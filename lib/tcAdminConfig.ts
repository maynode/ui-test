import { testConfig } from '../testConfig';

const DEFAULT_ADMIN_SUFFIX = '/etcert-admin/';

/** Website 与 Admin 同 host，Admin 在根路径 /etcert-admin/（不在 /etcert/ 下） */
function websiteOrigin(env: string): string {
    const website =
        (testConfig[env as keyof typeof testConfig] as string | undefined) || testConfig.tcQa;
    const { protocol, host } = new URL(website);
    return `${protocol}//${host}`;
}

export function adminBaseURL(env = process.env.ENV || 'tcQa'): string {
    const fromEnv = process.env.TC_ADMIN_BASE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/?$/, '/');

    return `${websiteOrigin(env)}${DEFAULT_ADMIN_SUFFIX}`;
}

export function adminPageUrl(hashPath: string, env?: string): string {
    const path = hashPath.startsWith('#')
        ? hashPath
        : `#${hashPath.startsWith('/') ? hashPath : `/${hashPath}`}`;
    return `${adminBaseURL(env)}${path}`;
}
