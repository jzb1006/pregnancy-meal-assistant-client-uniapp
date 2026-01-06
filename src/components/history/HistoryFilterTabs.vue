<template>
  <view class="filter-tabs-container">
    <!-- 反馈筛选 -->
    <view class="filter-row">
      <text class="filter-label">反馈：</text>
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
          <text>👎 不喜欢</text>
        </view>
      </view>
    </view>
    
    <!-- 餐次筛选 -->
    <view class="filter-row">
      <text class="filter-label">餐次：</text>
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
          <text>早餐</text>
        </view>
        <view 
          class="tab-item lunch" 
          :class="{ active: localMealType === 'LUNCH' }"
          @click="handleMealTypeChange('LUNCH')"
        >
          <text>午餐</text>
        </view>
        <view 
          class="tab-item dinner" 
          :class="{ active: localMealType === 'DINNER' }"
          @click="handleMealTypeChange('DINNER')"
        >
          <text>晚餐</text>
        </view>
      </view>
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
  padding: 12px 15px;
  background: #fff;
  border-bottom: 1px solid #f1f5f9;
}

.filter-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .filter-label {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
    min-width: 50px;
    margin-right: 8px;
  }
  
  .tab-group {
    display: flex;
    gap: 8px;
    flex: 1;
    flex-wrap: wrap;
    
    .tab-item {
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 16px;
      background: #f8fafc;
      color: #64748b;
      transition: all 0.2s;
      white-space: nowrap;
      
      &.active {
        background: linear-gradient(135deg, #fda4af, #f43f5e);
        color: #fff;
        font-weight: 600;
      }
      
      &.breakfast.active {
        background: linear-gradient(135deg, #fdba74, #f97316);
      }
      
      &.lunch.active {
        background: linear-gradient(135deg, #86efac, #22c55e);
      }
      
      &.dinner.active {
        background: linear-gradient(135deg, #c084fc, #a855f7);
      }
      
      &:active {
        opacity: 0.8;
        transform: scale(0.98);
      }
    }
  }
}
</style>

