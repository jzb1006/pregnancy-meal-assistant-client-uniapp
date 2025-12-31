<template>
  <PageContainer>
     <WelcomeHeader userName="准妈妈" greeting="今天感觉怎么样？" avatar="👩" />
     
     <WeekCalendar 
        :activeDate="activeDate"
        @dateSelect="setActiveDate"
     />

     <StatusCard 
        :status="status"
        :loading="loading"
        @complete="navigateToProfile"
     />

     <ActionGrid 
        :actions="actions"
        @click="handleActionClick"
     />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';
import PageContainer from '@/components/common/PageContainer.vue';
import WelcomeHeader from '@/components/home/WelcomeHeader.vue';
import WeekCalendar from '@/components/home/WeekCalendar.vue';
import StatusCard from '@/components/home/StatusCard.vue';
import ActionGrid from '@/components/home/ActionGrid.vue';
import type { ActionItem } from '@/components/home/ActionGrid.vue';

const userStore = useUserStore();
const activeDate = ref(new Date().getDate());
const status = ref<any>(null);
const loading = ref(true);

const actions: ActionItem[] = [
    {
      title: 'AI 点餐',
      subtitle: 'Generate your meal plan',
      iconName: 'play-circle',
      variant: 'peach',
      route: '/pages/recommend/recommend',
    },
    {
      title: '历史记录',
      subtitle: 'Review your meals',
      iconName: 'clock',
      variant: 'mint',
      route: '/pages/history/history',
    },
];

const fetchStatus = async () => {
    try {
        // Use await with type assertion or data checking
        const res: any = await request({
            url: '/v1/user/status',
            data: { openId: userStore.openId }
        });
        
        // Adapt response structure
        if (res && (res.code === 200 || res.status === 200)) {
            status.value = res.data;
        } else {
             // Mock data for development
             status.value = { week: 24, day: 3 };
        }
    } catch (e) {
        console.error('Fetch status failed', e);
        // Fallback mock
        status.value = { week: 24, day: 3 }; 
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchStatus();
});

const setActiveDate = (day: number) => {
    activeDate.value = day;
}

const navigateToProfile = () => {
    uni.navigateTo({ url: '/pages/profile/profile' });
}

const handleActionClick = (route: string) => {
    uni.navigateTo({ 
        url: route,
        fail: (err) => {
            console.error('Nav fail', err);
            uni.showToast({ title: '页面开发中', icon: 'none' });
        }
    });
}
</script>
