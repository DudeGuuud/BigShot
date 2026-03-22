# EVE Frontier: 位置追踪数据研究报告

本文档总结了关于 EVE Frontier 世界合约（World Contract）如何生成并追踪位置数据（特别是星系 ID）的调查结果。

## 1. 核心发现：星系 ID 与位置哈希 (Location Hash)

世界合约对位置数据的处理遵循**隐私 (Hashed)** 与 **公开 (Revealed)** 的区分。

| 数据类型 | 出现位置 | 可见性 | 描述 |
|-----------|------------|------------|-------------|
| **星系 ID** | `KillmailCreatedEvent` | 公开 | 在所有击杀记录中均可直接获取。 |
| **位置哈希** | `GateCreatedEvent`, `LocationUpdated` | 隐私 | 基于坐标的经过混淆的哈希值。 |
| **设施 ID** | `JumpEvent`, `ItemDepositedEvent` | 公开 | 交互发生的星门或仓库的对象 ID (Object ID)。 |

---

## 2. 合约事件 Emit 深度解析

### 2.1 击杀记录 (Killmail)：最可靠的数据源
击杀记录是星系 ID（即 `solar_system_id`）的主要来源。
*   **合约文件**: `killmail.move`
*   **触发事件**: `KillmailCreatedEvent`
*   **关键字段**:
    ```move
    public struct KillmailCreatedEvent has copy, drop {
        key: TenantItemId,
        killer_id: TenantItemId,
        victim_id: TenantItemId,
        reported_by_character_id: TenantItemId,
        kill_timestamp: u64,
        solar_system_id: TenantItemId, // 包含 u64 格式的数字 ID
    }
    ```

### 2.2 智能星门与组件：基于设施的追踪
常规的交互事件（如跳转或存取）在默认情况下**不包含**星系 ID。
*   **触发事件**: `JumpEvent` (跃迁)
*   **关键字段**:
    ```move
    public struct JumpEvent has copy, drop {
        source_gate_id: ID,
        destination_gate_id: ID,
        character_id: ID,
        // 此处不包含 star_system_id!
    }
    ```

---

## 3. 位置“点亮”机制 (Reveal Mechanism)

合约中存在一套特殊的机制，允许管理员主动公开特定建筑的位置坐标。

*   **注册表**: `LocationRegistry` (`0x62e6ec...`)
*   **核心函数**: `reveal_location` (仅限管理员/服务器权限)
*   **星系 ID (solarsystem)**：所有点亮的位置均会关联一个星系 ID，用于地名转换。
*   **星域级规模**：经分析 Utopia 官方数据，目前包含超过 **24,500** 个星系，分布在多个独立的星域（Region）中。这意味着游戏协议从底层支持大规模的跨星域追踪与航行。

一旦位置被管理员“点亮”，dApp 就可以通过查询 `LocationRegistry` 共享对象，将一个星门 ID 翻译成具体地名。

---

## 4. 外部情报源：游戏 API 星系映射


### 4.1 数据结构解析
一个典型的星系数据条目包含：
*   **`id`**: 唯一星系 ID（与链上 `solar_system_id` 对应）。
*   **`name`**: 人类可读名称（如 `E06-D68`）。
*   **`constellationId` / `regionId`**: 所属星座和星域，用于大尺度范围追踪。
*   **`location`**: 星系在宇宙中的三维坐标 (X, Y, Z)。

### 4.2 战术价值
*   **轨迹计算**：利用 XYZ 坐标，我们可以计算目标在过去一小时内的位移矢量，预测其航向。
*   **导航辅助**：计算猎人当前位置与目标最后出现位置之间的直线距离。

---

## 5. 对 BigShot 的战术性建议

为了提升“追踪目标”的情报行动价值，我们应：

1.  **击杀地名翻译**: 导入静态 `systems.json` 映射表，将 `solar_system_id.item_id` (u64) 翻译为人类可读地名（如 "Jita"）。
2.  **设施 ID 反向追踪**: 建立或查询星门 ID 与星系的映射关系。即使链上事件没带 ID，我们也知道某个特定 ID 的星门位于哪个星系。
3.  **追踪热度 UI**: 在 `useLastSeen.ts` 中，对最近发生的 `JumpEvent` 进行高亮处理。虽然没有具体的 XYZ，但知道目标经过了“XX 联盟主航道星门”，对猎人来说是非常清晰的信号。

---

## 5. 前端实现思路

```typescript
// useLastSeen.ts 增强逻辑建议
async function resolveLocation(id: string, type: 'Killmail' | 'Jump' | 'Deposit') {
  if (type === 'Killmail') {
    // 根据本地映射表查找数字 ID
    return systemMap[id] || `星系 ${id}`;
  } else {
    // 在 LocationRegistry 共享对象中查询此设施 ID 是否已被公开
    const coordinates = await queryLocationRegistry(id);
    return coordinates ? systemMap[coordinates.solarsystem] : `未知星门 (${id.slice(0, 6)})`;
  }
}
```

---

## 6. 赏金猎人实战：如何利用位置情报

在 EVE Frontier 的物理规则下，位置情报是缩短“捕猎时间”的关键。

### 6.1 航行逻辑：手动追击
*   **无瞬移机制**：玩家无法直接传送到目标星系，必须通过星门（Stargate）网路逐跳航行。
*   **路径规划**：猎人获取地名后，需在游戏内地图设定终点。BigShot 提供的地名消除了猎人在数万星系中盲目搜寻的成本。

### 6.2 战术价值：从“追踪”到“截击”
*   **预测航向**：通过 Timeline 观察目标在不同时间的星系位移，猎人可以判断其航行矢量，直接跳往其必经的“咽喉星系”埋伏（Interception），而非尾随其后。
*   **跳数估算**：利用 XYZ 坐标计算目标与猎人的实时跳数距离。若距离在 1-3 跳内，拦截成功率极高。
*   **星域锁定**：一旦确认目标在特定星域频繁活动（如持续在某星区的 SSU 存取物资），猎人可判定其为本地常驻人员，从而进行针对性蹲守。

### 6.3 未来 UI 增强方向
*   **一键定位**：在 UI 提供 deeplink，直接在游戏客户端地图中锁定目标星系。
*   **实时跳数显示**：动态计算并显示“距离你：X 跳”。
