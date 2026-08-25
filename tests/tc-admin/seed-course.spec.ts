import { test, expect } from '@playwright/test';
import { CourseManagePage } from '@pages/admin/CourseManagePage';
import { appendCourse, loadCatalog } from '@lib/catalog';
import { tcAuthConfig } from '@lib/tcAuthConfig';
import { seedEnv, seedRunId } from '@pages/admin/adminUi';

const auth = tcAuthConfig('admin');

test.describe('Admin Seed 课程', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(() => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('SEED-COURSE-001 新建或收编课程写入 catalog', { tag: '@Seed' }, async ({ page }) => {
        const coursePage = new CourseManagePage(page);
        const stamp = Date.now();
        const uniqueName = `UISeed课程-${stamp}`;
        const { id, name } = await coursePage.ensureCourseId(uniqueName);
        expect(id.trim().length).toBeGreaterThan(0);

        appendCourse(
            {
                id: id.trim(),
                name,
                createdAt: new Date().toISOString(),
            },
            seedRunId(),
            seedEnv(),
        );
        expect(loadCatalog()?.courses[0]?.id).toBe(id.trim());
    });
});
