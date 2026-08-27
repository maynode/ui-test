# P2 造数 / 测试数据矩阵

P1 Seed（`pnpm run test:tc-admin:seed`）覆盖 user 授权 + 认证资源 + 课程 + 考试。  
P2 分两类：**可 Admin UI 自动 Seed** 与 **需人工/商城/专用账号**。

## 一、P2 自动 Seed（已实现 / 规划中）

| 优先级 | Seed ID | Admin 入口 | catalog 字段 | 状态 | 支撑用例 |
|--------|---------|------------|--------------|------|----------|
| P2a | SEED-MEMBER-RES-001 | `#/platformAuth/membership` → `membershipRes` | `memberships[]` | **已实现**（收编首行） | 后续 VIP/会员课 |
| P2b | SEED-CERT-ISSUE-001 | `#/certificate/sign` 等 | `certificates[]` | 规划中 | TC-CERT-004 |
| P2c | SEED-NCRE-001 | NCRE 管理 | `ncre[]`（待扩展） | 规划中 | TC-NCRE-* |

可选环境变量：

| 变量 | 用途 |
|------|------|
| `TC_SEED_MEMBERSHIP_ID` | 直达会员详情 `#/platformAuth/membershipRes?id=` |

## 二、需人工准备（暂不做 Admin Seed）

| 场景 | 原因 | 建议做法 | 支撑用例 |
|------|------|----------|----------|
| **团队订阅 / 名额** | Website 走商城购买（`useTeamProductBuy` → 外链商城） | admin 账号在测试环境**已买过**团队课程/认证产品 | TC-TEAM-004/005 |
| **考试多状态** | 状态依赖历史考试记录，UI Seed 无法一步造 | 准备多账号或固定 user 在环境中处于目标状态 | TC-CERT-005 |
| **伙伴认证** | 伙伴页课程来自前端配置 + partner 账号权限 | 配置 `accounts.local.json` 的 `partner` | TC-PARTNER-* |
| **破坏性交卷** | 消耗考试次数、需已实名 | 专用 user + 可重复进考 certId | TC-CERT-002 |
| **我的证书非空** | 需考试通过且证书已发布 | 使用已通过考试账号，或等 P2b 证书 Seed | TC-CERT-004 |

## 三、考试多状态账号矩阵（示例）

复制为 `exam-states.local.json`（gitignore，本地自用）：

```json
{
  "description": "按账号标注当前期望的认证考试 UI 状态，供 TC-CERT-005 对照",
  "accounts": {
    "user": { "expectedState": "start", "certIdFrom": "catalog.certs[0]" },
    "userContinuing": { "username": "...", "expectedState": "continuing" },
    "userPending": { "username": "...", "expectedState": "pending" },
    "userPassed": { "username": "...", "expectedState": "pass" },
    "userFailed": { "username": "...", "expectedState": "fail-retake" }
  }
}
```

当前 **TC-CERT-005** 仍用默认 `user` 自适应识别，不读此文件；后续 P2 可按 `expectedState` 拆多条用例。

## 四、推荐跑法

```powershell
# P1 + P2a 会员资源（会员表非空时写入 memberships[0]）
pnpm run test:tc-admin:seed --ENV=tcTest

# Website Regression（含团队/拦截/考试多状态识别）
pnpm run test:tc-platform --ENV=tcTest
```

团队用例：确认 `accounts.admin` 在 C 端已开通团队后再跑 `team-management.spec.ts`。

Website / Seed 后续缺口见 **`../COVERAGE-BACKLOG.md`**。
