<template>

  <PageContainer>

     
     <!-- 1. Status Card (Dashboard Core) -->
     <StatusCard 
        :status="status"
        :loading="loading"
        @complete="navigateToProfile"
     />

     <!-- 2. Daily Encouragement (Emotional Connection) -->
    <view class="encouragement-section">
        <!-- 1. Mood Selector (Show if no encouragement yet) -->
        <view class="mood-card" v-if="!dailyEncouragement && !encouragementLoading">
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
                    <text class="mood-icon">{{ mood.icon }}</text>
                    <text class="mood-label">{{ mood.label }}</text>
                </view>
            </view>
        </view>

        <!-- 2. Loading State -->
         <view class="loading-card" v-if="encouragementLoading">
            <text class="loading-icon">🤔</text>
            <text class="loading-text">正在想悄悄话...</text>
         </view>

        <!-- 3. Result Card (Show if encouragement exists) -->
        <view class="encouragement-card" v-if="dailyEncouragement">
            <view class="card-header">
                <text class="card-title">👶 宝宝悄悄话</text>
                <view class="card-tag" v-if="dailyEncouragement.babySize">
                    <text class="tag-text">宝宝像{{ dailyEncouragement.babySize }}</text>
                </view>
            </view>
            <view class="card-content">
                <text class="auth-text">"{{ dailyEncouragement.encouragement }}"</text>
            </view>
        </view>
     </view>

     <!-- 3. Week Calendar (Timeline) -->
     <WeekCalendar 
        :activeDate="activeDate"
        :lmp="lmp"
        @dateSelect="setActiveDate"
     />

     <!-- 4. Food Search (Tool) -->
     <FoodSearchEntry />

     <!-- 5. Daily Recipe Recommendation -->
     <DailyRecipeCard />

     <!-- 6. Nutrition Tip -->
     <NutritionTip />



     <!-- Spacer for TabBar -->
     <view style="height: 120px;"></view>
     
     <CustomTabBar :current="0" />
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
            url: '/v1/user/status',
            data: { openId: userStore.openId }
        });
        
        if (res && (res.code === 200 || res.status === 200)) {
            status.value = res.data;
        } else {
             // specific error handled globally or via toast below
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
        const res: any = await request({
            url: '/v1/user/info',
            data: { openId: userStore.openId }
        });
        if (res && res.code === 200 && res.data) {
             if (res.data.lmp) {
                 lmp.value = dayjs(res.data.lmp).format('YYYY-MM-DD');
             }
        }
    } catch (e) {
        console.error('Fetch info failed', e);
    }
}



const fetchDailyEncouragement = async (mood?: string) => {
    if (!userStore.openId) {
        console.warn('DailyEncouragement: No openId found, skipping request');
        return;
    }
    
    // Only show loading if we are actively selecting a mood (generating)
    if (mood) {
        encouragementLoading.value = true;
    }
    
    console.log(`DailyEncouragement: Fetching for openId=${userStore.openId}, mood=${mood || 'CHECK_MODE'}`);
    
    try {
        let url = `/v1/user/daily-encouragement?openId=${userStore.openId}`;
        if (mood) {
            url += `&mood=${mood}`;
        }

        const res: any = await request({
            url: url,
            method: 'POST'
        });
        console.log('DailyEncouragement: Response:', res);
        
        if (res && (res.code === 200 || res.status === 200)) {
            // If data is null, it means no record exists (and we didn't force create one)
            // So we just leave dailyEncouragement as null, showing the selector
            if (res.data) {
                dailyEncouragement.value = res.data;
            }
        }
    } catch (e) {
        console.error('Fetch daily encouragement failed', e);
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
    fetchDailyEncouragement(moodValue);
}

const funcShowToast = (title: string) => {
    uni.showToast({ title, icon: 'none' });
}

onShow(() => {
    fetchStatus();
    fetchUserInfo();
    // Check if we already have a record for today
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


.mood-card {
    background: #fff;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    
    .card-header {
        margin-bottom: 16px;
        .card-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
        }
    }
    
    .mood-grid {
        display: flex;
        justify-content: space-between;
        
        .mood-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            
            .mood-icon {
                font-size: 32px;
                background: #F8F8F8;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .mood-label {
                font-size: 12px;
                color: #666;
            }
            
            &:active {
                .mood-icon {
                    transform: scale(0.9);
                    background: #FFE4E6; // Light pink
                }
            }
        }
    }
}

.loading-card {
    background: #fff;
    border-radius: 20px;
    padding: 30px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 150px;
    
    .loading-icon {
        font-size: 40px;
        animation: bounce 1s infinite;
    }
    
    .loading-text {
        font-size: 14px;
        color: #999;
    }
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.encouragement-card {
    background: #fff; // or use a soft color like #FFF9F9
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 16px rgba(255, 182, 193, 0.15); // Soft pink shadow
    border: 1px solid rgba(255, 230, 230, 0.5);

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .card-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }

        .card-tag {
            background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
            padding: 4px 10px;
            border-radius: 12px;
            
            .tag-text {
                font-size: 12px;
                color: #fff;
                font-weight: 500;
            }
        }
    }

    .card-content {
        .auth-text {
            font-size: 15px;
            color: #555;
            line-height: 1.6;
            font-style: italic;
        }
    }
}
</style>
