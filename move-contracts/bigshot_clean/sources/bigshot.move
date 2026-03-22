/// BigShot — EVE Frontier Bounty Hunter Extension.
///
/// This module implements a decentralised bounty-hunter board on top of the
/// EVE Frontier `world` package.  Players stake LUX or EVE-Token against a
/// target `character_id`; hunters claim the reward by presenting the native
/// on-chain `world::killmail::Killmail` shared object.
module bigshot_extension::bigshot;

use bigshot_extension::config::{AdminCap, ExtensionConfig};
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::dynamic_field as df;
use world::character::Character;
use world::killmail::Killmail;
use world::in_game_id;

// === Errors ===
#[error(code = 0)]
const EVictimMismatch: vector<u8> = b"Killmail victim does not match bounty target";
#[error(code = 1)]
const EKillerMismatch: vector<u8> = b"Killmail killer does not match caller character";
#[error(code = 2)]
const EBountyExpired: vector<u8> = b"Bounty has already expired";
#[error(code = 3)]
const EBountyNotExpired: vector<u8> = b"Bounty has not yet expired";
#[error(code = 4)]
const EAlreadyClaimed: vector<u8> = b"This Killmail has already been used to claim this bounty";
#[error(code = 5)]
const ENotIssuer: vector<u8> = b"Only issuer can cancel the bounty";
#[error(code = 6)]
const ENoBountyConfig: vector<u8> = b"Extension config missing BountyConfig";
#[error(code = 7)]
const EInsufficientPayment: vector<u8> = b"Payment below minimum bounty amount";
#[error(code = 8)]
const EBountyAlreadyClaimed: vector<u8> = b"Bounty reward pool is empty";

// === Structs ===

/// The core bounty object.  Shared so any hunter can submit a Killmail.
public struct Bounty<phantom T> has key {
    id: UID,
    /// Chain address of the player who posted the bounty.
    issuer: address,
    /// Target player's `character_id` (u64 from their `PlayerProfile`).
    target_character_id: u64,
    /// Staked reward (after 5% protocol fee deduction).
    reward_pool: Balance<T>,
    /// Unix-millisecond timestamp after which the bounty expires.
    expiry_timestamp_ms: u64,
    /// Threat level evaluated off-chain (0=D … 4=S).
    threat_level: u8,
    /// Killmail IDs already consumed; prevents double-claiming.
    claimed_killmail_ids: vector<ID>,
}

/// Protocol treasury that accumulates 5% fees.
public struct BigShotTreasury<phantom T> has key {
    id: UID,
    collected_fees: Balance<T>,
}

/// Per-extension protocol configuration stored as a dynamic field.
public struct BountyConfig has drop, store {
    /// Protocol fee in basis points (500 = 5%).
    fee_bps: u64,
    /// Minimum stake amount (in smallest token unit).
    min_bounty_amount: u64,
}

/// Dynamic-field key for `BountyConfig`.
public struct BountyConfigKey has copy, drop, store {}

// === Admin / Init helpers ===

/// Create and share a `BigShotTreasury`.  Called once after publish.
public fun create_treasury<T>(
    _: &AdminCap,
    ctx: &mut TxContext,
) {
    let treasury = BigShotTreasury<T> {
        id: object::new(ctx),
        collected_fees: balance::zero(),
    };
    transfer::share_object(treasury);
}

/// Set or overwrite the `BountyConfig` on `ExtensionConfig`.
public fun set_bounty_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    fee_bps: u64,
    min_bounty_amount: u64,
) {
    extension_config.set_rule<BountyConfigKey, BountyConfig>(
        admin_cap,
        BountyConfigKey {},
        BountyConfig { fee_bps, min_bounty_amount },
    );
}

// === Core entry functions ===

/// Post a new bounty.
///
/// * Deducts `fee_bps / 10_000` of `payment` into `treasury`.
/// * Wraps the remainder in a shared `Bounty<T>` object.
public fun create_bounty<T>(
    extension_config: &ExtensionConfig,
    treasury: &mut BigShotTreasury<T>,
    target_character_id: u64,
    threat_level: u8,
    mut payment: Coin<T>,
    duration_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(
        extension_config.has_rule<BountyConfigKey>(BountyConfigKey {}),
        ENoBountyConfig,
    );
    let cfg = extension_config.borrow_rule<BountyConfigKey, BountyConfig>(BountyConfigKey {});
    let total_amount = coin::value(&payment);
    assert!(total_amount >= cfg.min_bounty_amount, EInsufficientPayment);

    // Deduct protocol fee.
    let fee_amount = total_amount * cfg.fee_bps / 10_000;
    let fee_coin = coin::split(&mut payment, fee_amount, ctx);
    balance::join(&mut treasury.collected_fees, coin::into_balance(fee_coin));

    // Calculate expiry.
    let ts = clock.timestamp_ms();
    let expiry_timestamp_ms = ts + duration_ms;

    // Create and share the bounty.
    let bounty = Bounty<T> {
        id: object::new(ctx),
        issuer: ctx.sender(),
        target_character_id,
        reward_pool: coin::into_balance(payment),
        expiry_timestamp_ms,
        threat_level,
        claimed_killmail_ids: vector::empty(),
    };
    transfer::share_object(bounty);
}

