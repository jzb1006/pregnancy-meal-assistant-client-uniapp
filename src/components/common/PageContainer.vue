<template>
  <view class="page-container">
    <slot />
  </view>
</template>

<script setup lang="ts">
// Page wrapper
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
