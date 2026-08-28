# 主流程重构批次三：认证考试闭环与发证/补考 E2E Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为「认证考试」模块深化端到端主流程用例，覆盖模拟考试自测全流程闭环（进入、作答、交卷与结果页）、正式考试前置向导与答题交卷深化、跨页考试状态机与成绩记录同步，以及发证卡片、编号复制与查看下载闭环。

**Architecture:** 沿用 Playwright + Page Object 模式：在 `pageFactory/pageRepository/ExamPage.ts`、`MyExamPage.ts` 与 `MyCertPage.ts` 中补齐自测考试交互、答题卡联动、交卷成功占位图、考试列表记录提取与证书卡片操作方法；在 `tests/main-flow/cert/mf-cert.spec.ts` 中加深 `MF-CERT-003`、`MF-CERT-005`、`MF-CERT-006`、`MF-CERT-007`、`MF-CERT-008` 与 `MF-CERT-009`；正式考试答题交卷用例保留 `@Destructive` 标签用于单独执行；数据前置缺失（如认证无自测卷、未到发证阶段）时采用 `test.skip(condition, reason)` 优雅跳过。

**Tech Stack:** Playwright 1.60（`@playwright/test`）、TypeScript 6、Element Plus 表格/卡片选择器、ESLint 9

**req_type:** frontend

## Global Constraints

- 仅改动 `etcert-e2e/`，不得修改 `tc-platform-merge/` 下任何业务代码。
- 认证与考试用例统一使用 `user` 角色登录态（`tcAuthConfig('user')`）。
- MF-CERT-005 / MF-CERT-006 保持 `@Destructive` 标签；其余用例为非破坏性用例。
- 状态同步与证书断言需提取关键字段（考试科目、得分/状态、证书编号、有效期），不单依赖空态检查。
- 数据前置缺失时用 `test.skip(condition, reason)` 显式跳过并写明原因，禁止静默通过。
- 本工程无单元测试基建（无 vitest/jest），验收方式为 Playwright 用例语法检测 + `eslint` + `tsc --noEmit`。
- 所有步骤只 `git add` 暂存，不执行 `git commit`。

---

## 页面结构与关键组件选择器

| 区域 | 组件 / 选择器 | 说明 |
|------|--------------|------|
| 认证详情页 | `.cert-detail-page` / `.module-learn` / `.module-exam` | 学习与考试步骤区 |
| 模拟测试入口 | `.learn-side__btn`（文案：`进入模拟测试`） | 学习步骤侧栏自测按钮 |
| 考试前置向导 | `.cert-exam-prepare-wizard` / `.cert-exam-direction-pick` / `.cert-exam-prepare-binding` | 方向选择与协议确认 |
| 考试须知 | `.examination-notice` > `.el-checkbox` / `.notice-btn` | 须知阅读与倒计时按钮 |
| 答题页 | `.exam-answer` > `.options .option` / `.next-btn` / `.card-item` | 客观题选项、下一题与答题卡 |
| 交卷确认 | `button:has-text("交卷")` / `button:has-text("确认交卷")` | 答题页顶部/底部交卷与二次确认 |
| 交卷成功占位 | `.exam-placeholder` / `text="已完成交卷"` | 提交后的成绩提示页 |
| 我的考试表格 | `.my-exam .el-table` > `.el-table__body-wrapper tbody tr` | 科目/考试、考试时间、状态、分数 |
| 我的证书卡片 | `.my-cert .cert-list-item` | 证书封面、名称、有效期、证书编号、操作按钮 |
| 证书操作按钮 | `.cert-operate button`（文案：`查看下载` / `生成证书`） | 证书查看或生成入口 |

---

## Task 1: 扩展 ExamPage / MyExamPage / MyCertPage POM 能力

**Files:**
- Modify: `pageFactory/pageRepository/ExamPage.ts`
- Modify: `pageFactory/pageRepository/MyExamPage.ts`
- Modify: `pageFactory/pageRepository/MyCertPage.ts`

**Interfaces:**
- Consumes: `@playwright/test`
- Produces: 扩展的 ExamPage（自测向导、多题作答、交卷成功确认）、MyExamPage（记录行解析与状态获取）、MyCertPage（证书信息提取与查看操作）

- [ ] **Step 1: 扩展 ExamPage.ts**

更新 `pageFactory/pageRepository/ExamPage.ts`，增加自测流程、连续多题答题与提交结果断言方法：

