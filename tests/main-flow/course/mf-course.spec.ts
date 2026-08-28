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

    test('MF-COURSE-001 课程页加载正常', { tag: '@MainFlow' }, async ({ courseListPage, courseDetailPage, page }) => {
        await stepWithScreenshot(page, '导航到课程页', async () => {
            await courseListPage.goto(courseId);
        });
        await stepWithScreenshot(page, '验证课程详情与 CTA', async () => {
            await expect(courseListPage.container).toBeVisible();
            await expect(courseListPage.ctaButton).toBeVisible();
            const title = await courseDetailPage.getCourseTitleText();
            expect(title.length).toBeGreaterThan(0);
        });
    });

    test('MF-COURSE-002 课程详情页与大纲目录加载正常', { tag: '@MainFlow' }, async ({ courseListPage, courseDetailPage, page }) => {
        await stepWithScreenshot(page, '打开课程详情', async () => {
            await courseListPage.goto(courseId);
        });
        await stepWithScreenshot(page, '验证详情页大纲与操作栏', async () => {
            await expect(courseListPage.container).toBeVisible();
            await expect(courseListPage.favoriteButton).toBeVisible();
            const unitCount = await courseDetailPage.getOutlineUnitCount();
            expect(unitCount).toBeGreaterThan(0);
        });
    });

    test('MF-COURSE-003 课程视频播放与播控交互', { tag: '@MainFlow' }, async ({
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

        await stepWithScreenshot(page, '断言视频真实起播与进度推进', async () => {
            await courseDetailPage.assertVideoPlaying(0.3);
        });

        await stepWithScreenshot(page, '测试播放与暂停状态切换', async () => {
            await courseDetailPage.togglePlayPause();
        });

        await stepWithScreenshot(page, '测试倍速调节至 1.5x 并验证生效', async () => {
            await courseDetailPage.changePlaybackRate('1.5');
        });

        await stepWithScreenshot(page, '测试网页全屏与退出', async () => {
            await courseDetailPage.toggleWebFullscreen();
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

    test('MF-COURSE-005 课程选节与连播切换', { tag: '@MainFlow' }, async ({
        courseListPage,
        courseDetailPage,
        page,
    }) => {
        test.setTimeout(180_000);

        await stepWithScreenshot(page, '进入课程学习页', async () => {
            await courseListPage.goto(courseId);
            await courseListPage.openFirstCourse();
            await courseDetailPage.waitForStudyMode();
        });

        const totalUnits = await courseDetailPage.getUnitCount();
        test.skip(totalUnits <= 1, '当前课程仅有 1 个小节，跳过连播/切课测试');

        await stepWithScreenshot(page, '切换至下一小节并断言激活态与播放', async () => {
            const [, afterUnit] = await courseDetailPage.clickNextUnit();
            expect(afterUnit).not.toBe('');
            await courseDetailPage.assertVideoPlaying(0.1);
        });

        await stepWithScreenshot(page, '切换回上一小节', async () => {
            await courseDetailPage.clickPrevUnit();
            await courseDetailPage.assertVideoPlaying(0.1);
        });
    });

    test('MF-COURSE-006 VIP课程试看与会员拦截', { tag: '@MainFlow' }, async ({
        courseListPage,
        courseDetailPage,
        page,
    }) => {
        test.setTimeout(180_000);

        await stepWithScreenshot(page, '进入课程学习页', async () => {
            await courseListPage.goto(courseId);
            await courseListPage.openFirstCourse();
            await courseDetailPage.waitForStudyMode();
        });

        const hasVip = await courseDetailPage.hasVipUnits();
        test.skip(!hasVip, '当前课程为完全免费课程，无 VIP 试看与权限限制小节');

        await stepWithScreenshot(page, '选择 VIP 小节并断言试看提示条', async () => {
            await courseDetailPage.selectFirstVipUnit();
            await expect(courseDetailPage.previewBar.or(courseDetailPage.previewEndLayer)).toBeVisible({ timeout: 15_000 });
        });

        await stepWithScreenshot(page, '快进至试看结束点断言遮罩层', async () => {
            await courseDetailPage.seekNearPreviewEnd(59);
            await expect(courseDetailPage.previewEndLayer).toBeVisible({ timeout: 30_000 });
        });

        await stepWithScreenshot(page, '点击开通会员按钮断言购买指引', async () => {
            const buyBtn = courseDetailPage.previewVipBtn.first();
            if (await buyBtn.isVisible().catch(() => false)) {
                await buyBtn.click();
                const vipDialogOrPage = page.locator('.el-dialog, .course-vip-dialog, .el-overlay').filter({ hasText: /会员|开通|购买/ });
                await expect(vipDialogOrPage.first()).toBeVisible({ timeout: 10_000 });
            }
        });
    });
});
