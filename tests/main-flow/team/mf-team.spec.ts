import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { tcWebsiteAdminAuthConfig } from '@lib/tcAuthConfig';

const auth = tcWebsiteAdminAuthConfig();

/**
 * 主流程 · 团队管理（矩阵 3.1 ~ 3.3）
 * 对照：tests/MAIN-FLOW-MATRIX.md §3
 */
test.describe('主流程 · 团队管理', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('MF-TEAM-001 团队服务记录同步', { tag: '@MainFlow' }, async ({ myTeamPage }) => {
        test.skip(true, '待 SEED-TEAM / 商城购买链路（见 testData/main-flow/prerequisites.md）');

        await myTeamPage.goto();
        await expect(myTeamPage.container).toBeVisible();
    });

    test('MF-TEAM-002 管理员分配权限生效', { tag: '@MainFlow' }, async ({ myTeamPage, seatsManagePage }) => {
        test.setTimeout(180_000);
        await myTeamPage.goto();
        test.skip(await myTeamPage.isEmptyState(), 'admin 账号无团队订阅数据');

        await myTeamPage.expandFirstCollapseAndWaitTable();
        test.skip(!(await myTeamPage.isSeatManageVisible()), '折叠表格内无名额管理入口');

        await myTeamPage.openFirstSeatManage();
        await seatsManagePage.waitForLoad();
        await seatsManagePage.openAssignMemberDialog();
        await expect(seatsManagePage.assignDialogTitle).toBeVisible();
        await expect(seatsManagePage.assignDialog).toBeVisible();
    });

    test('MF-TEAM-003 未注册账号分配占位', { tag: '@MainFlow' }, async () => {
        test.skip(true, '待占位邮箱分配场景与 SEED-TEAM（见 testData/main-flow/prerequisites.md）');
    });
});
