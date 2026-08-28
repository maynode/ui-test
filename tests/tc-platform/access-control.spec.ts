import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { getCourseId } from '@lib/loadTcTestData';
import { tcAuthConfig } from '@lib/tcAuthConfig';
import { websitePath } from '@lib/websitePath';
import { CertDetailPage } from '@pages/CertDetailPage';
import { CourseDetailPage } from '@pages/CourseDetailPage';

const userAuth = tcAuthConfig('user');
const courseId = getCourseId();

/**
 * 未登录 / 非 partner / 无权限拦截
 */
test.describe('访问拦截', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC-AUTH-001 未登录访问个人中心重定向首页', { tag: '@Regression' }, async ({ page }) => {
        await test.step('访问我的考试页', async () => {
            await page.goto(websitePath('/user/myExam'));
        });

        await test.step('验证被重定向离开个人中心', async () => {
            await page.waitForURL((url) => !url.pathname.includes('/user/'));
            await expect(page).not.toHaveURL(/\/user\//);
        });
    });

    test('TC-AUTH-002 未登录点击开始学习弹出登录提示', { tag: '@Regression' }, async ({
        page,
        courseListPage,
        courseDetailPage,
    }) => {
        await test.step('打开课程详情（未登录）', async () => {
            await courseListPage.gotoWithoutLogin(courseId);
            await expect(page.getByRole('button', { name: '注册/登录' })).toBeVisible();
        });

        await test.step('点击收藏触发登录确认框', async () => {
            await courseDetailPage.triggerLoginPromptFromDetail();
            await expect(page.locator('.zw-confirm')).toBeVisible();
            await expect(page.getByRole('button', { name: '去登录' })).toBeVisible();
        });
    });
});

test.describe('非 partner 用户伙伴资源拦截', () => {
    if (userAuth.ready && userAuth.storageState) {
        test.use({ storageState: userAuth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!userAuth.ready, userAuth.skipReason);
    });

    test('TC-AUTH-003 非 partner 点击立即学习弹出无权限', { tag: '@Regression' }, async ({
        partnerCertPage,
        context,
    }) => {
        await test.step('进入伙伴认证页', async () => {
            await partnerCertPage.goto();
        });

        const studyCount = await partnerCertPage.getStudyCount();
        test.skip(studyCount === 0, '当前环境无伙伴课程卡，跳过无权限课程拦截断言');

        await test.step('新标签打开伙伴课程并触发学习拦截', async () => {
            const coursePage = await partnerCertPage.openFirstStudyInNewPage(context);
            const courseDetailPage = new CourseDetailPage(coursePage);
            await coursePage.getByRole('button', { name: /开始学习|继续学习/ }).click();
            await courseDetailPage.triggerPartnerAuthFromStudy();
            await expect(coursePage.locator('.zw-partner-auth-dialog')).toBeVisible();
            await expect(coursePage.getByText('非经销商伙伴，暂无权限访问该页面')).toBeVisible();
            await coursePage.close();
        });
    });

    test('TC-AUTH-004 非 partner 去考试触发认证无权限', { tag: '@Regression' }, async ({
        partnerCertPage,
        context,
    }) => {
        await test.step('进入伙伴认证页', async () => {
            await partnerCertPage.goto();
        });

        const goExamCount = await partnerCertPage.getGoExamCount();
        test.skip(goExamCount === 0, '当前环境无去考试入口，跳过认证无权限断言');

        await test.step('新标签打开认证详情并尝试进考', async () => {
            const certPopup = await partnerCertPage.openFirstGoExamInNewPage(context);
            const certDetailPage = new CertDetailPage(certPopup);
            await certDetailPage.container.waitFor({ state: 'visible' });
            await certDetailPage.clickEnterExamOrTriggerAuth();
            await certDetailPage.expectPartnerAuthDialog();
            await certPopup.close();
        });
    });
});
