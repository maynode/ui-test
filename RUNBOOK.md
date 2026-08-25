# tc-platform 跑测步骤清单（SOP）

这份文档只回答一件事：**从 0 到出报告，按什么顺序跑**。

## 0. 前置条件（只需检查一次）

- 已在 `ui-test` 目录执行过 `pnpm install`
- 已安装 Playwright 浏览器：`pnpm exec playwright install`
- 账号文件存在：`accounts.local.json`

> 最少账号：`admin` + `user`。  
> 若要跑伙伴 Smoke，再加 `partner`。

## 1. 打开终端并进入项目目录

```powershell
cd d:\CERT-ALL-CODES\ui-test
```

## 2. 选环境参数（直接跟在命令后）

可选值：`tcQa` / `tcTest` / `tcDev` / `tcGray`。  
`ENV` 只决定站点地址，不决定账号。

## 3. 先跑 Admin Seed（造数）

```powershell
pnpm run test:tc-admin:seed --ENV=tcTest
```

作用：
- 生成登录态 `.auth/*.json`
- 写测试数据 `tests/testData/generated/catalog.json`

若这一步失败，先不要跑 Smoke。

## 4. 跑主流程 Smoke（日常回归）

```powershell
pnpm run test:tc-platform:smoke --ENV=tcTest
```

范围：
- 只跑 `TC-Platform` 项目
- 只跑 `@Smoke`
- 不含 `@Destructive`

## 5. 打开 HTML 报告

```powershell
pnpm exec playwright show-report html-report/tcTest
```

说明：
- 这个命令只“看报告”，不“跑用例”
- 必须先执行过测试，`html-report/tcTest` 才存在

## 6. 需要更全覆盖时（可选）

### 6.1 全量（不含破坏性）

```powershell
pnpm run test:tc-platform --ENV=tcTest
```

### 6.2 仅破坏性（完整交卷等）

```powershell
pnpm run test:tc-platform:destructive --ENV=tcTest
```

建议用专用账号跑 destructive。

## 7. 常见判断（很实用）

- 看到 `skipped`：通常是缺对应角色账号或数据前置不足
- 看到 `Missing credentials for role ...`：检查 `accounts.local.json`
- 看到 `certId` 相关跳过/失败：先确认 Seed 是否成功写入 `catalog.json`

## 一键记忆版（最常用三条）

```powershell
cd d:\CERT-ALL-CODES\ui-test
pnpm run test:tc-admin:seed --ENV=tcTest
pnpm run test:tc-platform:smoke --ENV=tcTest
pnpm exec playwright show-report html-report/tcTest
```
