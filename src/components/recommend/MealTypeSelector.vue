<template>
  <view class="selector-container">
     <view class="tabs">
        <view 
            class="tab" 
            :class="{ active: value === 'LUNCH' }" 
            @click="emit('update:value', 'LUNCH')"
        >午餐</view>
        <view 
            class="tab" 
            :class="{ active: value === 'DINNER' }" 
            @click="emit('update:value', 'DINNER')"
        >晚餐</view>
     </view>
     
     <view class="action-btn">
          <u-button 
             shape="circle" 
             :loading="loading"
             color="linear-gradient(90deg, #fda4af, #f43f5e)"
             @click="emit('generate')"
          >
             开始 AI 推荐
          </u-button>
     </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  value: 'LUNCH' | 'DINNER';
  loading: boolean;
}>();
const emit = defineEmits(['update:value', 'generate']);
</script>

<style lang="scss" scoped>
.selector-container {
    background: white;
    padding: 20px;
    border-radius: 16px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    
    .tabs {
        display: flex;
        background: #f8fafc;
        border-radius: 12px;
        padding: 4px;
        margin-bottom: 20px;
        
        .tab {
            flex: 1;
            text-align: center;
            padding: 10px;
            font-size: 14px;
            color: #64748b;
            border-radius: 10px;
            transition: all 0.3s;
            
            &.active {
                background: white;
                color: #f43f5e;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
        }
    }
}
</style>
