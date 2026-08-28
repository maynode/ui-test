# 主流程 E2E 跑测手册（SOP）

> 产品「主要功能流程」24 项验收。用例目录：`tests/main-flow/`（`MF-*`）。  
> 覆盖对照：[`../MAIN-FLOW-MATRIX.md`](../MAIN-FLOW-MATRIX.md) · 用例索引：[`README.md`](README.md)

---

## 一、跑什么

| 套件 | 条数 | 命令 | 说明 |
|------|------|------|------|
| 主流程（日常） | 22 | `test:main-flow` | 不含交卷等破坏性 |
| 主流程 + 每步截图 | 22 | `test:main-flow:screenshots` | HTML 报告 Attachments 可看每步图 |
| 破坏性主流程 | 2 | `test:main-flow:destructive` | MF-CERT-005/006 完整考试/交卷 |
| 仅管理中心 | 5 | `test:main-flow:mc` | MF-MC-001~005，需 admin 有团队名额 |
| Admin 造数 | 5 Seed | `test:tc-admin:seed` | **建议先跑**，写 catalog + 登录态 |

Playwright project：**`TC-MainFlow`**（`playwright.config.ts`）。

---

## 二、一次性准备

在 **PowerShell** 中执行（只需做一次）：

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm install
pnpm exec playwright install
```

复制账号模板并填写真实密码（**勿提交 git**）：

```powershell
Copy-Item accounts.example.json accounts.local.json
# 编辑 accounts.local.json
```

---

## 三、账号要求

| 角色 | 是否必须 | 用途 |
|------|----------|------|
| `user` | **必须** | 课程、认证、NCRE、伙伴权限负向 |
| `admin` | **必须** | Seed 造数；管理中心 MF-MC-*（Website 登录态） |
| `partner` | 可选 | MF-PARTNER-001/002；缺则 skip |

`user` 跑破坏性交卷（MF-CERT-005/006）时需 **已实名**。

账号文件：`accounts.local.json`（优先于环境变量，见 `lib/loadAccounts.ts`）。

---

## 四、环境 `ENV`

`ENV` 决定打哪套站点（与账号无关），**必填**，否则 Playwright 直接退出。

| ENV | 站点 |
|-----|------|
| `tcTest` | https://edu-test.zwsoft.cn/etcert/（**推荐**） |
| `tcQa` | https://dev.edu-test.zwsoft.cn/etcert/ |
| `tcDev` | http://localhost:5173 |
| `tcGray` | 预发占位 |

写法（**二选一**，勿用 `pnpm run xxx --ENV=tcTest`，会被当成 Playwright 参数报错）：

```powershell
# 方式 A：带 :tcTest 后缀（推荐，复制即用）
pnpm run test:tc-admin:seed:tcTest

# 方式 B：先设环境变量再跑
$env:ENV = "tcTest"
pnpm run test:tc-admin:seed
```

---

## 五、标准流程（复制即用）

### 5.1 三步跑通（最常用）

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e

# ① 造数 + 登录态
pnpm run test:tc-admin:seed:tcTest

# ② 主流程 22 条
pnpm run test:main-flow:tcTest

# ③ 看报告
pnpm exec playwright show-report html-report/tcTest
```

Seed 成功后会生成：

- `.auth/user.json`、`.auth/admin.json`、`.auth/admin-website.json`（及 partner 若有）
- `tests/testData/generated/catalog.json`（含 `certId` / `courseId` 等）

### 5.2 需要每步截图时

```powershell
pnpm run test:tc-admin:seed:tcTest
pnpm run test:main-flow:screenshots:tcTest
pnpm exec playwright show-report html-report/tcTest
```

报告里：点开用例 → **Attachments** → 按步骤名查看 PNG（目前 **课程 6 条** 已接 `stepWithScreenshot`）。

### 5.3 完整考试 / 交卷（破坏性，单独跑）

会改考试状态，建议用 **专用 user 账号**：

```powershell
pnpm run test:main-flow:destructive:tcTest
```

含：**MF-CERT-005** 考试前置流程、**MF-CERT-006** 客观题交卷。

---

## 六、命令速查

```powershell
# 全量主流程（非破坏性）
pnpm run test:main-flow:tcTest

# 带每步截图
pnpm run test:main-flow:screenshots:tcTest

# 仅破坏性 2 条
pnpm run test:main-flow:destructive:tcTest

# 只跑某一模块（示例）
$env:ENV = "tcTest"
pnpm exec playwright test tests/main-flow/course --project=TC-MainFlow

# 只跑单条（示例）
pnpm exec playwright test -g "MF-COURSE-001" --project=TC-MainFlow

# UI 调试模式
pnpm exec playwright test --project=TC-MainFlow --grep @MainFlow --ui
```

