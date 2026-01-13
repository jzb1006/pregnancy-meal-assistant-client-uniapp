<template>
  <PageContainer :customStyle="{ background: 'linear-gradient(180deg, #FDF2F4 0%, #FFFFFF 100%)', paddingTop: '10px' }">

     <!-- 1. Status Card (Dashboard Core & Mood Interaction) -->
     <view class="fade-in-entry delay-1">
        <StatusCard 
            :status="status"
            :loading="loading"
            :lmp="lmp"
            :dailyEncouragement="dailyEncouragement"
            :encouragementLoading="encouragementLoading"
            @complete="navigateToProfile"
            @moodSelect="onSelectMood"
        />
     </view>

     <!-- 2. Week Calendar (Timeline Context) -->
     <view class="fade-in-entry delay-2">
         <WeekCalendar 
            :activeDate="activeDate"
            :lmp="lmp"
            @dateSelect="setActiveDate"
         />
     </view>

     <!-- 4. Tools Grid (Golden Zone) -->
     <view class="fade-in-entry delay-4">
        <ToolsGrid @foodSearch="showFoodSearch = true" />
     </view>

     <!-- 5. Todo Tips (Dynamic Reminders) -->
     <view class="fade-in-entry delay-5">
        <TodoTips ref="todoTipsRef" :status="status" />
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
import { onShow, onPullDownRefresh, onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';
import PageContainer from '@/components/common/PageContainer.vue';

import WeekCalendar from '@/components/home/WeekCalendar.vue';
import StatusCard from '@/components/home/StatusCard.vue';
import CustomTabBar from '@/components/common/CustomTabBar.vue';
// New Imports
import ToolsGrid from '@/components/home/ToolsGrid.vue';
// ... other imports
import TodoTips from '@/components/home/TodoTips.vue';
import FoodSearchModal from '@/components/home/FoodSearchModal.vue';

import dayjs from 'dayjs';

const userStore = useUserStore();
const activeDate = ref(dayjs().format('YYYY-MM-DD'));
const status = ref<any>(null);
const lmp = ref('');
const loading = ref(true);
const dailyEncouragement = ref<any>(null);
const encouragementLoading = ref(false);

const showFoodSearch = ref(false);
const todoTipsRef = ref<InstanceType<typeof TodoTips> | null>(null);

const moodOptions = [
    { label: '开心', value: 'HAPPY', icon: '😊' },
    { label: '疲惫', value: 'TIRED', icon: '😫' },
    { label: '焦虑', value: 'ANXIOUS', icon: '😟' },
    { label: '兴奋', value: 'EXCITED', icon: '🤩' },
    { label: '平静', value: 'CALM', icon: '😌' }
];

onLoad(() => {
    console.log('[Index] onLoad triggered');
    fetchUserInfo();
    fetchStatus();
});

onShow(() => {
    console.log('[Index] onShow triggered');
    // Ensure we fetch if not already done by onLoad (though redundancy is fine here for safety)
    fetchUserInfo();
    fetchStatus();
    fetchDailyEncouragement(); 
    
    // Refresh Todo Status
    if (todoTipsRef.value) {
        todoTipsRef.value.checkStatus();
    }
});
const fetchStatus = async () => {
    console.log('[Index] Calling fetchStatus...');
    try {
        const res: any = await request({
            url: '/v1/user/status'
        });
        console.log('[Index] fetchStatus result:', res);
        
        if (res && (res.code === 200 || res.status === 200)) {
            status.value = res.data;
        } else {
             console.warn('[Index] fetchStatus returned non-200:', res);
             if (res.message) uni.showToast({ title: res.message, icon: 'none' });
        }
    } catch (e: any) {
        console.error('[Index] Fetch status failed', e);
    } finally {
        loading.value = false;
    }
}

const fetchUserInfo = async () => {
    console.log('[Index] Calling fetchUserInfo...');
    try {
        // ALWAYS fetch fresh data to ensure we have the latest LMP and settings
        const res: any = await request({
            url: '/v1/user/info'
        });
        console.log('[Index] fetchUserInfo result:', res);
        
        if (!res || res.code !== 200 || !res.data) {
            console.warn('[Index] User info invalid');
            return;
        }
        
        const hasValidLmp = res.data.lmp && (
            typeof res.data.lmp === 'string' && res.data.lmp.length > 0 ||
            Array.isArray(res.data.lmp) && res.data.lmp.length === 3
        );
        
        if (!hasValidLmp) {
            console.warn('[Index] User has no LMP, redirecting to onboarding');
            uni.reLaunch({ url: '/pages/onboarding/onboarding' });
            return;
        }
        
        lmp.value = dayjs(res.data.lmp).format('YYYY-MM-DD');
        console.log('[Index] Set LMP to:', lmp.value);
        
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
             uni.showToast({ title: '获取鼓励失败', icon: 'none' });
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
    margin-left: 10px;
    margin-right: 10px;
    
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
    margin-left: 10px;
    margin-right: 10px;
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
    margin-left: 10px;
    margin-right: 10px;
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
