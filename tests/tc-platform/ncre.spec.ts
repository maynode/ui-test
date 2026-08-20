import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const auth = tcAuthConfig('user');

/**
 * NCRE 模块测试
 * 覆盖检查项 18：NCRE 模块正常展示
 */
test.describe('NCRE 模块', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('TC-NCRE-001 NCRE 模块加载', { tag: '@Smoke' }, async ({ ncrePage }) => {
        await test.step('导航到 NCRE 页面', async () => {
            await ncrePage.goto();
        });

        await test.step('验证 NCRE 容器可见', async () => {
            await expect(ncrePage.container).toBeVisible();
        });
    });
});
