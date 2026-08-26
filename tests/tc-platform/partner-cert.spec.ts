import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const auth = tcAuthConfig('partner');

/**
 * 伙伴认证模块测试
 * 对应前端：website/src/pages/partnerCert/index.vue（平铺岗位区块）
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

        await test.step('验证页面容器与岗位区块可见', async () => {
            await expect(partnerCertPage.container).toBeVisible();
            await expect(partnerCertPage.sectionList).toBeVisible();
            const sectionCount = await partnerCertPage.getSectionCount();
            expect(sectionCount).toBeGreaterThan(0);
            await expect(partnerCertPage.sectionBlocks.first()).toBeVisible();
        });
    });

    test('TC-PARTNER-002 伙伴专属权益与课程/考试展示', { tag: '@Regression' }, async ({ partnerCertPage }) => {
        await test.step('导航到伙伴认证页面', async () => {
            await partnerCertPage.goto();
        });

        await test.step('验证伙伴专属权益说明可见', async () => {
            await expect(partnerCertPage.partnerExclusiveLabel).toBeVisible();
        });

        await test.step('验证课程卡、去考试或阶段标题至少其一可见', async () => {
            const courseCount = await partnerCertPage.getCourseCount();
            const goExamCount = await partnerCertPage.getGoExamCount();
            const stageTitleCount = await partnerCertPage.getStageTitleCount();
            expect(courseCount + goExamCount + stageTitleCount).toBeGreaterThan(0);
            if (courseCount > 0) {
                await expect(partnerCertPage.courseItems.first()).toBeVisible();
                await expect(partnerCertPage.studyBtns.first()).toBeVisible();
            }
            if (goExamCount > 0) {
                await expect(partnerCertPage.goExamBtns.first()).toBeVisible();
            }
            if (courseCount === 0 && goExamCount === 0) {
                await expect(partnerCertPage.stageTitles.first()).toBeVisible();
            }
        });
    });
});
