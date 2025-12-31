import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        openId: 'user_123456', // Mock ID for development
        userInfo: null as any
    }),
    actions: {
        setOpenId(id: string) {
            this.openId = id;
        },
        setUserInfo(info: any) {
            this.userInfo = info;
        }
    }
});
