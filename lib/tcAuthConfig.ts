import fs from 'fs';
import { getAuthStatePath, type AuthStateKey } from './TcAuth';
import { hasAccount, type AccountRole } from './loadAccounts';

export interface TcAuthConfig {
    role: AccountRole;
    ready: boolean;
    storageState?: string;
    skipReason: string;
}

function buildConfig(role: AccountRole, stateKey: AuthStateKey, credentialsRole: AccountRole = role): TcAuthConfig {
    const storageState = getAuthStatePath(stateKey);
    const credentialsReady = hasAccount(credentialsRole);
    const stateReady = fs.existsSync(storageState);
    const ready = credentialsReady && stateReady;

    let skipReason = '';
    if (!credentialsReady) {
        skipReason =
            `Missing credentials for role "${credentialsRole}". Copy accounts.example.json to accounts.local.json or set TC_* env vars.`;
    } else if (!stateReady) {
        skipReason =
            `Auth state not found for "${stateKey}". Re-run tests so global-setup can generate ${storageState}.`;
    }

    return {
        role,
        ready,
        storageState: ready ? storageState : undefined,
        skipReason,
    };
}

export function tcAuthConfig(role: AccountRole): TcAuthConfig {
    return buildConfig(role, role);
}

/**
 * Website 团队服务等：使用 admin 账号在 C 端登录生成的 admin-website.json，
 * 避免误用 etcert-admin 的 admin.json。
 */
export function tcWebsiteAdminAuthConfig(): TcAuthConfig {
    return buildConfig('admin', 'adminWebsite', 'admin');
}
