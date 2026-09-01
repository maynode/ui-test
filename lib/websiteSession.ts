import { expect, type Page } from '@playwright/test';
import { loginAs } from './TcAuth';
import type { AccountRole } from './loadAccounts';
import { testConfig } from '../testConfig';
import { dismissBlockingWebsiteDialogs } from './websiteDialog';

const LOGIN_BUTTON = '注册/登录';

function websiteBaseURL(): string {
    const env = (process.env.ENV || process.env.npm_config_ENV || 'tcTest') as keyof typeof testConfig;
    const url = testConfig[env];
    if (typeof url === 'string' && url.startsWith('http')) {
        return url;
    }
    throw new Error(`No website baseURL for ENV=${String(env)}`);
}

function isOnWebsiteHost(page: Page): boolean {
    try {
        const host = new URL(websiteBaseURL()).host;
        return page.url().includes(host);
    } catch {
        return false;
    }
}

/**
 * 等待顶栏鉴权状态稳定：已登录（头像）或未登录（可点的「注册/登录」）。
 * 避免 cookie 恢复过程中按钮处于 is-loading 时被误判为需要 OAuth。
 */
export async function waitForWebsiteAuthSettled(page: Page): Promise<'logged-in' | 'logged-out'> {
    const loginBtn = page.getByRole('button', { name: LOGIN_BUTTON });
    const headerAvatar = page.locator('header .zw-vip-avatar, header [class*="ZwVipAvatar"], header .zw-header-avatar, header [class*="ZwHeaderAvatar"]').first();

    await expect
        .poll(
            async () => {
                if (await headerAvatar.isVisible().catch(() => false)) {
                    return 'logged-in';
                }
                if (!(await loginBtn.isVisible().catch(() => false))) {
                    return isOnWebsiteHost(page) ? 'logged-in' : 'pending';
                }
                const loading = await loginBtn.evaluate((el) => el.classList.contains('is-loading')).catch(() => true);
                return loading ? 'pending' : 'logged-out';
            },
            { timeout: 60_000, intervals: [300, 500, 1000] },
        )
        .not.toBe('pending');

    if (await headerAvatar.isVisible().catch(() => false)) {
        return 'logged-in';
    }
    if (!(await loginBtn.isVisible().catch(() => false))) {
        return isOnWebsiteHost(page) ? 'logged-in' : 'logged-out';
    }
    return 'logged-out';
}

/**
 * 在首页完成登录（或从 cookie 恢复），并用顶栏断言确认已登录。
 * 业务页导航前必须先调用本函数，再 goto 目标路由。
 */
export async function ensureWebsiteLoggedIn(page: Page, role: AccountRole = 'user'): Promise<void> {
    const baseURL = websiteBaseURL();

    // 如果已经在当前站点的页面上且已经登录，则不必重复 page.goto('.')
    if (isOnWebsiteHost(page)) {
        const currentAuthState = await waitForWebsiteAuthSettled(page);
        if (currentAuthState === 'logged-in') {
            try {
                await assertWebsiteLoggedIn(page);
                await dismissBlockingWebsiteDialogs(page);
                return;
            } catch {
                // 顶栏头像可见但 cookie 半失效，继续走完整登录
            }
        }
    }

    await page.goto('.', { waitUntil: 'domcontentloaded' });
    await loginWebsiteWithRetry(page, role, baseURL);
}

async function loginWebsiteWithRetry(page: Page, role: AccountRole, baseURL: string): Promise<void> {
    const authState = await waitForWebsiteAuthSettled(page);
    if (authState === 'logged-out') {
        await loginAs(page, baseURL, role);
    }

    try {
        await assertWebsiteLoggedIn(page);
    } catch {
        await loginAs(page, baseURL, role);
        await assertWebsiteLoggedIn(page);
    }

    await dismissBlockingWebsiteDialogs(page);
}

/**
 * 顶栏仍显示「注册/登录」时强制 OAuth 重登（storageState 过期场景）。
 * @returns 是否执行了重登
 */
export async function reloginWebsiteIfNeeded(page: Page, role: AccountRole = 'user'): Promise<boolean> {
    const loginBtn = page.getByRole('button', { name: LOGIN_BUTTON });
    const headerAvatar = page.locator('header .zw-vip-avatar, header [class*="ZwVipAvatar"], header .zw-header-avatar, header [class*="ZwHeaderAvatar"]').first();

    const needsRelogin = await expect
        .poll(
            async () => {
                if (await headerAvatar.isVisible().catch(() => false)) return false;
                return await loginBtn.isVisible().catch(() => false);
            },
            { timeout: 10_000, intervals: [300, 500, 1000] },
        )
        .toBe(true)
        .then(() => true)
        .catch(() => false);

    if (!needsRelogin) {
        return false;
    }

    const baseURL = websiteBaseURL();
    await page.goto('.', { waitUntil: 'domcontentloaded' });
    await loginAs(page, baseURL, role);
    await assertWebsiteLoggedIn(page);
    await dismissBlockingWebsiteDialogs(page);
    return true;
}

/** 断言当前页顶栏已是登录态（无「注册/登录」）。须在业务页操作前调用。 */
export async function assertWebsiteLoggedIn(page: Page): Promise<void> {
    const loginBtn = page.getByRole('button', { name: LOGIN_BUTTON });
    const headerAvatar = page.locator('header .zw-vip-avatar, header [class*="ZwVipAvatar"], header .zw-header-avatar, header [class*="ZwHeaderAvatar"]').first();

    await expect
        .poll(
            async () => {
                if (await headerAvatar.isVisible().catch(() => false)) return true;
                return !(await loginBtn.isVisible().catch(() => false));
            },
            { timeout: 30_000, intervals: [300, 500, 1000] },
        )
        .toBe(true);

    await expect(loginBtn).toBeHidden();
}
