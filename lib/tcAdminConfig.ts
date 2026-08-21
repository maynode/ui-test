import { testConfig } from '../testConfig';

const DEFAULT_ADMIN_SUFFIX = '/etcert-admin/';

export function adminBaseURL(env = process.env.ENV || 'tcQa'): string {
    const fromEnv = process.env.TC_ADMIN_BASE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/?$/, '/');

    const website = (testConfig as Record<string, string>)[env] || testConfig.tcQa;
    return `${website.replace(/\/$/, '')}${DEFAULT_ADMIN_SUFFIX}`;
}

export function adminPageUrl(hashPath: string, env?: string): string {
    const path = hashPath.startsWith('#')
        ? hashPath
        : `#${hashPath.startsWith('/') ? hashPath : `/${hashPath}`}`;
    return `${adminBaseURL(env)}${path}`;
}
