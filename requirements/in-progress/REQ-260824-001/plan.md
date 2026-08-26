# 主流程 E2E 硬化 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 `etcert-e2e` 中 TC-Platform / TC-Admin 主流程自动化与真实前端不一致、登录态错配、数据与断言偏弱的问题，使 Smoke 可稳定跑通、完整交卷可隔离执行。

**Architecture:** 仅改 `etcert-e2e`。核心是重写 `ExamPage` 前置（等待页面边界 → 向导多步 → 须知勾选与倒计时 → 答题页），将破坏性交卷标为 `@Destructive`；为 Website 团队用例单独生成 `admin-website.json`（website OAuth），与 Admin 后台的 `admin.json` 分离；课程用例消费 `getCourseId()`；catalog 补齐 `appendCert/Course/Exam` 供后续造数写入；加深 NCRE/伙伴/团队断言并更新 README。完整 Admin 建认证/课程/考试 UI 造数仍由 `REQ-260821-002` 承接，本需求只把 catalog 契约与 Website 消费侧补齐。

**Tech Stack:** Playwright Test、现有 Page Object、`TcAuth` / `catalog` / `loadTcTestData`

**req_type:** frontend

## Global Constraints

- 代码只改 `D:\CERT-ALL-CODES\etcert-e2e`
- 不提交 `accounts.local.json` / `.auth` / `catalog.json`
- 实名认证步骤不自动填身份证：未实名账号应明确失败提示
- 完整交卷用例必须带 `@Destructive`，Smoke 默认不跑破坏性步骤
- Stage only，不替用户 git commit

## 页面结构（对照前端）

| 阶段 | 路由/容器 | 关键交互 |
|------|-----------|----------|
| 认证详情 | `/cert/detail` `.cert-detail-page` | 步骤「在线考试」→「进入正式考试\|继续考试\|开始补考」 |
| 报名向导 | `/cert/binding` `.cert-exam-prepare-wizard` | 可能：实名 → 方向卡+下一步 → 同意+开始考试 |
| 考试须知 | `/cert/notice` `.examination-notice` | 勾选「我已阅读…」、等倒计时（前端默认 10s）、开始考试/模拟考试 |
| 答题 | `/etcert-exam/#/exam` `.exam-answer` | `.options .option` 仅客观题；交卷→确认交卷→`.exam-placeholder` |

## 组件树（测试侧）

```
TcAuth (user / admin / partner / admin-website)
  ├─ TC-Admin @Seed → catalog.auth
  └─ TC-Platform
       ├─ course-learning (getCourseId)
       ├─ cert-exam (Smoke 详情 + Destructive 交卷)
       ├─ team-management (admin-website)
       ├─ ncre / partner-cert（加深断言）
```

## 路由与数据流

1. `global-setup`：有 admin 账号时除 `admin.json`（后台）外再写 `admin-website.json`（website `loginAs`）
2. `getCertId` / `getCourseId`：catalog 优先覆盖静态 json；缺失时 Smoke 明确 skip
3. `appendCert` / `appendCourse` / `appendExam`：与 `appendAuth` 同模式，供 Seed 写入

## 状态管理

无前端 store；测试状态 = Playwright `storageState` + `catalog.json`。

## 验收标准

| ID | Pass | Fail |
|----|------|------|
| A1 | `ExamPage.completePreExamFlow` 在向导可见时处理方向/报名，在须知页勾选并等按钮可点后进入 `.exam-answer` | 仍用即时 `isVisible` 跳过未加载页面，或不勾选须知就点开始 |
| A2 | `TC-CERT-001` 仅详情；完整交卷为独立用例且含 `@Destructive`；无 certId 时 skip 文案含 catalog/certs.json | 无 certId 仍尝试交卷，或 Smoke 默认包含交卷 |
| A3 | `team-management` 使用 `admin-website` storageState；`TC-Admin` 仍用 `admin.json` | 团队用例仍绑后台 admin.json 且无 website 态生成 |
| A4 | `course-learning` 有 catalog/静态 courseId 时 `goto(courseId)`，否则 `/course` | 始终忽略 `getCourseId` |
| A5 | `catalog.ts` 具备 `appendCert`/`appendCourse`/`appendExam`；`loadTcTestData` 优先读 catalog | 仅有 auth 数组可写 |
| A6 | NCRE 至少断言考生区；伙伴断言 tabs+权益；团队空态/区块逻辑保留并加强 | 仅 container 可见 |
| A7 | `tests/tc-platform/README.md` 更新命令（含 Destructive）与 SSO/实名说明 | 文档仍写「完整考试流程」为默认 Smoke 且无 admin-website |

