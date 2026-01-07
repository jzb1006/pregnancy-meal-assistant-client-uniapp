<template>
  <PageContainer>
    <!-- Custom Navbar -->
    <u-navbar 
        title="" 
        bgColor="transparent" 
        :placeholder="true"
        leftIconColor="#334155"
        :autoBack="true"
    ></u-navbar>

    <view class="onboarding-container">
      <!-- 1. Liquid Progress Header -->
      <view class="progress-section">
        <view class="progress-info">
          <text class="step-counter">STEP {{ currentStep }} / 3</text>
          <text class="step-name">{{ currentStepName }}</text>
        </view>
        <view class="progress-track">
          <view class="progress-liquid" :style="{ width: progressPercent + '%' }">
            <view class="liquid-glow"></view>
          </view>
        </view>
      </view>

      <!-- 2. Main Content Stack -->
      <view class="content-viewport">
        <!-- Step 1: Pregnancy Stage -->
        <view class="step-card" :class="getCardClass(1)">
          <view class="hero-section">
            <view class="hero-emoji float-animation">🤰</view>
            <text class="hero-title">开启孕期之旅</text>
            <text class="hero-subtitle">记录美好时刻，定制专属营养</text>
          </view>

          <view class="form-body">
             <!-- LMP Input -->
            <view class="glass-input-group" @click="showLmp = true; hideKeyboard()">
               <view class="input-header">
                   <u-icon name="calendar" color="#F43F5E" size="20"></u-icon>
                   <text class="input-label">末次月经</text>
               </view>
               <view class="input-row">
                 <text class="input-value" :class="{ 'placeholder': !model.lmp }">
                   {{ model.lmp || '点击选择日期' }}
                 </text>
                 <u-icon name="arrow-right" color="#CBD5E1" size="16"></u-icon>
               </view>
            </view>

            <!-- Birth Date Input -->
            <view class="glass-input-group" @click="showBirth = true; hideKeyboard()">
               <view class="input-header">
                   <u-icon name="gift" color="#3B82F6" size="20"></u-icon>
                   <text class="input-label">您的出生日期</text>
               </view>
               <view class="input-row">
                 <text class="input-value" :class="{ 'placeholder': !model.birthDate }">
                   {{ model.birthDate || '点击选择日期' }}
                 </text>
                 <u-icon name="arrow-right" color="#CBD5E1" size="16"></u-icon>
               </view>
            </view>

            <!-- Tip -->
            <view class="tip-box fade-in-up">
                <u-icon name="info-circle" color="#94A3B8" size="14"></u-icon>
                <text class="tip-text">收集这些信息是为了更好地匹配您的饮食习惯，为您推荐更精准的营养菜谱。</text>
            </view>
          </view>
        </view>

        <!-- Step 2: Body Stats -->
        <view class="step-card" :class="getCardClass(2)">
          <view class="hero-section">
            <view class="hero-emoji float-animation delayed">🧘‍♀️</view>
            <text class="hero-title">身体数据</text>
            <text class="hero-subtitle">了解您的身体状况，科学计重</text>
          </view>

          <view class="form-body">
            <view class="data-cards-row">
              <!-- Height -->
              <view class="glass-data-card" @click="showHeight = true; hideKeyboard()">
                <text class="data-label">身高 (cm)</text>
                <text class="data-huge-num">{{ model.height }}</text>
                <view class="edit-icon"><u-icon name="edit-pen" size="14" color="#94a3b8"></u-icon></view>
              </view>
              
              <!-- Weight -->
              <view class="glass-data-card" @click="showWeight = true; hideKeyboard()">
                <text class="data-label">体重 (kg)</text>
                <text class="data-huge-num">{{ model.weight }}</text>
                <view class="edit-icon"><u-icon name="edit-pen" size="14" color="#94a3b8"></u-icon></view>
              </view>
            </view>

            <!-- BMI Display -->
            <view class="bmi-glass-panel" :class="bmiStatusColorClass">
              <view class="bmi-left">
                  <text class="bmi-title">BMI 指数</text>
                  <text class="bmi-number">{{ bmiValue }}</text>
              </view>
              <view class="bmi-right">
                  <text class="bmi-status-badge">{{ bmiStatus }}</text>
              </view>
            </view>

            <!-- Tip -->
            <view class="tip-box fade-in-up">
                <u-icon name="info-circle" color="#94A3B8" size="14"></u-icon>
                <text class="tip-text">填写精准的身高体重数据，有助于我们为您计算准确的卡路里和营养需求。</text>
            </view>
          </view>
        </view>

        <!-- Step 3: Preferences -->
        <view class="step-card" :class="getCardClass(3)">
          <view class="hero-section">
            <view class="hero-emoji float-animation">🥗</view>
            <text class="hero-title">饮食偏好</text>
            <text class="hero-subtitle">投其所好，让每一餐都美味</text>
          </view>

          <scroll-view scroll-y class="form-body scrollable">
            <text class="section-header">菜系选择</text>
            <view class="cuisine-grid">
              <view 
                class="glass-chip"
                v-for="(item, index) in cuisineOptions" 
                :key="index"
                :class="{ 'active': model.cuisine === item.value }"
                @click="selectCuisine(item.value)"
              >
                <text class="chip-emoji">{{ item.emoji }}</text>
                <text class="chip-label">{{ item.label }}</text>
                <view class="chip-check" v-if="model.cuisine === item.value">
                    <u-icon name="checkmark" color="#fff" size="10"></u-icon>
                </view>
              </view>
            </view>

            <view class="preference-section">
               <view class="glass-textarea">
                 <text class="textarea-label">口味偏好</text>
                 <u-textarea 
                   v-model="model.preferences" 
                   placeholder="例如：少油、少盐、喜酸..." 
                   :maxlength="50"
                   border="none"
                   height="50"
                   confirmType="done"
                   :customStyle="{ background: 'transparent', padding: '0', fontSize: '15px' }"
                 ></u-textarea>
               </view>
               <view class="glass-textarea">
                 <text class="textarea-label">忌口/过敏</text>
                 <u-textarea 
                   v-model="model.taboo" 
                   placeholder="例如：不吃海鲜、花生过敏..." 
                   :maxlength="50"
                   border="none"
                   height="50"
                   confirmType="done"
                   :customStyle="{ background: 'transparent', padding: '0', fontSize: '15px' }"
                 ></u-textarea>
               </view>
            </view>

            <!-- Tip -->
            <view class="tip-box fade-in-up" style="margin-top: 12px;">
                <u-icon name="info-circle" color="#94A3B8" size="14"></u-icon>
                <text class="tip-text">告诉我们您的口味和禁忌，AI 助手将为您规避风险，推荐最合心意的餐单。</text>
            </view>
          </scroll-view>
        </view>
      </view>

      <!-- 3. Bottom Action Bar (Full Width) -->
      <view class="footer-actions">
        <!-- Back Btn -->
        <view 
          class="action-btn secondary" 
          v-if="currentStep > 1" 
          @click="prevStep"
        >
          <u-icon name="arrow-left" color="#64748b" size="20"></u-icon>
        </view>

        <!-- Next/Finish Btn -->
        <view 
          class="action-btn primary pulse-animation"
          @click="handleMainAction"
        >
          <text class="btn-text">{{ btnText }}</text>
          <u-icon v-if="!loading" name="arrow-right" color="#fff" size="18" style="margin-left: 6px;"></u-icon>
          <u-loading-icon v-else color="#fff" mode="circle"></u-loading-icon>
        </view>
      </view>
    </view>
    
    <!-- Helpers: Pickers -->
    <u-datetime-picker :show="showLmp" v-model="lmpTimestamp" mode="date" :maxDate="Number(new Date())" @confirm="confirmLmp" @cancel="showLmp = false" confirmColor="#F43F5E"></u-datetime-picker>
    <u-datetime-picker :show="showBirth" v-model="birthTimestamp" mode="date" :minDate="new Date(1960, 0, 1).getTime()" :maxDate="Number(new Date())" @confirm="confirmBirth" @cancel="showBirth = false" confirmColor="#F43F5E"></u-datetime-picker>
    <u-picker :show="showHeight" :columns="heightColumns" title="选择身高 (cm)" @confirm="confirmHeight" @cancel="showHeight = false" confirmColor="#F43F5E"></u-picker>
    <u-picker :show="showWeight" :columns="weightColumns" title="选择体重 (kg)" @confirm="confirmWeight" @cancel="showWeight = false" confirmColor="#F43F5E"></u-picker>

    <!-- Success Modal -->
    <view class="success-overlay" :class="{ 'show': showSuccess }">
        <view class="success-card popper">
            <view class="success-emoji">🎉</view>
            <text class="success-msg">设置完成！</text>
            <text class="success-tip">即将为您推荐营养餐单</text>
        </view>
    </view>

  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { request } from '@/utils/request';
