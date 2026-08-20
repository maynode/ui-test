import { Page, Locator } from '@playwright/test';

/**
 * 考试答题页 Page Object
 * 对应前端：exam/src/views/exam/index.vue（独立 exam 子应用）
 */
export class ExamPage {
    readonly page: Page;
    readonly container: Locator;
    readonly questionOptions: Locator;
    readonly submitBtn: Locator;
    readonly confirmSubmitBtn: Locator;
    readonly prepareWizard: Locator;
    readonly startExamBtn: Locator;
    readonly noticeStartBtn: Locator;
    readonly submitSuccess: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.exam-answer');
        this.questionOptions = page.locator('.options .option');
        this.submitBtn = page.getByRole('button', { name: '交卷' });
        this.confirmSubmitBtn = page.getByRole('button', { name: '确认交卷' });
        this.prepareWizard = page.locator('.cert-exam-prepare-wizard');
        this.startExamBtn = page.getByRole('button', { name: '开始考试' });
        this.noticeStartBtn = page.getByRole('button', { name: /开始考试|模拟考试/ });
        this.submitSuccess = page.locator('.exam-placeholder').filter({ hasText: /已完成交卷|交卷成功/ });
    }

    async waitForLoad() {
        await this.container.waitFor({ state: 'visible', timeout: 90_000 });
    }

    async answerFirstQuestion() {
        await this.questionOptions.first().click();
    }

    async submitExam() {
        await this.submitBtn.click();
        await this.confirmSubmitBtn.click();
    }

    /**
     * 考试前置：报名向导（/cert/binding）→ 考试须知（/cert/notice）→ 答题页
     * 各步骤按实际可见性跳过，适配不同账号状态。
     */
    async completePreExamFlow() {
        if (await this.prepareWizard.isVisible().catch(() => false)) {
            const agreeCheckbox = this.page.getByRole('checkbox', { name: /同意/ });
            if (await agreeCheckbox.isVisible().catch(() => false)) {
                await agreeCheckbox.check({ force: true });
            }
            if (await this.startExamBtn.isVisible().catch(() => false)) {
                await this.startExamBtn.click();
            }
        }

        if (await this.noticeStartBtn.isVisible().catch(() => false)) {
            await this.noticeStartBtn.click();
        }

        await this.waitForLoad();
    }
}
