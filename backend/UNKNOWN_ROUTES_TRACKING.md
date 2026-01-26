# Unknown Routes Tracking

## 功能说明

追踪在 attendance 文件中出现但**bus_id 不在 buses 表中**的记录。

## 核心逻辑

### 什么是 Unknown Bus？

**判断条件：**
1. PersonId 在 attendance 文件中出现
2. PersonId **不在 master list** 中（找不到对应的 employee）
3. 从 attendance 的 route 解析出的 bus_id **不在 buses 表中**

**不是 Unknown 的情况：**
- PersonId 不在 master list，但 bus_id 在 buses 表中存在
  - 例如：A14 的某个新员工不在 master list，但 A14 bus 已经通过其他员工创建了
  - 这种情况下，attendance 会计入到已知的 A14 bus 中

### 数据流程示例

**场景 1: 真正的 Unknown Bus (A25)**
```
Attendance: PersonId=75553, Route="Route-A25 P2"
  ↓
Master list 查找: PersonId 75553 → 找不到 ❌
  ↓
解析 route: "Route-A25 P2" → bus_id = "A25"
  ↓
Buses 表查找: bus_id="A25" → 找不到 ❌
  ↓
保存到 unknown_attendances 表
  ↓
Dashboard 显示: Plant Unknown → A25 (present=1, roster=0)
```

**场景 2: 未知员工但已知 Bus (A14)**
```
Attendance: PersonId=30204, Route="Route-A14 P1"
  ↓
Master list 查找: PersonId 30204 → 找不到 ❌
  ↓
解析 route: "Route-A14 P1" → bus_id = "A14"
  ↓
Buses 表查找: bus_id="A14" → 找到 ✓ (building_id=P1)
  ↓
保存到 unknown_attendances 表（记录未知员工）
  ↓
Dashboard 显示: Plant P1 → A14 (present 包含这个未知员工)
```

## 数据库表结构

```sql
CREATE TABLE unknown_attendances (
    id               BIGSERIAL PRIMARY KEY,
    scanned_batch_id BIGINT NOT NULL,        -- PersonId from attendance
    route_raw        VARCHAR(200),            -- Original route string
    bus_id           VARCHAR(10),             -- Normalized bus code
    shift            unknown_attendance_shift NOT NULL,
    scanned_at       TIMESTAMPTZ NOT NULL,
    scanned_on       DATE NOT NULL,
    source           VARCHAR(50),

    UNIQUE (scanned_batch_id, scanned_on, shift)
);
```

## API 端点

### 查询未知 attendance
```bash
GET /api/report/unknown-attendances
  ?date_from=2026-01-20
  &date_to=2026-01-26
  &bus_id=B12A
  &shift=morning
  &limit=100
  &offset=0
```

响应：
```json
{
  "total_count": 26,
  "limit": 100,
  "offset": 0,
  "records": [
    {
      "id": 1,
      "scanned_batch_id": 123456,
      "route_raw": "Route-B12AA",
      "bus_id": "B12A",
      "shift": "morning",
      "scanned_on": "2026-01-26",
      "scanned_at": "2026-01-26T07:30:00+08:00",
      "source": "manual_upload"
    }
  ]
}
```

### 获取汇总统计
```bash
GET /api/report/unknown-attendances/summary
  ?date_from=2026-01-20
  &date_to=2026-01-26
```

响应：
```json
{
  "total_records": 26,
  "unique_personids": 18,
  "unique_routes": 2,
  "top_routes": [
    {
      "bus_id": "B12A",
      "route_raw": "Route-B12AA",
      "count": 14
    },
    {
      "bus_id": "P8D0",
      "route_raw": "Route-P8D02 (DV)",
      "count": 12
    }
  ]
}
```

## 使用场景

### 场景 1: 发现新 route
1. 上传 attendance 文件
2. 看到 "Unknown PersonIds: 26 (26 saved for tracking)"
3. 在 dashboard 查看 "Plant Unknown" 分组
4. 发现 B12A 和 P8D0 两条新 route
5. 在 master list 中添加这些 route 的员工

### 场景 2: 审计 unknown routes
1. 调用 `/api/report/unknown-attendances/summary`
2. 查看最常见的 unknown routes
3. 决定是否需要添加到 master list

### 场景 3: 清理历史数据
```sql
-- 删除某个日期范围的 unknown attendance
DELETE FROM unknown_attendances
WHERE scanned_on >= '2026-01-01'
  AND scanned_on <= '2026-01-31';
```

## 注意事项

1. **Roster = 0**: Unknown buses 的 roster 永远是 0（因为不在 master list）
2. **Attendance Rate = 0%**: 因为 roster = 0，所以 attendance_rate 始终是 0%
3. **Utilization**: 使用默认 capacity = 40 计算
4. **去重**: 基于 (scanned_batch_id, scanned_on, shift) 唯一约束
5. **Plant 归类**: building_id = null 自动归类为 "Unknown"

## 下一步优化（可选）

1. 添加批量 PersonId → Employee 的导入功能
2. Dashboard 中添加 "Review Unknown Routes" 按钮
3. 允许手动将 unknown attendance 标记为已审核
4. 发送通知当检测到新的 unknown routes
