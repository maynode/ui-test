import fs from 'fs';
import path from 'path';
import { testConfig } from '../testConfig';

export type AccountRole = 'user' | 'admin' | 'partner';

export interface AccountCredentials {
    username: string;
    password: string;
}

type AccountsFile = Partial<Record<AccountRole, AccountCredentials>>;

const ENV_KEYS: Record<AccountRole, { username: string; password: string }> = {
    user: { username: 'TC_USER_USERNAME', password: 'TC_USER_PASSWORD' },
    admin: { username: 'TC_ADMIN_USERNAME', password: 'TC_ADMIN_PASSWORD' },
    partner: { username: 'TC_PARTNER_USERNAME', password: 'TC_PARTNER_PASSWORD' },
};

function readLocalAccountsFile(): AccountsFile {
    const filePath = path.resolve(process.cwd(), 'accounts.local.json');
    if (!fs.existsSync(filePath)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as AccountsFile;
    } catch (error) {
        throw new Error(`Failed to parse accounts.local.json: ${String(error)}`);
    }
}

function isPlaceholder(value: string): boolean {
    return (
        !value ||
        value.includes('example.com') ||
        value.startsWith('U2FsdGVkX1') ||
        value.startsWith('your-')
    );
}

export function getAccount(role: AccountRole): AccountCredentials {
    const localAccounts = readLocalAccountsFile();
    const local = localAccounts[role];
    const envKeys = ENV_KEYS[role];
    const fallback = testConfig.accounts[role];

    const username =
        local?.username ||
        process.env[envKeys.username] ||
        fallback.username;

    const password =
        local?.password ||
        process.env[envKeys.password] ||
        fallback.password;

    if (isPlaceholder(username) || isPlaceholder(password)) {
        throw new Error(
            `Missing credentials for role "${role}". Provide accounts.local.json or env vars ${envKeys.username}/${envKeys.password}.`,
        );
    }

    return { username, password };
}

export function hasAccount(role: AccountRole): boolean {
    try {
        getAccount(role);
        return true;
    } catch {
        return false;
    }
}