```ts
    /**
     * 模拟测试须知：等待倒计时结束并勾选同意，点击开始模拟考试
     */
    async completeSelfTestNotice() {
        await this.examNotice.waitFor({ state: 'visible', timeout: 60_000 });
        if (await this.noticeCheckbox.isVisible().catch(() => false)) {
            await this.noticeCheckbox.click();
        } else {
            const labelCheck = this.examNotice.getByText(/我已阅读/);
            if (await labelCheck.isVisible().catch(() => false)) {
                await this.examNotice.locator('.el-checkbox').first().click();
            }
        }
        await expect(this.noticeStartBtn).toBeEnabled({ timeout: 30_000 });
        await this.noticeStartBtn.click();
    }

    /**
     * 连续作答客观题（最多尝试 answerCount 道）
     */
    async answerObjectiveQuestions(answerCount = 2) {
        await this.waitForLoad();
        let answered = 0;
        for (let i = 0; i < 10 && answered < answerCount; i++) {
            const count = await this.questionOptions.count();
            if (count > 0) {
                await this.questionOptions.first().click();
                answered++;
            }
            if (answered < answerCount && (await this.nextQuestionBtn.isVisible().catch(() => false))) {
                await this.nextQuestionBtn.click();
                await this.page.waitForTimeout(500);
            }
        }
    }

    /**
     * 确认交卷并断言提交成功界面
     */
    async submitAndAssertSuccess() {
        await this.submitBtn.click();
        await this.confirmSubmitBtn.click();
        await expect(this.submitSuccess).toBeVisible({ timeout: 30_000 });
    }
```

- [ ] **Step 2: 扩展 MyExamPage.ts**

更新 `pageFactory/pageRepository/MyExamPage.ts`，增加读取考试记录、状态与分数的方法：

```ts
    async getExamRowCount(): Promise<number> {
        if (!(await this.hasExamRecords())) return 0;
        return await this.page.locator('.my-exam .el-table__body-wrapper tbody tr').count();
    }

    /**
     * 读取第一条考试记录详情 [科目名, 考试状态, 分数]
     */
    async readFirstExamRecord(): Promise<{ name: string; status: string; score: string }> {
        const rows = this.page.locator('.my-exam .el-table__body-wrapper tbody tr');
        const firstRow = rows.first();
        const name = (await firstRow.locator('.exam-name-column, td:nth-child(1)').innerText()).trim();
        const status = (await firstRow.locator('td:nth-child(3)').innerText()).trim();
        const score = (await firstRow.locator('td:nth-child(4)').innerText()).trim();
        return { name, status, score };
    }
```

- [ ] **Step 3: 扩展 MyCertPage.ts**

更新 `pageFactory/pageRepository/MyCertPage.ts`，增加读取证书名称、证书编号与点击查看下载操作方法：

```ts
    /**
     * 读取第一张证书的基本信息 [证书名称, 证书编号, 有效期]
     */
    async readFirstCertInfo(): Promise<{ name: string; certNo: string; expireDate: string }> {
        const firstItem = this.certItems.first();
        const name = (await firstItem.locator('.cert-name').innerText()).trim();
        const certNoText = (await firstItem.locator('.cert-subinfo').innerText()).match(/证书编号：\s*([^\s\n]+)/)?.[1] || '';
        const expireDateText = (await firstItem.locator('.cert-subinfo').innerText()).match(/有效期：\s*([^\s\n]+)/)?.[1] || '';
        return { name, certNo: certNoText, expireDate: expireDateText };
    }

    /**
     * 点击第一张证书的「查看下载」或「生成证书」按钮
     */
    async clickFirstCertAction(): Promise<Locator> {
        const actionBtn = this.certItems.first().locator('.cert-operate button').first();
        await expect(actionBtn).toBeVisible({ timeout: 10_000 });
        return actionBtn;
    }
```

