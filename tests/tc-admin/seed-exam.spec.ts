import { test, expect } from '@playwright/test';
import { ExamListPage } from '@pages/admin/ExamListPage';
import { appendExam, loadCatalog } from '@lib/catalog';
import { tcAuthConfig } from '@lib/tcAuthConfig';
import { seedEnv, seedRunId } from '@pages/admin/adminUi';

const auth = tcAuthConfig('admin');

test.describe('Admin Seed 考试', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(() => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('SEED-EXAM-001 新建或收编考试写入 catalog', { tag: '@Seed' }, async ({ page }) => {
        const examPage = new ExamListPage(page);
        const stamp = Date.now();
        const uniqueName = `UISeed考试-${stamp}`;
        const { id, name } = await examPage.ensureExamId(uniqueName);
        expect(id.trim().length).toBeGreaterThan(0);

        appendExam(
            {
                id: id.trim(),
                name,
                createdAt: new Date().toISOString(),
            },
            seedRunId(),
            seedEnv(),
        );
        expect(loadCatalog()?.exams[0]?.id).toBe(id.trim());
    });
});