import PageContainer from '@/components/common/PageContainer.vue';
import dayjs from 'dayjs';

const loading = ref(false);
const currentStep = ref(1);
const showSuccess = ref(false);

const showLmp = ref(false);
const showBirth = ref(false);
const showHeight = ref(false);
const showWeight = ref(false);
const lmpTimestamp = ref(Number(new Date()));
const birthTimestamp = ref(Number(new Date()));

const heightColumns = reactive([Array.from({length: 61}, (_, i) => i + 140)]);
const weightColumns = reactive([Array.from({length: 131}, (_, i) => (35 + i * 0.5).toFixed(1))]);
const cuisineOptions = [
    { label: '中餐', emoji: '🥢', value: 'CHINESE' },
    { label: '西餐', emoji: '🍴', value: 'WESTERN' },
    { label: '日韩', emoji: '🍱', value: 'JAPANESE_KOREAN' },
    { label: '东南亚', emoji: '🌶️', value: 'SOUTHEAST_ASIAN' },
    { label: '素食', emoji: '🥬', value: 'VEGETARIAN' },
    { label: '不限', emoji: '🌍', value: 'NO_PREFERENCE' },
];

const model = reactive({
    lmp: '',
    birthDate: '',
    height: 160,
    weight: 55,
    cuisine: 'NO_PREFERENCE',
    preferences: '',
    taboo: ''
});

