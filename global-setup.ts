import fs from 'fs/promises';
import path from 'path';
import { chromium, type FullConfig } from '@playwright/test';
import { setupTcAuthStates } from './lib/TcAuth';

async function globalSetup(config: FullConfig): Promise<void> {
    await fs.rm('./allure-results', { recursive: true, force: true });

    const env = process.env.ENV || process.env.npm_config_ENV || '';
    if (env.startsWith('tc')) {
        const baseURL = config.projects.find(p => p.name === 'TC-Platform')?.use?.baseURL as string | undefined;
        if (!baseURL) {
            throw new Error('TC-Platform project baseURL is not configured.');
        }
        await setupTcAuthStates(baseURL);
    }
}

export default globalSetup;
