<template>
  <view class="login-container">
    <!-- Header -->
    <view class="header-section" :class="{ 'shrink': isRegister }">
      <view class="title">欢迎使用</view>
      <view class="sub-title">孕期饮食助手</view>
    </view>

    <!-- Main Card Area -->
    <view class="card-area">
      
      <!-- Login Form -->
      <transition name="fade-slide">
        <view v-if="!isRegister" class="form-container login-form">
          <view class="input-group">
            <u-text text="账号登录" size="18" bold color="#333" margin="0 0 20px 0"></u-text>
            <u-input 
              v-model="inputOpenId" 
              placeholder="请输入您的 OpenID" 
              border="surround"
              shape="circle"
              prefixIcon="account"
              prefixIconStyle="font-size: 22px; color: #909399"
              clearable
            ></u-input>
          </view>
          
          <u-button 
            type="primary" 
            text="立即登录" 
            shape="circle" 
            color="linear-gradient(90deg, #fda4af, #f43f5e)"
            size="large"
            :loading="loading"
            @click="handleLogin"
            customStyle="margin-top: 30px; width: 100%; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);"
          ></u-button>

          <view class="toggle-link" @click="toggleMode">
            <text>没有账号？</text> <text class="link">去注册</text>
          </view>
        </view>
      </transition>

      <!-- Registration Wizard -->
      <transition name="fade-slide">
        <view v-if="isRegister" class="form-container register-form">
          <view class="wizard-header">
            <u-steps :current="currentStep" activeColor="#f43f5e" inactiveColor="#fce7f3">
              <u-steps-item title="账号"></u-steps-item>
              <u-steps-item title="昵称"></u-steps-item>
              <u-steps-item title="预产期"></u-steps-item>
              <u-steps-item title="档案"></u-steps-item>
            </u-steps>
          </view>

          <!-- Step 1: OpenID -->
          <view v-if="currentStep === 0" class="step-content">
            <view class="step-title">创建您的账号</view>
            <view class="input-card">
                 <u-input 
                  v-model="regForm.openId" 
                  placeholder="设置 OpenID (如 user_new)" 
                  border="none"
                  clearable
                  prefixIcon="account-fill"
                  prefixIconStyle="font-size: 22px; color: #f43f5e; margin-right: 10px;"
                  fontSize="16px"
                  customStyle="padding: 12px 0;"
                ></u-input>
            </view>
            <view class="tip-text">这将作为您的唯一登录凭证</view>
          </view>

          <!-- Step 2: Personal Info -->
          <view v-if="currentStep === 1" class="step-content">
            <view class="step-title">关于您</view>
            
            <view class="section-label" style="margin: 0 0 10px 10px; color: #666; font-size: 14px;">昵称</view>
            <view class="input-card" style="margin-bottom: 25px;">
                <u-input 
                  v-model="regForm.nickname" 
                  placeholder="请输入昵称" 
                  border="none"
                  clearable
                  prefixIcon="edit-pen-fill"
                  prefixIconStyle="font-size: 22px; color: #f43f5e; margin-right: 10px;"
                  fontSize="16px"
                  customStyle="padding: 12px 0;"
                ></u-input>
            </view>

            <view class="section-label" style="margin: 0 0 10px 10px; color: #666; font-size: 14px;">出生日期</view>
            <view class="input-card" @click="showBirthDatePicker = true">
                <view class="picker-trigger" style="display: flex; align-items: center; padding: 12px 0;">
                    <u-icon name="calendar-fill" color="#f43f5e" size="22" customStyle="margin-right: 10px;"></u-icon>
                    <text class="value-text" :style="{ color: regForm.birthDate ? '#333' : '#c0c4cc', fontSize: '16px', flex: 1 }">
                        {{ regForm.birthDate ? regForm.birthDate : '请选择出生日期' }}
                    </text>
                    <u-icon name="arrow-right" color="#999" size="16"></u-icon>
                </view>
            </view>
            
            <u-datetime-picker
              :show="showBirthDatePicker"
              v-model="birthDatePickerValue"
              mode="date"
              :minDate="Number(new Date('1970-01-01'))"
              :maxDate="Number(new Date())"
              @confirm="onBirthDateConfirm"
              @cancel="showBirthDatePicker = false"
            ></u-datetime-picker>
          </view>

          <!-- Step 3: LMP -->
          <view v-if="currentStep === 2" class="step-content">
            <view class="step-title">您的末次月经是？</view>
            <view class="date-display" @click="showDatePicker = true">
              {{ regForm.lmp ? regForm.lmp : '点击选择日期' }}
            </view>
            <u-datetime-picker
              :show="showDatePicker"
              v-model="datePickerValue"
              mode="date"
              :maxDate="Number(new Date())"
              @confirm="onDateConfirm"
              @cancel="showDatePicker = false"
            ></u-datetime-picker>
          </view>

          <!-- Step 4: Body Metrics -->
          <view v-if="currentStep === 3" class="step-content">
            <view class="step-title">身体档案</view>
            
            <view class="metric-input-group">
              <view class="label">身高</view>
              <u-input 
                v-model="regForm.height" 
                type="number" 
                placeholder="请输入身高"
                border="surround"
                shape="circle"
                fontSize="18px"
              >
                <template #suffix>
                    <text class="unit-suffix">cm</text>
                </template>
              </u-input>
            </view>

            <view class="metric-input-group">
              <view class="label">孕前体重</view>
              <u-input 
                v-model="regForm.weight" 
                type="number" 
                placeholder="请输入体重"
                border="surround"
                shape="circle"
                fontSize="18px"
              >
                <template #suffix>
                    <text class="unit-suffix">kg</text>
                </template>
              </u-input>
            </view>
          </view>

          <!-- Navigation Buttons -->
          <view class="wizard-actions">
            <u-button 
              v-if="currentStep > 0"
              plain 
              shape="circle" 
              type="info" 
              text="上一步"
              @click="prevStep"
              customStyle="flex: 1; margin-right: 10px;"
            ></u-button>
            <u-button 
              type="primary" 
              shape="circle" 
              color="linear-gradient(90deg, #fda4af, #f43f5e)"
              :text="currentStep === 3 ? '完成注册' : '下一步'"
              @click="nextStep"
              :loading="loading"
              customStyle="flex: 1; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);"
            ></u-button>
          </view>

          <view class="toggle-link" @click="toggleMode" style="margin-top: 15px;">
            <text>已有账号？</text> <text class="link">去登录</text>
          </view>
        </view>
      </transition>

    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';

