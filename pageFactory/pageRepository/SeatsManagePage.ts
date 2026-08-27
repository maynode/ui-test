import { Page, Locator } from '@playwright/test';

/**
 * 名额管理页 Page Object
 * 对应路由：/user/seatsMng?teamId=xxx
 * 对应前端：website/src/pages/user/seatsMng/index.vue
 */
export class SeatsManagePage {
    readonly page: Page;
    readonly container: Locator;
    readonly breadcrumbTeamLink: Locator;
    readonly assignMemberBtn: Locator;
    readonly seatsHeader: Locator;
    readonly assignDialog: Locator;
    readonly assignDialogTitle: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.seats-mng');
        this.breadcrumbTeamLink = page.locator('.seats-breadcrumb').getByText('团队服务');
        this.assignMemberBtn = page.getByRole('button', { name: '分配成员' });
        this.seatsHeader = page.locator('.seats-header');
        this.assignDialog = page.locator('.seats-allocate');
        this.assignDialogTitle = page.getByText(/分配成员/);
    }

    async waitForLoad() {
        await this.container.waitFor({ state: 'visible' });
        await this.seatsHeader.waitFor({ state: 'visible' });
    }

    async openAssignMemberDialog() {
        await this.assignMemberBtn.click();
        await this.assignDialog.waitFor({ state: 'visible' });
    }
}
