/**
 * 微信登录服务
 * 提供微信小程序静默登录功能
 */

import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';

/**
 * 登录响应接口
 */
export interface LoginResponse {
    openId: string;
    token: string;
    isNewUser: boolean;
    userInfo?: any;
}

/**
 * 微信登录结果
 */
export interface WxLoginResult {
    success: boolean;
    isNewUser: boolean;
    message?: string;
    userInfo?: any;
}

/**
 * 执行微信静默登录
 * 
 * 流程：
 * 1. 调用 wx.login() 获取临时登录凭证 code
 * 2. 将 code 发送到后端接口 /v1/auth/wx/login
 * 3. 后端返回 openId、token、用户状态
 * 4. 保存 token 和 openId 到本地
 * 
 * @returns {Promise<WxLoginResult>} 登录结果
 */
export async function wxLogin(): Promise<WxLoginResult> {
    try {
        console.log('[Auth] ========== 开始微信静默登录 ==========');

        // Step 1: 获取微信登录凭证
        console.log('[Auth] Step 1: 调用 uni.login() 获取微信 code...');
        const loginRes = await uni.login({
            provider: 'weixin'
        });

        console.log('[Auth] uni.login() 返回结果:', JSON.stringify(loginRes));

        // uni.login 返回格式：[err, res] 或直接返回 res
        // 兼容两种格式
        let code: string;
        if (Array.isArray(loginRes)) {
            // Promise 化返回数组格式 [err, res]
            code = loginRes[1]?.code;
        } else {
            // 直接返回对象格式 {errMsg, code}
            code = (loginRes as any).code;
        }

        if (!code) {
            console.error('[Auth] ❌ 获取微信登录凭证失败', loginRes);
            return {
                success: false,
                isNewUser: false,
                message: '获取微信登录凭证失败，请检查微信配置'
            };
        }

        console.log('[Auth] ✅ 获取到微信 code:', code.substring(0, 10) + '...');

        // Step 2: 调用后端登录接口
        console.log('[Auth] Step 2: 调用后端接口 /v1/auth/wx/login');
        console.log('[Auth] 请求参数:', { code: code.substring(0, 10) + '...' });

        const response = await request({
            url: '/v1/auth/wx/login',
            method: 'POST',
            data: { code }
        }) as any;

        console.log('[Auth] 后端接口响应:', JSON.stringify(response));

        // Step 3: 检查响应
        if (response.code !== 200 || !response.data) {
            console.error('[Auth] ❌ 后端登录接口返回错误');
            console.error('[Auth] response.code:', response.code);
            console.error('[Auth] response.data:', response.data);
            console.error('[Auth] response.message:', response.message);
            return {
                success: false,
                isNewUser: false,
                message: response.message || response.msg || '登录失败，请重试'
            };
        }

        const loginData: LoginResponse = response.data;
        console.log('[Auth] ✅ 登录成功！');
        console.log('[Auth] openId:', loginData.openId);
        console.log('[Auth] token:', loginData.token ? loginData.token.substring(0, 20) + '...' : 'null');
        console.log('[Auth] isNewUser:', loginData.isNewUser);

        // Step 4: 保存登录信息到 Store
        console.log('[Auth] Step 3: 保存登录信息到 Store...');
        const userStore = useUserStore();
        userStore.setLoginInfo({
            token: loginData.token,
            openId: loginData.openId,
            userInfo: loginData.userInfo
        });
        console.log('[Auth] ✅ 登录信息已保存');

        // Step 5: 返回登录结果
        console.log('[Auth] ========== 微信登录流程完成 ==========');
        return {
            success: true,
            isNewUser: loginData.isNewUser,
            userInfo: loginData.userInfo
        };

    } catch (error: any) {
        console.error('[Auth] ❌❌❌ 微信登录异常 ❌❌❌');
        console.error('[Auth] 错误类型:', error.constructor.name);
        console.error('[Auth] 错误信息:', error.message);
        console.error('[Auth] 错误详情:', JSON.stringify(error));
        console.error('[Auth] 错误堆栈:', error.stack);
        return {
            success: false,
            isNewUser: false,
            message: error.message || error.errMsg || '登录失败，请检查网络后重试'
        };
    }
}

/**
 * 检查登录状态
 * 
 * @returns {boolean} 是否已登录
 */
export function checkLoginStatus(): boolean {
    const userStore = useUserStore();
    return userStore.hasToken;
}

/**
 * 处理登录过期
 * 清除本地认证信息，触发重新登录
 * 
 * @returns {Promise<WxLoginResult>} 重新登录结果
 */
export async function handleLoginExpired(): Promise<WxLoginResult> {
    console.log('[Auth] Token 已过期，执行重新登录...');

    const userStore = useUserStore();
    userStore.clearAuth();

    // 执行重新登录
    return await wxLogin();
}

/**
 * 退出登录
 */
export function logout() {
    console.log('[Auth] 用户退出登录');
    const userStore = useUserStore();
    userStore.logout();
}