// Computed
const currentStepName = computed(() => {
    switch(currentStep.value) {
        case 1: return '孕期信息';
        case 2: return '身体数据';
        case 3: return '饮食偏好';
        default: return '';
    }
});
const progressPercent = computed(() => ((currentStep.value) / 3) * 100);
const btnText = computed(() => currentStep.value === 3 ? '完成并开始' : '下一步');

const bmiValue = computed(() => {
    if (!model.height || !model.weight) return '--';
    const h = model.height / 100;
    return (model.weight / (h * h)).toFixed(1);
});

const bmiStatus = computed(() => {
    const bmi = parseFloat(bmiValue.value);
    if (isNaN(bmi)) return '--';
    if (bmi < 18.5) return '偏瘦';
    if (bmi < 24) return '标准';
    if (bmi < 28) return '偏重';
    return '肥胖';
});

const bmiStatusColorClass = computed(() => {
    const bmi = parseFloat(bmiValue.value);
    if (isNaN(bmi)) return 'neutral';
    if (bmi >= 18.5 && bmi < 24) return 'success';
    if (bmi < 18.5) return 'warning';
    return 'danger';
});

const getCardClass = (step: number) => {
    if (currentStep.value === step) return 'active';
    if (currentStep.value > step) return 'prev';
    return 'next';
};

// Actions
const hideKeyboard = () => uni.hideKeyboard();

const confirmLmp = (e: any) => { showLmp.value = false; model.lmp = dayjs(e.value).format('YYYY-MM-DD'); }
const confirmBirth = (e: any) => { showBirth.value = false; model.birthDate = dayjs(e.value).format('YYYY-MM-DD'); }
const confirmHeight = (e: any) => { model.height = Number(e.value[0]); showHeight.value = false; }
const confirmWeight = (e: any) => { model.weight = Number(e.value[0]); showWeight.value = false; }

const selectCuisine = (val: string) => { model.cuisine = val; uni.vibrateShort({ type: 'light' }); }

const handleMainAction = () => {
    if (currentStep.value < 3) nextStep();
    else submit();
}

const nextStep = () => {
    // Step 1 Validation
    if (currentStep.value === 1) {
        if (!model.lmp || !model.birthDate) {
            uni.showToast({ title: '请完善日期信息', icon: 'none' }); return;
        }
        
        // Age Check (18+)
        const age = dayjs().diff(dayjs(model.birthDate), 'year');
        if (age < 18) {
            uni.showToast({ title: '未满18周岁，无法提供服务', icon: 'none' }); 
            return;
        }
    }
    
    // Step 2 Validation
    if (currentStep.value === 2 && (!model.height || !model.weight)) {
        uni.showToast({ title: '请完善身体数据', icon: 'none' }); return;
    }
    
    currentStep.value++;
    uni.vibrateShort({ type: 'medium' });
}

const prevStep = () => {
    currentStep.value--;
    uni.vibrateShort({ type: 'light' });
}

