# tc-platform 用例索引

培训认证平台（website / exam / admin 造数）**扩展回归**说明。  
**产品主流程验收（20 项）** 见 [`../main-flow/README.md`](../main-flow/README.md)（`MF-*`，命令 `pnpm run test:main-flow`）。

**代码即用例**：细节以 `*.spec.ts` 为准；本文件维护怎么跑、账号、命令范围、用例 ID 与覆盖状态。

快速执行清单见：`RUNBOOK.md`（项目根目录）

---

## 怎么跑

### 1. 账号（必配）

```powershell
# 在 etcert-e2e 根目录
Copy-Item accounts.example.json accounts.local.json
# 编辑 accounts.local.json，填入真实账号（该文件已 gitignore，勿提交）
```

| 角色 | 几个号 | 用途 | 最少要有 |
|------|--------|------|----------|
| `admin` | 1 | Admin Seed 造数；同一号再登 Website 跑团队用例 | Seed / 团队 |
| `user` | 1 | 课程、认证考试、NCRE；Seed 授权对象 | Seed 授权 + 主流程 |
| `partner` | 1 | 伙伴认证 | 仅伙伴用例；可暂缺（会 skip） |

**最少跑通造数 + 主流程 Smoke：`admin` + `user`（2 个）。**

账号读取顺序（`lib/loadAccounts.ts`）：

1. `accounts.local.json`（优先）
2. 环境变量 `TC_USER_USERNAME` / `TC_ADMIN_*` / `TC_PARTNER_*`
3. `testConfig.ts` → `accounts`（仅占位兜底；`example.com` / 假 AES 前缀视为无效）

| 文件 | 配什么 | 要不要填真密码 |
|------|--------|----------------|
| `accounts.local.json` | 测试账号 | **要** |
| `testConfig.ts` | 环境 URL（`tcQa` / `tcTest` / `tcDev` / `tcGray`）；`accounts` 只是占位 | **不要**把真密码写进这里 |
| `accounts.json` | — | **框架不读**；请用 `accounts.local.json` |

### 2. 环境 `ENV`（必选）

`playwright.config.ts` **没有默认 ENV**：未设置或不合法会直接退出。  
`ENV` 只决定打哪套地址，和账号文件是两件事。

