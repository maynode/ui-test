# Admin Seed P1：认证资源 / 课程 / 考试造数

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 TC-Admin 用 Playwright 把认证资源（产品资源绑定）、课程、考试写入 `catalog.json`，供 Website 用例消费。

**Architecture:** 复用现有 `UserAuthPage` / `appendAuth` 模式：Admin PO + `@Seed` 规格 + `appendCert|Course|Exam`。`append*` / `getExamId` 已由并行需求补齐，本需求不再重复实现。认证侧走「产品资源绑定已有认证」拿 `resId`（即 website `certId`），不从零走认证管理向导。课程以「新建 + 读表/URL」为主，列表为空字典时退回收编首行。考试以「新建固定试卷 + 选已有卷」为主，无卷时收编列表首行。名称带时间戳防冲突；`--workers=1`。

**Tech Stack:** Playwright、TypeScript、Element Plus 选择器、现有 `lib/catalog.ts` / `tcAuthConfig`

**req_type:** frontend

## Global Constraints

- 仅改 `etcert-e2e`；不改 admin 业务包
- 无本地账号时用例 `test.skip`，不虚构通过
- 造数产物只写 `tests/testData/generated/catalog.json`（gitignore）
- 需求文档不写领域 skill 名

## 页面结构 / 路由

| Seed | Admin 路由 | 关键 UI |
|------|------------|--------|
| SEED-CERT-RES-001 | `#/platformAuth/product` → `#/platformAuth/productRes?id=` | 「新增认证资源」/ 表「资源ID」 |
| SEED-COURSE-001 | `#/system/course` | 「新增课程」dialog / 表「课程ID」 |
| SEED-EXAM-001 | `#/exam/list` | 「新增考试」dialog / 表「考试ID」 |

## 组件树

```
TC-Admin project
  seed-product-res.spec → ProductResPage → appendCert
  seed-course.spec → CourseManagePage → appendCourse
  seed-exam.spec → ExamListPage → appendExam
  （已有）seed-user-auth.spec → UserAuthPage → appendAuth
```

## 数据流

1. `global-setup` 生成 `.auth/admin.json`（依赖 `accounts.local.json`）
2. Seed 写入 `catalog.json` 的 `certs` / `courses` / `exams`
3. Website `getCertId` / `getCourseId` / `getExamId` 优先读 catalog

## 状态管理

无前端 store；catalog 为本地 JSON 文件契约。

## 验收标准

| ID | Pass |
|----|------|
| A1 | `ProductResPage` 能打开产品资源页并读到或绑定出 `resId` |
| A2 | `SEED-CERT-RES-001` 成功时 `catalog.certs[0].id` 非空 |
| A3 | `CourseManagePage` 能新建或收编课程并得到 `courseId` |
| A4 | `SEED-COURSE-001` 成功时 `catalog.courses[0].id` 非空 |
| A5 | `ExamListPage` 能新建（有卷）或收编考试并得到 `examId` |
| A6 | `SEED-EXAM-001` 成功时 `catalog.exams[0].id` 非空 |
| A7 | README 写明 Seed 命令、环境依赖、可选 `TC_SEED_PRODUCT_ID` |
| A8 | `tsc --noEmit` 通过；无账号时用例 skip 而非 fail |

## 风险

- 考试依赖环境已有试卷；无卷则收编列表
- 课程分类/标签字典为空则无法新建，收编列表
- 产品列表为空则无法进 productRes
- 动态菜单权限不足时直达 hash 仍可能空白页

## File Structure

- Modify: `lib/catalog.ts`（已齐，本需求不改逻辑）
- Create: `pageFactory/pageRepository/admin/adminUi.ts`
- Create: `pageFactory/pageRepository/admin/ProductResPage.ts`
- Create: `pageFactory/pageRepository/admin/CourseManagePage.ts`
- Create: `pageFactory/pageRepository/admin/ExamListPage.ts`
- Create: `tests/tc-admin/seed-product-res.spec.ts`
- Create: `tests/tc-admin/seed-course.spec.ts`
- Create: `tests/tc-admin/seed-exam.spec.ts`
- Modify: `tests/tc-platform/README.md`

### Task 1: Catalog 契约确认（已完成）

**Files:** 无改动（`appendCert/Course/Exam`、`getExamId` 已存在）

- [ ] **Step 1:** 确认 `lib/catalog.ts` 与 `lib/loadTcTestData.ts` 已具备 append / getExamId
- [ ] **Step 2:** meta 将本任务标 done

### Task 2: 产品资源 PO + SEED-CERT-RES-001

**Files:**
- Create: `pageFactory/pageRepository/admin/adminUi.ts`
- Create: `pageFactory/pageRepository/admin/ProductResPage.ts`
- Create: `tests/tc-admin/seed-product-res.spec.ts`

- [ ] **Step 1:** 实现 `pickFirstSelectOption` 等共用 UI 助手
- [ ] **Step 2:** 实现 ProductResPage（进产品详情 / 绑认证或读表）
- [ ] **Step 3:** 写 SEED-CERT-RES-001 `@Seed`
- [ ] **Step 4:** `npx tsc --noEmit` 无错 → `git add`（不 commit）

### Task 3: 课程 PO + SEED-COURSE-001

**Files:**
- Create: `pageFactory/pageRepository/admin/CourseManagePage.ts`
- Create: `tests/tc-admin/seed-course.spec.ts`

- [ ] **Step 1:** 新建课程填必填 + 提交；失败则收编首行
- [ ] **Step 2:** appendCourse 断言
- [ ] **Step 3:** typecheck → stage

### Task 4: 考试 PO + SEED-EXAM-001

**Files:**
- Create: `pageFactory/pageRepository/admin/ExamListPage.ts`
- Create: `tests/tc-admin/seed-exam.spec.ts`

- [ ] **Step 1:** 新建固定试卷考试（选首份卷）；无卷则收编首行
- [ ] **Step 2:** appendExam 断言
- [ ] **Step 3:** typecheck → stage

### Task 5: README / 脚本说明

**Files:**
- Modify: `tests/tc-platform/README.md`

- [ ] **Step 1:** 补充三条 Seed ID、依赖、`TC_SEED_PRODUCT_ID`、推荐命令序
- [ ] **Step 2:** 确认 `test:tc-admin:seed` 已覆盖全部 `@Seed`

### Task 6: getExamId 接线说明

**Files:**
- Modify: `tests/tc-platform/README.md`（测数表注明 getExamId）

- [ ] **Step 1:** 函数已存在；README 标明 Website 可消费 `catalog.exams`；暂无独立 exams 用例则不硬接线
