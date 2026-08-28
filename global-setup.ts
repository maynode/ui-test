import fs from 'fs/promises';
import { type FullConfig } from '@playwright/test';
import { setupTcAuthStates } from './lib/TcAuth';
import { adminBaseURL } from './lib/tcAdminConfig';

async function globalSetup(config: FullConfig): Promise<void> {
    await fs.rm('./allure-results', { recursive: true, force: true });

    const env = process.env.ENV || process.env.npm_config_ENV || '';
    if (env.startsWith('tc')) {
        if (process.env.SKIP_TC_AUTH_SETUP === '1') {
            console.log('[tc-auth] SKIP_TC_AUTH_SETUP=1, reusing existing .auth/* storageState');
            return;
        }
        const websiteBaseURL = config.projects.find(p => p.name === 'TC-Platform')?.use?.baseURL as string | undefined;
        if (!websiteBaseURL) {
            throw new Error('TC-Platform project baseURL is not configured.');
        }
        const adminBase = adminBaseURL(env);
        await setupTcAuthStates(websiteBaseURL, adminBase);
    }
}

export default globalSetup;