const userStore = useUserStore();

// --- Login State ---
const inputOpenId = ref('');
const loading = ref(false);

// --- Register State ---
const isRegister = ref(false);
const currentStep = ref(0);
const showDatePicker = ref(false);
const datePickerValue = ref(Number(new Date()));

const showBirthDatePicker = ref(false);
const birthDatePickerValue = ref(Number(new Date('1995-01-01')));

// New Picker States
const showHeight = ref(false);
const showWeight = ref(false);

// Generate picker columns matches profile.vue
const heightColumns = reactive([
    Array.from({length: 61}, (_, i) => i + 140)
]);
const weightColumns = reactive([
    Array.from({length: 131}, (_, i) => (35 + i * 0.5).toFixed(1))
]);

const regForm = reactive({
  openId: '',
  nickname: '',
  birthDate: '',
  lmp: '',
  height: 165,
  weight: 55
});

// --- Actions ---

const toggleMode = () => {
  isRegister.value = !isRegister.value;
  // Reset states
  currentStep.value = 0;
  regForm.openId = ''; 
};

const handleLogin = async () => {
    if (!inputOpenId.value) {
        uni.showToast({ title: '请输入 OpenID', icon: 'none' });
        return;
    }
    
    loading.value = true;
    try {
        const res: any = await request({
            url: '/v1/user/info',
            data: { openId: inputOpenId.value }
        });
        
        if (res.code === 200 && res.data) {
            userStore.setOpenId(inputOpenId.value);
            userStore.setUserInfo(res.data);
            uni.showToast({ title: '登录成功', icon: 'success' });
            setTimeout(() => {
                uni.reLaunch({ url: '/pages/index/index' });
            }, 1000);
        } else {
            uni.showToast({ title: res.msg || '用户不存在，请注册', icon: 'none' });
        }
    } catch (e: any) {
        console.error(e);
        uni.showToast({ title: e.msg || '登录请求失败', icon: 'none' });
    } finally {
        loading.value = false;
    }
};

// --- Wizard Logic ---

const onDateConfirm = (e: any) => {
  const date = new Date(e.value);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  regForm.lmp = `${year}-${month}-${day}`;
  showDatePicker.value = false;
};

const onBirthDateConfirm = (e: any) => {
  const date = new Date(e.value);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  regForm.birthDate = `${year}-${month}-${day}`;
  showBirthDatePicker.value = false;
};

const confirmHeight = (e: any) => {
    regForm.height = Number(e.value[0]);
    showHeight.value = false;
};

