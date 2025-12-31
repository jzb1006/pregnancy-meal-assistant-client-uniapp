<template>
  <view class="streaming-display">
      <view class="markdown-body">
          <text class="text-content">{{ content }}</text>
          <text v-if="isStreaming" class="cursor">|</text>
      </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  content: string;
  isStreaming: boolean;
}>();
</script>

<style lang="scss" scoped>
.streaming-display {
    min-height: 100px;
    padding: 10px;
    
    .text-content {
        line-height: 1.6;
        font-size: 15px;
        color: #333;
        white-space: pre-wrap;
    }
    
    .cursor {
        animation: blink 1s infinite;
        color: #f43f5e;
        font-weight: bold;
        margin-left: 2px;
    }
}
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}
</style>
