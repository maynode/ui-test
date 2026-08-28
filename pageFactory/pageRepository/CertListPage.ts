import { Page, Locator } from '@playwright/test';
import { gotoWebsitePage } from '@lib/websiteNavigate';

/**
 * 认证展示/目录页 Page Object
 * 对应路由：/cert/list（/cert 会 redirect）
 * 对应前端：website/src/pages/cert/list.vue
 */
export class CertListPage {
    readonly page: Page;
    readonly container: Locator;
    readonly catalogHeader: Locator;
    readonly certBanner: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.cert-home');
        this.catalogHeader = page.getByText('认证目录', { exact: true });
        this.certBanner = page.locator('.cert-banner');
    }

    async goto() {
        await gotoWebsitePage(this.page, '/cert/list');
        await this.container.waitFor({ state: 'visible' });
    }
}
