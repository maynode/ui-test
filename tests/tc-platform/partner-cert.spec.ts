import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const auth = tcAuthConfig('partner');

/**
 * 伙伴认证模块测试
 * 对应前端：website/src/pages/partnerCert/index.vue
 */
test.describe('伙伴认证模块', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('TC-PARTNER-001 伙伴认证模块加载', { tag: '@Smoke' }, async ({ partnerCertPage }) => {
        await test.step('导航到伙伴认证页面', async () => {
            await partnerCertPage.goto();
        });

        await test.step('验证页面容器与选项卡可见', async () => {
            await expect(partnerCertPage.container).toBeVisible();
            await expect(partnerCertPage.coreTabs).toBeVisible();
            const tabCount = await partnerCertPage.getTabCount();
            expect(tabCount).toBeGreaterThan(0);
        });
    });

    test('TC-PARTNER-002 伙伴专属权益与课程展示', { tag: '@Regression' }, async ({ partnerCertPage }) => {
        await test.step('导航到伙伴认证页面', async () => {
            await partnerCertPage.goto();
        });

        await test.step('验证伙伴专属权益说明可见', async () => {
            await expect(partnerCertPage.partnerExclusiveLabel).toBeVisible();
        });

        await test.step('验证课程列表有数据或展示空态', async () => {
            const count = await partnerCertPage.getCourseCount();
            if (count === 0) {
                await expect(partnerCertPage.page.getByText('暂无课程信息').first()).toBeVisible();
            } else {
                expect(count).toBeGreaterThan(0);
            }
        });
    });
});
