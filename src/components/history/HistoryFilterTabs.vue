<template>
  <view class="filter-tabs-container">
    <!-- 反馈筛选 -->
    <view class="filter-row">
      <text class="filter-label">反馈</text>
      <scroll-view class="tab-scroll-view" scroll-x :show-scrollbar="false">
        <view class="tab-group">
          <view 
            class="tab-item" 
            :class="{ active: localFeedback === '' }"
            @click="handleFeedbackChange('')"
          >
            <text>全部</text>
          </view>
          <view 
            class="tab-item" 
            :class="{ active: localFeedback === 'LIKE' }"
            @click="handleFeedbackChange('LIKE')"
          >
            <text>❤️ 喜欢</text>
          </view>
          <view 
            class="tab-item" 
            :class="{ active: localFeedback === 'DISLIKE' }"
            @click="handleFeedbackChange('DISLIKE')"
          >
            <text>👎 不感兴趣</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 餐次筛选 -->
    <view class="filter-row">
      <text class="filter-label">餐次</text>
      <scroll-view class="tab-scroll-view" scroll-x :show-scrollbar="false">
        <view class="tab-group">
          <view 
            class="tab-item" 
            :class="{ active: localMealType === '' }"
            @click="handleMealTypeChange('')"
          >
            <text>全部</text>
          </view>
          <view 
            class="tab-item breakfast" 
            :class="{ active: localMealType === 'BREAKFAST' }"
            @click="handleMealTypeChange('BREAKFAST')"
          >
            <text>🍳 早餐</text>
          </view>
          <view 
            class="tab-item lunch" 
            :class="{ active: localMealType === 'LUNCH' }"
            @click="handleMealTypeChange('LUNCH')"
          >
            <text>🍱 午餐</text>
          </view>
          <view 
            class="tab-item dinner" 
            :class="{ active: localMealType === 'DINNER' }"
            @click="handleMealTypeChange('DINNER')"
          >
            <text>🥗 晚餐</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  feedback: string;
  mealType: string;
}>();

const emit = defineEmits<{
  (e: 'update:feedback', value: string): void;
  (e: 'update:mealType', value: string): void;
  (e: 'change'): void;
}>();

const localFeedback = ref(props.feedback);
const localMealType = ref(props.mealType);

watch(() => props.feedback, (newVal) => {
  localFeedback.value = newVal;
});

watch(() => props.mealType, (newVal) => {
  localMealType.value = newVal;
});

const handleFeedbackChange = (value: string) => {
  localFeedback.value = value;
  emit('update:feedback', value);
  emit('change');
};

const handleMealTypeChange = (value: string) => {
  localMealType.value = value;
  emit('update:mealType', value);
  emit('change');
};
</script>

<style lang="scss" scoped>
.filter-tabs-container {
  padding: 0 0 10px; /* Remove side padding to allow full bleed scroll */
  background: transparent;
  margin-bottom: 4px;
}

.filter-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .filter-label {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 700;
    min-width: 44px;
    margin-left: 20px; /* Add padding back here */
    margin-right: 8px;
    flex-shrink: 0;
  }
  
  .tab-scroll-view {
    flex: 1;
    width: 0; /* Flexbox trick for scroll items */
    white-space: nowrap;
    
    .tab-group {
      display: inline-flex;
      padding-right: 20px; /* Padding for end of scroll */
      align-items: center;
      height: 44px; /* Ensure height for shadows */
    }
  }
    
  .tab-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0 16px;
    margin-right: 10px;
    border-radius: 100px;
    background: #fff;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    border: 1px solid rgba(0,0,0,0.03); 
    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
    
    &:last-child {
      margin-right: 0;
    }
    
    /* Active States */
    &.active {
      background: linear-gradient(135deg, #fb7185, #f43f5e);
      color: #fff;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(244, 63, 94, 0.25);
      border-color: transparent;
      transform: scale(1.02);
    }
    
    &.breakfast.active {
      background: linear-gradient(135deg, #fdba74, #f97316);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
    }
    
    &.lunch.active {
      background: linear-gradient(135deg, #86efac, #22c55e);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
    }
    
    &.dinner.active {
      background: linear-gradient(135deg, #c4b5fd, #8b5cf6); // adjusted purple
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
    }
    
    &:active {
      transform: scale(0.96);
    }
  }
}
</style>