/// Claim a bounty by presenting the native on-chain `Killmail` shared object.
///
/// Verifications:
/// 1. `killmail.victim_id()` matches `bounty.target_character_id`
/// 2. `killmail.killer_id()` matches the caller's `character_id`
/// 3. Kill occurred before the bounty's expiry
/// 4. This Killmail has not already been used against this bounty
public fun claim_bounty<T>(
    bounty: &mut Bounty<T>,
    killmail: &Killmail,
    hunter_character: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // 1. Verify the bounty has not expired.
    assert!(clock.timestamp_ms() <= bounty.expiry_timestamp_ms, EBountyExpired);

    // 2. Reward pool must still have funds.
    assert!(balance::value(&bounty.reward_pool) > 0, EBountyAlreadyClaimed);

    // 3. Verify victim matches target.
    assert!(
        in_game_id::item_id(&killmail.victim_id()) == bounty.target_character_id,
        EVictimMismatch,
    );

    // 4. Verify the hunter is the killer.
    assert!(
        in_game_id::item_id(&killmail.killer_id()) == in_game_id::item_id(&hunter_character.key()),
        EKillerMismatch,
    );

    // 5. Kill must have occurred before bounty expiry.
    //    `kill_timestamp` is Unix seconds; convert to ms for comparison.
    let kill_ms = killmail.kill_timestamp() * 1_000;
    assert!(kill_ms <= bounty.expiry_timestamp_ms, EBountyExpired);

    // 6. Prevent duplicate claims.
    let km_id = object::id(killmail);
    assert!(!bounty.claimed_killmail_ids.contains(&km_id), EAlreadyClaimed);
    bounty.claimed_killmail_ids.push_back(km_id);

    // 7. Transfer reward to hunter.
    let reward = balance::withdraw_all(&mut bounty.reward_pool);
    transfer::public_transfer(coin::from_balance(reward, ctx), ctx.sender());
}

/// Cancel a bounty and refund the issuer after it has expired.
public fun cancel_expired_bounty<T>(
    bounty: Bounty<T>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(clock.timestamp_ms() > bounty.expiry_timestamp_ms, EBountyNotExpired);
    assert!(ctx.sender() == bounty.issuer, ENotIssuer);

    let Bounty {
        id,
        issuer,
        target_character_id: _,
        reward_pool,
        expiry_timestamp_ms: _,
        threat_level: _,
        claimed_killmail_ids: _,
    } = bounty;

    object::delete(id);
    if (balance::value(&reward_pool) > 0) {
        transfer::public_transfer(coin::from_balance(reward_pool, ctx), issuer);
    } else {
        balance::destroy_zero(reward_pool);
    };
}

/// Admin: withdraw collected protocol fees.
public fun withdraw_fees<T>(
    treasury: &mut BigShotTreasury<T>,
    _: &AdminCap,
    ctx: &mut TxContext,
) {
    let fees = balance::withdraw_all(&mut treasury.collected_fees);
    transfer::public_transfer(coin::from_balance(fees, ctx), ctx.sender());
}

// === View helpers ===

public fun bounty_issuer<T>(bounty: &Bounty<T>): address { bounty.issuer }
public fun bounty_target<T>(bounty: &Bounty<T>): u64 { bounty.target_character_id }
public fun bounty_reward<T>(bounty: &Bounty<T>): u64 { balance::value(&bounty.reward_pool) }
public fun bounty_expiry<T>(bounty: &Bounty<T>): u64 { bounty.expiry_timestamp_ms }
public fun bounty_threat<T>(bounty: &Bounty<T>): u8 { bounty.threat_level }
public fun treasury_balance<T>(treasury: &BigShotTreasury<T>): u64 {
    balance::value(&treasury.collected_fees)
}
