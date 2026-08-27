# etcert-e2e

培训认证平台（website / etcert-admin）Playwright E2E。

## 文档入口

| 文档 | 内容 |
|------|------|
| [`RUNBOOK.md`](RUNBOOK.md) | **怎么跑**（Seed → Smoke → 报告） |
| [`tests/tc-platform/README.md`](tests/tc-platform/README.md) | 账号、环境、命令范围、用例清单 |

## 快速开始

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm install
pnpm exec playwright install

Copy-Item accounts.example.json accounts.local.json
# 编辑 accounts.local.json，至少填 admin + user

pnpm run test:tc-admin:seed --ENV=tcTest
pnpm run test:tc-platform:smoke --ENV=tcTest
pnpm exec playwright show-report html-report/tcTest
```

## 技术栈

- Node.js ≥ 20、pnpm
- Playwright + TypeScript
- 报告：HTML（按 `ENV` 分目录）+ Allure；日志见 `CustomReporterConfig.ts`

## 说明

- 主流程请只用 `test:tc-admin:*` / `test:tc-platform:*`。
- 仓内仍留有原 DemoQA 样例（`tests/functional` 等），**不要**用根脚本 `pnpm run test` 当作认证平台全量。
- 真实账号只放 `accounts.local.json`（已 gitignore），勿提交。
