import { Page, Locator } from '@playwright/test';
import { gotoWebsitePage } from '@lib/websiteNavigate';

/**
 * 我的证书页 Page Object
 * 对应路由：/user/myCert
 * 对应前端：website/src/pages/user/myCert/components/MyCertList.vue
 */
export class MyCertPage {
    readonly page: Page;
    readonly container: Locator;
    readonly certItems: Locator;
    readonly emptyText: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.my-cert');
        this.certItems = page.locator('.my-cert .cert-list-item, .my-cert .cert-img');
        this.emptyText = page.getByText('暂无证书信息');
    }

    async goto() {
        await gotoWebsitePage(this.page, '/user/myCert');
        await this.container.waitFor({ state: 'visible' });
    }

    async getCertCount() {
        return this.certItems.count();
    }
}
