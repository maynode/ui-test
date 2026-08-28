import { Page, Locator } from '@playwright/test';
import { gotoManageCenterPage } from '@lib/manageCenterNavigate';

/**
 * 管理中心 · 坐席分配 Page Object
 * 对应路由：/manageCenter/seat/
 * 对应前端：website/src/pages/manageCenter/seat/components/TeamServicePanel.vue
 */
export class ManageCenterSeatPage {
    readonly page: Page;
    readonly container: Locator;
    readonly panel: Locator;
    readonly emptyGuide: Locator;
    readonly collapses: Locator;
    readonly seatManageBtns: Locator;
    readonly quotaCells: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.seat-allocation');
        this.panel = page.locator('.team-service-panel');
        this.emptyGuide = page.locator('.team-service-panel-empty');
        this.collapses = page.locator('.el-collapse-item');
        this.seatManageBtns = page.getByRole('button', { name: '名额管理' });
        this.quotaCells = page.locator('.el-table__body-wrapper tbody tr td').filter({ hasText: /^\s*\d+\/\d+\s*$/ });
    }

    async goto() {
        await gotoManageCenterPage(this.page, 'seat');
        await this.container.waitFor({ state: 'visible' });
        await this.panel.waitFor({ state: 'visible' });
    }

    async isEmptyState() {
        return this.emptyGuide.isVisible();
    }

    async seatManageCount() {
        return this.seatManageBtns.count();
    }

    /** 读第一行「已分配名额/总名额」，返回 [已分配, 总数] */
    async readFirstQuota(): Promise<[number, number]> {
        const text = (await this.quotaCells.first().innerText()).trim();
        const [allocated, total] = text.split('/').map((part) => Number(part.trim()));
        return [allocated, total];
    }

    async openFirstSeatManage() {
        await this.seatManageBtns.first().click();
        await this.page.waitForURL(/\/manageCenter\/seat\/manage/, { timeout: 60_000 });
    }
}