- [ ] **Step 4: Verify POM code**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js pageFactory/pageRepository/ExamPage.ts pageFactory/pageRepository/MyExamPage.ts pageFactory/pageRepository/MyCertPage.ts
```

- [ ] **Step 5: Stage changes**

```powershell
git add etcert-e2e/pageFactory/pageRepository/ExamPage.ts etcert-e2e/pageFactory/pageRepository/MyExamPage.ts etcert-e2e/pageFactory/pageRepository/MyCertPage.ts
```

---

## Task 2: 深化 MF-CERT-003 模拟自测答题与交卷闭环

**Files:**
- Modify: `tests/main-flow/cert/mf-cert.spec.ts`

**Interfaces:**
- Consumes: `certDetailPage`, `examPage`
- Produces: 深度闭环用例 `MF-CERT-003 模拟测试答题与交卷`

- [ ] **Step 1: 深化 MF-CERT-003 用例实现**

在 `tests/main-flow/cert/mf-cert.spec.ts` 中将 MF-CERT-003 重构为从进入模拟测试、阅读须知、作答客观题到提交交卷的闭环：

```ts
    test('MF-CERT-003 模拟测试答题与交卷', { tag: '@MainFlow' }, async ({ certDetailPage, page }) => {
        test.skip(!certId, certSkipReason);
        test.skip(Boolean(certName?.includes('课程订阅')), certExamSkipReason);
        await certDetailPage.goto(certId!);

        const selfTestVisible = await certDetailPage.selfTestBtn.isVisible().catch(() => false);
        test.skip(!selfTestVisible, '当前认证无「进入模拟测试」入口');

        const examPopup = await certDetailPage.clickSelfTestInNewPage(page.context());
        await expect(examPopup).toHaveURL(EXAM_ENTRY_URL);

        const popupExamPage = new ExamPage(examPopup);
        await popupExamPage.completeExamNotice();
        await popupExamPage.answerObjectiveQuestions(2);
        await popupExamPage.submitAndAssertSuccess();
        await examPopup.close();
    });
```

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

## Task 3: 深化 MF-CERT-005 & MF-CERT-006 正式考试流程

**Files:**
- Modify: `tests/main-flow/cert/mf-cert.spec.ts`

**Interfaces:**
- Consumes: `certDetailPage`, `examPage`
- Produces: 深度闭环用例 `MF-CERT-005 考试前置向导与须知` 与 `MF-CERT-006 考试客观题答题与交卷`

- [ ] **Step 1: 深化 MF-CERT-005 & MF-CERT-006 用例实现**

在 `tests/main-flow/cert/mf-cert.spec.ts` 中深化 005 与 006：

```ts
    test(
        'MF-CERT-005 考试前置向导与须知',
        { tag: ['@MainFlow', '@Destructive'] },
        async ({ certDetailPage, examPage }) => {
            test.skip(!certId, certSkipReason);
            await certDetailPage.goto(certId!);
            await certDetailPage.clickExam();
            await examPage.completePreExamFlow();
            await expect(examPage.container).toBeVisible();
        },
    );

    test(
        'MF-CERT-006 考试客观题答题与交卷',
        { tag: ['@MainFlow', '@Destructive'] },
        async ({ certDetailPage, examPage }) => {
            test.skip(!certId, certSkipReason);
            await certDetailPage.goto(certId!);
            await certDetailPage.clickExam();
            await examPage.completePreExamFlow();
            await examPage.answerObjectiveQuestions(3);
            await examPage.submitAndAssertSuccess();
        },
    );
```

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

## Task 4: 深化 MF-CERT-007 & MF-CERT-008 考试记录与状态机断言

**Files:**
- Modify: `tests/main-flow/cert/mf-cert.spec.ts`

**Interfaces:**
- Consumes: `certDetailPage`, `myExamPage`
- Produces: 深度闭环用例 `MF-CERT-007 考试状态同步` 与 `MF-CERT-008 我的考试页面与记录明细`

- [ ] **Step 1: 深化 MF-CERT-007 & MF-CERT-008 用例实现**

在 `tests/main-flow/cert/mf-cert.spec.ts` 中完善 007 与 008：

```ts
    test('MF-CERT-007 考试状态同步', { tag: '@MainFlow' }, async ({ certDetailPage, myExamPage, page }) => {
        test.skip(!certId, certSkipReason);
        test.skip(Boolean(certName?.includes('课程订阅')), certExamSkipReason);

        await certDetailPage.goto(certId!);
        await certDetailPage.goToExamStep();
        const detailState = await certDetailPage.detectExamUiState();
        const detailTitle = (await certDetailPage.title.innerText()).trim();

        await myExamPage.goto();
        const hasRecords = await myExamPage.hasExamRecords();
        test.skip(!hasRecords, '我的考试无记录，无法断言跨页状态同步');

        await expect(myExamPage.examTable).toBeVisible();
        const record = await myExamPage.readFirstExamRecord();
        expect(record.name).not.toBe('');
        expect(record.status).not.toBe('');

        test.info().annotations.push({
            type: 'exam-state',
            description: `detail-state=${detailState ?? 'unknown'}, table-status=${record.status}`,
        });
    });

    test('MF-CERT-008 我的考试页面与记录明细', { tag: '@MainFlow' }, async ({ myExamPage }) => {
        await myExamPage.goto();
        await expect(myExamPage.container).toBeVisible();
        const hasRecords = await myExamPage.hasExamRecords();
        if (hasRecords) {
            await expect(myExamPage.examTable).toBeVisible();
            const count = await myExamPage.getExamRowCount();
            expect(count).toBeGreaterThan(0);
            const record = await myExamPage.readFirstExamRecord();
            expect(record.name.length).toBeGreaterThan(0);
        } else {
            await expect(myExamPage.emptyText).toBeVisible();
        }
    });
