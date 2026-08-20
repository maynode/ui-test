import { Page, Locator } from '@playwright/test';

/**
 * 伙伴认证页 Page Object
 * 对应路由：/partnerCert
 * 对应前端：website/src/pages/partnerCert/index.vue
 */
export class PartnerCertPage {
    readonly page: Page;
    readonly container: Locator;
    readonly courseItems: Locator;
    readonly partnerExclusiveLabel: Locator;
    readonly coreTabs: Locator;
    readonly tabItems: Locator;
    readonly examRegisterBtns: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.partner-cert-page');
        this.courseItems = page.locator('.partner-cert-course .course-item');
        this.partnerExclusiveLabel = page.getByText('伙伴专属', { exact: true });
        this.coreTabs = page.locator('.partner-core-tabs');
        this.tabItems = page.locator('.partner-core-tabs .el-tabs__item');
        this.examRegisterBtns = page.getByRole('button', { name: '报名考试' });
    }

    async goto() {
        await this.page.goto('/partnerCert');
        await this.container.waitFor({ state: 'visible' });
    }

    async getCourseCount() {
        return this.courseItems.count();
    }

    async getTabCount() {
        return this.tabItems.count();
    }

    async switchTab(tabName: string) {
        await this.page.getByRole('tab', { name: tabName }).click();
    }

    async getExamRegisterCount() {
        return this.examRegisterBtns.count();
    }

    async isPartnerExclusiveVisible() {
        return this.partnerExclusiveLabel.isVisible();
    }
}
