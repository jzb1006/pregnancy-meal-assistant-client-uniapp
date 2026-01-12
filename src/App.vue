<script setup lang="ts">
import { ref } from 'vue';
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useUserStore } from '@/stores/user';
import { wxLogin } from '@/services/auth';
import { request } from '@/utils/request';

// 防止重复登录的标志位
const isLoggingIn = ref(false);
const loginRetryCount = ref(0);
const MAX_RETRY = 3;

/**
 * 开发模式配置
 * 设置为 true 时跳过微信登录，使用测试账号
 * ⚠️ 生产环境必须设置为 false
 */
const DEV_MODE = false;

/**
 * App 启动 - 执行微信静默登录
 */
onLaunch(async () => {
  console.log("=== App Launch ===");
  console.log("[App] DEV_MODE:", DEV_MODE);
  
  const userStore = useUserStore();
  
  // 检查是否已有 token
  if (userStore.hasToken) {
    console.log("[App] 检测到本地 token，检查用户资料");
    await checkUserProfile();
    return;
  }
  
  // 开发模式：跳过微信登录
  if (DEV_MODE) {
    console.log("[App] ⚠️ 开发模式：跳过微信登录");
    console.log("[App] 提示：请手动在后端创建测试用户或使用真实微信登录");
    console.log("[App] 如需测试真实登录流程，请将 DEV_MODE 设置为 false");
    return;
  }
  
  // 防止重复登录
  if (isLoggingIn.value) {
    console.warn("[App] 登录正在进行中，跳过重复请求");
    return;
  }
  
  // 检查重试次数
  if (loginRetryCount.value >= MAX_RETRY) {
    console.error("[App] 登录重试次数超限，停止登录");
    uni.showModal({
      title: '登录失败',
      content: '多次登录失败，请检查网络或稍后重试',
      showCancel: true,
      cancelText: '退出',
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          // 重置重试次数
          loginRetryCount.value = 0;
          isLoggingIn.value = false;
          // 手动重试（不使用 reLaunch）
          performLogin();
        } else {
          // 用户选择退出
          // 可以导航到一个错误页面或保持当前状态
        }
      }
    });
    return;
  }
  
  await performLogin();
});

/**
 * 检查用户资料是否完善
 */
