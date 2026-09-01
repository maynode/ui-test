# etcert-e2e

培训认证平台（website / etcert-admin）Playwright E2E。

## 文档入口

| 文档 | 内容 |
|------|------|
| [`tests/main-flow/README.md`](tests/main-flow/README.md) | **主流程套件说明**（24 条验收用例结构与模块分布） |
| [`tests/main-flow/RUNBOOK.md`](tests/main-flow/RUNBOOK.md) | **主流程跑测手册**（常用命令、单模块执行、截图与报告查看） |
| [`tests/MAIN-FLOW-MATRIX.md`](tests/MAIN-FLOW-MATRIX.md) | **主流程覆盖矩阵**（24/24 项 100% 深度验收对照表） |
| [`RUNBOOK.md`](RUNBOOK.md) | 全套件 SOP 跑测手册（Seed → MainFlow → 扩展回归） |
| [`tests/tc-platform/README.md`](tests/tc-platform/README.md) | 扩展回归套件说明（TC-* / TC-AUTH 历史用例） |

## 快速开始

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm install
pnpm exec playwright install

Copy-Item accounts.example.json accounts.local.json
# 编辑 accounts.local.json，至少填 admin + user

# 1. （推荐）Admin 造数 Seed
pnpm run test:tc-admin:seed:tcTest

# 2. 跑主流程验收套件（22 条非破坏性核心用例）
pnpm run test:main-flow:tcTest

# 3. 带每一步步骤截图的主流程跑测
pnpm run test:main-flow:screenshots:tcTest

# 4. 查看 HTML 可视化报告
pnpm exec playwright show-report html-report/tcTest
```

## 常用跑测命令速查

| 命令 | 说明 | 适用场景 |
|------|------|----------|
| `pnpm run test:main-flow:tcTest` | 跑全量主流程（22 条非破坏性） | 日常门禁与核心回归（推荐） |
| `pnpm run test:main-flow:screenshots:tcTest` | 跑主流程并记录每一步截图 | 直观验收排查与报告交付 |
| `pnpm run test:main-flow:destructive:tcTest` | 跑破坏性交卷用例（2 条） | 专项正式考试交卷链路验证 |
| `pnpm run test:main-flow:mc:tcTest` | 仅跑管理中心模块（5 条） | 企业端坐席分配与报表验证 |
| `pnpm run test:tc-platform:smoke:tcTest` | 跑扩展回归 Smoke 套件 | 历史用例与边界回归 |

## 技术栈

- Node.js ≥ 22、pnpm 11+
- Playwright + TypeScript
- 报告：HTML（按 `ENV` 分目录）+ Allure；日志见 `CustomReporterConfig.ts`

## 说明

- **主流程验收**首选 `test:main-flow:*` 系列命令。
- 仓内仍留有原 DemoQA 样例（`tests/functional` 等），**不要**用根脚本 `pnpm run test` 当作认证平台全量。
- 真实账号只放 `accounts.local.json`（已 gitignore），勿提交。