> 跑 `pnpm exec playwright test ...` 前请先 `$env:ENV = "tcTest"`。  
> **不要**写 `pnpm run xxx --ENV=tcTest`（Playwright 不识别该参数）。

---

## 七、24 条用例一览

| 模块 | ID | 标题 |
|------|-----|------|
| 课程 | MF-COURSE-001~006 | 课程页 / 详情 / 视频播控 / 文档 / 选节连播 / VIP试看 |
| 认证 | MF-CERT-001~009 | 认证列表~证书（005/006 为 Destructive） |
| 管理中心 | MF-MC-001~005 | 入口布局 / 成员 / 分配闭环 / 跨账号收权 / 报表 |
| NCRE | MF-NCRE-001 | 模块 + 考点 Tab |
| 伙伴 | MF-PARTNER-001~003 | 模块 / 课程详情 / 权限 |

文件路径：`tests/main-flow/{course|cert|manage-center|ncre|partner}/mf-*.spec.ts`

---

## 八、结果怎么读

| 结果 | 含义 |
|------|------|
| **passed** | 该条验收通过 |
| **skipped** | 缺账号/缺数据/环境不满足（见下表，多数正常） |
| **failed** | 需排查：先看 HTML 报告截图/trace |

### 常见 skip（预期）

| 用例 | 原因 |
|------|------|
| MF-MC-003 | admin 无可分配团队 / 名额已耗尽 |
| MF-MC-004 | 依赖 MF-MC-003 成功分配；`.auth/user.json` 缺失时 skip |
| MF-MC-005 | 团队暂无学习数据时只断言空态 |
| MF-COURSE-004 | 课程无 PDF 小节 |
| MF-COURSE-005 | 课程小节数 ≤ 1 |
| MF-COURSE-006 | 纯免费课无 VIP 试看节 |
| MF-CERT-003 | 认证无「进入模拟测试」 |
| MF-CERT-004 | 当前状态无进考按钮 |
| MF-CERT-007 | 「我的考试」无记录 |
| MF-PARTNER-001/002 | 无有效 `partner` 账号 |
| MF-PARTNER-003 | 伙伴页无课程/去考试入口 |

明细：[`../testData/main-flow/prerequisites.md`](../testData/main-flow/prerequisites.md)

---

## 九、故障排查

| 现象 | 处理 |
|------|------|
| `Please provide a correct environment value` | 用 `pnpm run xxx:tcTest` 或先 `$env:ENV="tcTest"` |
| `unknown option '--ENV=tcTest'` | 不要用 `pnpm run xxx --ENV=tcTest`，见上文 |
| `Missing credentials for role "user"` | 检查 `accounts.local.json`，勿用 `your-*` 占位 |
| certId 相关失败 | 重跑 Seed，确认 `catalog.json` 里 `certs[0].id` |
| 交卷失败「实名认证」 | 换已实名 user，或先手工完成实名 |
| 交卷失败「No objective question」 | 换含客观题的认证/试卷 |
| Seed 失败 | 查 admin 权限、Admin 后台是否有产品/课程列表 |
| 报告打不开 | 先跑完测试；目录为 `html-report/{ENV}` |

日志：`logs/info.log`（CustomReporter 写入）。

---

## 十、产物位置

| 路径 | 内容 |
|------|------|
| `html-report/tcTest/` | HTML 报告（按 ENV 分目录） |
| `test-results/` | 失败 trace / video（本地，gitignore） |
| `.auth/*.json` | 登录态（gitignore） |
| `tests/testData/generated/catalog.json` | 造数结果（gitignore） |

---

## 十一、相关文档

| 文档 | 说明 |
|------|------|
| [`FAILURE-ANALYSIS.md`](FAILURE-ANALYSIS.md) | **失败用例逐项分析**、登录账号说明（随跑测更新） |
| [`README.md`](README.md) | 用例索引、截图配置、与 tc-platform 关系 |
| [`../MAIN-FLOW-MATRIX.md`](../MAIN-FLOW-MATRIX.md) | 产品清单 ↔ 覆盖度 |
| [`../testData/main-flow/prerequisites.md`](../testData/main-flow/prerequisites.md) | 每条 MF 前置 |
| [`../../RUNBOOK.md`](../../RUNBOOK.md) | 含 tc-platform 扩展回归的完整 SOP |
| [`../COVERAGE-BACKLOG.md`](../COVERAGE-BACKLOG.md) | 未覆盖 / 后续迭代 |

---

## 十二、一键复制（tcTest）

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm run test:tc-admin:seed:tcTest
pnpm run test:main-flow:tcTest
pnpm exec playwright show-report html-report/tcTest
```