const submit = async () => {
    if (!model.cuisine) { uni.showToast({ title: '请选择菜系', icon: 'none' }); return; }
    loading.value = true;
    try {
        const payload = {
            lmp: model.lmp,
            birthDate: model.birthDate,
            height: model.height,
            weight: model.weight,
            dietaryRestrictions: model.taboo,
            preferences: model.preferences,
            cuisinePreference: model.cuisine
        };
        
        console.log('[Onboarding] 提交资料:', payload);
        const res: any = await request({ url: '/v1/user/profile', method: 'POST', data: payload });
        
        console.log('[Onboarding] 保存结果:', res);
        
        if (res.code === 200) {
            // 保存成功，设置标记防止首页重复检查
            uni.setStorageSync('ONBOARDING_COMPLETED', true);
            uni.setStorageSync('USER_PROFILE_CACHE', {
                lmp: model.lmp,
                birthDate: model.birthDate,
                height: model.height,
                weight: model.weight,
                cuisinePreference: model.cuisine,
                preferences: model.preferences,
                dietaryRestrictions: model.taboo,
                timestamp: Date.now()
            });
            
            showSuccess.value = true;
            uni.vibrateShort({ type: 'heavy' });
            
            // 延迟跳转，确保数据已保存
            setTimeout(() => {
                uni.reLaunch({ url: '/pages/index/index' });
            }, 1500);
        } else {
            uni.showToast({ title: res.message || '保存失败', icon: 'none' });
        }
    } catch (e: any) {
        console.error('[Onboarding] 保存失败:', e);
        uni.showToast({ title: e.message || '网络错误', icon: 'none' });
    } finally {
        loading.value = false;
    }
}
</script>

