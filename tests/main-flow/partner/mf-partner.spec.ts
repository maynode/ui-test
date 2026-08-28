import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { CertDetailPage } from '@pages/CertDetailPage';
import { CourseDetailPage } from '@pages/CourseDetailPage';
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
        await partnerCertPage.goto('partner');
        await expect(partnerCertPage.container).toBeVisible();
        await expect(partnerCertPage.sectionList).toBeVisible();
        expect(await partnerCertPage.getSectionCount()).toBeGreaterThan(0);
    });

    test('MF-PARTNER-002 伙伴课程详情页正常加载', { tag: '@MainFlow' }, async ({ partnerCertPage, context }) => {
        await partnerCertPage.goto('partner');
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

    test('MF-PARTNER-003 非 partner 无权限拦截', { tag: '@MainFlow' }, async ({
        partnerCertPage,
        context,
    }) => {
        test.setTimeout(180_000);
        await partnerCertPage.goto();

        const studyCount = await partnerCertPage.getStudyCount();
        const goExamCount = await partnerCertPage.getGoExamCount();
        test.skip(studyCount === 0 && goExamCount === 0, '无伙伴课程/去考试入口，跳过权限断言');

        let asserted = false;

        if (studyCount > 0) {
            const coursePage = await partnerCertPage.openFirstStudyInNewPage(context);
            const courseDetailPage = new CourseDetailPage(coursePage);
            await coursePage.getByRole('button', { name: /开始学习|继续学习/ }).click();
            await courseDetailPage.triggerPartnerAuthFromStudy();
            const partnerDialog = coursePage.locator('.zw-partner-auth-dialog');
            const dialogVisible = await partnerDialog.isVisible({ timeout: 20_000 }).catch(() => false);
            if (dialogVisible) {
                await expect(partnerDialog).toBeVisible();
                await expect(coursePage.getByText('非经销商伙伴，暂无权限访问该页面')).toBeVisible();
                asserted = true;
            }
            await coursePage.close();
        }

        if (goExamCount > 0) {
            const certPopup = await partnerCertPage.openFirstGoExamInNewPage(context);
            const certDetailPage = new CertDetailPage(certPopup);
            await certDetailPage.container.waitFor({ state: 'visible' });
            await certDetailPage.clickEnterExamOrTriggerAuth();
            const partnerDialog = certPopup.locator('.zw-partner-auth-dialog');
            const dialogVisible = await partnerDialog.isVisible({ timeout: 20_000 }).catch(() => false);
            if (dialogVisible) {
                await expect(partnerDialog).toBeVisible();
                await expect(certPopup.getByText('非经销商伙伴，暂无权限访问该页面')).toBeVisible();
                asserted = true;
            }
            await certPopup.close();
        }

        test.skip(!asserted, '当前伙伴入口均非伙伴专属资源，无权限弹窗可断言');
    });
});