## 设计健全性

- 未实名：明确 Error，避免卡死超时
- 非客观题：答题步骤 skip 或找下一道客观题（限次），再允许交卷（允许 0 题作答后交卷若业务允许）
- 无真实账号时无法端到端真跑：代码路径与 skip 文案可静态验收

---

### Task 1: ExamPage 考试前置重写

**Files:**
- Modify: `pageFactory/pageRepository/ExamPage.ts`

- [ ] **Step 1:** 重写 `completePreExamFlow`：先 `Promise.race` 等待 wizard / notice / `.exam-answer`；向导内若出现实名面板则 throw；方向页点第一张卡+「下一步」；报名勾选同意并点「开始考试」；须知勾选并等待按钮 enabled 再点；最后 `waitForLoad`
- [ ] **Step 2:** `answerFirstQuestion`：若无 `.options .option` 则尝试点「下一题」最多 5 次找客观题；仍无则 throw 明确错误
- [ ] **Step 3:** Stage — `git add pageFactory/pageRepository/ExamPage.ts`

### Task 2: cert-exam 拆分

**Files:**
- Modify: `tests/tc-platform/cert-exam.spec.ts`

- [ ] **Step 1:** `TC-CERT-001` 保持 `@Smoke`；原 `TC-CERT-002` 改为 `@Smoke` `@Destructive` 或仅 `@Destructive`，标题标明完整交卷；skip 文案提示 catalog / certs.json / Seed
- [ ] **Step 2:** 新增可选 `TC-CERT-002a`（若需要）：仅进入考试步骤可见「进入正式考试」按钮，`@Smoke`，不交卷——若与 001 重叠则只加强 001 后进 exam step 断言
- [ ] **Step 3:** Stage

### Task 3: admin-website SSO

**Files:**
- Modify: `lib/TcAuth.ts`
- Modify: `lib/tcAuthConfig.ts`
- Modify: `tests/tc-platform/team-management.spec.ts`
- Modify: `playwright.config.ts`（若需）

- [ ] **Step 1:** `getAuthStatePath` 支持 `admin-website.json`；`setupTcAuthStates` 在有 admin 账号时额外 `loginAs(website, 'admin')` 写入该文件
- [ ] **Step 2:** `tcAuthConfig` 增加 websiteAdmin 模式或 `tcWebsiteAdminAuthConfig()`；团队用例改用该态
- [ ] **Step 3:** Stage

### Task 4: 课程 getCourseId

**Files:**
- Modify: `tests/tc-platform/course-learning.spec.ts`

- [ ] **Step 1:** `goto(getCourseId())`；无 id 时仍 `/course`
- [ ] **Step 2:** Stage

### Task 5: catalog 契约

**Files:**
- Modify: `lib/catalog.ts`
- Modify: `lib/loadTcTestData.ts`（如需 exams）

- [ ] **Step 1:** 实现 `appendCert` / `appendCourse` / `appendExam`（与 `appendAuth` 同：load or empty → push → save）
- [ ] **Step 2:** Stage

### Task 6: 断言 + README + package script

**Files:**
- Modify: `tests/tc-platform/ncre.spec.ts`
- Modify: `tests/tc-platform/partner-cert.spec.ts`
- Modify: `tests/tc-platform/team-management.spec.ts`
- Modify: `tests/tc-platform/README.md`
- Modify: `package.json`（可选 `test:tc-platform:destructive`）

- [ ] **Step 1:** NCRE 断言 `studentPanel`；伙伴断言岗位区块 `getSectionCount()>0`（平铺改版，见 REQ-260826-001）；团队保持/加强
- [ ] **Step 2:** README 写清管线、admin-website、实名要求、`@Destructive` 命令；`package.json` 增加 destructive 脚本
- [ ] **Step 3:** Stage

## 与 REQ-260821-002 边界

本需求不实现 Admin「新建认证资源/课程/考试」UI Seed；只提供 catalog 写入 API。`REQ-260821-002` 落地后 Seed 调用 `appendCert` 等即可被 Website 消费。
