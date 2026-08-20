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
    tcQa: `https://dev.edu-test.zwsoft.cn`,       // 测试环境
    tcDev: `http://localhost:5173`,               // 本地开发环境
    tcGray: `https://gray-cert.example.com`,      // 预发布环境（占位）

    // 多角色账号配置
    accounts: {
        // 普通用户（用于课程学习、认证考试等常规流程）
        user: {
            username: `user@example.com`,          // 替换为实际测试账号
            password: `U2FsdGVkX1...`,           // AES 加密后的密码
        },
        // 管理员（用于团队管理、权限分配等）
        admin: {
            username: `admin@example.com`,         // 替换为实际管理员账号
            password: `U2FsdGVkX1...`,           // AES 加密后的密码
        },
        // 伙伴用户（用于伙伴认证模块）
        partner: {
            username: `partner@example.com`,       // 替换为实际伙伴账号
            password: `U2FsdGVkX1...`,           // AES 加密后的密码
        },
    },
}