| `ENV` | 地址来源（`testConfig.ts`） |
|-------|------------------------------|
| `tcQa` | 开发测试站 `https://dev.edu-test.zwsoft.cn/etcert/` |
| `tcTest` | 测试环境 [`https://edu-test.zwsoft.cn/etcert/`](https://edu-test.zwsoft.cn/etcert/) |
| `tcDev` | 本地 `http://localhost:5173` |
| `tcGray` | 预发占位 |

推荐统一写法（最省事）：

```powershell
pnpm run test:tc-admin:seed --ENV=tcTest
```

可选 Seed 辅助变量：

- `TC_SEED_PRODUCT_ID`：产品数字 ID，直达产品资源页
- `TC_SEED_CERT_QUERY`：认证资源搜索关键字
- `TC_ADMIN_BASE_URL`：覆盖默认 Admin 地址（默认 website + `/etcert-admin/`）

### 3. 命令范围（不是「跑全部」）

| 命令 | 实际跑什么 | 不是什么 |
|------|------------|----------|
| `pnpm run test:tc-admin:seed` | **仅** `--project=TC-Admin` + `@Seed` 造数 → 写 `catalog.json` | 不是 Website 全量，不是 DemoQA |
| `pnpm run test:tc-platform:smoke` | `TC-Platform` + `@Smoke` | 不含完整交卷 |
| `pnpm run test:tc-platform` | `TC-Platform` 全量，**排除** `@Destructive` | 不含交卷类破坏性用例 |
| `pnpm run test:tc-platform:destructive` | 仅 `@Destructive`（如完整交卷） | 建议专用账号 |
| `pnpm run test`（根脚本） | 原 DemoQA 多浏览器套件 | **不要**用来跑培训认证主流程 |

推荐管线：

```powershell
pnpm run test:tc-admin:seed --ENV=tcTest
pnpm run test:tc-platform:smoke --ENV=tcTest
# 需要时再：
# pnpm run test:tc-platform --ENV=tcTest
# pnpm run test:tc-platform:destructive --ENV=tcTest
```

登录态由 `global-setup` 写入 `.auth/*`（gitignore）。  
造数产物：`tests/testData/generated/catalog.json`（gitignore）；Website 经 `lib/loadTcTestData.ts` 优先读 catalog **数组 `[0]`**（Seed 写入为 unshift，最新在前）。

**实名**：`TC-CERT-002` 若出现实名面板会失败——交卷请用已实名 `user`。  
**DemoQA**：`tests/functional` 等为样例；培训认证请始终用上表 `TC-*` 脚本。

---

## 角色与 storageState

| 角色 | 账号键 | storageState | 用途 |
|------|--------|--------------|------|
| user | `accounts.user` | `.auth/user.json` | 课程、认证考试、NCRE、我的考试/证书；Seed 被授权方 |
| admin（后台） | `accounts.admin` | `.auth/admin.json` | TC-Admin 造数 |
| admin（Website） | 同上 | `.auth/admin-website.json` | 团队服务等 C 端（global-setup 额外生成） |
| partner | `accounts.partner` | `.auth/partner.json` | 伙伴认证 |

---

## 用例 ID 规则

`TC-{模块}-{序号}`

| 前缀 | 模块 | 文件 |
|------|------|------|
| `TC-COURSE` | 课程学习 | `course-learning.spec.ts` |
| `TC-CERT` | 认证考试 | `cert-exam.spec.ts` |
| `TC-TEAM` | 团队服务 | `team-management.spec.ts` |
| `TC-NCRE` | NCRE | `ncre.spec.ts` |
| `TC-PARTNER` | 伙伴认证 | `partner-cert.spec.ts` |
| `TC-AUTH` | 访问拦截 / 无权限 | `access-control.spec.ts` |

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
| TC-PARTNER-001 | 伙伴认证模块加载（岗位区块平铺） | @Smoke | partner | — | 已写 |
| TC-PARTNER-002 | 伙伴专属权益与课程/去考试展示 | @Regression | partner | — | 已写 |
| TC-CERT-005 | 在线考试多状态 UI 识别 | @Regression | user | **必填** certId | 已写 |
| TC-TEAM-004 | 团队折叠区块可展开 | @Regression | admin-website | 非空态账号 | 已写 |
| TC-TEAM-005 | 名额管理页可进入 | @Regression | admin-website | 非空态 + 有名额行 | 已写 |
| TC-AUTH-001 | 未登录访问个人中心重定向 | @Regression | 无登录态 | — | 已写 |
| TC-AUTH-002 | 未登录点击开始学习弹登录框 | @Regression | 无登录态 | courseId 可选 | 已写 |
| TC-AUTH-003 | 非 partner 立即学习无权限弹窗 | @Regression | user | 伙伴页有课程卡 | 已写 |
| TC-AUTH-004 | 非 partner 去考试无权限弹窗 | @Regression | user | 伙伴页有去考试 | 已写 |

**合计**：20 条（8 Smoke + 11 Regression + 1 Destructive）

## 测试数据

| 文件 | 关键字段 | 说明 |
|------|----------|------|
| `../testData/courses.json` | `firstCourse.id` | 空则打开 `/course` 默认课；有 catalog.courses[0].id 时覆盖 |
| `../testData/certs.json` | `firstCert.id` | 认证详情/考试必填；优先 catalog.certs[0].id |
| `../testData/generated/catalog.json` | `auth[]` / `certs[]` / `courses[]` / `exams[]` / `memberships[]` | Admin Seed 写入；勿提交 |
| `../testData/seed-p2-matrix.md` | — | P2 自动 Seed vs 人工前置（团队/考试状态/伙伴/证书） |
| `../testData/exam-states.example.json` | — | 多状态账号矩阵示例 |
| `../testData/ncre.json` | — | 路由参考 |
| `../testData/partner.json` | — | 路由参考 |

Website 消费：`getCertId()` / `getCourseId()` / `getExamId()` 优先读 catalog。考试 ID 暂无独立 Website 用例硬接线，Seed 仍写入 `exams[]`。

### Admin Seed 清单（`tests/tc-admin`）

`pnpm run test:tc-admin:seed` 会跑下列全部 `@Seed`（`--workers=1`）。

| ID | 说明 | 依赖 |
|----|------|------|
| SEED-AUTH-001 | 批量用户授权 → `auth[]` | admin + user |
| SEED-CERT-RES-001 | 产品资源绑/收编认证 → `certs[0].id`（= 资源ID） | admin；产品列表非空或 `TC_SEED_PRODUCT_ID`；可搜认证 |
| SEED-COURSE-001 | 新建课程（**仅提交前失败**才收编首行）→ `courses[0]` | admin；新建需分类/标签，否则列表至少一行 |
| SEED-EXAM-001 | 新建固定试卷考试（**仅提交前失败**才收编首行）→ `exams[0]` | admin；新建需已有试卷，否则列表至少一行 |
| SEED-MEMBER-RES-001 | 收编会员资源首行 → `memberships[0]`（P2） | admin；会员详情资源表非空，否则 skip |

P2 人工前置见 `../testData/seed-p2-matrix.md`。Admin 说明见 `tests/tc-admin/README.md`。

## 待补（后续加）

主流程验收对照：**[`../MAIN-FLOW-MATRIX.md`](../MAIN-FLOW-MATRIX.md)** · 实现目录 **`../main-flow/`**  
完整 backlog 见：**[`../COVERAGE-BACKLOG.md`](../COVERAGE-BACKLOG.md)**（未覆盖 / 很浅 / 造数缺口 / 830 新功能）。

摘要：

| 优先级 | 方向 |
|--------|------|
| P0 加深 | 考试固定多状态、名额页内操作、NCRE 考点、伙伴跳转详情、更多未登录入口 |
| P1 新用例 | 模拟测试、交卷专用账号、团队商城购买、负向账号态 |
| P2 造数 | 成绩管理 Seed、发证 Seed、团队 Seed（待调研） |
| P3 | 中望杯、个人中心会员卡、830 其它新页 |

## 相关代码

| 能力 | 路径 |
|------|------|
| Fixture / PO 注入 | `lib/BaseTest.ts` |
| OAuth + storageState | `lib/TcAuth.ts`、`global-setup.ts`、`lib/tcAuthConfig.ts` |
| 账号加载 | `lib/loadAccounts.ts`、`accounts.example.json` → `accounts.local.json` |
| 环境地址 | `testConfig.ts`、`ENV` |
| Playwright project | `playwright.config.ts` → `TC-Platform` / `TC-Admin` |
| Admin 造数 Seed | `tests/tc-admin/seed-*.spec.ts` |
| Admin PO | `pageFactory/pageRepository/admin/` |
| Catalog / 测数合并 | `lib/catalog.ts`、`lib/loadTcTestData.ts` |
