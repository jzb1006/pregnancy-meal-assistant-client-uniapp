<template>
  <PageContainer>
     <MealTypeSelector 
        v-model:value="mealType"
        :loading="generating"
        @generate="startRecommendation"
     />
     
     <view class="result-card" v-if="content || generating || resultData">
         <StreamingDisplay v-if="!resultData" :content="content" :isStreaming="generating" />
         <RecipeResult v-else :data="resultData" @feedback="handleFeedback" />
     </view>
     
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { SSEClient } from '@/utils/sse';
import PageContainer from '@/components/common/PageContainer.vue';
import MealTypeSelector from '@/components/recommend/MealTypeSelector.vue';
import StreamingDisplay from '@/components/recommend/StreamingDisplay.vue';
import RecipeResult from '@/components/recommend/RecipeResult.vue';
import type { RecipeData } from '@/components/recommend/RecipeResult.vue';

const userStore = useUserStore();
const mealType = ref<'LUNCH'|'DINNER'>('LUNCH');
const generating = ref(false);
const content = ref('');
const resultData = ref<RecipeData | null>(null);
let sseClient: SSEClient | null = null;

const startRecommendation = () => {
    if (!userStore.openId) {
        uni.showToast({ title: '未登录', icon: 'none' });
        // uni.navigateTo({ url: '/pages/login/login' }); // demo logic
        return;
    }
    
    if (sseClient) {
        sseClient.close();
        sseClient = null;
    }
    
    generating.value = true;
    content.value = '正在连接 AI 大脑...\n';
    resultData.value = null;
    
    // Construct URL for local env. For real env, this should be configurable
    let baseUrl = 'http://localhost:8080/api';
    // #ifdef H5
    baseUrl = '/api'; 
    // #endif
    
    const url = `${baseUrl}/v1/meal/recommend/stream?openId=${userStore.openId}&mealType=${mealType.value}`;
    
    sseClient = new SSEClient(url);
    sseClient.connect();
    
    sseClient.addEventListener('start', (event: any) => {
        // console.log('Started', event);
        if (content.value.includes('正在连接')) {
             content.value = '';
        }
    });

    sseClient.addEventListener('chunk', (event: any) => {
        const text = event.data;
        // In case of buffering or initial message
        if (content.value.includes('正在连接')) {
             content.value = '';
        }
        content.value += text;
    });
    
    sseClient.addEventListener('complete', (event: any) => {
        try {
            const json = JSON.parse(event.data);
            resultData.value = json;
        } catch (e) {
            console.error('Parse complete error', e);
        }
        generating.value = false;
        if(sseClient) sseClient.close();
    });
    
    sseClient.addEventListener('error', (err: any) => {
        console.error('SSE Error', err);
        // generating.value = false; // Optional: stop or retry
        uni.showToast({ title: '连接中断', icon: 'none' });
    });
}

const handleFeedback = (id: string, action: string) => {
    uni.showToast({ title: action === 'LIKE' ? '已收藏' : '已反馈', icon: 'none' });
}

onUnmounted(() => {
    if (sseClient) sseClient.close();
});
</script>

<style lang="scss" scoped>
.result-card {
    background: white;
    padding: 16px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    min-height: 200px;
}
</style>
