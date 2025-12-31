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
  background-color: #f8f9fa;
  padding: 20px 16px;
  box-sizing: border-box;
}
</style>
