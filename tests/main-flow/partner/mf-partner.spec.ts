import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { CertDetailPage } from '@pages/CertDetailPage';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const partnerAuth = tcAuthConfig('partner');
const userAuth = tcAuthConfig('user');

/**
 * 主流程 · 伙伴认证（矩阵 5.1 ~ 5.3）
 * 对照：tests/MAIN-FLOW-MATRIX.md §5
 */
test.describe('主流程 · 伙伴认证 · partner 正向', () => {
    if (partnerAuth.ready && partnerAuth.storageState) {
        test.use({ storageState: partnerAuth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!partnerAuth.ready, partnerAuth.skipReason);
    });

    test('MF-PARTNER-001 伙伴认证模块加载正常', { tag: '@MainFlow' }, async ({ partnerCertPage }) => {
        await partnerCertPage.goto();
        await expect(partnerCertPage.container).toBeVisible();
        await expect(partnerCertPage.sectionList).toBeVisible();
        expect(await partnerCertPage.getSectionCount()).toBeGreaterThan(0);
    });

    test('MF-PARTNER-002 伙伴课程详情页正常加载', { tag: '@MainFlow' }, async ({ partnerCertPage, context }) => {
        await partnerCertPage.goto();
        const studyCount = await partnerCertPage.getStudyCount();
        test.skip(studyCount === 0, '当前环境无伙伴课程卡');

        const coursePage = await partnerCertPage.openFirstStudyInNewPage(context);
        await expect(coursePage.locator('.course-detail-page')).toBeVisible({ timeout: 60_000 });
        await expect(coursePage.getByRole('button', { name: /开始学习|继续学习/ })).toBeVisible();
        await expect(coursePage.locator('.zw-partner-auth-dialog')).toHaveCount(0);
        await coursePage.close();
    });
});

test.describe('主流程 · 伙伴认证 · 权限判断', () => {
    if (userAuth.ready && userAuth.storageState) {
        test.use({ storageState: userAuth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!userAuth.ready, userAuth.skipReason);
    });

    test('MF-PARTNER-003 非 partner 无权限拦截', { tag: '@MainFlow' }, async ({ partnerCertPage, context }) => {
        await partnerCertPage.goto();

        const studyCount = await partnerCertPage.getStudyCount();
        const goExamCount = await partnerCertPage.getGoExamCount();
        test.skip(studyCount === 0 && goExamCount === 0, '无伙伴课程/去考试入口，跳过权限断言');

        if (studyCount > 0) {
            const coursePage = await partnerCertPage.openFirstStudyInNewPage(context);
            await coursePage.getByRole('button', { name: /开始学习|继续学习/ }).click();
            await expect(coursePage.locator('.zw-partner-auth-dialog')).toBeVisible();
            await expect(coursePage.getByText('非经销商伙伴，暂无权限访问该页面')).toBeVisible();
            await coursePage.close();
        }

        if (goExamCount > 0) {
            const certPopup = await partnerCertPage.openFirstGoExamInNewPage(context);
            const certDetailPage = new CertDetailPage(certPopup);
            await certDetailPage.container.waitFor({ state: 'visible' });
            await certDetailPage.clickEnterExamOrTriggerAuth();
            await certDetailPage.expectPartnerAuthDialog();
            await certPopup.close();
        }
    });
});
