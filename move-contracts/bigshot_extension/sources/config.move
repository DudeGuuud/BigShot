/// BigShot Extension — Shared configuration module.
///
/// Publishes an `ExtensionConfig` shared object and `AdminCap` on package init.
/// Other BigShot modules attach their own typed config structs via dynamic fields.
module bigshot_extension::config;

use sui::dynamic_field as df;

// === Objects ===

public struct ExtensionConfig has key {
    id: UID,
}

public struct AdminCap has key, store {
    id: UID,
}

/// Witness type authorising BigShot-internal operations (e.g. treasury deposits).
public struct BigShotAuth has drop {}

// === Init ===

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin_cap, ctx.sender());

    let config = ExtensionConfig { id: object::new(ctx) };
    transfer::share_object(config);
}

// === Dynamic-field helpers ===
//
// Callers define a key type `K has copy + drop + store` and a value type `V has store`,
// then use these helpers to attach/read their own config under the shared `ExtensionConfig`.

public fun has_rule<K: copy + drop + store>(config: &ExtensionConfig, key: K): bool {
    df::exists_(&config.id, key)
}

public fun borrow_rule<K: copy + drop + store, V: store>(config: &ExtensionConfig, key: K): &V {
    df::borrow(&config.id, key)
}

public fun borrow_rule_mut<K: copy + drop + store, V: store>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
): &mut V {
    df::borrow_mut(&mut config.id, key)
}

public fun add_rule<K: copy + drop + store, V: store>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
    value: V,
) {
    df::add(&mut config.id, key, value);
}

/// Insert-or-overwrite a rule.
public fun set_rule<K: copy + drop + store, V: store + drop>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
    value: V,
) {
    if (df::exists_(&config.id, copy key)) {
        let _old: V = df::remove(&mut config.id, copy key);
    };
    df::add(&mut config.id, key, value);
}

public fun remove_rule<K: copy + drop + store, V: store>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
): V {
    df::remove(&mut config.id, key)
}

/// Mint a `BigShotAuth` witness — restricted to this package.
public(package) fun bigshot_auth(): BigShotAuth {
    BigShotAuth {}
}
