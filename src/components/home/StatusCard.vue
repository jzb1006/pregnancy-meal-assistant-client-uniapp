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
                 <text class="num small">+{{ status.day || 0 }}</text>
                 <text class="unit">天</text>
             </view>
             <text class="label">宝宝正在健康发育</text>
        </view>
        <view class="empty-info" v-else>
            <text>完善信息开启守护</text>
        </view>
    </view>
    <view class="progress-ring">
        <!-- Simple CSS circle for now -->
        <view class="ring-circle">
            <text class="pct">75%</text>
        </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  status: any;
  loading: boolean;
}>();
const emit = defineEmits(['complete']);
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
          }
      }
  }

  .progress-ring {
      .ring-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 4px solid #f1f5f9;
          border-top-color: #fda4af; 
          display: flex;
          align-items: center;
          justify-content: center;
          .pct {
              font-size: 12px;
              font-weight: bold;
              color: #fda4af;
          }
      }
  }
}
</style>
