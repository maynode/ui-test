# 主流程重构批次四：全主流程 100% 验收闭环 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐全矩阵剩余的 5 项浅断言用例（`MF-CERT-004` 进考二次弹窗与入口验证、`MF-MC-005` 管理中心报表统计与筛选导出、`MF-COURSE-001` 课程分类与卡片元数据、`MF-COURSE-002` 课程大纲结构与收藏分享、`MF-COURSE-004` 学习文档加载与优雅识别），使主流程矩阵 24 项全部达到 ✅ 深度闭环标准（100% 深度验收覆盖）。

**Architecture:** 
1. `CourseDetailPage.ts` / `CourseListPage.ts`：扩展课程卡片元信息提取、课程大纲章节树与收藏分享断言方法。
2. `ManageCenterReportPage.ts`：扩展报表指标卡片值提取、表格表头结构与筛选控件断言。
3. `tests/main-flow/cert/mf-cert.spec.ts`：深化 `MF-CERT-004` 进考二次弹窗与新标签页跳转。
4. `tests/main-flow/manage-center/mf-manage-center.spec.ts`：深化 `MF-MC-005` 报表统计卡与明细表。
5. `tests/main-flow/course/mf-course.spec.ts`：深化 `MF-COURSE-001`、`MF-COURSE-002` 与 `MF-COURSE-004`。
6. 同步矩阵与文档，实现 24/24 ✅ 满覆盖。

**Tech Stack:** Playwright 1.60（`@playwright/test`）、TypeScript 6、Element Plus、ESLint 9

**req_type:** frontend

## Global Constraints

- 仅改动 `etcert-e2e/`，不得修改 `tc-platform-merge/` 下任何业务代码。
- 验收方式为 `tsc --noEmit` + `eslint`。
- 所有步骤只 `git add` 暂存，不执行 `git commit`。

---

## Task 1: 扩展 CourseListPage / CourseDetailPage / ManageCenterReportPage POM 能力

**Files:**
- Modify: `pageFactory/pageRepository/CourseListPage.ts`
- Modify: `pageFactory/pageRepository/CourseDetailPage.ts`
- Modify: `pageFactory/pageRepository/manageCenter/ManageCenterReportPage.ts`

- [ ] **Step 1: 扩展 CourseListPage.ts**
增加课程分类标签、课程卡片列表统计与首个卡片元数据读取方法。

- [ ] **Step 2: 扩展 CourseDetailPage.ts**
增加课程大纲章节列表提取、收藏/分享按钮状态断言。

- [ ] **Step 3: 扩展 ManageCenterReportPage.ts**
增加统计卡数值提取与筛选控件交互方法。

- [ ] **Step 4: Verify POM code**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js pageFactory/pageRepository/CourseListPage.ts pageFactory/pageRepository/CourseDetailPage.ts pageFactory/pageRepository/manageCenter/ManageCenterReportPage.ts
```

- [ ] **Step 5: Stage changes**

```powershell
git add etcert-e2e/pageFactory/pageRepository/CourseListPage.ts etcert-e2e/pageFactory/pageRepository/CourseDetailPage.ts etcert-e2e/pageFactory/pageRepository/manageCenter/ManageCenterReportPage.ts
```

---

## Task 2: 深化 MF-CERT-004 点击去考试按钮与进考确认

**Files:**
- Modify: `tests/main-flow/cert/mf-cert.spec.ts`

- [ ] **Step 1: 深化 MF-CERT-004**
断言在线考试步骤卡片、考试须知说明、点击进考后二次确认 MessageBox（`请确认是否立即开始正式考试？`）及新标签页跳转。

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js tests/main-flow/cert/mf-cert.spec.ts
```

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/cert/mf-cert.spec.ts
```

---

## Task 3: 深化 MF-MC-005 报表分析统计与明细表

**Files:**
- Modify: `tests/main-flow/manage-center/mf-manage-center.spec.ts`

- [ ] **Step 1: 深化 MF-MC-005**
断言报表统计概览卡片（总学习时长/人次/证书）、明细表格表头、认证筛选器、状态筛选器及重置按钮。

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js tests/main-flow/manage-center/mf-manage-center.spec.ts
```

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/manage-center/mf-manage-center.spec.ts
```

---

## Task 4: 深化 MF-COURSE-001、MF-COURSE-002 与 MF-COURSE-004

**Files:**
- Modify: `tests/main-flow/course/mf-course.spec.ts`

- [ ] **Step 1: 深化 MF-COURSE-001、002 与 004**
- `MF-COURSE-001`：断言分类标签栏、课程列表容器、卡片封面与标题。
- `MF-COURSE-002`：断言课程详情页标题、大纲目录章节、课时数及操作栏。
- `MF-COURSE-004`：完善 PDF/文档小节识别与视图加载断言，保持优雅 skip。

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js tests/main-flow/course/mf-course.spec.ts
```

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/course/mf-course.spec.ts
```

---

## Task 5: 同步主流程矩阵（24/24 ✅ 100% 闭环）、运行手册与 Backlog

**Files:**
- Modify: `tests/MAIN-FLOW-MATRIX.md`（所有 24 项均为 ✅，深度用例达 24 条）
- Modify: `tests/main-flow/README.md`
- Modify: `tests/COVERAGE-BACKLOG.md`

- [ ] **Step 1: 更新 MAIN-FLOW-MATRIX.md**
更新汇总表：✅ 达到 **24 条**（100%），🟡 为 **0 条**，❌ 为 0 条。

- [ ] **Step 2: 全量 Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js .
```

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/MAIN-FLOW-MATRIX.md etcert-e2e/tests/main-flow/README.md etcert-e2e/tests/COVERAGE-BACKLOG.md
```
