<template>
  <view class="login-container">
    <view class="title">欢迎使用</view>
    <view class="sub-title">孕期饮食助手</view>
    
    <view class="input-box">
        <u-input 
            v-model="inputOpenId" 
            placeholder="请输入 OpenID (如 user_123456)" 
            border="surround"
            clearable
        ></u-input>
    </view>
    
    <u-button 
       type="primary" 
       text="登录 / 注册" 
       shape="circle" 
       color="linear-gradient(90deg, #fda4af, #f43f5e)"
       size="large"
       :loading="loading"
       @click="handleLogin"
       customStyle="margin-top: 20px; width: 100%"
    ></u-button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';

const userStore = useUserStore();
const inputOpenId = ref('');
const loading = ref(false);

const handleLogin = async () => {
    if (!inputOpenId.value) {
        uni.showToast({ title: '请输入 OpenID', icon: 'none' });
        return;
    }
    
    loading.value = true;
    try {
        // Verify user existence
        const res: any = await request({
            url: '/v1/user/info',
            data: { openId: inputOpenId.value }
        });
        
        if (res.code === 200 && res.data) {
            // Login Success
            userStore.setOpenId(inputOpenId.value);
            userStore.setUserInfo(res.data);
            
            uni.showToast({ title: '登录成功', icon: 'success' });
            setTimeout(() => {
                uni.switchTab({ url: '/pages/index/index' });
            }, 1000);
        } else {
            // Login Failed / User Not Found
            uni.showToast({ title: res.msg || '用户不存在，请检查 ID', icon: 'none' });
        }
    } catch (e: any) {
        console.error(e);
        // Handle request failure
        const msg = e.msg || '登录请求失败';
        uni.showToast({ title: msg, icon: 'none' });
    } finally {
        loading.value = false;
    }
}
</script>

<style lang="scss" scoped>
.login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 40px;
    background: white;

    .title {
        font-size: 28px;
        font-weight: bold;
        color: #333;
        margin-bottom: 10px;
    }
    .sub-title {
        font-size: 16px;
        color: #666;
        margin-bottom: 40px;
    }
    
    .input-box {
        width: 100%;
        margin-bottom: 10px;
    }
}
</style>
