import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const auth = tcAuthConfig('user');

/**
 * 主流程 · NCRE（矩阵 4.1）
 * 对照：tests/MAIN-FLOW-MATRIX.md §4
 */
test.describe('主流程 · NCRE', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('MF-NCRE-001 NCRE 模块加载正常', { tag: '@MainFlow' }, async ({ ncrePage }) => {
        await ncrePage.goto();
        await expect(ncrePage.container).toBeVisible();
        await expect(ncrePage.studentPanel).toBeVisible();
        await expect(ncrePage.studentTab).toBeVisible();

        await ncrePage.switchToExamCenterTab();
        await expect(ncrePage.examCenterPanel).toBeVisible();
    });
});
