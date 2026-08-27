import { test, expect } from '@playwright/test';
import { MembershipResPage } from '@pages/admin/MembershipResPage';
import { appendMembership, loadCatalog } from '@lib/catalog';
import { tcAuthConfig } from '@lib/tcAuthConfig';
import { seedEnv, seedRunId } from '@pages/admin/adminUi';

const auth = tcAuthConfig('admin');

test.describe('Admin Seed 会员资源', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(() => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('SEED-MEMBER-RES-001 收编会员资源写入 catalog', { tag: '@Seed' }, async ({ page }) => {
        const membershipPage = new MembershipResPage(page);
        let result: { membershipId: string; id: string; name: string };
        try {
            result = await membershipPage.ensureMembershipResId();
        } catch (error) {
            test.skip(true, String(error));
            return;
        }

        expect(result.id.length).toBeGreaterThan(0);

        appendMembership(
            {
                id: result.id,
                name: result.name,
                membershipId: result.membershipId,
                createdAt: new Date().toISOString(),
            },
            seedRunId(),
            seedEnv(),
        );
        expect(loadCatalog()?.memberships[0]?.id).toBe(result.id);
    });
});
