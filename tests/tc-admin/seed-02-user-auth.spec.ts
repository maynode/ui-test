import { test, expect } from '@playwright/test';
import { UserAuthPage } from '@pages/admin/UserAuthPage';
import { appendAuth, loadCatalog } from '@lib/catalog';
import { getAccount, hasAccount } from '@lib/loadAccounts';
import { tcAuthConfig } from '@lib/tcAuthConfig';
import { latestCatalogCert } from '@lib/seedConfig';
import { seedEnv, seedRunId } from '@pages/admin/adminUi';

const auth = tcAuthConfig('admin');

function pad2(n: number) {
    return String(n).padStart(2, '0');
}

function fmt(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} 00:00:00`;
}

test.describe('Admin Seed 用户授权', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(() => {
        test.skip(!auth.ready, auth.skipReason);
        test.skip(!hasAccount('user'), '需要 accounts.local.json 中的 user 作为被授权账号');
    });

    test('SEED-AUTH-001 批量用户授权并写入 catalog', { tag: '@Seed' }, async ({ page }) => {
        const seedCert = latestCatalogCert();
        test.skip(!seedCert?.productName, '请先跑 SEED-CERT-RES-001 写入 certs[0].productName');

        const userAuth = new UserAuthPage(page);
        const account = getAccount('user').username;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);

        await userAuth.goto();
        await userAuth.openBatchDialog();
        const productName = await userAuth.pickProductByName(seedCert!.productName!);
        await userAuth.fillAccount(account);
        await userAuth.fillDateTime('授权开始时间', fmt(start));
        await userAuth.fillDateTime('授权结束时间', fmt(end));
        await userAuth.confirm();

        appendAuth(
            {
                account,
                productName,
                start: fmt(start),
                end: fmt(end),
                createdAt: new Date().toISOString(),
            },
            seedRunId(),
            seedEnv(),
        );
        expect(loadCatalog()?.auth.length).toBeGreaterThan(0);
    });
});
