# BigShot: EVE Frontier Bounty Hunter System

## 1. 简介 (Introduction)
**BigShot** 是为 EVE Frontier 打造的一个去中心化赏金猎人系统。玩家可以通过该系统，使用在链上质押代币的方式，对其他玩家发布悬赏。该系统充分利用了区块链智能合约（Sui 协议下的 Move 语言）以及带有 AI（LLM）能力的现代前端，为玩家提供沉浸式、极具 EVE Frontier 赛博朋克深空风格的悬赏体验。

## 2. 核心功能与业务流程 (Core Features & Flow)

### 2.1 质押与悬赏发布 (Bounty Creation & Staking)
- **支持代币**: 玩家可以选择使用 `SUI` 代币或原生的 `EVE` 代币进行质押。
- **协议费提取**: 为了维持系统运转，智能合约会在玩家质押时自动扣除总质押金额的 **5%** 作为协议费。
- **目标设定**: 悬赏发布者需要提供目标玩家的 `Player ID`。
- **倒计时机制**: 每份悬赏在发布时都会带有一个链上时间戳（Timestamp）。前端将拉取该时间戳进行实时倒计时计算，超过时限后悬赏可由发布者撤回（或设计为永久悬赏直到被认领），渲染出极具紧迫感的 UI。

### 2.2 LLM 威胁评级分析 (Threat Level Assessment via LLM)
在玩家确定发布悬赏前，系统会进行一轮数据分析：
1. **数据拉取 (Data Fetching)**: 前端通过 EVE Frontier 官方 API 或相关节点，拉取目标玩家的 `Profile`（个人资料）和 `Killmail`（击杀与损失记录）。
2. **AI 评估 (LLM Evaluation)**: 前端将拉取到的原始数据组装为 Prompt，发送给后端/直接调用 LLM，让 LLM 根据目标的战斗活跃度、常驾驶舰船价值、胜率等综合特征，为其评估出一个**威胁等级 (Threat Level)**（例如 D, C, B, A, S 级）并生成一段简短的战术评价。
3. **展示**: 威胁等级会同悬赏金额一起展示在悬赏看板上，帮助赏金猎人评估风险与收益。

### 2.3 奖金领用机制 (Claiming the Reward)
- 一旦某位玩家在 EVE Frontier 世界中击杀了被悬赏的目标，游戏（或预言机）会生成对应的 `Killmail` 链上证明。
- 击杀者可以带着属于该目标的被击杀 `Killmail` 来到 BigShot 平台。
- 智能合约校验 `Killmail` 的真实性、受害者 ID 和击杀者 ID。
- 若校验通过，智能合约将剩余的 95% 质押代币直接转入击杀者的钱包，悬赏结束。

---

