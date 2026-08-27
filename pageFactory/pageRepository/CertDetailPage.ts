import { Page, Locator, expect } from '@playwright/test';

export type CertExamUiState =
    | 'start'
    | 'continuing'
    | 'pending'
    | 'fail-retake'
    | 'fail-final'
    | 'pass';

/**
 * 认证详情页 Page Object
 * 对应路由：/cert/detail?certId=xxx
 * 对应前端：website/src/pages/cert/detail.vue
 */
export class CertDetailPage {
    readonly page: Page;
    readonly container: Locator;
    readonly title: Locator;
    readonly stepNav: Locator;
    readonly examStep: Locator;
    readonly learnStep: Locator;
    readonly selfTestBtn: Locator;
    readonly enterExamBtn: Locator;
    readonly examModule: Locator;
    readonly partnerAuthDialog: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.cert-detail-page');
        this.title = page.locator('.cert-banner__title');
        this.stepNav = page.locator('.step-nav');
        this.examStep = page.getByText('在线考试', { exact: true });
        this.learnStep = page.getByText('认证学习', { exact: true });
        this.selfTestBtn = page.getByRole('button', { name: '进入模拟测试' });
        this.enterExamBtn = page.getByRole('button', { name: /进入正式考试|继续考试|开始补考/ });
        this.examModule = page.locator('.module-exam');
        this.partnerAuthDialog = page.locator('.zw-partner-auth-dialog');
    }

    async goto(certId: string) {
        await this.page.goto(`/cert/detail?certId=${certId}`);
        await this.container.waitFor({ state: 'visible' });
        await this.title.waitFor({ state: 'visible' });
    }

    async goToExamStep() {
        await this.examStep.click();
        await this.page.locator('.module-exam').waitFor({ state: 'visible' });
    }

    async clickSelfTest() {
        await this.learnStep.click();
        await this.page.locator('.module-learn').waitFor({ state: 'visible' });
        await this.selfTestBtn.click();
    }

    async clickExam() {
        await this.goToExamStep();
        await this.enterExamBtn.click();
    }

    async detectExamUiState(): Promise<CertExamUiState | null> {
        if (await this.page.getByRole('button', { name: '进入正式考试' }).isVisible().catch(() => false)) {
            return 'start';
        }
        if (await this.page.getByRole('button', { name: '继续考试' }).isVisible().catch(() => false)) {
            return 'continuing';
        }
        if (await this.page.getByText('成绩待发布', { exact: true }).isVisible().catch(() => false)) {
            return 'pending';
        }
        if (await this.page.getByRole('button', { name: '开始补考' }).isVisible().catch(() => false)) {
            return 'fail-retake';
        }
        if (await this.page.getByText('恭喜！您已通过考试', { exact: true }).isVisible().catch(() => false)) {
            return 'pass';
        }
        if (await this.page.getByText('考试未通过', { exact: true }).isVisible().catch(() => false)) {
            return 'fail-final';
        }
        return null;
    }

    async assertRecognizedExamState() {
        await expect(this.examModule).toBeVisible();
        const state = await this.detectExamUiState();
        expect(state, '在线考试步骤应识别为已知 UI 状态之一').not.toBeNull();

        switch (state) {
            case 'start':
                await expect(this.page.getByText('请确保网络环境稳定')).toBeVisible();
                await expect(this.page.getByRole('button', { name: '进入正式考试' })).toBeVisible();
                break;
            case 'continuing':
                await expect(this.page.getByText('考试正在进行中')).toBeVisible();
                await expect(this.page.getByRole('button', { name: '继续考试' })).toBeVisible();
                break;
            case 'pending':
                await expect(this.page.getByText('成绩待发布', { exact: true })).toBeVisible();
                await expect(this.page.getByText('成绩正在评阅中')).toBeVisible();
                break;
            case 'fail-retake':
                await expect(this.page.getByText('考试未通过', { exact: true })).toBeVisible();
                await expect(this.page.getByRole('button', { name: '开始补考' })).toBeVisible();
                break;
            case 'fail-final':
                await expect(this.page.getByText('考试未通过', { exact: true })).toBeVisible();
                await expect(this.page.getByRole('button', { name: '开始补考' })).toBeHidden();
                break;
            case 'pass':
                await expect(this.page.getByText('恭喜！您已通过考试', { exact: true })).toBeVisible();
                break;
            default:
                break;
        }

        return state;
    }

    async clickEnterExamOrTriggerAuth() {
        await this.goToExamStep();
        const enterVisible = await this.enterExamBtn.isVisible().catch(() => false);
        if (enterVisible) {
            await this.enterExamBtn.click();
        }
    }

    async expectPartnerAuthDialog() {
        await expect(this.partnerAuthDialog).toBeVisible();
        await expect(this.page.getByText('非经销商伙伴，暂无权限访问该页面')).toBeVisible();
    }
}
