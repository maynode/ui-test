import { Page, Locator } from '@playwright/test';
import { gotoManageCenterPage, type ManageCenterRouteKey } from '@lib/manageCenterNavigate';
import { waitForWebsitePopupUrl } from '@lib/websitePopup';
import { gotoWebsitePage } from '@lib/websiteNavigate';

/**
 * 管理中心布局 Page Object
 * 对应路由：/manageCenter/ · /manageCenter/seat/ · /manageCenter/member/ · /manageCenter/report/
 * 对应前端：website/src/pages/manageCenter/components/ManageCenterLayout.vue
 */
export class ManageCenterPage {
    readonly page: Page;
    readonly layout: Locator;
    readonly header: Locator;
    readonly headerTitle: Locator;
    readonly sideMenu: Locator;
    readonly content: Locator;
    readonly seatMenuItem: Locator;
    readonly memberMenuItem: Locator;
    readonly trainingNav: Locator;
    readonly reportNav: Locator;

    constructor(page: Page) {
        this.page = page;
        // 不要用 .manage-center-layout：layouts/manage-center.vue 与 ManageCenterLayout.vue 同名嵌套，会命中 2 个元素
        this.layout = page.locator('.manage-center-layout-page');
        this.header = page.locator('.zw-header');
        this.headerTitle = this.header.getByText('中望软件培训认证管理中心');
        this.sideMenu = page.locator('.manage-center-layout-left .user-menu');
        this.content = page.locator('.manage-center-layout-content');
        this.seatMenuItem = this.sideMenu.getByText('坐席分配', { exact: true });
        this.memberMenuItem = this.sideMenu.getByText('成员信息', { exact: true });
        this.trainingNav = this.header.getByText('培训管理', { exact: true });
        this.reportNav = this.header.getByText('报表分析', { exact: true });
    }

    async goto(routeKey: ManageCenterRouteKey = 'home') {
        await gotoManageCenterPage(this.page, routeKey);
        await this.layout.waitFor({ state: 'visible' });
    }

    /** 从个人中心点「管理中心」按钮：前端用 window.open 新开标签页 */
    async openFromUserCenter() {
        await gotoWebsitePage(this.page, '/user/', 'admin');
        const button = this.page.getByRole('button', { name: '管理中心' });
        await button.waitFor({ state: 'visible' });
        return waitForWebsitePopupUrl(
            this.page.context(),
            async () => {
                await button.click();
            },
            /\/manageCenter/,
        );
    }

    async clickSideMenu(label: '坐席分配' | '成员信息') {
        const item = label === '坐席分配' ? this.seatMenuItem : this.memberMenuItem;
        await item.click();
    }

    async isSideMenuVisible() {
        return this.sideMenu.isVisible();
    }
}
