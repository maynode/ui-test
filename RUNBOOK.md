# tc-platform / 主流程 跑测步骤清单（SOP）

这份文档只回答一件事：**从 0 到出报告，按什么顺序跑**。

> **产品主流程验收**（20 项）→ **[`tests/main-flow/RUNBOOK.md`](tests/main-flow/RUNBOOK.md)**（推荐）  
> 扩展回归 / 历史 Smoke → `pnpm run test:tc-platform:smoke`

## 0. 前置条件（只需检查一次）

- 已在 `etcert-e2e` 目录执行过 `pnpm install`
- 已安装 Playwright 浏览器：`pnpm exec playwright install`
- 账号文件存在：`accounts.local.json`

> 最少账号：`admin` + `user`。  
> 若要跑伙伴 Smoke，再加 `partner`。

## 1. 打开终端并进入项目目录

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
```

## 2. 选环境参数

可选值：`tcQa` / `tcTest` / `tcDev` / `tcGray`。  
`ENV` 只决定站点地址，不决定账号。

**PowerShell 不要用** `pnpm run xxx --ENV=tcTest`（会报 `unknown option '--ENV=tcTest'`）。

```powershell
# 推荐：脚本名带 :tcTest
pnpm run test:tc-admin:seed:tcTest

# 或先设变量
$env:ENV = "tcTest"
pnpm run test:tc-admin:seed
```

## 3. 先跑 Admin Seed（造数）

```powershell
pnpm run test:tc-admin:seed:tcTest
```

作用：
- 生成登录态 `.auth/*.json`
- 写测试数据 `tests/testData/generated/catalog.json`

若这一步失败，先不要跑 Smoke。

## 4. 跑主流程验收（推荐 · 产品清单 20 项）

```powershell
pnpm run test:main-flow:tcTest
```

范围：
- 只跑 `TC-MainFlow` 项目（`tests/main-flow/`）
- 只跑 `@MainFlow`，不含 `@Destructive`
- 对照表：[`tests/MAIN-FLOW-MATRIX.md`](tests/MAIN-FLOW-MATRIX.md)

破坏性主流程（交卷等，2 条）：

```powershell
pnpm run test:main-flow:destructive:tcTest
```

## 5. 跑扩展 Smoke（可选 · tc-platform 历史门禁）

```powershell
pnpm run test:tc-platform:smoke:tcTest
```

范围：
- 只跑 `TC-Platform` 项目
- 只跑 `@Smoke`
- 不含 `@Destructive`

## 6. 打开 HTML 报告

```powershell
pnpm exec playwright show-report html-report/tcTest
```

说明：
- 这个命令只“看报告”，不“跑用例”
- 必须先执行过测试，`html-report/tcTest` 才存在

## 7. 需要更全覆盖时（可选）

### 7.1 tc-platform 全量（不含破坏性）

```powershell
$env:ENV = "tcTest"
pnpm run test:tc-platform
```

### 7.2 tc-platform 破坏性（完整交卷等）

```powershell
$env:ENV = "tcTest"
pnpm run test:tc-platform:destructive
```

建议用专用账号跑 destructive。

## 8. 常见判断（很实用）

- 看到 `skipped`：通常是缺对应角色账号或数据前置不足
- 看到 `Missing credentials for role ...`：检查 `accounts.local.json`
- 看到 `certId` 相关跳过/失败：先确认 Seed 是否成功写入 `catalog.json`

## 一键记忆版（最常用三条）

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm run test:tc-admin:seed:tcTest
pnpm run test:main-flow:tcTest
pnpm exec playwright show-report html-report/tcTest
```