## 3. 前端设计与风格规范 (Frontend Design & EVE Frontier Style)
前端设计必须与 EVE Frontier [Leaderboards](https://evefrontier.com/en/leaderboards) 的官方风格高度一致，营造出硬核、太空歌剧与赛博朋克的视觉感受。

### 3.1 视觉风格 (Visual Aesthetics)
- **色彩板 (Color Palette)**:
  - 背景色：纯黑（`#000000`）或深空灰（`#0A0A0A`）。
  - 强调色（Accent）：高对比度的霓虹色调。例如，针对不同威胁等级使用不同色彩，S级使用危险的亮红色（`#FF2A2A`），普通等级使用冷冽的青蓝色（`#00E5FF`）或琥珀色（`#FF9100`）。
- **材质与动效 (Materials & Animations)**:
  - 大量使用 **Glassmorphism (玻璃拟态)**，黑色半透明背景搭配极细的 1px 亮色边框。
  - **微小科幻动效 (Micro-animations)**：比如模拟 CRT 屏幕扫描线、悬停目标时的故障（Glitch）闪烁效果、以及悬赏倒计时数字的跳动。
- **排版 (Typography)**:
  - 字体选择无衬线、带有机械感的字体（如 `Inter`, `Roboto Mono`, `Orbitron` 或官方同款字体）。
  - 数字和时间戳保持等宽 (Monospaced) 排版，营造仪表盘和控制台的感觉。

### 3.2 布局规划 (Layout Structure)
1. **The Terminal (控制台模式)**: 屏幕分为几块战术显示区。
2. **左侧/顶部 - Target Acquisition (锁定目标)**:
   - 包含输入框（Input Target ID）。
   - 选择代币种类 (SUI / EVE) 和输入质押金额。
   - 带有扫描动效的 "Analyze & Set Bounty" 按钮。
3. **中央 - AI Threat Briefing (AI 威胁简报)**: 
   - 独立模块，打字机特效显示 LLM 返回的玩家数据分析和巨大醒目的 **Threat Level** 评级。
4. **右侧/底部 - BigShot Leaderboards (当期高额悬赏榜)**:
   - 列表展示当前活跃的悬赏，包含倒计时 (Countdown, `HH:MM:SS`)、目标头像、威胁评级和赏金总量。
   - 采用类似 EVE Frontier Leaderboards 的网格/列表视图，包含排序与过滤功能。提供 "Claim" 操作入口。

---

## 4. 智能合约架构 (Smart Contract Architecture - Sui Move)
系统需要在 `world-contracts` 目录下开发原生的 Sui Move 合约。

### 4.1 数据结构 (Objects)
\`\`\`move
/// 悬赏对象
struct Bounty<phantom T> has key {
    id: UID,
    issuer: address,            // 发布者
    target_player_id: String,   // 悬赏目标的 EVE Player ID
    reward_pool: Balance<T>,    // 质押的 SUI 或 EVE 代币余额 (已扣除 5% 手续费)
    expiration_ms: u64,         // 悬赏到期的时间戳，用于前端倒计时
    threat_level: String,       // AI评定的威胁等级（可选项，记录在链上或前端维护）
}

/// 协议国库，用于收集 5% 的协议费
struct BigShotTreasury<phantom T> has key {
    id: UID,
    collected_fees: Balance<T>,
}
\`\`\`

### 4.2 接口定义 (Entry Functions)
1. `create_bounty<T>(target_id: String, payment: Coin<T>, duration_ms: u64, threat_level: String, ctx: &mut TxContext)`:
   - 提取付款的 5% 并存入 `BigShotTreasury`。
   - 用剩余的 95% 创建并共享一个 `Bounty<T>` 对象。
   - 计算并设定到期时间戳 `expiration_ms = current_time + duration_ms`。
2. `claim_bounty<T>(bounty: &mut Bounty<T>, killmail_proof: Killmail, ctx: &mut TxContext)`:
   - 验证传入的 Killmail，确认该 Killmail 对应的死者是 `bounty.target_player_id`，且击杀发生的时间在悬赏有效期内。
   - 将 `bounty` 内的 `reward_pool` 发放给 Killmail 的合法拥有者（击杀者）。
   - 销毁该 `Bounty` 对象。

---

## 5. 后续开发计划 (Next Steps)
1. **智能合约 (Move)** 阶段：在 `world-contracts/contracts/` 下新建 `bigshot` assembly 模块并编写上述核心逻辑和测试。
2. **前端开发 (Next.js / Vite)** 阶段：在 `dapps/` 目录下搭建具有暗黑赛博风格的 UI，利用 `sui.js` 接入合约，并接入 OpenAI 或其他 LLM 的 API 用于威胁判定。
3. **数据接入 阶段**：熟悉 EVE Frontier 官方获取 Profile 和 Killmail 的接口，打通数据全链路。

MVP 可做成 5 个页面 + 4 条核心交易流程。

登录页
用 EVE Vault 登录。接入 useConnection()。身份基于 Wallets & Identity 和 dApp kit。


Copy
const { isConnected, handleConnect } = useConnection();
角色绑定页
钱包连上后，按 Smart Character （https://docs.evefrontier.com/smart-assemblies/smart-character）查询钱包拥有的 PlayerProfile，取 character_id，映射成平台用户。

赏金列表页
展示任务标题、奖励资产、发布者角色、状态。可附带 tenant 和 itemId，兼容 Connecting from an External Browser (https://docs.evefrontier.com/dapps/connecting-from-an-external-browser) 的入口模式 。最好还要能在游戏浮窗内能看到 这个后面再细聊

发布赏金页
输入任务说明、奖励数量、关联对象。提交时走钱包签名；资产与身份仍由 EVE Vault 承载，参考 Introduction to EVE Vault（https://docs.evefrontier.com/eve-vault/introduction-to-eve-vault）。

赏金详情页
支持 接单 / 完成 / 结算。若动作涉及对象控制，按 Ownership Model（https://docs.evefrontier.com/smart-contracts/ownership-model） 的 borrow -> use -> return 组装交易。

考虑融合以下内容
# 6. 链上无头赏金所 (Bounty Hunter Escrow)

## 💡 核心概念 (Concept)
完全自动化的刺客平台。发布者悬赏特定玩家人头，合约在确认击杀后自动释放赏金给刺客。

## 🧩 解决的痛点 (Pain Points Solved)
- **黑吃黑**：传统暗杀经常发生“钱给了，人不杀”或“杀了人，钱没给”的情况。
- **匿名需求**：买凶者和刺客都希望在链上保持身份隐秘。

## 🎮 详细玩法与机制 (Gameplay Mechanics)
1. **Killmail 预言机**：合约对接 EVE 游戏服务器生成的战损日志证据。
2. **SUI 锁定**：赏金由合约托管。一旦触发 `Victim_ID == Bounty_Target` 逻辑。
3. **ZK-Login 提现**：刺客甚至不需要常用钱包接收，通过 ZK-Login 用临时社交账号（如 Twitch）生成新地址，隐秘领走赏金，彻底斩断社交关系链。

## 🛠️ Sui 核心特性应用 (Sui Features)
- [x] zkLogin (暗中提款)
- [x] DeepBook (如果有复仇物资，可直接折算市价)

## 📐 智能合约架构规划 (Smart Contract Architecture)
### 核心 Object
- `BountyContract`: 共享对象，多方订阅。
- `Evidence`: 击杀凭证。

## 📅 开发里程碑 (Milestones)
- [ ] 编写证据哈希验证
- [ ] 实现自动打款奖励分配
- [ ] 测试多重签名发布悬赏
