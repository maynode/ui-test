import { test, expect } from '@playwright/test';
import { ProductResPage } from '@pages/admin/ProductResPage';
import { appendCert, loadCatalog } from '@lib/catalog';
import { tcAuthConfig } from '@lib/tcAuthConfig';
import { seedEnv, seedRunId } from '@pages/admin/adminUi';

const auth = tcAuthConfig('admin');

test.describe('Admin Seed 产品认证资源', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(() => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('SEED-CERT-RES-001 绑定或收编认证资源写入 catalog', { tag: '@Seed' }, async ({ page }) => {
        const productRes = new ProductResPage(page);
        const { id, name } = await productRes.ensureCertResId();
        expect(id.trim().length).toBeGreaterThan(0);

        appendCert(
            {
                id: id.trim(),
                name,
                createdAt: new Date().toISOString(),
            },
            seedRunId(),
            seedEnv(),
        );
        expect(loadCatalog()?.certs[0]?.id).toBe(id.trim());
    });
});
