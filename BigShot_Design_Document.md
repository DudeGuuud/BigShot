# BigShot: EVE Frontier 赏金猎人系统

## 1. 简介 (Introduction)

**BigShot** 是为 EVE Frontier 打造的一个去中心化赏金猎人 dApp。玩家可以使用在链上质押 **LUX** 或 **EVE Token** 的方式，对其他玩家角色发布悬赏。该系统基于 EVE Frontier 的 Sui Move **扩展合约模式（Extension Pattern）**，结合 `@evefrontier/dapp-kit` 前端 SDK 与 AI（LLM）威胁评级能力，为玩家提供沉浸式的深空赏金猎人体验。

> **架构核心**：BigShot 不是一个独立的 Sui Move 包。它是 EVE Frontier `world` 合约体系的一个**扩展模块（Extension Module）**，遵循官方 builder-scaffold 的 `smart_gate_extension` 同款模式开发。

---

## 2. 核心功能与业务流程 (Core Features & Flow)

### 2.1 质押与悬赏发布 (Bounty Creation & Staking)

- **支持代币**：玩家使用 **LUX**（游戏内主要交易货币）或 **EVE Token**（生态参与代币）进行质押。注意：SUI 本身不是游戏内流通货币。
- **协议费提取**：智能合约在玩家发布悬赏时，自动从质押总额中扣除 **5%** 作为协议运营费，存入协议 Treasury 对象。
- **目标设定**：发布者需提供目标玩家在链上对应的 `character_id`（通过查询目标玩家的 `PlayerProfile` 对象获得，非玩家自定义 ID）。
- **倒计时机制**：悬赏对象上记录 `expiry_duration_ms`（到期时长），通过 `sui::clock::Clock` 获取当前链上时间戳计算到期时间，前端拉取后实时倒计时渲染。

### 2.2 LLM 威胁评级分析 (Threat Level Assessment via LLM)

发布悬赏前，系统进行一轮链下数据分析：

