import fs from 'fs/promises';
import path from 'path';
import { chromium, type Page } from '@playwright/test';
import { getAccount, hasAccount, type AccountRole } from './loadAccounts';
import { adminBaseURL as resolveAdminBaseURL } from './tcAdminConfig';

export const AUTH_DIR = path.resolve(process.cwd(), '.auth');

/** Website 侧以 admin 账号登录的 storageState（团队服务等 C 端页） */
export const ADMIN_WEBSITE_AUTH_FILE = path.join(AUTH_DIR, 'admin-website.json');

const AUTH_FILES: Record<AccountRole, string> = {
    user: path.join(AUTH_DIR, 'user.json'),
    admin: path.join(AUTH_DIR, 'admin.json'),
    partner: path.join(AUTH_DIR, 'partner.json'),
};

export type AuthStateKey = AccountRole | 'adminWebsite';

export function getAuthStatePath(role: AuthStateKey): string {
    if (role === 'adminWebsite') {
        return ADMIN_WEBSITE_AUTH_FILE;
    }
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

function normalizeAdminBase(adminBase: string): string {
    return adminBase.replace(/\/?$/, '/');
}

/**
 * Admin OAuth：用户授权页 →「授权登录」→ testaccounts.zwsoft.cn → 回跳 etcert-admin。
 * Navigation uses the passed adminBase (not tcAdminConfig defaults).
 */
export async function loginAsAdmin(page: Page, adminBase: string): Promise<void> {
    const normalizedAdminBase = normalizeAdminBase(adminBase);
    await page.goto(`${normalizedAdminBase}#/platformAuth/user`, { waitUntil: 'domcontentloaded' });

    const addAuth = page.getByRole('button', { name: '新增授权' });
    const oauthBtn = page.getByRole('button', { name: '授权登录' });

    try {
        await Promise.race([
            addAuth.waitFor({ state: 'visible', timeout: 60_000 }),
            oauthBtn.waitFor({ state: 'visible', timeout: 60_000 }),
            page.waitForURL(/testaccounts\.zwsoft\.cn/, { timeout: 60_000 }),
        ]);
    } catch {
        throw new Error('Admin login: expected 新增授权, 授权登录, or testaccounts.zwsoft.cn');
    }

    if (await addAuth.isVisible().catch(() => false)) {
        return;
    }

    if (await oauthBtn.isVisible().catch(() => false)) {
        await oauthBtn.click();
    }

    await fillZwsoftAccountLogin(page, 'admin');
    await page.waitForURL(/etcert-admin/, { timeout: 90_000 });
    await page.waitForLoadState('networkidle');
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

async function saveAuthState(
    websiteBaseURL: string,
    role: AccountRole,
    adminBaseURL?: string,
): Promise<void> {
    const isAdmin = role === 'admin';
    const contextBaseURL = isAdmin
        ? normalizeAdminBase(adminBaseURL ?? '')
        : websiteBaseURL;

    if (isAdmin && !adminBaseURL) {
        throw new Error('[tc-auth] adminBaseURL is required when generating admin storageState.');
    }

    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({
        baseURL: contextBaseURL,
        ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    try {
        if (isAdmin) {
            await loginAsAdmin(page, adminBaseURL!);
        } else {
            await loginAs(page, websiteBaseURL, role);
        }
        await fs.mkdir(AUTH_DIR, { recursive: true });
        await context.storageState({ path: AUTH_FILES[role] });
    } finally {
        await browser.close();
    }
}

/** Website 上以 admin 账号登录，供 /user/myTeam 等 C 端用例（与后台 admin.json 分离） */
async function saveAdminWebsiteAuthState(websiteBaseURL: string): Promise<void> {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({
        baseURL: websiteBaseURL,
        ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    try {
        await loginAs(page, websiteBaseURL, 'admin');
        await fs.mkdir(AUTH_DIR, { recursive: true });
        await context.storageState({ path: ADMIN_WEBSITE_AUTH_FILE });
    } finally {
        await browser.close();
    }
}

export async function setupTcAuthStates(websiteBaseURL: string, adminBaseURL?: string): Promise<void> {
    const roles: AccountRole[] = ['user', 'admin', 'partner'];
    const availableRoles = roles.filter(hasAccount);
    const resolvedAdminBaseURL = adminBaseURL ?? resolveAdminBaseURL();

    if (availableRoles.length === 0) {
        console.warn(
            '[tc-auth] No credentials found. Skipping auth state generation. ' +
            'Copy accounts.example.json to accounts.local.json and fill in test accounts.',
        );
        return;
    }

    for (const role of availableRoles) {
        console.log(`[tc-auth] Generating storageState for role: ${role}`);
        if (role === 'admin') {
            await saveAuthState(websiteBaseURL, role, resolvedAdminBaseURL);
            console.log('[tc-auth] Generating storageState for admin on website (admin-website.json)');
            await saveAdminWebsiteAuthState(websiteBaseURL);
        } else {
            await saveAuthState(websiteBaseURL, role);
        }
    }
}
