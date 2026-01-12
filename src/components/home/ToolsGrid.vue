<template>
  <view class="tools-grid-container glass-panel">
    <view class="grid-header">
      <text class="title">孕期工具箱</text>
    </view>
    
    <view class="grid-content">
      <view 
        class="grid-item" 
        v-for="(tool, index) in tools" 
        :key="index"
        @click="handleToolClick(tool)"
      >
        <view class="icon-wrapper" :class="tool.theme">
          <text class="icon">{{ tool.icon }}</text>
        </view>
        <text class="label">{{ tool.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits(['foodSearch']);

const tools = [
  { 
    name: '体重管理', 
    icon: '⚖️', 
    path: '/pages/weight/index',
    theme: 'theme-weight' 
  },
  { 
    name: '产检时光', 
    icon: '🗓️', 
    path: '/pages/care/index',
    theme: 'theme-care' 
  },
  { 
    name: '数胎动', 
    icon: '👣', 
    path: '/pages/tools/fetal-movement/index',
    theme: 'theme-fetal' 
  },
  { 
    name: '宫缩计时', 
    icon: '⏱️', 
    path: '/pages/tools/contraction/index',
    theme: 'theme-contraction' 
  },
  { 
    name: '待产包', 
    icon: '👜', 
    path: '/pages/tools/hospital-bag/index',
    theme: 'theme-bag' 
  },
  { 
    name: '能吃吗', 
    icon: '🔍', 
    action: 'FOOD_SEARCH',
    theme: 'theme-food' 
  }
];

const handleToolClick = (tool: any) => {
    uni.vibrateShort({ type: 'light' });
    
    if (tool.action === 'FOOD_SEARCH') {
        emit('foodSearch');
    } else if (tool.path) {
        uni.navigateTo({ url: tool.path });
    }
}
</script>

<style lang="scss" scoped>
.glass-panel {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 8px 24px rgba(255, 182, 193, 0.1);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 24px;
}

.grid-header {
    margin-bottom: 16px;
    .title {
        font-size: 16px;
        font-weight: 700;
        color: #334155;
    }
}

.grid-content {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.grid-item {
    width: calc(33.33% - 11px); /* 3 items per row approx */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    
    .icon-wrapper {
        width: 56px;
        height: 56px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        
        &.theme-weight { background: #FFF1F2; color: #F43F5E; }
        &.theme-care { background: #EFF6FF; color: #3B82F6; }
        &.theme-fetal { background: #F0FDF4; color: #22C55E; }
        &.theme-contraction { background: #FFF7ED; color: #F97316; }
        &.theme-food { background: #F5F3FF; color: #8B5CF6; }
        &.theme-bag { background: #ECFEFF; color: #06B6D4; }

    }
    
    .label {
        font-size: 12px;
        color: #64748B;
        font-weight: 500;
    }
    
    &:active {
        .icon-wrapper {
            transform: scale(0.92);
        }
    }
}
</style>
