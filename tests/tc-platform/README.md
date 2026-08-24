# tc-platform 用例索引

培训认证平台（website / exam）E2E 用例说明。  
**代码即用例**：细节以 `*.spec.ts` 为准；本文件维护 ID、角色、数据与覆盖状态。

## 怎么跑

```powershell
# 账号：复制根目录 accounts.example.json → accounts.local.json 并填写
# admin 需具备后台「用户授权」权限；user 作为被授权账号；交卷账号需已实名
# 环境：tcQa | tcDev | tcGray

# 推荐管线：Admin 造数 → Website 验证
$env:ENV="tcQa"; pnpm run test:tc-admin:seed       # @Seed 用户授权 → catalog.json
$env:ENV="tcQa"; pnpm run test:tc-platform:smoke   # @Smoke（不含完整交卷）
$env:ENV="tcQa"; pnpm run test:tc-platform         # 全量（含 @Regression，仍不含 @Destructive）
$env:ENV="tcQa"; pnpm run test:tc-platform:destructive  # 完整交卷等破坏性用例（专用账号更佳）
```

| 角色 | 账号键 | storageState | 用途 |
|------|--------|--------------|------|
| user | `accounts.user` | `.auth/user.json` | 课程、认证考试、NCRE、我的考试/证书；Seed 被授权方 |
| admin（后台） | `accounts.admin` | `.auth/admin.json` | TC-Admin 造数（需用户授权权限） |
| admin（Website） | 同上 | `.auth/admin-website.json` | 团队服务等 C 端页（global-setup 额外生成） |
| partner | `accounts.partner` | `.auth/partner.json` | 伙伴认证 |

登录态由 `global-setup` 写入 `.auth/*`（已 gitignore）。  
造数产物：`tests/testData/generated/catalog.json`（gitignore）；Website 通过 `lib/loadTcTestData.ts` 优先合并 catalog。

**实名**：`TC-CERT-002` 向导若出现实名面板会直接失败——请使用已实名测试号。  
**DemoQA**：根目录 `tests/functional` 等为样例工程，跑主流程请始终带 `--project=TC-Platform` / `TC-Admin`。

## 用例 ID 规则

`TC-{模块}-{序号}`

| 前缀 | 模块 | 文件 |
|------|------|------|
| `TC-COURSE` | 课程学习 | `course-learning.spec.ts` |
| `TC-CERT` | 认证考试 | `cert-exam.spec.ts` |
| `TC-TEAM` | 团队服务 | `team-management.spec.ts` |
| `TC-NCRE` | NCRE | `ncre.spec.ts` |
| `TC-PARTNER` | 伙伴认证 | `partner-cert.spec.ts` |

新增用例：沿用模块前缀，序号递增；标题写成 `TC-XXX-00N 中文描述`。

## 当前用例清单

| ID | 标题 | 标签 | 角色 | 依赖数据 | 状态 |
|----|------|------|------|----------|------|
| TC-COURSE-001 | 课程详情页加载与入口展示 | @Smoke | user | `getCourseId()` 可选 | 已写 |
| TC-COURSE-002 | 进入学习流程 | @Smoke | user | 同上 | 已写 |
| TC-CERT-001 | 认证详情页加载 | @Smoke | user | **必填** certId | 已写 |
| TC-CERT-001b | 在线考试步骤有状态区 | @Smoke | user | **必填** certId | 已写 |
| TC-CERT-002 | 完整考试交卷流程 | @Destructive | user | **必填** 可进考 certId；已实名 | 已写 |
| TC-CERT-003 | 我的考试记录展示 | @Regression | user | — | 已写 |
| TC-CERT-004 | 我的证书展示 | @Regression | user | — | 已写 |
| TC-TEAM-001 | 团队服务页加载 | @Smoke | admin-website | — | 已写 |
| TC-TEAM-002 | 团队服务区块或空态展示 | @Regression | admin-website | — | 已写 |
| TC-TEAM-003 | 空态下开通入口可见 | @Regression | admin-website | 空态账号更佳 | 已写 |
| TC-NCRE-001 | NCRE 模块加载 | @Smoke | user | — | 已写 |
| TC-PARTNER-001 | 伙伴认证模块加载 | @Smoke | partner | — | 已写 |
| TC-PARTNER-002 | 伙伴专属权益与课程展示 | @Regression | partner | — | 已写 |

**合计**：13 条（8 Smoke + 4 Regression + 1 Destructive）

## 测试数据

| 文件 | 关键字段 | 说明 |
|------|----------|------|
| `../testData/courses.json` | `firstCourse.id` | 空则打开 `/course` 默认课；有 catalog.courses[0].id 时覆盖 |
| `../testData/certs.json` | `firstCert.id` | 认证详情/考试必填；优先 catalog.certs[0].id |
| `../testData/generated/catalog.json` | `auth[]` / `certs[]` / `courses[]` / `exams[]` | Admin Seed 写入；勿提交。写入 API：`appendAuth` / `appendCert` / `appendCourse` / `appendExam` |
| `../testData/ncre.json` | — | 路由参考 |
| `../testData/partner.json` | — | 路由参考 |

认证资源 / 课程 / 考试的 Admin UI 造数见 `REQ-260821-002`；本仓已预留 catalog append 契约。

## 待补（后续加）

### 第一批（有账号后）
- 认证「进入模拟测试」
- 破坏性交卷专用账号与环境重置

### 第二批
- 团队：折叠展开、名额管理
- NCRE：考点 Tab、课程区
- 伙伴：多 Tab、报名考试

### 第三批
- 无会员 / 无认证权限 / 非 partner 等账号态
- 考试多状态：继续考、待发布、未通过、已通过
- 未登录拦截

## 相关代码

| 能力 | 路径 |
|------|------|
| Fixture / PO 注入 | `lib/BaseTest.ts` |
| OAuth + storageState | `lib/TcAuth.ts`、`global-setup.ts`、`lib/tcAuthConfig.ts` |
| 账号加载 | `lib/loadAccounts.ts`、`accounts.example.json` |
| Playwright project | `playwright.config.ts` → `TC-Platform` / `TC-Admin` |
| Admin 造数 Seed | `tests/tc-admin/seed-user-auth.spec.ts` |
| Catalog / 测数合并 | `lib/catalog.ts`、`lib/loadTcTestData.ts` |
