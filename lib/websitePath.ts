/**
 * Website 路由（相对 Playwright baseURL，须含 /etcert/ 前缀）。
 * 使用 `cert/list` 而非 `/cert/list`，避免 URL 解析到 host 根路径。
 */
export function websitePath(route: string): string {
    return route.replace(/^\//, '');
}
