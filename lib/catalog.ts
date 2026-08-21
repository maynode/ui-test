import fs from 'fs';
import path from 'path';

export type CatalogAuth = {
    account: string;
    productName: string;
    start: string;
    end: string;
    createdAt: string;
};

export type Catalog = {
    version: 1;
    runId: string;
    env: string;
    auth: CatalogAuth[];
    courses: unknown[];
    exams: unknown[];
    certs: unknown[];
    certificates: unknown[];
};

export const CATALOG_PATH = path.resolve(process.cwd(), 'tests/testData/generated/catalog.json');

export function emptyCatalog(runId: string, env: string): Catalog {
    return { version: 1, runId, env, auth: [], courses: [], exams: [], certs: [], certificates: [] };
}

export function loadCatalog(): Catalog | null {
    if (!fs.existsSync(CATALOG_PATH)) return null;
    return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as Catalog;
}

export function saveCatalog(catalog: Catalog): void {
    fs.mkdirSync(path.dirname(CATALOG_PATH), { recursive: true });
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
}

export function appendAuth(entry: CatalogAuth, runId: string, env: string): Catalog {
    const current = loadCatalog() ?? emptyCatalog(runId, env);
    current.auth.push(entry);
    saveCatalog(current);
    return current;
}
