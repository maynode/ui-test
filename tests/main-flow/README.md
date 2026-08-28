# 主流程 E2E（tests/main-flow）

产品「主要功能流程」验收专用目录，与 `tests/tc-platform/`（扩展回归）分离。

**跑测手册（从这里开始）**：👉 **[`RUNBOOK.md`](RUNBOOK.md)**

| 文档 | 用途 |
|------|------|
| **[`RUNBOOK.md`](RUNBOOK.md)** | **主流程跑测 SOP（命令、账号、报告）** |
| [`../MAIN-FLOW-MATRIX.md`](../MAIN-FLOW-MATRIX.md) | 产品清单 ↔ 覆盖度 |
| [`../testData/main-flow/prerequisites.md`](../testData/main-flow/prerequisites.md) | 每条 MF 的前置账号/数据 |
| [`../tc-platform/README.md`](../tc-platform/README.md) | TC-* 扩展用例（拦截、830 等） |

---

## 用例 ID

`MF-{模块}-{序号}`，与 `MAIN-FLOW-MATRIX.md` 矩阵行号一一对应。

| 目录 | 模块 | 文件 | 条数 |
|------|------|------|------|
| `course/` | 课程学习 | `mf-course.spec.ts` | 4 |
| `cert/` | 认证考试 | `mf-cert.spec.ts` | 9 |
| `team/` | 团队管理 | `mf-team.spec.ts` | 3 |
| `ncre/` | NCRE | `mf-ncre.spec.ts` | 1 |
| `partner/` | 伙伴认证 | `mf-partner.spec.ts` | 3 |

**合计 20 条**（`@MainFlow`）；其中 **2 条** 另标 `@Destructive`（MF-CERT-005/006）。

---

## 怎么跑

Playwright project：`TC-MainFlow`（`playwright.config.ts`）。

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e

# 1. 造数（建议）
pnpm run test:tc-admin:seed:tcTest

# 2. 主流程（非破坏性，18 条）
pnpm run test:main-flow:tcTest

# 3. 破坏性主流程（交卷/完整考试，2 条）
pnpm run test:main-flow:destructive:tcTest
```

报告：`pnpm exec playwright show-report html-report/tcTest`

---

## 标签

| 标签 | 含义 |
|------|------|
| `@MainFlow` | 属于主流程验收套件 |
| `@Destructive` | 会改环境（交卷等），不进日常 main-flow |

---

## 每一步截图（HTML 报告里看）

Playwright **没有**「按 `test.step` 自动截图」的全局开关，分两层：

| 层级 | 配置位置 | 作用 |
|------|----------|------|
| **用例结束** | `playwright.config.ts` → `TC-MainFlow` 的 `screenshot` | `STEP_SCREENSHOT=1` 时为 `on`（每条用例一张） |
| **每个 step** | `lib/stepWithScreenshot.ts` + spec 里调用 | 步骤结束 attach 到报告 |

### 怎么开

```powershell
# 推荐：已内置 STEP_SCREENSHOT=1
pnpm run test:main-flow:screenshots:tcTest

# 或手动
$env:STEP_SCREENSHOT="1"
pnpm run test:main-flow:tcTest
```

### spec 里怎么写

把 `test.step(...)` 换成 `stepWithScreenshot(page, ...)`（见 `course/mf-course.spec.ts` 示例）：

```typescript
import { stepWithScreenshot } from '@lib/stepWithScreenshot';

await stepWithScreenshot(page, '导航到课程页', async () => {
  await courseListPage.goto(courseId);
});
```

### 截图在哪看

1. 跑完后：`pnpm exec playwright show-report html-report/tcTest`
2. 点开某个用例 → **Attachments** 里按步骤名排列
3. 失败时另有 `test-results/` 下 trace/video（与 step attach 无关）

未设 `STEP_SCREENSHOT=1` 时，`stepWithScreenshot` 行为与普通 `test.step` 相同，不 attach。

---

## 与 tc-platform 的关系

| 套件 | 目录 | 命令 | 职责 |
|------|------|------|------|
| **主流程** | `tests/main-flow/` | `test:main-flow` | 产品验收清单 20 项 |
| **扩展回归** | `tests/tc-platform/` | `test:tc-platform` | TC-AUTH、多状态加深、历史 Smoke |
| **造数** | `tests/tc-admin/` | `test:tc-admin:seed` | `@Seed` → catalog |

PO（`pageFactory/`）、`BaseTest`、`lib/catalog` **共用**，不重复维护 Page Object。

---

## 当前 skip 项（预期）

| ID | 原因 |
|----|------|
| MF-TEAM-001 | 待商城购买 / SEED-TEAM |
| MF-TEAM-003 | 待未注册占位分配场景 |
| MF-COURSE-004 | 课程无 PDF 小节时 skip |
| MF-CERT-003/004/007 | 无自测入口 / 无进考按钮 / 我的考试无记录 |
| MF-PARTNER-* | 缺 partner 账号或页上无课程卡 |

详见 [`prerequisites.md`](../testData/main-flow/prerequisites.md)。