<style lang="scss" scoped>
.onboarding-container {
    padding: 0 20px;
    min-height: 100vh;
    background: linear-gradient(180deg, #FDF2F4 0%, #FFFFFF 100%);
    display: flex;
    flex-direction: column;
}

/* Header */
.progress-section {
    padding-top: 10px;
    margin-bottom: 30px;
}
.progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    .step-counter { font-size: 14px; font-weight: 800; color: #FDA4AF; letter-spacing: 1px; }
    .step-name { font-size: 14px; font-weight: 600; color: #475569; }
}
.progress-track {
    height: 6px; background: #F1F5F9; border-radius: 3px; overflow: hidden;
    .progress-liquid {
        height: 100%; background: #F43F5E; border-radius: 3px;
        transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Smoother linear-like easing */
        position: relative;
        .liquid-glow { position: absolute; right: 0; top: 0; bottom: 0; width: 10px; background: rgba(255,255,255,0.5); filter: blur(2px); }
    }
}

/* Viewport & Transitions */
.content-viewport {
    flex: 1; position: relative; width: 100%;
}
.step-card {
    position: absolute; top: 0; left: 0; width: 100%; 
    opacity: 0;
    /* Softened Animation: Reduced translation distance and softer easing */
    transform: translateX(20px); 
    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
    
    &.active { opacity: 1; transform: translateX(0); pointer-events: auto; }
    &.prev { opacity: 0; transform: translateX(-20px); }
}

/* Tip Box */
.tip-box {
    margin-top: 16px;
    padding: 12px 16px;
    background: #F8FAFC;
    border-radius: 12px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    
    .tip-text {
        flex: 1;
        font-size: 12px;
        color: #94A3B8;
        line-height: 1.5;
    }
}
.fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
    animation-delay: 0.2s;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Hero */
.hero-section {
    text-align: center; margin-bottom: 30px;
    .hero-emoji { font-size: 64px; margin-bottom: 12px; display: inline-block; }
    .hero-title { display: block; font-size: 26px; font-weight: 800; color: #1E293B; margin-bottom: 4px; }
    .hero-subtitle { font-size: 14px; color: #94A3B8; }
}
.float-animation { animation: float 4s ease-in-out infinite; } /* Slower float */
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} } /* Reduced float movement */

/* Glass Inputs (Full Width) */
.glass-input-group {
    background: #FFFFFF; border: 1px solid #F1F5F9;
    border-radius: 20px; padding: 16px 20px; margin-bottom: 16px;
    width: 100%; 
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    transition: all 0.2s;
    &:active { transform: scale(0.99); background: #FFF1F2; border-color: #FDA4AF; }
    
    .input-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .input-label { font-size: 13px; font-weight: 600; color: #64748B; }
    .input-row { display: flex; justify-content: space-between; align-items: center; }
    .input-value { font-size: 17px; font-weight: 600; color: #1E293B; &.placeholder { color: #CBD5E1; } }
}

/* Data Cards */
.data-cards-row { display: flex; gap: 12px; margin-bottom: 16px; }
.glass-data-card {
    flex: 1; background: #fff; border-radius: 20px; padding: 16px;
    border: 1px solid #F1F5F9; text-align: center; position: relative;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    .data-label { display: block; font-size: 12px; color: #94A3B8; margin-bottom: 4px; }
    .data-huge-num { font-size: 32px; font-weight: 800; color: #1E293B; }
    .edit-icon { position: absolute; top: 10px; right: 10px; }
}

/* BMI Panel */
.bmi-glass-panel {
    background: #F8FAFC; border-radius: 16px; padding: 16px 20px;
    display: flex; justify-content: space-between; align-items: center;
    border: 1px solid transparent;
    &.success { background: #F0FDF4; border-color: #86EFAC; .bmi-number { color: #15803D; } .bmi-status-badge { color: #15803D; background: #DCFCE7; } }
    &.warning { background: #FEF3C7; border-color: #FDE047; .bmi-number { color: #B45309; } .bmi-status-badge { color: #B45309; background: #FEF9C3; } }
    &.danger { background: #FEF2F2; border-color: #FECACA; .bmi-number { color: #B91C1C; } .bmi-status-badge { color: #B91C1C; background: #FEE2E2; } }
    
    .bmi-title { font-size: 13px; color: #64748B; margin-right: 8px; }
    .bmi-number { font-size: 24px; font-weight: 800; color: #334155; }
    .bmi-status-badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; background: #E2E8F0; color: #64748B; }
}

/* Cuisine Grid */
.cuisine-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
.glass-chip {
    background: #fff; border: 1px solid #E2E8F0; border-radius: 16px;
    padding: 14px; display: flex; align-items: center; gap: 10px;
    position: relative; 
    /* Softer Selection Animation */
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    
    &.active { 
        background: #FFF1F2; 
        border-color: #F43F5E; 
        box-shadow: 0 4px 12px rgba(244, 63, 94, 0.1); 
        /* Removed scale, added subtle glow only */
    }
    
    .chip-emoji { font-size: 20px; }
    .chip-label { font-size: 14px; color: #334155; font-weight: 500; }
    .chip-check { position: absolute; top: 8px; right: 8px; width: 16px; height: 16px; background: #F43F5E; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
}

/* Preference */
.preference-section { display: flex; flex-direction: column; gap: 12px; }
.glass-textarea {
    background: #fff; border-radius: 16px; padding: 12px 16px; border: 1px solid #F1F5F9;
    .textarea-label { font-size: 12px; color: #94A3B8; margin-bottom: 4px; display: block; }
}
.scrollable { height: 420px; }

/* Footer */
.footer-actions {
    position: fixed; bottom: 40px; left: 20px; right: 20px;
    display: flex; gap: 12px; align-items: stretch;
}
.action-btn {
    border-radius: 28px; display: flex; align-items: center; justify-content: center;
    transition: opacity 0.2s; /* Fade instead of scale */
    &:active { opacity: 0.8; }
    &.secondary { width: 56px; height: 56px; background: #fff; border: 1px solid #E2E8F0; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
    &.primary {
        flex: 1; height: 56px; background: linear-gradient(135deg, #F43F5E 0%, #E11D48 100%);
        box-shadow: 0 8px 20px rgba(225, 29, 72, 0.3);
        .btn-text { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
    }
}
.pulse-animation { animation: pulse 3s infinite; } /* Slower pulse */
@keyframes pulse { 0% { box-shadow: 0 8px 20px rgba(225, 29, 72, 0.3); } 50% { box-shadow: 0 10px 25px rgba(225, 29, 72, 0.4); } 100% { box-shadow: 0 8px 20px rgba(225, 29, 72, 0.3); } }

/* Success Overlay */
.success-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.9); z-index: 999;
    display: flex; align-items: center; justify-content: center;
    visibility: hidden; opacity: 0; transition: all 0.3s;
    &.show { visibility: visible; opacity: 1; }
}
.success-card {
    background: #fff; padding: 30px 50px; border-radius: 30px;
    text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    transform: scale(0.9); opacity: 0; transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.show .success-card { transform: scale(1); opacity: 1; }
.success-emoji { font-size: 60px; margin-bottom: 16px; display: block; }
.success-msg { font-size: 20px; font-weight: 800; color: #1E293B; display: block; margin-bottom: 6px; }
.success-tip { font-size: 14px; color: #64748B; }
</style>
