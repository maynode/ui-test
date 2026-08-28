import { Page, Locator } from '@playwright/test';
import { gotoManageCenterPage } from '@lib/manageCenterNavigate';

/**
 * 管理中心 · 成员信息 Page Object
 * 对应路由：/manageCenter/member/
 * 对应前端：website/src/pages/manageCenter/member/components/MemberInfo.vue
 */
export class ManageCenterMemberPage {
    readonly page: Page;
    readonly container: Locator;
    readonly search: Locator;
    readonly resetBtn: Locator;
    readonly addMemberBtn: Locator;
    readonly batchRemoveBtn: Locator;
    readonly table: Locator;
    readonly tableRows: Locator;
    readonly addSingleItem: Locator;
    readonly addBatchItem: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.member-info');
        this.search = page.locator('.member-search');
        this.resetBtn = page.getByRole('button', { name: '重置' });
        this.addMemberBtn = page.getByRole('button', { name: /添加成员/ });
        this.batchRemoveBtn = page.getByRole('button', { name: '批量移除' });
        this.table = page.locator('.member-info-table');
        this.tableRows = this.table.locator('.el-table__body-wrapper tbody tr');
        // el-dropdown-item 的 role 随 EP 版本变化，用稳定的 EP class + 文本过滤
        this.addSingleItem = page.locator('.el-dropdown-menu__item').filter({ hasText: '单个添加' });
        this.addBatchItem = page.locator('.el-dropdown-menu__item').filter({ hasText: '批量添加' });
    }

    async goto() {
        await gotoManageCenterPage(this.page, 'member');
        await this.container.waitFor({ state: 'visible' });
        await this.table.waitFor({ state: 'visible' });
    }

    async rowCount() {
        return this.tableRows.count();
    }

    /** hover 展开「添加成员」下拉 */
    async openAddMemberDropdown() {
        await this.addMemberBtn.hover();
        await this.addSingleItem.waitFor({ state: 'visible' });
    }

    /** 搜索联系方式（手机号/邮箱），返回命中行数 */
    async searchByKeyword(keyword: string) {
        const input = this.search.locator('input').first();
        await input.fill(keyword);
        await input.press('Enter');
        await this.page.waitForTimeout(1_000);
        return this.rowCount();
    }
}