async function checkUserProfile() {
  console.log("[App] 检查用户资料完整性...");
  
  try {
    // 先检查本地缓存
    const profileCache = uni.getStorageSync('USER_PROFILE_CACHE');
    if (profileCache && profileCache.lmp && profileCache.timestamp) {
      // 缓存有效期：24小时
      const cacheAge = Date.now() - profileCache.timestamp;
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log("[App] 使用缓存数据，资料完整");
        uni.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1000
        });
        return;
      }
    }
    
    const res: any = await request({
      url: '/v1/user/info',
      method: 'GET'
    });
    
    console.log("[App] 用户资料检查结果:", JSON.stringify(res));
    
    // 检查是否有资料或 lmp 字段为空
    // lmp 可能是字符串 "2025-01-01"、数组 [2025,1,1]、或 null
    const hasValidLmp = res?.data?.lmp && (
      typeof res.data.lmp === 'string' && res.data.lmp.length > 0 ||
      Array.isArray(res.data.lmp) && res.data.lmp.length === 3
    );
    
    if (!res || res.code !== 200 || !res.data || !hasValidLmp) {
      // 用户资料不完整，记录日志，让首页处理跳转逻辑
      console.log("[App] 用户资料不完整，首页将处理跳转");
      console.log("[App] 详细信息 - res:", res);
      console.log("[App] 详细信息 - res.data:", res?.data);
      console.log("[App] 详细信息 - res.data.lmp:", res?.data?.lmp);
      console.log("[App] 详细信息 - lmp类型:", typeof res?.data?.lmp);
      console.log("[App] 详细信息 - lmp是数组:", Array.isArray(res?.data?.lmp));
      
      // 清除可能存在的旧缓存
      uni.removeStorageSync('USER_PROFILE_CACHE');
      uni.removeStorageSync('ONBOARDING_COMPLETED');
    } else {
      // 资料完整，更新缓存
      console.log("[App] 用户资料完整，进入首页");
      uni.setStorageSync('USER_PROFILE_CACHE', {
        lmp: res.data.lmp,
        birthDate: res.data.birthDate,
        height: res.data.height,
        weight: res.data.weight,
        cuisinePreference: res.data.cuisinePreference,
        preferences: res.data.preferences,
        dietaryRestrictions: res.data.dietaryRestrictions,
        timestamp: Date.now()
      });
      
      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1000
      });
    }
  } catch (error: any) {
    console.error("[App] 检查用户资料失败:", error);
    
    // 区分错误类型进行处理
    if (error.statusCode === 401 || error.data?.code === 401) {
      // 未授权，token 失效，清除并重新登录
      console.log("[App] Token 失效，清除认证信息");
      userStore.clearAuth();
      uni.removeStorageSync('USER_PROFILE_CACHE');
      uni.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 检查是否有有效缓存
    const profileCache = uni.getStorageSync('USER_PROFILE_CACHE');
    if (profileCache && profileCache.lmp) {
      console.log("[App] 网络错误，使用缓存数据");
      uni.showToast({
        title: '网络异常，使用离线数据',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 网络错误或其他错误
    uni.showModal({
      title: '网络异常',
      content: '无法获取用户信息，请检查网络连接',
      confirmText: '重试',
      cancelText: '稍后',
      success: (modalRes) => {
        if (modalRes.confirm) {
          // 用户选择重试
          checkUserProfile();
        } else {
          // 用户选择稍后，清除缓存，让首页处理跳转逻辑
          console.log("[App] 用户选择稍后，首页将处理跳转");
          uni.removeStorageSync('USER_PROFILE_CACHE');
          uni.removeStorageSync('ONBOARDING_COMPLETED');
        }
      }
    });
  }
}

/**
 * 执行登录逻辑（独立函数，避免重复代码）
 */
async function performLogin() {
  isLoggingIn.value = true;
  loginRetryCount.value++;
  
  const userStore = useUserStore();
  
  // 显示加载提示
  uni.showLoading({
    title: '登录中...',
    mask: true
  });
  
  console.log(`[App] 开始执行微信静默登录... (第 ${loginRetryCount.value} 次尝试)`);
  
  try {
    // 执行微信静默登录
    const result = await wxLogin();
    
    uni.hideLoading();
    
    if (!result.success) {
      // 登录失败
      console.error("[App] 微信登录失败:", result.message);
      isLoggingIn.value = false;
      
      // 显示错误，但不自动重试
      uni.showModal({
        title: '登录失败',
        content: result.message || '登录失败，请检查网络后重试',
        showCancel: true,
        cancelText: '取消',
        confirmText: '重试',
        success: (res) => {
          if (res.confirm) {
            // 用户选择重试
            performLogin();
          } else {
            // 用户取消，重置状态
            loginRetryCount.value = 0;
          }
        }
      });
      return;
    }
    
    console.log("[App] 微信登录成功，isNewUser:", result.isNewUser);
    
    // 重置状态
    isLoggingIn.value = false;
    loginRetryCount.value = 0;
    
    // 检查用户是否已完善资料
    await checkUserProfile();
    
  } catch (error: any) {
    uni.hideLoading();
    console.error("[App] 登录异常:", error);
    isLoggingIn.value = false;
    
    uni.showModal({
      title: '登录异常',
      content: `登录过程中出现异常：${error.message || '未知错误'}`,
      showCancel: true,
      cancelText: '取消',
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          performLogin();
        } else {
          loginRetryCount.value = 0;
        }
      }
    });
  }
}

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
	/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
	@import "uview-plus/index.scss";
</style>