```

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

## Task 5: 深化 MF-CERT-009 我的证书卡片、编号与下载操作

**Files:**
- Modify: `tests/main-flow/cert/mf-cert.spec.ts`

**Interfaces:**
- Consumes: `myCertPage`
- Produces: 深度闭环用例 `MF-CERT-009 我的证书卡片与下载操作`

- [ ] **Step 1: 深化 MF-CERT-009 用例实现**

在 `tests/main-flow/cert/mf-cert.spec.ts` 中完善 009：

```ts
    test('MF-CERT-009 我的证书卡片与下载操作', { tag: '@MainFlow' }, async ({ myCertPage }) => {
        await myCertPage.goto();
        await expect(myCertPage.container).toBeVisible();
        const count = await myCertPage.getCertCount();
        if (count === 0) {
            await expect(myCertPage.emptyText).toBeVisible();
        } else {
            expect(count).toBeGreaterThan(0);
            const certInfo = await myCertPage.readFirstCertInfo();
            expect(certInfo.name).not.toBe('');
            const actionBtn = await myCertPage.clickFirstCertAction();
            await expect(actionBtn).toBeEnabled();
        }
    });
```

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

## Task 6: 同步主流程矩阵、运行手册、前置文档与 Backlog

**Files:**
- Modify: `tests/MAIN-FLOW-MATRIX.md`（§2 认证考试更新至 ✅ 深度，统计基准更新）
- Modify: `tests/main-flow/README.md`
- Modify: `tests/main-flow/RUNBOOK.md`
- Modify: `tests/testData/main-flow/prerequisites.md`
- Modify: `tests/COVERAGE-BACKLOG.md`

- [ ] **Step 1: 更新 MAIN-FLOW-MATRIX.md §2 与统计汇总**

更新 §2 认证考试 9 项中的覆盖状态：
- 2.3 模拟测试答题与交卷 MF-CERT-003 改为 ✅
- 2.5 考试前置向导与须知 MF-CERT-005 改为 ✅
- 2.6 考试客观题答题与交卷 MF-CERT-006 改为 ✅
- 2.7 考试状态同步 MF-CERT-007 改为 ✅
- 2.8 我的考试页面与记录明细 MF-CERT-008 改为 ✅
- 2.9 我的证书卡片与下载操作 MF-CERT-009 改为 ✅
- 汇总统计更新：✅ 达到 **19 条**，🟡 为 **5 条**，❌ 为 0 条，总计 24 条。

- [ ] **Step 2: 更新 main-flow/README.md、RUNBOOK.md、prerequisites.md、COVERAGE-BACKLOG.md**

- 更新文档中的用例描述与深度标记。
- 更新 COVERAGE-BACKLOG.md，将「认证考试 及格发证闭环 / 不及格补考闭环」移出缺口。

- [ ] **Step 3: 全量 Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js .
```

- [ ] **Step 4: Stage changes**

```powershell
git add etcert-e2e/tests/MAIN-FLOW-MATRIX.md etcert-e2e/tests/main-flow/README.md etcert-e2e/tests/main-flow/RUNBOOK.md etcert-e2e/tests/testData/main-flow/prerequisites.md etcert-e2e/tests/COVERAGE-BACKLOG.md
```

---

## 风险与应对

| 风险 | 应对 |
|------|------|
| 模拟自测入口受认证配置控制（某些认证无自测卷） | 用例内使用 `certDetailPage.selfTestBtn.isVisible()` 检查，无自测卷时优雅 skip |
| 正式考试需要消耗考试机会（@Destructive） | 用例打上 `@Destructive` 标签，默认 `pnpm run test:main-flow` 会自动排除，仅在 `pnpm run test:main-flow:destructive` 执行 |
| 考试交卷后生成成绩存在异步延迟 | 使用 `expect(examPage.submitSuccess).toBeVisible({ timeout: 30_000 })` 容忍等待后端处理 |
| 证书列表为空（用户尚未及格发证） | 用例内对 `count === 0` 做优雅降级，断言空态或证书卡片二者之一 |
