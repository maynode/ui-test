import { Page, Locator } from '@playwright/test';

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

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.ncre-pro-page');
        this.studentPanel = page.locator('.ncre-pro-main');
        this.studentTab = page.getByRole('tab', { name: '考生' });
    }

    async goto() {
        await this.page.goto('/ncreExam');
        await this.container.waitFor({ state: 'visible' });
        await this.studentPanel.waitFor({ state: 'visible' });
    }
}
