<template>
  <PageContainer :customStyle="{ background: 'linear-gradient(180deg, #FDF2F4 0%, #FFFFFF 100%)', paddingTop: '10px' }">

     <!-- 1. Status Card (Dashboard Core) -->
     <view class="fade-in-entry delay-1">
        <StatusCard 
            :status="status"
            :loading="loading"
            @complete="navigateToProfile"
        />
     </view>

     <!-- 2. Daily Encouragement (Emotional Connection) -->
    <view class="encouragement-section fade-in-entry delay-2">
        <!-- 1. Mood Selector (Show if no encouragement yet) -->
        <view class="mood-card glass-panel" v-if="!dailyEncouragement && !encouragementLoading">
            <view class="card-header">
                <text class="card-title">👋 准妈妈，今天心情怎么样？</text>
            </view>
            <view class="mood-grid">
                <view 
                    class="mood-item" 
                    v-for="mood in moodOptions" 
                    :key="mood.value"
                    @click="onSelectMood(mood.value)"
                >
                    <view class="mood-icon-wrapper">
                        <text class="mood-icon">{{ mood.icon }}</text>
                    </view>
                    <text class="mood-label">{{ mood.label }}</text>
                </view>
            </view>
        </view>

        <!-- 2. Loading State -->
         <view class="loading-card glass-panel" v-if="encouragementLoading">
            <text class="loading-icon">🤔</text>
            <text class="loading-text">正在想悄悄话...</text>
         </view>

        <!-- 3. Result Card (Show if encouragement exists) -->
        <view class="encouragement-card glass-panel" v-if="dailyEncouragement">
            <view class="card-decoration-circle"></view>
            <view class="card-header">
                <text class="card-title">👶 宝宝悄悄话</text>
                <view class="card-tag float-animation" v-if="dailyEncouragement.babySize">
                    <text class="tag-text">宝宝像{{ dailyEncouragement.babySize }}</text>
                </view>
            </view>
            <view class="card-content">
                <text class="auth-text">"{{ dailyEncouragement.encouragement }}"</text>
            </view>
        </view>
     </view>

     <!-- 3. Week Calendar (Timeline) -->
     <view class="fade-in-entry delay-3">
         <WeekCalendar 
            :activeDate="activeDate"
            :lmp="lmp"
            @dateSelect="setActiveDate"
         />
     </view>

     <!-- 4. Food Search (Tool) -->
     <view class="fade-in-entry delay-4">
        <FoodSearchEntry @open="showFoodSearch = true" />
     </view>

     <!-- 5. Daily Recipe Recommendation -->
     <view class="fade-in-entry delay-5">
        <DailyRecipeCard />
     </view>

     <!-- 6. Nutrition Tip -->
     <view class="fade-in-entry delay-6">
        <NutritionTip />
     </view>

     <!-- Spacer for TabBar -->
     <view style="height: 120px;"></view>
     
     <CustomTabBar :current="0" />

     <!-- GLOBAL MODALS -->
     <FoodSearchModal v-model:show="showFoodSearch" />

  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';
import PageContainer from '@/components/common/PageContainer.vue';

import WeekCalendar from '@/components/home/WeekCalendar.vue';
import StatusCard from '@/components/home/StatusCard.vue';
import CustomTabBar from '@/components/common/CustomTabBar.vue';
// New Imports
import FoodSearchEntry from '@/components/home/FoodSearchEntry.vue';
import FoodSearchModal from '@/components/home/FoodSearchModal.vue';
import NutritionTip from '@/components/home/NutritionTip.vue';
import DailyRecipeCard from '@/components/home/DailyRecipeCard.vue';

import dayjs from 'dayjs';

const userStore = useUserStore();
const activeDate = ref(dayjs().format('YYYY-MM-DD'));
const status = ref<any>(null);
const lmp = ref('');
const loading = ref(true);
const dailyEncouragement = ref<any>(null);
const encouragementLoading = ref(false);

const showFoodSearch = ref(false);

const moodOptions = [
    { label: '开心', value: 'HAPPY', icon: '😊' },
    { label: '疲惫', value: 'TIRED', icon: '😫' },
    { label: '焦虑', value: 'ANXIOUS', icon: '😟' },
    { label: '兴奋', value: 'EXCITED', icon: '🤩' },
    { label: '平静', value: 'CALM', icon: '😌' }
];

const fetchStatus = async () => {
    try {
        const res: any = await request({
            url: '/v1/user/status'
        });
        
        if (res && (res.code === 200 || res.status === 200)) {
            status.value = res.data;
        } else {
             if (res.message) uni.showToast({ title: res.message, icon: 'none' });
        }
    } catch (e: any) {
        console.error('Fetch status failed', e);
        const errorData = e?.data || {};
        const msg = errorData.message || errorData.msg; 
        if (msg) funcShowToast(msg);
    } finally {
        loading.value = false;
    }
}

