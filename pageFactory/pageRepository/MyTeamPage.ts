import { Page, Locator } from '@playwright/test';

/**
 * 团队服务页 Page Object
 * 对应路由：/user/myTeam
 * 对应前端：website/src/pages/user/myTeam/components/MyTeam.vue
 */
export class MyTeamPage {
    readonly page: Page;
    readonly container: Locator;
    readonly teamSections: Locator;
    readonly courseTeamSection: Locator;
    readonly certTeamSection: Locator;
    readonly seatManageBtn: Locator;
    readonly emptyState: Locator;
    readonly openTeamCourseBtn: Locator;
    readonly openTeamCertBtn: Locator;
    readonly collapseTables: Locator;
    readonly firstCollapseItemHead: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.my-team');
        this.teamSections = page.locator('.my-team-collapse-container');
        this.courseTeamSection = page.locator('.my-team-collapse-container').filter({ hasText: '课程订阅' });
        this.certTeamSection = page.locator('.my-team-collapse-container').filter({ hasText: '认证考试' });
        this.seatManageBtn = page.getByRole('button', { name: '名额管理' });
        this.emptyState = page.locator('.my-team-empty');
        this.openTeamCourseBtn = page.getByRole('button', { name: '开通团队课程订阅' });
        this.openTeamCertBtn = page.getByRole('button', { name: '开通团队认证考试' });
        this.collapseTables = page.locator('.my-team-collapse-table');
        this.firstCollapseItemHead = page.locator('.my-team-collapse-item-head').first();
    }

    async goto() {
        await this.page.goto('/user/myTeam');
        await this.container.waitFor({ state: 'visible' });
    }

    async isEmptyState() {
        return this.emptyState.isVisible();
    }

    async hasTeamSection() {
        return (await this.teamSections.count()) > 0;
    }

    async expandFirstTeamSection() {
        await this.teamSections.first().locator('.my-team-collapse-item-head').click();
    }
}
