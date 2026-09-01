import { Page, Locator, expect } from '@playwright/test';
import { gotoWebsitePage } from '@lib/websiteNavigate';
import { dismissBlockingWebsiteDialogs } from '@lib/websiteDialog';

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
        await dismissBlockingWebsiteDialogs(this.page);
        await this.waitForListReady();
    }

    /** 等待 UserSuspense 加载完成：证书列表或空态二选一 */
    async waitForListReady() {
        await expect
            .poll(
                async () => {
                    if (await this.emptyText.isVisible().catch(() => false)) return 'empty';
                    if ((await this.certItems.count()) > 0) return 'items';
                    const loading = await this.container.getByText('加载中', { exact: true }).isVisible().catch(() => false);
                    return loading ? 'loading' : 'pending';
                },
                { timeout: 30_000, intervals: [300, 500, 1000] },
            )
            .not.toBe('loading');

        await expect
            .poll(
                async () => (await this.emptyText.isVisible().catch(() => false)) || (await this.certItems.count()) > 0,
                { timeout: 30_000, intervals: [300, 500, 1000] },
            )
            .toBe(true);
    }

    async getCertCount() {
        await this.waitForListReady();
        return this.certItems.count();
    }

    /**
     * 读取第一张证书的基本信息 [证书名称, 证书编号, 有效期]
     */
    async readFirstCertInfo(): Promise<{ name: string; certNo: string; expireDate: string }> {
        await this.waitForListReady();
        const firstItem = this.certItems.first();
        await expect(firstItem).toBeVisible({ timeout: 15_000 });
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
        await this.waitForListReady();
        const actionBtn = this.certItems.first().locator('.cert-operate button').first();
        await expect(actionBtn).toBeVisible({ timeout: 10_000 });
        return actionBtn;
    }
}
