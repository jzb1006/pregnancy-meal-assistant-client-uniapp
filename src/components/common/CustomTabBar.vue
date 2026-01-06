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
    if (currentPath.value === item.pagePath) return;
    
    // Use switchTab for smooth transition without page reload
    uni.switchTab({
        url: '/' + item.pagePath
    });
}
</script>

<style lang="scss" scoped>
.tab-bar-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 999;
    display: flex;
    justify-content: center;
    pointer-events: none;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
}

.glass-panel {
    pointer-events: auto;
    width: 90%;
    max-width: 380px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 24px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 10px 12px;
    margin-bottom: 8px;
    box-shadow: 0 8px 32px 0 rgba(253, 164, 175, 0.15);
    
    .tab-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 6px;
        min-height: 44px;
        min-width: 44px;
        transition: all 0.3s ease;
        
        .tab-text {
            font-size: 10px;
            margin-top: 2px;
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
