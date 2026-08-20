import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const auth = tcAuthConfig('admin');

/**
 * 团队服务主流程测试
 * 对应前端：website/src/pages/user/myTeam/components/MyTeam.vue
 */
test.describe('团队服务主流程', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('TC-TEAM-001 团队服务页加载', { tag: '@Smoke' }, async ({ myTeamPage }) => {
        await test.step('导航到团队服务页', async () => {
            await myTeamPage.goto();
        });

        await test.step('验证页面容器可见', async () => {
            await expect(myTeamPage.container).toBeVisible();
        });
    });

    test('TC-TEAM-002 团队服务区块或空态展示', { tag: '@Regression' }, async ({ myTeamPage }) => {
        await test.step('导航到团队服务页', async () => {
            await myTeamPage.goto();
        });

        await test.step('验证已开通团队或空态引导', async () => {
            const isEmpty = await myTeamPage.isEmptyState();
            const hasTeam = await myTeamPage.hasTeamSection();
            expect(isEmpty || hasTeam).toBeTruthy();
        });
    });

    test('TC-TEAM-003 空态下开通入口可见', { tag: '@Regression' }, async ({ myTeamPage }) => {
        await test.step('导航到团队服务页', async () => {
            await myTeamPage.goto();
        });

        await test.step('空态时验证开通按钮', async () => {
            if (await myTeamPage.isEmptyState()) {
                await expect(myTeamPage.openTeamCourseBtn).toBeVisible();
                await expect(myTeamPage.openTeamCertBtn).toBeVisible();
            }
        });
    });
});
