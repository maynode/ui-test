import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { getCourseId } from '@lib/loadTcTestData';
import { tcAuthConfig } from '@lib/tcAuthConfig';

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

    test('MF-COURSE-001 课程页加载正常', { tag: '@MainFlow' }, async ({ courseListPage }) => {
        await courseListPage.goto(courseId);
        await expect(courseListPage.container).toBeVisible();
        await expect(courseListPage.ctaButton).toBeVisible();
    });

    test('MF-COURSE-002 课程详情页加载正常', { tag: '@MainFlow' }, async ({ courseListPage }) => {
        await courseListPage.goto(courseId);
        await expect(courseListPage.container).toHaveClass(/course-detail-page/);
        await expect(courseListPage.favoriteButton).toBeVisible();
    });

    test('MF-COURSE-003 课程视频播放正常', { tag: '@MainFlow' }, async ({ courseListPage, courseDetailPage }) => {
        await courseListPage.goto(courseId);
        await courseListPage.openFirstCourse();
        await courseDetailPage.waitForStudyMode();
        await courseDetailPage.assertVideoStudyVisible();
    });

    test('MF-COURSE-004 学习文档加载正常', { tag: '@MainFlow' }, async ({ courseListPage, courseDetailPage }) => {
        await courseListPage.goto(courseId);
        await courseListPage.openFirstCourse();
        await courseDetailPage.waitForStudyMode();

        const hasDocument = await courseDetailPage.tryAssertDocumentStudyVisible();
        test.skip(!hasDocument, '当前课程无 PDF/文档小节，跳过文档加载断言');
    });
});