const confirmWeight = (e: any) => {
    regForm.weight = Number(e.value[0]);
    showWeight.value = false;
};

const validateStep = () => {
  switch (currentStep.value) {
    case 0:
      if (!regForm.openId) {
        uni.showToast({ title: '请输入 OpenID', icon: 'none' });
        return false;
      }
      return true;
    case 1:
      if (!regForm.nickname) {
        uni.showToast({ title: '请输入昵称', icon: 'none' });
        return false;
      }
      if (!regForm.birthDate) {
        uni.showToast({ title: '请选择出生日期', icon: 'none' });
        return false;
      }
      return true;
    case 2:
      if (!regForm.lmp) {
        uni.showToast({ title: '请选择末次月经', icon: 'none' });
        return false;
      }
      return true;
    case 3:
      return true;
    default:
      return true;
  }
};

const nextStep = () => {
  if (!validateStep()) return;

  if (currentStep.value < 3) {
    currentStep.value++;
  } else {
    handleRegister();
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const handleRegister = async () => {
  loading.value = true;
  try {
    // Call Profile API for Registration
    const payload = {
      openId: regForm.openId,
      // nickName removed as backend doesn't support it
      lmp: regForm.lmp,
      height: regForm.height,
      weight: regForm.weight,
      birthDate: regForm.birthDate,
      dietaryRestrictions: '',
      allergies: '',
      preferences: '',
      cuisinePreference: 'NO_PREFERENCE'
    };

    console.log('Registering (Saving Profile) with payload:', payload);

    const res: any = await request({
        url: '/v1/user/profile',
        method: 'POST',
        data: payload
    });

    if (res.code === 200) {
        // Success
        userStore.setOpenId(regForm.openId);
        userStore.setUserInfo(payload); 
        
        uni.showToast({ title: '注册成功', icon: 'success' });
        setTimeout(() => {
            uni.reLaunch({ url: '/pages/index/index' });
        }, 1000);
    } else {
        uni.showToast({ title: res.msg || res.message || '注册失败', icon: 'none' });
    }

  } catch (e: any) {
    console.error(e);
    const msg = e.msg || e.message || '注册请求失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #fff1f2 0%, #fff 100%);
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
}

.header-section {
    margin-top: 60px;
    margin-bottom: 40px;
    text-align: center;
    transition: all 0.5s ease;
    
    &.shrink {
        margin-top: 20px;
        margin-bottom: 20px;
        transform: scale(0.8);
    }

    .title {
        font-size: 20px;
        font-weight: 700;
        color: #333;
        margin-bottom: 10px;
        letter-spacing: 1px;
    }
    .sub-title {
        font-size: 13px;
        color: #fff;
        letter-spacing: 2px;
    }
}

.card-area {
    width: 100%;
    max-width: 400px;
    position: relative;
}

.form-container {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 30px 25px;
    box-shadow: 0 10px 40px rgba(244, 63, 94, 0.15);
}

.input-group {
    margin-bottom: 20px;
}

.toggle-link {
    margin-top: 20px;
    text-align: center;
    font-size: 13px;
    color: #666;
    
    .link {
        color: #f43f5e;
        font-weight: bold;
        margin-left: 5px;
    }
}

// --- Wizard Styles ---
.wizard-header {
    margin-bottom: 25px;
}

.step-content {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.step-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 20px;
    text-align: center;
}

.input-card {
    background: #f8fafc;
    border-radius: 100px;
    padding: 2px 20px;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    
    &:active, &:focus-within {
        background: #fff;
        box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.1);
    }
}

.tip-text {
    font-size: 11px;
    color: #999;
    margin-top: 10px;
    text-align: center;
}

.date-display {
    background: #fdf2f8;
    color: #f43f5e;
    font-size: 16px;
    font-weight: bold;
    padding: 15px;
    border-radius: 16px;
    text-align: center;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(251, 207, 232, 0.3);
}

.metric-input-group {
    margin-bottom: 25px;
    
    .label {
        font-size: 13px;
        color: #666;
        margin-bottom: 10px;
        font-weight: 500;
    }
    
    .picker-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: white;
        border-radius: 100px;
        padding: 12px 15px;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        
        &:active {
            background: #fdf2f8;
            box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.1);
        }

        .value-text {
            font-size: 16px;
            color: #333;
            font-weight: 500;
            flex: 1;
        }
        
        .unit-suffix {
             font-size: 13px;
             color: #999;
             margin-right: 10px;
        }
    }
}

.wizard-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
}

// --- Animations ---
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
  display: none; // Essential to remove from flow
}
</style>

