import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const auth = tcAuthConfig('user');

/**
 * 课程学习主流程测试
 * 对应前端：website/src/pages/course/index.vue
 */
test.describe('课程学习主流程', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('TC-COURSE-001 课程详情页加载与入口展示', { tag: '@Smoke' }, async ({ courseListPage }) => {
        await test.step('导航到课程页', async () => {
            await courseListPage.goto();
        });

        await test.step('验证课程详情容器可见', async () => {
            await expect(courseListPage.container).toBeVisible();
        });

        await test.step('验证开始学习按钮可见', async () => {
            await expect(courseListPage.ctaButton).toBeVisible();
        });
    });

    test('TC-COURSE-002 进入学习流程', { tag: '@Smoke' }, async ({ courseListPage, courseDetailPage }) => {
        await test.step('导航到课程页', async () => {
            await courseListPage.goto();
        });

        await test.step('点击开始学习', async () => {
            await courseListPage.openFirstCourse();
        });

        await test.step('验证进入学习模式', async () => {
            await courseDetailPage.waitForStudyMode();
            await expect(courseDetailPage.studyContainer).toBeVisible();
        });
    });
});
