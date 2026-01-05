<template>
  <view class="tab-bar-container">
    <view class="glass-panel">
      <view 
        class="tab-item" 
        v-for="(item, index) in tabs" 
        :key="index"
        :class="{ active: currentPath === item.pagePath }"
        @click="switchTab(item)"
      >
        <u-icon 
            :name="item.icon" 
            :color="currentPath === item.pagePath ? '#f43f5e' : '#94a3b8'" 
            size="28"
        ></u-icon>
        <text class="tab-text" :class="{ active: currentPath === item.pagePath }">
            {{ item.text }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';

const props = defineProps<{
    current: number; // 0, 1, 2, 3
}>();

const tabs = [
    { pagePath: 'pages/index/index', text: '首页', icon: 'home' },
    { pagePath: 'pages/recommend/recommend', text: '点餐', icon: 'chat' }, // 'chat' as approx for 'message'
    { pagePath: 'pages/history/history', text: '历史', icon: 'clock' },
    { pagePath: 'pages/profile/profile', text: '我的', icon: 'account' }
];

onMounted(() => {
    // uni.hideTabBar(); // Native tabbar is removed via pages.json
});

const currentPath = computed(() => tabs[props.current].pagePath);

const switchTab = (item: any) => {
    // Since native tabBar is disabled, use reLaunch to simulate tab switch
    if (currentPath.value === item.pagePath) return;
    
    uni.reLaunch({
        url: '/' + item.pagePath
    });
}
</script>

<style lang="scss" scoped>
.tab-bar-container {
    position: fixed;
    bottom: 30px;
    left: 0;
    right: 0;
    z-index: 999;
    display: flex;
    justify-content: center;
    pointer-events: none; // Allow clicks to pass through outside the panel
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
}

.glass-panel {
    pointer-events: auto;
    width: 90%;
    max-width: 380px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 24px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 12px 16px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.18);
    
    .tab-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px;
        transition: all 0.3s ease;
        
        .tab-text {
            font-size: 10px;
            margin-top: 4px;
            color: #94a3b8;
            font-weight: 500;
            
            &.active {
                color: #f43f5e;
            }
        }
        
        &:active {
            transform: scale(0.95);
        }
    }
}
</style>
