import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { getCourseId } from '@lib/loadTcTestData';
import { tcAuthConfig } from '@lib/tcAuthConfig';
import { stepWithScreenshot } from '@lib/stepWithScreenshot';

const auth = tcAuthConfig('user');
const courseId = getCourseId();

/**
 * 主流程 · 课程学习（矩阵 1.1 ~ 1.4）
 * 对照：tests/MAIN-FLOW-MATRIX.md §1
 */
test.describe('主流程 · 课程学习', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('MF-COURSE-001 课程页加载正常', { tag: '@MainFlow' }, async ({ courseListPage, page }) => {
        await stepWithScreenshot(page, '导航到课程页', async () => {
            await courseListPage.goto(courseId);
        });
        await stepWithScreenshot(page, '验证课程详情与 CTA', async () => {
            await expect(courseListPage.container).toBeVisible();
            await expect(courseListPage.ctaButton).toBeVisible();
        });
    });

    test('MF-COURSE-002 课程详情页加载正常', { tag: '@MainFlow' }, async ({ courseListPage, page }) => {
        await stepWithScreenshot(page, '打开课程详情', async () => {
            await courseListPage.goto(courseId);
        });
        await stepWithScreenshot(page, '验证详情页元素', async () => {
            await expect(courseListPage.container).toBeVisible();
            await expect(courseListPage.favoriteButton).toBeVisible();
        });
    });

    test('MF-COURSE-003 课程视频播放正常', { tag: '@MainFlow' }, async ({
        courseListPage,
        courseDetailPage,
        page,
    }) => {
        test.setTimeout(180_000);
        await stepWithScreenshot(page, '进入课程页并开始学习', async () => {
            await courseListPage.goto(courseId);
            await courseListPage.openFirstCourse();
            await courseDetailPage.waitForStudyMode();
        });
        await stepWithScreenshot(page, '验证视频播放器', async () => {
            await courseDetailPage.assertVideoStudyVisible();
        });
    });

    test('MF-COURSE-004 学习文档加载正常', { tag: '@MainFlow' }, async ({
        courseListPage,
        courseDetailPage,
        page,
    }) => {
        await stepWithScreenshot(page, '进入学习模式', async () => {
            await courseListPage.goto(courseId);
            await courseListPage.openFirstCourse();
            await courseDetailPage.waitForStudyMode();
        });

        let hasDocument = false;
        await stepWithScreenshot(page, '查找 PDF/文档小节', async () => {
            hasDocument = await courseDetailPage.tryAssertDocumentStudyVisible();
        });
        test.skip(!hasDocument, '当前课程无 PDF/文档小节，跳过文档加载断言');
    });
});
