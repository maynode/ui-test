import type { Page } from '@playwright/test';
import { gotoWebsitePage } from './websiteNavigate';

/** 管理中心（原团队服务）路由表，对应前端 constants/manageCenterSideMenu.ts 与 manageCenterNav.ts */
export const MANAGE_CENTER_ROUTES = {
    home: '/manageCenter/',
    seat: '/manageCenter/seat/',
    seatManage: '/manageCenter/seat/manage',
    member: '/manageCenter/member/',
    report: '/manageCenter/report/',
} as const;

export type ManageCenterRouteKey = keyof typeof MANAGE_CENTER_ROUTES;

/** 管理中心页面一律用 admin 账号的 C 端登录态（.auth/admin-website.json） */
export async function gotoManageCenterPage(
    page: Page,
    routeKey: ManageCenterRouteKey,
    query?: Record<string, string>,
): Promise<void> {
    const search = query ? `?${new URLSearchParams(query).toString()}` : '';
    await gotoWebsitePage(page, `${MANAGE_CENTER_ROUTES[routeKey]}${search}`, 'admin');
}
