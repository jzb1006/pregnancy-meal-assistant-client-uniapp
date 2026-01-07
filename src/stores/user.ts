import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        token: uni.getStorageSync('token') || '',
        openId: uni.getStorageSync('openId') || '',
        userInfo: null as any,
        isLogin: false
    }),
    
    getters: {
        // 检查是否已登录
        hasToken: (state) => !!state.token,
        // 获取用户昵称
        nickname: (state) => state.userInfo?.nickname || '孕妈妈'
    },
    
    actions: {
        // 设置 token
        setToken(token: string) {
            this.token = token;
            this.isLogin = true;
            uni.setStorageSync('token', token);
        },
        
        // 获取 token
        getToken(): string {
            return this.token || uni.getStorageSync('token') || '';
        },
        
        // 检查 token 是否有效
        isTokenValid(): boolean {
            // 优先检查内存中的 token，如果没有则从 Storage 读取
            const token = this.token || uni.getStorageSync('token');
            const isValid = !!token && token.length > 0;
            console.log('[UserStore] isTokenValid:', isValid, 'token length:', token?.length || 0);
            return isValid;
        },
        
        // 设置 openId
        setOpenId(id: string) {
            this.openId = id;
            uni.setStorageSync('openId', id);
        },
        
        // 设置用户信息
        setUserInfo(info: any) {
            this.userInfo = info;
        },
        
        // 设置登录信息（一次性设置 token + openId + userInfo）
        setLoginInfo(data: { token: string; openId: string; userInfo?: any }) {
            this.setToken(data.token);
            this.setOpenId(data.openId);
            if (data.userInfo) {
                this.setUserInfo(data.userInfo);
            }
        },
        
        // 清除所有认证信息
        clearAuth() {
            this.token = '';
            this.openId = '';
            this.userInfo = null;
            this.isLogin = false;
            uni.removeStorageSync('token');
            uni.removeStorageSync('openId');
        },
        
        // 退出登录
        logout() {
            this.clearAuth();
            // 跳转到首页（会被 App.vue 拦截重新登录）
            uni.reLaunch({ url: '/pages/index/index' });
        }
    }
});
