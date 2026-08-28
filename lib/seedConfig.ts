import { loadCatalog } from './catalog';

export function latestCatalogAuth() {
    const auth = loadCatalog()?.auth;
    if (!auth?.length) return undefined;
    return auth[auth.length - 1];
}

export function latestCatalogCert() {
    const certs = loadCatalog()?.certs;
    if (!certs?.length) return undefined;
    return certs[0];
}

/** 供 SEED-CERT-RES 在产品列表搜索的关键词（非授权弹窗里的展示名） */
export function resolveSeedProductSearchQueries(): string[] {
    const queries = new Set<string>();
    const fromEnv = process.env.TC_SEED_PRODUCT_QUERY?.trim();
    if (fromEnv) queries.add(fromEnv);

    const fromCert = latestCatalogCert()?.productName?.trim();
    if (fromCert) {
        queries.add(fromCert);
        queries.add(fromCert.replace(/^产品-/, ''));
    }

    const fromAuth = latestCatalogAuth()?.productName?.trim();
    if (fromAuth) {
        queries.add(fromAuth);
        queries.add(fromAuth.replace(/^产品-/, ''));
    }

    queries.add('测试考试');
    queries.add('工程师');
    return [...queries].filter(Boolean);
}

export function resolveSeedCertQuery(): string {
    return process.env.TC_SEED_CERT_QUERY?.trim() || '测试考试';
}

/** 课程订阅类资源不可用于正式考试主流程 */
export function isExamCertResourceName(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed || trimmed.includes('课程订阅')) {
        return false;
    }
    const query = resolveSeedCertQuery();
    if (trimmed.includes(query)) {
        return true;
    }
    return /认证|考试|工程师/.test(trimmed);
}

export function isExamProductRowText(text: string): boolean {
    if (!text || text.includes('课程订阅')) return false;
    return /工程师|认证|考试|测试/.test(text);
}
