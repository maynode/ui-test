# 主流程 E2E（tests/main-flow）

产品「主要功能流程」验收专用目录，与 `tests/tc-platform/`（扩展回归）分离。

| 文档 | 用途 |
|------|------|
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
pnpm run test:tc-admin:seed --ENV=tcTest

# 2. 主流程（非破坏性，19 条）
pnpm run test:main-flow --ENV=tcTest

# 3. 破坏性主流程（交卷/完整考试，2 条）
pnpm run test:main-flow:destructive --ENV=tcTest
```

报告：`pnpm exec playwright show-report html-report/tcTest`

---

## 标签

| 标签 | 含义 |
|------|------|
| `@MainFlow` | 属于主流程验收套件 |
| `@Destructive` | 会改环境（交卷等），不进日常 main-flow |

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
