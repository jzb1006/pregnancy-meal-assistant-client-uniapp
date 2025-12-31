<template>
  <view class="status-card" @click="emit('complete')">
    <view class="content">
        <view class="header">
            <text class="title">孕期进度</text>
            <view class="loading-icon" v-if="loading">...</view>
        </view>
        <view class="status-info" v-if="status">
             <view class="week-info">
                 <text class="num">{{ status.week || 0 }}</text>
                 <text class="unit">周</text>
                 <text class="num small">+{{ (status.pregnancyDays % 7) || 0 }}</text>
                 <text class="unit">天</text>
             </view>
             <text class="label">{{ status.tips || '宝宝正在健康发育' }}</text>
        </view>
        <view class="empty-info" v-else>
            <text>完善信息开启守护</text>
        </view>
    </view>
    <view class="progress-ring">
        <!-- Dynamic Progress Ring -->
        <view class="ring-circle" :style="ringStyle">
            <text class="pct">{{ progressPercentage }}%</text>
        </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: any;
  loading: boolean;
}>();

const emit = defineEmits(['complete']);

const progressPercentage = computed(() => {
    if (!props.status || !props.status.pregnancyDays) return 0;
    const days = props.status.pregnancyDays;
    const totalDays = 280; // 40 weeks
    const pct = Math.round((days / totalDays) * 100);
    return Math.min(100, Math.max(0, pct));
});

// Simple conic-gradient for the ring border
// Note: This is a simplified visual representation.
// For a real SVG ring, we'd need a more complex setup or a library (u-charts/qiun etc).
// Here we use a CSS background conic-gradient to simulate the border progress.
const ringStyle = computed(() => {
    const p = progressPercentage.value;
    return {
        background: `conic-gradient(#f43f5e ${p}%, #f1f5f9 ${p}% 100%)`,
        // We'll mask the inner part in CSS to make it a ring
    };
});
</script>

<style lang="scss" scoped>
.status-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  .content {
      flex: 1; // Take up remaining space
      .header {
          margin-bottom: 8px;
          .title {
              font-size: 13px;
              color: #94a3b8;
          }
      }
      .status-info {
          display: flex;
          flex-direction: column;
          .week-info {
              display: flex;
              align-items: baseline;
              margin-bottom: 4px;
              .num { font-size: 28px; font-weight: bold; color: #333; }
              .unit { font-size: 13px; color: #666; margin-right: 4px; margin-left: 1px;}
              .small { font-size: 18px; margin-left: 6px; }
          }
          .label {
              font-size: 12px;
              color: #10b981; // emerald
              line-height: 1.4;
          }
      }
  }

  .progress-ring {
      margin-left: 16px; 
      .ring-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          
          // Inner white circle to create ring effect
          &::after {
              content: '';
              position: absolute;
              left: 5px; 
              top: 5px;
              width: 54px;
              height: 54px;
              background: white;
              border-radius: 50%;
              z-index: 1;
          }

          .pct {
              position: relative;
              z-index: 2; // Above the mask
              font-size: 14px;
              font-weight: 800;
              color: #f43f5e;
          }
      }
  }
}
</style>
