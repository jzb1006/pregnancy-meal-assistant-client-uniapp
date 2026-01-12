import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        token: uni.getStorageSync('token') || '',
        openId: uni.getStorageSync('openId') || '',
        userInfo: null as any,
        avatarUrl: uni.getStorageSync('userAvatar') || '', // Persist avatar
        nickName: uni.getStorageSync('userNickname') || '', // Persist nickname
        isLogin: false
    }),

    getters: {
        // 检查是否已登录
        hasToken: (state) => !!state.token,
        // 获取用户昵称 (Priority: Store > UserInfo > Default)
        nickname: (state) => state.nickName || state.userInfo?.nickname || '准妈妈',
        // 获取头像
        avatar: (state) => state.avatarUrl || state.userInfo?.avatar || '/static/logo.png'
    },

    actions: {
        // ... existing actions ...
        setToken(token: string) {
            this.token = token;
            this.isLogin = true;
            uni.setStorageSync('token', token);
        },

        getToken() {
            return this.token;
        },

        setLoginInfo(info: { token: string; openId: string; userInfo?: any }) {
            this.token = info.token;
            this.openId = info.openId;
            this.userInfo = info.userInfo || null;
            this.isLogin = true;
            uni.setStorageSync('token', info.token);
            uni.setStorageSync('openId', info.openId);
        },

        // ... existing actions ...

        // 新增：单独更新头像
        setAvatar(url: string) {
            this.avatarUrl = url;
            uni.setStorageSync('userAvatar', url);
        },

        // 新增：单独更新昵称
        setNickname(name: string) {
            this.nickName = name;
            uni.setStorageSync('userNickname', name);
        },

        // ... existing actions ...

        // 清除所有认证信息
        clearAuth() {
            this.token = '';
            this.openId = '';
            this.userInfo = null;
            this.avatarUrl = '';
            this.nickName = '';
            this.isLogin = false;
            uni.removeStorageSync('token');
            uni.removeStorageSync('openId');
            uni.removeStorageSync('userAvatar');
            uni.removeStorageSync('userNickname');
        },

        logout() {
            this.clearAuth();
        },

        // ... existing actions ...
    }
});
