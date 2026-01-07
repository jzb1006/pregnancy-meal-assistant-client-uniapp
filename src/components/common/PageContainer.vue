<template>
  <view class="page-container" :style="customStyle">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  customStyle?: any
}>();
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f8f9fc;
  padding: 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}
</style>
