import fs from 'fs';
import { getAuthStatePath } from './TcAuth';
import { hasAccount, type AccountRole } from './loadAccounts';

export interface TcAuthConfig {
    role: AccountRole;
    ready: boolean;
    storageState?: string;
    skipReason: string;
}

export function tcAuthConfig(role: AccountRole): TcAuthConfig {
    const storageState = getAuthStatePath(role);
    const credentialsReady = hasAccount(role);
    const stateReady = fs.existsSync(storageState);
    const ready = credentialsReady && stateReady;

    let skipReason = '';
    if (!credentialsReady) {
        skipReason =
            `Missing credentials for role "${role}". Copy accounts.example.json to accounts.local.json or set TC_* env vars.`;
    } else if (!stateReady) {
        skipReason =
            `Auth state not found for role "${role}". Re-run tests so global-setup can generate ${storageState}.`;
    }

    return {
        role,
        ready,
        storageState: ready ? storageState : undefined,
        skipReason,
    };
}
