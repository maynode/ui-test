import { Page, Locator, expect } from '@playwright/test';
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

    /**
     * 读取第一张证书的基本信息 [证书名称, 证书编号, 有效期]
     */
    async readFirstCertInfo(): Promise<{ name: string; certNo: string; expireDate: string }> {
        const firstItem = this.certItems.first();
        const name = (await firstItem.locator('.cert-name').innerText()).trim();
        const subInfoText = await firstItem.locator('.cert-subinfo').innerText();
        const certNoText = subInfoText.match(/证书编号：\s*([^\s\n]+)/)?.[1] || '';
        const expireDateText = subInfoText.match(/有效期：\s*([^\s\n]+)/)?.[1] || '';
        return { name, certNo: certNoText, expireDate: expireDateText };
    }

    /**
     * 获取第一张证书的操作按钮（查看下载 / 生成证书）
     */
    async clickFirstCertAction(): Promise<Locator> {
        const actionBtn = this.certItems.first().locator('.cert-operate button').first();
        await expect(actionBtn).toBeVisible({ timeout: 10_000 });
        return actionBtn;
    }
}
