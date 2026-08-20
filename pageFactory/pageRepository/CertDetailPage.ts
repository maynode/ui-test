import { Page, Locator } from '@playwright/test';

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

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.cert-detail-page');
        this.title = page.locator('.cert-banner__title');
        this.stepNav = page.locator('.step-nav');
        this.examStep = page.getByText('在线考试', { exact: true });
        this.learnStep = page.getByText('认证学习', { exact: true });
        this.selfTestBtn = page.getByRole('button', { name: '进入模拟测试' });
        this.enterExamBtn = page.getByRole('button', { name: /进入正式考试|继续考试|开始补考/ });
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
}