const fetchUserInfo = async () => {
    try {
        const onboardingCompleted = uni.getStorageSync('ONBOARDING_COMPLETED');
        const profileCache = uni.getStorageSync('USER_PROFILE_CACHE');
        
        if (onboardingCompleted && profileCache) {
            console.log('[Index] 检测到刚完成引导页，使用缓存数据');
            if (profileCache.lmp) {
                lmp.value = dayjs(profileCache.lmp).format('YYYY-MM-DD');
            }
            uni.removeStorageSync('ONBOARDING_COMPLETED');
            return;
        }
        
        const res: any = await request({
            url: '/v1/user/info'
        });
        
        if (!res || res.code !== 200 || !res.data) {
            uni.reLaunch({ url: '/pages/onboarding/onboarding' });
            return;
        }
        
        const hasValidLmp = res.data.lmp && (
            typeof res.data.lmp === 'string' && res.data.lmp.length > 0 ||
            Array.isArray(res.data.lmp) && res.data.lmp.length === 3
        );
        
        if (!hasValidLmp) {
            uni.reLaunch({ url: '/pages/onboarding/onboarding' });
            return;
        }
        
        lmp.value = dayjs(res.data.lmp).format('YYYY-MM-DD');
        
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
        
    } catch (e) {
        console.error('[Index] Fetch info failed:', e);
    }
}

const fetchDailyEncouragement = async (mood?: string) => {
    if (mood) {
        encouragementLoading.value = true;
    }
    
    try {
        let url = `/v1/user/daily-encouragement`;
        if (mood) {
            url += `?mood=${mood}`;
        }

        const res: any = await request({
            url: url,
            method: 'POST'
        });
        
        if (res && (res.code === 200 || res.status === 200)) {
            if (res.data) {
                dailyEncouragement.value = res.data;
            }
        }
    } catch (e) {
        if (mood) {
             funcShowToast('获取鼓励失败，请稍后再试');
        }
    } finally {
        if (mood) {
            encouragementLoading.value = false;
        }
    }
}

const onSelectMood = (moodValue: string) => {
    uni.vibrateShort({ type: 'medium' });
    fetchDailyEncouragement(moodValue);
}

const funcShowToast = (title: string) => {
    uni.showToast({ title, icon: 'none' });
}

onShow(() => {
    fetchStatus();
    fetchUserInfo();
    fetchDailyEncouragement(); 
});

const setActiveDate = (date: string) => {
    activeDate.value = date;
}

const navigateToProfile = () => {
    uni.switchTab({ url: '/pages/profile/profile' });
}

</script>

<style lang="scss" scoped>

/* Global Animations */
.fade-in-entry {
    opacity: 0;
    animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }
.delay-5 { animation-delay: 0.5s; }
.delay-6 { animation-delay: 0.6s; }

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.float-animation { animation: float 4s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }


/* Glassmorphism Common */
.glass-panel {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 8px 24px rgba(255, 182, 193, 0.15);
    border-radius: 24px;
}

.mood-card {
    padding: 24px 20px;
    margin-bottom: 24px;
    
    .card-header {
        margin-bottom: 20px;
        text-align: center;
        .card-title {
            font-size: 17px;
            font-weight: 600;
            color: #334155;
            letter-spacing: 0.5px;
        }
    }
    
    .mood-grid {
        display: flex;
        justify-content: space-between;
        padding: 0 8px;
        
        .mood-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            
            .mood-icon-wrapper {
                width: 52px;
                height: 52px;
                border-radius: 50%;
                background: #F8FAFC;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            .mood-icon {
                font-size: 28px;
            }
            
            .mood-label {
                font-size: 12px;
                color: #64748B;
                transition: color 0.2s;
            }
            
            &:active {
                .mood-icon-wrapper {
                    transform: scale(1.15) rotate(5deg);
                    background: #FFF1F2;
                    box-shadow: 0 4px 12px rgba(244, 63, 94, 0.2);
                }
                .mood-label {
                    color: #F43F5E;
                    font-weight: 600;
                }
            }
        }
    }
}

.loading-card {
    padding: 30px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 160px;
    
    .loading-icon {
        font-size: 48px;
        animation: bounce 1s infinite;
    }
    
    .loading-text {
        font-size: 14px;
        color: #94A3B8;
        letter-spacing: 1px;
    }
}

@keyframes bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-10px) scale(0.95); }
}

.encouragement-card {
    padding: 24px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;

    .card-decoration-circle {
        position: absolute;
        top: -20px;
        right: -20px;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(254, 207, 239, 0.3) 0%, rgba(255,255,255,0) 70%);
        border-radius: 50%;
        z-index: 0;
    }
    
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        position: relative; 
        z-index: 1;

        .card-title {
            font-size: 18px;
            font-weight: 700;
            color: #334155;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .card-tag {
            background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
            padding: 6px 14px;
            border-radius: 20px;
            box-shadow: 0 4px 10px rgba(255, 154, 158, 0.3);
            
            .tag-text {
                font-size: 12px;
                color: #fff;
                font-weight: 600;
            }
        }
    }

    .card-content {
        position: relative;
        z-index: 1;
        .auth-text {
            font-size: 15px;
            color: #475569;
            line-height: 1.7;
            text-align: justify;
            display: block;
            background: rgba(255,241,242, 0.5); /* subtle highlight bg */
            padding: 12px;
            border-radius: 12px;
            border-left: 3px solid #F43F5E;
        }
    }
}
</style>
