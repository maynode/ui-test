import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { getCertId } from '@lib/loadTcTestData';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const auth = tcAuthConfig('user');
const certId = getCertId();

/**
 * 认证考试主流程测试
 * 对应前端：website/src/pages/cert/detail.vue、exam/src/views/exam/index.vue
 */
test.describe('认证考试主流程', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('TC-CERT-001 认证详情页加载', { tag: '@Smoke' }, async ({ certDetailPage }) => {
        test.skip(!certId, '请在 tests/testData/certs.json 中配置 firstCert.id');

        await test.step('导航到认证详情页', async () => {
            await certDetailPage.goto(certId);
        });

        await test.step('验证认证标题与步骤导航可见', async () => {
            await expect(certDetailPage.title).toBeVisible();
            await expect(certDetailPage.stepNav).toBeVisible();
        });
    });

    test('TC-CERT-002 完整考试流程', { tag: '@Smoke' }, async ({ certDetailPage, examPage }) => {
        test.skip(!certId, '请在 tests/testData/certs.json 中配置 firstCert.id');

        await test.step('导航到认证详情页', async () => {
            await certDetailPage.goto(certId);
        });

        await test.step('进入在线考试', async () => {
            await certDetailPage.clickExam();
        });

        await test.step('完成考试前置流程', async () => {
            await examPage.completePreExamFlow();
        });

        await test.step('回答第一道题', async () => {
            await examPage.answerFirstQuestion();
        });

        await test.step('提交试卷', async () => {
            await examPage.submitExam();
        });

        await test.step('验证提交成功', async () => {
            await expect(examPage.submitSuccess).toBeVisible();
        });
    });

    test('TC-CERT-003 我的考试记录展示', { tag: '@Regression' }, async ({ myExamPage }) => {
        await test.step('导航到我的考试页', async () => {
            await myExamPage.goto();
        });

        await test.step('验证页面容器可见', async () => {
            await expect(myExamPage.container).toBeVisible();
        });

        await test.step('验证有考试记录或空态', async () => {
            const hasRecords = await myExamPage.hasExamRecords();
            if (!hasRecords) {
                await expect(myExamPage.emptyText).toBeVisible();
            }
        });
    });

    test('TC-CERT-004 我的证书展示', { tag: '@Regression' }, async ({ myCertPage }) => {
        await test.step('导航到我的证书页', async () => {
            await myCertPage.goto();
        });

        await test.step('验证页面容器可见', async () => {
            await expect(myCertPage.container).toBeVisible();
        });

        await test.step('验证有证书或空态', async () => {
            const count = await myCertPage.getCertCount();
            if (count === 0) {
                await expect(myCertPage.emptyText).toBeVisible();
            } else {
                expect(count).toBeGreaterThan(0);
            }
        });
    });
});
