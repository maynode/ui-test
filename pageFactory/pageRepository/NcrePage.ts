import { Page, Locator } from '@playwright/test';
import { gotoWebsitePage } from '@lib/websiteNavigate';

/**
 * NCRE 模块页 Page Object
 * 对应路由：/ncreExam
 * 对应前端：website/src/pages/ncreExam/index.vue
 */
export class NcrePage {
    readonly page: Page;
    readonly container: Locator;
    readonly studentPanel: Locator;
    readonly studentTab: Locator;
    readonly examCenterTab: Locator;
    readonly examCenterPanel: Locator;
    readonly coursesSection: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.ncre-pro-page');
        this.studentPanel = page.locator('.ncre-pro-main');
        this.studentTab = page.getByRole('tab', { name: '考生' });
        this.examCenterTab = page.getByRole('tab', { name: '考点' });
        this.examCenterPanel = page.locator('.ncre-exam-center');
        this.coursesSection = page.locator('.ncre-pro-courses');
    }

    async goto() {
        await gotoWebsitePage(this.page, '/ncreExam');
        await this.container.waitFor({ state: 'visible' });
        await this.studentPanel.waitFor({ state: 'visible' });
    }

    async switchToExamCenterTab() {
        await this.examCenterTab.click();
        await this.examCenterPanel.waitFor({ state: 'visible' });
    }

    async switchToStudentTab() {
        await this.studentTab.click();
        await this.studentPanel.waitFor({ state: 'visible' });
    }
}