1. **数据拉取 (Data Fetching)**：前端通过 Sui GraphQL 端点（`https://graphql.testnet.sui.io/graphql`）查询目标 `character_id` 对应的 `Character` 对象及其历史事件（如 `JumpEvent`），获得活跃度、持有资产等数据。具体查询参考[官方文档 — Interfacing with the EVE Frontier World](https://docs.evefrontier.com/tools/interfacing-with-the-eve-frontier-world)。
2. **AI 评估**：前端将数据组装为 Prompt，调用 LLM，根据活跃度、持有物价值、行为模式等综合评估**威胁等级（D / C / B / A / S）**，并生成简短战术分析文本。(暂时不使用llm 而是设定一套规则来给予权重公式计算，例如：活跃度越高，威胁等级越高；持有物价值越高，威胁等级越高；行为模式越激进，威胁等级越高)
3. **展示**：威胁等级与赏金金额一并展示在悬赏看板上，帮助赏金猎人评估风险。

### 2.3 击杀证明与奖金领用 (Kill Proof & Claim)

**`Killmail` 在 EVE Frontier 中本身就是链上共享对象**（`world::killmail::Killmail`），由游戏服务器在每次 PvP 击杀后，经 `AdminACL.verify_sponsor` 鉴权后自动调用 `create_killmail` 创建并 `share_object`。无需 StorageUnit、无需 Corpse 物品。

**认领流程**：
1. 赏金猎人击杀目标后，游戏服务器自动在链上生成 `Killmail` 共享对象，包含 `killer_id`、`victim_id`、`kill_timestamp` 等字段。
2. 赏金猎人来到 BigShot，将该 `Killmail` 对象的引用作为参数传入 `claim_bounty` 函数。
3. 合约验证：
   - `killmail.victim_id` 是否匹配 `bounty.target_character_id`（必须击杀了被悬赏目标）
   - `killmail.killer_id` 是否匹配调用者的 `character_id`（本人击杀）
   - `killmail.kill_timestamp` 是否在悬赏有效期内（防止使用过期击杀记录）
4. 验证通过后，合约将 `reward_pool` 发放给赏金猎人。

> **防重复领取**：合约应记录已使用过的 `Killmail` 对象 ID（存入动态字段），防止同一条 Killmail 被重复用于领赏。

> **ZK-Login 匿名领赏**：赏金猎人可通过 zkLogin（社交账号生成临时 Sui 地址）接收赏金，完全斩断链上身份关联。此特性由 EVE Vault 和 Sui zkLogin 原生支持。

---

## 3. 前端设计与风格规范 (Frontend Design)

前端设计参考 EVE Frontier [Leaderboards](https://evefrontier.com/en/leaderboards) 官方风格，营造硬核赛博朋克深空美学。

### 3.1 视觉风格
在保持根目录的前端大模式的前提下，微调以下元素
- **材质与动效**：Glassmorphism 黑色半透明 + 1px 亮边；CRT 扫描线 / 故障 Glitch 闪烁 / 倒计时数字跳动等微动效。
- **排版**：`Inter`、`Roboto Mono`、`Orbitron` 等机械感字体；数字时间戳全部等宽（Monospaced）。

### 3.2 布局与页面规划（5 页 + 4 交易流程 MVP）

#### 页面列表

| 页面 | 说明 |
|------|------|
| **登录页** | EVE Vault 钱包连接入口 |
| **角色绑定页** | 钱包 → PlayerProfile → character_id 映射 |
| **赏金列表页** | 活跃悬赏看板，兼容游戏外部浏览器入口 |
| **发布赏金页** | 输入目标 character_id、质押金额、发起链上交易 |
| **赏金详情页** | 接单 / 提交 Corpse 证明 / 结算 |

#### 外部浏览器接入模式

支持从外部浏览器通过 URL 参数直接定位游戏对象（参考[官方文档](https://docs.evefrontier.com/dapps/connecting-from-an-external-browser)）：
```
https://yourdapp.com/?tenant=stillness&itemId=1000000012345
```
`tenant` 和 `itemId` 为必填参数，`itemId` 为游戏内 Smart Assembly 的 ID。

---

## 4. 技术栈 (Tech Stack)

### 4.1 前端

| 层 | 技术 |
|----|------|
| 框架 | **Vite + React + TypeScript**（对应 builder-scaffold `/dapps`，非 Next.js）|
| 包管理 | **pnpm** |
| 链接 & 数据 | `@evefrontier/dapp-kit`（官方 EVE Frontier dApp Kit）|
| 底层 Sui | `@mysten/dapp-kit-react`（扩展 Sui hooks）|
| 样式 | Vanilla CSS / CSS Modules |

**关键 Hook 用法（基于 `@evefrontier/dapp-kit`）**：

```tsx
// Provider 封装（main.tsx）
// EveFrontierProvider 组合了：QueryClientProvider, DAppKitProvider,
// VaultProvider, SmartObjectProvider, NotificationProvider
<EveFrontierProvider queryClient={queryClient}>
  <App />
</EveFrontierProvider>

// 连接钱包（App.tsx）
const { isConnected, handleConnect, handleDisconnect, walletAddress, hasEveVault } = useConnection();

// 读取 Smart Object（AssemblyInfo.tsx）
// VITE_ITEM_ID 来自 .env 或 URL ?itemId= 参数
const { assembly, character, loading, error, refetch } = useSmartObject();

// 签名 & 执行交易（WalletStatus.tsx）
const { signAndExecuteTransaction } = useDAppKit(); // from @mysten/dapp-kit-react
```

### 4.2 合约（Move Extension）

**重要**：BigShot 的 Move 合约是对 EVE Frontier `world` 包的**扩展**，不是独立合约。遵循 builder-scaffold 的扩展模式（参考 `move-contracts/smart_gate_extension`）。

**项目结构**（在 `builder-scaffold/move-contracts/` 下新建 `bigshot_extension/`）：

```toml
# Move.toml
[package]
name = "bigshot_extension"
edition = "2024"

[dependencies]
world = { git = "https://github.com/evefrontier/world-contracts.git", subdir = "contracts/world", rev = "v0.0.18" }
```

---

## 5. 智能合约架构 (Smart Contract Architecture)

### 5.1 核心概念

BigShot 沿用 EVE Frontier 的 **Capability 体系**：
- `GovernorCap` → `AdminACL` → `OwnerCap<T>` 三层权限
- `OwnerCap<T>` 存储在玩家 `Character` 对象（作为"钥匙串"），而非直接存于钱包
- 使用 **borrow → use → return**（`ReturnOwnerCapReceipt` hot potato）模式在单笔交易内使用能力

### 5.2 数据结构

```move
module bigshot_extension::bigshot;

use bigshot_extension::config::{AdminCap, ExtensionConfig};
use sui::balance::Balance;
use sui::clock::Clock;
use sui::coin::Coin;
use world::{
    access::OwnerCap,
    character::Character,
    storage_unit::StorageUnit,
};

/// 悬赏对象（共享对象，链上存储）
public struct Bounty<phantom T> has key {
    id: UID,
    issuer: address,              // 发布者链上地址
    target_character_id: u64,     // 目标玩家的 character_id（u64，来自 PlayerProfile）
    reward_pool: Balance<T>,      // 质押的 LUX 或 EVE Token 余额（扣除5%后）
    expiry_timestamp_ms: u64,     // 到期时间戳（ms），前端用于倒计时渲染
    threat_level: u8,             // AI 评定的威胁等级（链下计算，链上记录）
    claimed_killmail_ids: vector<ID>, // 已消耗的 Killmail 对象 ID，防止重复领赏
}

/// 协议国库（收集 5% 协议费的共享对象）
public struct BigShotTreasury<phantom T> has key {
    id: UID,
    collected_fees: Balance<T>,
}

/// 悬赏配置（存储在 ExtensionConfig 动态字段下）
public struct BountyConfig has drop, store {
    fee_bps: u64,          // 协议费，单位 bps（500 = 5%）
    min_bounty_amount: u64,
}

public struct BountyConfigKey has copy, drop, store {}
```

### 5.3 接口定义 (Entry Functions)

```move
/// 创建悬赏
/// payment: 玩家支付的 LUX 或 EVE Token Coin 对象
public fun create_bounty<T>(
    extension_config: &ExtensionConfig,
    treasury: &mut BigShotTreasury<T>,
    target_character_id: u64,   // 目标玩家 character_id（从其 PlayerProfile 查来）
    threat_level: u8,
    payment: Coin<T>,
    duration_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) { ... }

/// 认领赏金（赏金猎人传入链上 Killmail 共享对象）
/// Killmail 由游戏服务器在击杀发生后自动 share_object，无需 StorageUnit
public fun claim_bounty<T>(
    bounty: &mut Bounty<T>,
    killmail: &Killmail,           // world::killmail::Killmail 共享对象
    hunter_character: &Character,  // 调用者的角色（用于验证 killer_id）
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // 1. 验证受害者匹配悬赏目标
    assert!(killmail.victim_id().item_id() == bounty.target_character_id, EVictimMismatch);
    // 2. 验证击杀者是当前调用者
    assert!(killmail.killer_id().item_id() == hunter_character.character_id(), EKillerMismatch);
    // 3. 验证击杀发生在有效期内（kill_timestamp 单位为秒，expiry 为 ms）
    assert!(killmail.kill_timestamp() * 1000 <= bounty.expiry_timestamp_ms, EBountyExpired);
    // 4. 防止重复认领（同一条 Killmail 不能领两次）
    let km_id = object::id(killmail);
    assert!(!bounty.claimed_killmail_ids.contains(&km_id), EAlreadyClaimed);
    bounty.claimed_killmail_ids.push_back(km_id);
    // 5. 发放赏金
    let reward = balance::withdraw_all(&mut bounty.reward_pool);
    transfer::public_transfer(coin::from_balance(reward, ctx), ctx.sender());
}

/// 发布者超时撤回（悬赏到期后）
public fun cancel_expired_bounty<T>(
    bounty: Bounty<T>,
    clock: &Clock,
    ctx: &mut TxContext,
) { ... }
```

### 5.4 实现要点

1. **时间戳**：通过 `clock.timestamp_ms()` 获取链上时间，计算 `expiry_timestamp_ms = timestamp_ms + duration_ms`。
2. **协议费**：在 `create_bounty` 内用 `coin::split` 提取 5%（`amount * fee_bps / 10000`），存入 `BigShotTreasury`。
3. **Killmail 验证**：`claim_bounty` 接受 `&Killmail`（`world::killmail::Killmail` 共享对象引用），验证 `victim_id`、`killer_id`、`kill_timestamp` 三项。注意 `kill_timestamp` 单位是 **Unix 秒**，`expiry_timestamp_ms` 是毫秒，比较时需换算。
4. **防重复领赏**：在 `Bounty` 对象的 `claimed_killmail_ids: vector<ID>` 字段中记录已用 Killmail ID，防止同一战报被重复领赏。
5. **共享对象**：`Bounty<T>` 用 `transfer::share_object` 发布，使任何人（赏金猎人）都能访问。

---

## 6. 角色身份与钱包集成

### 6.1 从钱包地址获取 Character ID

按[官方文档](https://docs.evefrontier.com/smart-assemblies/smart-character#discovering-character-from-wallet-address)：玩家创建角色时，游戏服务器在链上生成 `PlayerProfile` 对象并转入玩家钱包。前端流程：

1. **连接钱包** → 获取 `walletAddress`（Sui 地址）
2. **GraphQL 查询**：按类型 `0x<WORLD_PACKAGE_ID>::character::PlayerProfile` 查询该地址持有的对象 → 取得 `character_id`
3. **加载 Character**：用 `character_id` 查询完整的 `Character` 共享对象

```typescript
// 前端查询示例（@evefrontier/dapp-kit 封装）
const { assembly, character, loading } = useSmartObject();
// useSmartObject 内部走 GraphQL 自动完成上述流程

// 若需要自定义查询：
import { getOwnedObjectsByType, executeGraphQLQuery } from '@evefrontier/dapp-kit';
```

### 6.2 EVE Vault 与货币体系

- **EVE Vault**：官方钱包 + 身份管理器，支持 Sui Wallet Standard、FusionAuth OAuth、permissioned dApp 访问。
- **LUX**：游戏内主要交易货币，用于大多数游戏内购买、交易、服务。→ **BigShot 的主要质押货币**。
- **EVE Token**：Sui 链上生态参与代币，用于生态激励、modding 奖励、特殊资产购买。→ 可作为可选质押货币。
- ❌ **SUI 代币本身不是 EVE Frontier 游戏内货币**，不适合作为悬赏质押资产（除非专门设计为协议层）。

---

## 7. 后续开发计划 (Next Steps)

### 阶段 1：合约开发
1. 在 `builder-scaffold/move-contracts/` 下新建 `bigshot_extension/` 包。
2. 编写 `Bounty<T>` 对象、`BigShotTreasury`、`BountyConfig`，实现 `create_bounty`、`claim_bounty`、`cancel_expired_bounty`。
3. 本地测试：`sui move test`，testnet 部署：`sui client publish -e testnet`。

### 阶段 2：前端开发
1. 在 `builder-scaffold/dapps/` 下开发（Vite + React + TypeScript + pnpm）。
2. 使用 `@evefrontier/dapp-kit` 接入合约（`signAndExecuteTransaction`）。
3. 用 `useSmartObject()` 和 GraphQL 查询角色数据，组装 LLM Prompt 进行威胁评级。
4. 实现 5 页 UI + 4 条核心交易流（创建悬赏、认领赏金、超时撤回、zkLogin 匿名领取）。

### 阶段 3：数据接入与测试
1. 通过 Sui GraphQL 端点查询 `PlayerProfile`、`Character` 对象、链上事件（`JumpEvent` 等）。
2. 使用 [`suix_queryEvents`](https://docs.sui.io/guides/developer/accessing-data/using-events) 订阅赏金相关事件，实时刷新 UI。
3. 在 testnet (`stillness` / `utopia`) 上进行端到端测试。
4. 评估 zkLogin 匿名领赏的 UX 可行性。

---

## 8. 关键参考资料

| 主题 | 链接 |
|------|------|
| dApp 快速入门 | https://docs.evefrontier.com/dapps/dapps-quick-start |
| 外部浏览器接入 | https://docs.evefrontier.com/dapps/connecting-from-an-external-browser |
| Smart Character | https://docs.evefrontier.com/smart-assemblies/smart-character |
| Ownership Model | https://docs.evefrontier.com/smart-contracts/ownership-model |
| EVE Vault 介绍 | https://docs.evefrontier.com/eve-vault/introduction-to-eve-vault |
| 与世界合约交互 | https://docs.evefrontier.com/tools/interfacing-with-the-eve-frontier-world |
| builder-scaffold dapps README | `builder-scaffold/dapps/readme.md` |
| builder-scaffold move-contracts README | `builder-scaffold/move-contracts/readme.md` |
| 参考扩展示例 | `builder-scaffold/move-contracts/smart_gate_extension/sources/corpse_gate_bounty.move` |
