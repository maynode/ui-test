export const testConfig = {
    // === demoqa (original) ===
    qa: `https://demoqa.com`,
    dev: ``,
    qaApi: `https://reqres.in`,
    devApi: ``,
    username: `demouat@gmail.com`,
    password: `U2FsdGVkX18/eMdsOJpvI4hJZ/w7hNgwSRFaDvAcZx4=`,
    waitForElement: 120000,
    dbUsername: ``,
    dbPassword: ``,
    dbServerName: ``,
    dbPort: ``,
    dbName: ``,

    // === 培训认证平台 (tc-platform) ===
    // 环境地址：根据 ENV 值选择对应地址
    tcQa: `https://dev.edu-test.zwsoft.cn`,       // 开发测试站
    tcTest: `https://edu-test.zwsoft.cn`,         // 测试环境
    tcDev: `http://localhost:5173`,               // 本地开发环境
    tcGray: `https://gray-cert.example.com`,      // 预发布环境（占位）

    // 多角色账号：仅占位兜底。真实账号请写 accounts.local.json（见 tests/tc-platform/README.md）
    // loadAccounts 会忽略 example.com / 假 AES 前缀；勿把真密码提交进本文件
    accounts: {
        // 普通用户（用于课程学习、认证考试等常规流程）
        user: {
            username: `user@example.com`,
            password: `U2FsdGVkX1...`,
        },
        // 管理员（Admin 造数 + Website 团队服务；同一号）
        admin: {
            username: `admin@example.com`,
            password: `U2FsdGVkX1...`,
        },
        // 伙伴用户（用于伙伴认证模块）
        partner: {
            username: `partner@example.com`,
            password: `U2FsdGVkX1...`,
        },
    },
}