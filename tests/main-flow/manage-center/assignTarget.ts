import { getAccount } from '@lib/loadAccounts';

/**
 * 被分配学员固定复用 user 账号：分配后可直接用 .auth/user.json 验证学员端收权。
 * 返回用于在成员池表格里定位行的联系方式（手机号或邮箱）。
 */
export function resolveAssignTargetContact(): string {
    return getAccount('user').username;
}
