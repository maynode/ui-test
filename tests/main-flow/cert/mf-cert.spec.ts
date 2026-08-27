import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { getCertId } from '@lib/loadTcTestData';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const auth = tcAuthConfig('user');
const certId = getCertId();
const certSkipReason =
    '缺少 certId：请配置 tests/testData/certs.json 或先跑 Admin Seed 写入 catalog.certs[0].id';

/**
 * 主流程 · 认证考试（矩阵 2.1 ~ 2.9）
 * 对照：tests/MAIN-FLOW-MATRIX.md §2
 */
test.describe('主流程 · 认证考试', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('MF-CERT-001 认证页加载正常', { tag: '@MainFlow' }, async ({ certListPage }) => {
        await certListPage.goto();
        await expect(certListPage.container).toBeVisible();
        await expect(certListPage.catalogHeader).toBeVisible();
    });

    test('MF-CERT-002 认证详情页加载正常', { tag: '@MainFlow' }, async ({ certDetailPage }) => {
        test.skip(!certId, certSkipReason);
        await certDetailPage.goto(certId!);
        await expect(certDetailPage.title).toBeVisible();
        await expect(certDetailPage.stepNav).toBeVisible();
    });

    test('MF-CERT-003 点击去自测按钮', { tag: '@MainFlow' }, async ({ certDetailPage, page }) => {
        test.skip(!certId, certSkipReason);
        await certDetailPage.goto(certId!);

        const selfTestVisible = await certDetailPage.selfTestBtn.isVisible().catch(() => false);
        test.skip(!selfTestVisible, '当前认证无「进入模拟测试」入口');

        await certDetailPage.clickSelfTest();
        await page.waitForURL(/\/cert\/(notice|binding)|etcert-exam/, { timeout: 90_000 });
    });

    test('MF-CERT-004 点击去考试按钮', { tag: '@MainFlow' }, async ({ certDetailPage, page }) => {
        test.skip(!certId, certSkipReason);
        await certDetailPage.goto(certId!);
        await certDetailPage.goToExamStep();

        const enterVisible = await certDetailPage.enterExamBtn.isVisible().catch(() => false);
        test.skip(!enterVisible, '当前账号考试状态无「进入/继续/补考」按钮');

        await certDetailPage.enterExamBtn.click();
        await page.waitForURL(/\/cert\/(notice|binding)|etcert-exam/, { timeout: 90_000 });
    });

    test(
        'MF-CERT-005 考试流程正常',
        { tag: ['@MainFlow', '@Destructive'] },
        async ({ certDetailPage, examPage }) => {
            test.skip(!certId, certSkipReason);
            await certDetailPage.goto(certId!);
            await certDetailPage.clickExam();
            await examPage.completePreExamFlow();
            await expect(examPage.container).toBeVisible();
        },
    );

    test(
        'MF-CERT-006 考试正常',
        { tag: ['@MainFlow', '@Destructive'] },
        async ({ certDetailPage, examPage }) => {
            test.skip(!certId, certSkipReason);
            await certDetailPage.goto(certId!);
            await certDetailPage.clickExam();
            await examPage.completePreExamFlow();
            await examPage.answerFirstQuestion();
            await examPage.submitExam();
            await expect(examPage.submitSuccess).toBeVisible();
        },
    );

    test('MF-CERT-007 考试状态同步', { tag: '@MainFlow' }, async ({ certDetailPage, myExamPage, page }) => {
        test.skip(!certId, certSkipReason);

        await certDetailPage.goto(certId!);
        await certDetailPage.goToExamStep();
        const detailState = await certDetailPage.detectExamUiState();
        const detailTitle = await certDetailPage.title.innerText();

        await myExamPage.goto();
        const hasRecords = await myExamPage.hasExamRecords();
        test.skip(!hasRecords, '我的考试无记录，无法断言跨页状态同步');

        await expect(myExamPage.examTable).toBeVisible();
        await expect(page.getByRole('cell', { name: detailTitle }).first()).toBeVisible({ timeout: 15_000 });

        test.info().annotations.push({
            type: 'exam-state',
            description: `detail-state=${detailState ?? 'unknown'}`,
        });
    });

    test('MF-CERT-008 我的考试页面', { tag: '@MainFlow' }, async ({ myExamPage }) => {
        await myExamPage.goto();
        await expect(myExamPage.container).toBeVisible();
        const hasRecords = await myExamPage.hasExamRecords();
        if (hasRecords) {
            await expect(myExamPage.examTable).toBeVisible();
        } else {
            await expect(myExamPage.emptyText).toBeVisible();
        }
    });

    test('MF-CERT-009 我的证书页面', { tag: '@MainFlow' }, async ({ myCertPage }) => {
        await myCertPage.goto();
        await expect(myCertPage.container).toBeVisible();
        const count = await myCertPage.getCertCount();
        if (count === 0) {
            await expect(myCertPage.emptyText).toBeVisible();
        } else {
            expect(count).toBeGreaterThan(0);
        }
    });
});
