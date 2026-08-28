import { Locator, Page, expect } from '@playwright/test';
import { reloginAdminSession, waitForAdminLoggedIn } from '@lib/TcAuth';
import { adminBaseURL, adminPageUrl } from '@lib/tcAdminConfig';

function normalizeHashPath(hashPath: string): string {
    return hashPath.startsWith('#')
        ? hashPath.slice(1)
        : hashPath.startsWith('/')
          ? hashPath
          : `/${hashPath}`;
}

function adminMenubar(page: Page) {
    return page.getByRole('menubar').first();
}

/** OAuth 页则重新登录（storageState 过期时） */
export async function reloginAdminIfNeeded(page: Page): Promise<void> {
    await Promise.race([
        adminMenubar(page).waitFor({ state: 'visible', timeout: 20_000 }),
        page.getByRole('button', { name: '授权登录' }).waitFor({ state: 'visible', timeout: 20_000 }),
    ]).catch(() => undefined);

    await reloginAdminSession(page, adminBaseURL());
    await waitForAdminLoggedIn(page);
}

async function waitForAdminShell(page: Page): Promise<void> {
    await reloginAdminIfNeeded(page);
    await adminMenubar(page).waitFor({ state: 'visible', timeout: 60_000 });
}

/** 依次点侧栏：先展开父级，再点子项（如 课程中心 → 课程管理） */
export async function clickAdminMenuPath(page: Page, labels: string[]): Promise<void> {
    if (labels.length === 0) {
        throw new Error('clickAdminMenuPath: labels must not be empty');
    }

    const menubar = adminMenubar(page);
    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const item = menubar.getByRole('menuitem', { name: label, exact: true });

        if (i < labels.length - 1) {
            await item.click();
            await page.waitForTimeout(350);
            continue;
        }

        await expect(item).toBeVisible({ timeout: 15_000 });
        await item.click();
    }
}

/**
 * 进入 Admin 页并等待 ready。
 * 1) 优先 hash 直链（与历史 PO 一致） 2) 404/未就绪则 home + 侧栏 menuPath
 */
export async function gotoAdminHashPage(
    page: Page,
    hashPath: string | undefined,
    ready: Locator,
    options: { menuPath: string[] },
): Promise<void> {
    if (hashPath) {
        const path = normalizeHashPath(hashPath);
        await page.goto(adminPageUrl(path), { waitUntil: 'domcontentloaded' });
        await reloginAdminIfNeeded(page);
        try {
            await expect(ready).toBeVisible({ timeout: 30_000 });
            return;
        } catch {
            if (page.url().includes(path.replace(/^\//, '')) && !(await page.getByText('找不到此页面').isVisible().catch(() => false))) {
                await expect(ready).toBeVisible({ timeout: 30_000 });
                return;
            }
        }
    }

    await page.goto(adminPageUrl('/home'), { waitUntil: 'domcontentloaded' });
    await waitForAdminShell(page);
    await clickAdminMenuPath(page, options.menuPath);
    await expect(ready).toBeVisible({ timeout: 30_000 });
}

/** tcTest 等环境的后台 hash 路由（侧栏：课程中心→课程管理） */
export const ADMIN_ROUTES = {
    courseList: '/course-center/courseMng/list',
    examFreeTestList: '/exam/free-test/list',
    userAuth: '/platformAuth/user',
    productList: '/platformAuth/product',
    productRes: '/platformAuth/productRes',
} as const;

export function adminCourseRoute(): string {
    return process.env.TC_ADMIN_COURSE_ROUTE?.trim() || ADMIN_ROUTES.courseList;
}

export function adminExamRoute(): string {
    return process.env.TC_ADMIN_EXAM_ROUTE?.trim() || ADMIN_ROUTES.examFreeTestList;
}
