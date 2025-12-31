<template>
  <PageContainer>
     <WelcomeHeader userName="准妈妈" greeting="今天感觉怎么样？" avatar="👩" />
     
     <WeekCalendar 
        :activeDate="activeDate"
        :lmp="lmp"
        @dateSelect="setActiveDate"
     />

     <StatusCard 
        :status="status"
        :loading="loading"
        @complete="navigateToProfile"
     />

     <!-- Pregnancy Animation Video -->
     <view class="video-card">
        <video 
            class="anim-video"
            src="/static/video/pregnancy_cycle.mp4"
            autoplay
            loop
            muted
            :controls="false"
            :show-center-play-btn="false"
            object-fit="cover"
        ></video>
     </view>


     
     <CustomTabBar :current="0" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';
import PageContainer from '@/components/common/PageContainer.vue';
import WelcomeHeader from '@/components/home/WelcomeHeader.vue';
import WeekCalendar from '@/components/home/WeekCalendar.vue';
import StatusCard from '@/components/home/StatusCard.vue';
import CustomTabBar from '@/components/common/CustomTabBar.vue';
import dayjs from 'dayjs';

const userStore = useUserStore();
const activeDate = ref(dayjs().format('YYYY-MM-DD'));
const status = ref<any>(null);
const lmp = ref('');
const loading = ref(true);



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

const funcShowToast = (title: string) => {
    uni.showToast({ title, icon: 'none' });
}

onShow(() => {
    fetchStatus();
    fetchUserInfo();
});

const setActiveDate = (date: string) => {
    activeDate.value = date;
}

const navigateToProfile = () => {
    uni.switchTab({ url: '/pages/profile/profile' });
}



</script>

<style lang="scss" scoped>
.video-card {
    width: 100%;
    height: 220px;
    background: #000;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    
    .anim-video {
        width: 100%;
        height: 100%;
        display: block;
    }
}
</style>
