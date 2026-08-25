import { Locator, Page, expect } from '@playwright/test';

type Scope = Page | Locator;

function formItem(scope: Scope, label: string) {
    return scope.locator('.el-form-item').filter({ hasText: label });
}

/** 打开可见下拉并点选第一项可用 option，返回文案 */
export async function pickFirstSelectOption(scope: Scope, page: Page, label: string): Promise<string> {
    const select = formItem(scope, label).locator('.el-select').first();
    await select.click();
    const opt = page
        .locator('.el-select-dropdown:visible .el-select-dropdown__item:not(.is-disabled)')
        .first();
    await opt.waitFor({ state: 'visible', timeout: 15_000 });
    const name = (await opt.innerText()).trim();
    await opt.click();
    return name;
}

export async function fillFormInput(scope: Scope, label: string, value: string): Promise<void> {
    const input = formItem(scope, label).locator('input:not([type="hidden"])').first();
    await input.fill(value);
}

export async function setInputNumber(scope: Scope, label: string, value: number): Promise<void> {
    const input = formItem(scope, label).locator('.el-input-number input, input').first();
    await input.fill(String(value));
    await input.blur();
}

export async function clickRadioByText(scope: Scope, groupLabel: string, optionText: string): Promise<void> {
    await formItem(scope, groupLabel).getByText(optionText, { exact: false }).first().click();
}

/** 表体第一行指定列（按表头文案）单元格文本 */
export async function readFirstRowCell(page: Page, columnHeader: string): Promise<string> {
    const table = page.locator('.el-table').first();
    await expect(table.locator('.el-table__body tr').first()).toBeVisible({ timeout: 30_000 });
    const headers = table.locator('.el-table__header th');
    const count = await headers.count();
    let col = -1;
    const want = columnHeader.replace(/\s+/g, '');
    for (let i = 0; i < count; i++) {
        const text = (await headers.nth(i).innerText()).replace(/\s+/g, '');
        if (text.includes(want)) {
            col = i;
            break;
        }
    }
    if (col < 0) {
        throw new Error(`Column not found: ${columnHeader}`);
    }
    const cell = table.locator('.el-table__body tr').first().locator('td').nth(col);
    return (await cell.innerText()).trim();
}

export async function readRowCellByName(
    page: Page,
    nameColumn: string,
    nameValue: string,
    idColumn: string,
): Promise<{ id: string; name: string }> {
    const table = page.locator('.el-table').first();
    await expect(table.locator('.el-table__body tr').first()).toBeVisible({ timeout: 30_000 });
    const headers = table.locator('.el-table__header th');
    const count = await headers.count();
    let nameIdx = -1;
    let idIdx = -1;
    const nameWant = nameColumn.replace(/\s+/g, '');
    const idWant = idColumn.replace(/\s+/g, '');
    for (let i = 0; i < count; i++) {
        const text = (await headers.nth(i).innerText()).replace(/\s+/g, '');
        if (text.includes(nameWant)) nameIdx = i;
        if (text.includes(idWant)) idIdx = i;
    }
    if (nameIdx < 0 || idIdx < 0) {
        throw new Error(`Columns not found: ${nameColumn} / ${idColumn}`);
    }
    const rows = table.locator('.el-table__body tr');
    const rowCount = await rows.count();
    for (let r = 0; r < rowCount; r++) {
        const name = (await rows.nth(r).locator('td').nth(nameIdx).innerText()).trim();
        if (name.includes(nameValue)) {
            const id = (await rows.nth(r).locator('td').nth(idIdx).innerText()).trim();
            return { id, name };
        }
    }
    throw new Error(`Row not found for name containing: ${nameValue}`);
}

export function seedRunId(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

export function seedEnv(): string {
    return process.env.ENV || 'tcQa';
}
