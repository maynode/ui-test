import fs from 'fs/promises';
import path from 'path';
import { chromium, type Page } from '@playwright/test';
import { getAccount, hasAccount, type AccountRole } from './loadAccounts';

export const AUTH_DIR = path.resolve(process.cwd(), '.auth');

const AUTH_FILES: Record<AccountRole, string> = {
    user: path.join(AUTH_DIR, 'user.json'),
    admin: path.join(AUTH_DIR, 'admin.json'),
    partner: path.join(AUTH_DIR, 'partner.json'),
};

export function getAuthStatePath(role: AccountRole): string {
    return AUTH_FILES[role];
}

async function fillZwsoftAccountLogin(page: Page, role: AccountRole): Promise<void> {
    const { username, password } = getAccount(role);

    await page.waitForURL(/testaccounts\.zwsoft\.cn/, { timeout: 60_000 });
    await page.locator('#phoneInput').fill(username);
    await page.locator('#passwordInput').fill(password);

    const agreement = page.locator('#Agreement');
    if (!(await agreement.isChecked().catch(() => false))) {
        await agreement.check({ force: true });
    }

    await page.getByRole('link', { name: /登\s*录/ }).click();
}

/** OAuth 登录：首页「注册/登录」→ testaccounts.zwsoft.cn → 回跳平台 */
export async function loginAs(page: Page, baseURL: string, role: AccountRole = 'user'): Promise<void> {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '注册/登录' }).click();
    await fillZwsoftAccountLogin(page, role);

    const hostPattern = new URL(baseURL).host.replace(/\./g, '\\.');
    await page.waitForURL(new RegExp(hostPattern), { timeout: 90_000 });
    await page.waitForLoadState('networkidle');

    const loginBtn = page.getByRole('button', { name: '注册/登录' });
    if (await loginBtn.isVisible().catch(() => false)) {
        throw new Error(`Login failed for role "${role}": header still shows 注册/登录`);
    }
}

async function saveAuthState(baseURL: string, role: AccountRole): Promise<void> {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    try {
        await loginAs(page, baseURL, role);
        await fs.mkdir(AUTH_DIR, { recursive: true });
        await context.storageState({ path: AUTH_FILES[role] });
    } finally {
        await browser.close();
    }
}

export async function setupTcAuthStates(baseURL: string): Promise<void> {
    const roles: AccountRole[] = ['user', 'admin', 'partner'];
    const availableRoles = roles.filter(hasAccount);

    if (availableRoles.length === 0) {
        console.warn(
            '[tc-auth] No credentials found. Skipping auth state generation. ' +
            'Copy accounts.example.json to accounts.local.json and fill in test accounts.',
        );
        return;
    }

    for (const role of availableRoles) {
        console.log(`[tc-auth] Generating storageState for role: ${role}`);
        await saveAuthState(baseURL, role);
    }
}
