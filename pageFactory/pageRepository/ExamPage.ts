import { Page, Locator, expect } from '@playwright/test';

/**
 * 考试答题页 Page Object
 * 对应前端：exam/src/views/exam/index.vue（独立 exam 子应用）
 * 前置：website 报名向导 /cert/binding → 须知 /cert/notice → /etcert-exam/#/exam
 */
export class ExamPage {
    readonly page: Page;
    readonly container: Locator;
    readonly questionOptions: Locator;
    readonly submitBtn: Locator;
    readonly confirmSubmitBtn: Locator;
    readonly prepareWizard: Locator;
    readonly realAuthPanel: Locator;
    readonly directionPick: Locator;
    readonly bindingPanel: Locator;
    readonly examNotice: Locator;
    readonly startExamBtn: Locator;
    readonly noticeStartBtn: Locator;
    readonly noticeCheckbox: Locator;
    readonly nextQuestionBtn: Locator;
    readonly submitSuccess: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.exam-answer');
        this.questionOptions = page.locator('.options .option');
        this.submitBtn = page.getByRole('button', { name: '交卷' });
        this.confirmSubmitBtn = page.getByRole('button', { name: '确认交卷' });
        this.prepareWizard = page.locator('.cert-exam-prepare-wizard');
        this.realAuthPanel = page.locator('.cert-exam-prepare-real-auth');
        this.directionPick = page.locator('.cert-exam-direction-pick');
        this.bindingPanel = page.locator('.cert-exam-prepare-binding');
        this.examNotice = page.locator('.examination-notice');
        this.startExamBtn = page.getByRole('button', { name: '开始考试' });
        this.noticeStartBtn = this.examNotice.getByRole('button', { name: /开始考试|模拟考试/ });
        this.noticeCheckbox = this.examNotice.locator('.examination-notice-check .el-checkbox');
        this.nextQuestionBtn = page.getByRole('button', { name: '下一题' });
        this.submitSuccess = page.locator('.exam-placeholder').filter({ hasText: /已完成交卷|交卷成功/ });
    }

    async waitForLoad() {
        await this.container.waitFor({ state: 'visible', timeout: 90_000 });
    }

    /**
     * 等待进入向导 / 须知 / 答题页之一（避免页面未加载完就误判「无向导」）。
     */
    private async waitForPreExamOrAnswer(timeout = 90_000): Promise<'wizard' | 'notice' | 'answer'> {
        const deadline = Date.now() + timeout;
        while (Date.now() < deadline) {
            if (await this.container.isVisible().catch(() => false)) return 'answer';
            if (await this.prepareWizard.isVisible().catch(() => false)) return 'wizard';
            if (await this.examNotice.isVisible().catch(() => false)) return 'notice';
            await this.page.waitForTimeout(300);
        }
        throw new Error(
            'Exam pre-flow: timed out waiting for .cert-exam-prepare-wizard, .examination-notice, or .exam-answer',
        );
    }

    /**
     * 报名向导：实名（未实名则失败）→ 方向选择 → 信息确认（同意 + 开始考试）
     */
    async completePrepareWizard() {
        await this.prepareWizard.waitFor({ state: 'visible', timeout: 60_000 });

        if (await this.realAuthPanel.isVisible().catch(() => false)) {
            throw new Error(
                'Exam prepare wizard shows 实名认证. Use a pre-verified test account; ' +
                    'automated ID-card real-name flow is not supported.',
            );
        }

        if (await this.directionPick.isVisible().catch(() => false)) {
            await this.directionPick.locator('.direction-card').first().click();
            await this.page.getByRole('button', { name: '下一步' }).click();
            await this.bindingPanel.waitFor({ state: 'visible', timeout: 30_000 });
        }

        if (await this.bindingPanel.isVisible().catch(() => false)) {
            const agreeCheckbox = this.page.getByRole('checkbox', { name: /同意/ });
            if (await agreeCheckbox.isVisible().catch(() => false)) {
                await agreeCheckbox.check({ force: true });
            }
            const startBtn = this.bindingPanel.getByRole('button', { name: '开始考试' });
            await expect(startBtn).toBeEnabled({ timeout: 15_000 });
            await startBtn.click();
        } else if (await this.startExamBtn.isVisible().catch(() => false)) {
            await this.startExamBtn.click();
        }

        await this.examNotice.waitFor({ state: 'visible', timeout: 90_000 });
    }

    /**
     * 考试须知：勾选「我已阅读…」，等待倒计时结束（前端默认约 10s）后点开始考试/模拟考试。
     */
    async completeExamNotice() {
        await this.examNotice.waitFor({ state: 'visible', timeout: 60_000 });

        if (await this.noticeCheckbox.isVisible().catch(() => false)) {
            await this.noticeCheckbox.click();
        } else {
            const labelCheck = this.examNotice.getByText(/我已阅读考试须知/);
            if (await labelCheck.isVisible().catch(() => false)) {
                await this.examNotice.locator('.el-checkbox').first().click();
            }
        }

        await expect(this.noticeStartBtn).toBeEnabled({ timeout: 30_000 });
        await this.noticeStartBtn.click();
    }

    /**
     * 考试前置：报名向导 → 考试须知 → 答题页。各阶段按实际出现执行，不跳过未加载完成的页面。
     */
    async completePreExamFlow() {
        let stage = await this.waitForPreExamOrAnswer();

        if (stage === 'wizard') {
            await this.completePrepareWizard();
            stage = 'notice';
        }

        if (stage === 'notice' || (await this.examNotice.isVisible().catch(() => false))) {
            await this.completeExamNotice();
        }

        await this.waitForLoad();
    }

    /**
     * 作答当前客观题；若首题非客观题，最多翻 5 次「下一题」寻找选项。
     */
    async answerFirstQuestion() {
        for (let i = 0; i < 6; i++) {
            const count = await this.questionOptions.count();
            if (count > 0) {
                await this.questionOptions.first().click();
                return;
            }
            if (i < 5 && (await this.nextQuestionBtn.isVisible().catch(() => false))) {
                await this.nextQuestionBtn.click();
                await this.page.waitForTimeout(500);
                continue;
            }
            break;
        }
        throw new Error(
            'No objective question options (.options .option) found within first 6 questions. ' +
                'Paper may be draw/redraw/fill-blank only — use a cert with objective items or skip Destructive exam.',
        );
    }

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

    async submitExam() {
        await this.submitBtn.click();
        await this.confirmSubmitBtn.click();
    }
}
