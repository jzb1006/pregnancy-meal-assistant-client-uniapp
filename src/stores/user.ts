import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        openId: uni.getStorageSync('openId') || '', // Load from storage
        userInfo: null as any
    }),
    actions: {
        setOpenId(id: string) {
            this.openId = id;
            uni.setStorageSync('openId', id); // Save to storage
        },
        logout() {
            this.openId = '';
            this.userInfo = null;
            uni.removeStorageSync('openId');
        },
        setUserInfo(info: any) {
            this.userInfo = info;
        }
    }
});
