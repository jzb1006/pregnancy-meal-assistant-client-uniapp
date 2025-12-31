<template>
  <view class="welcome-header">
    <view class="text-container">
      <text class="greeting">{{ greeting }}</text>
      <text class="username">{{ userName }}</text>
    </view>
    <view class="avatar">
      <text class="emoji">{{ avatar }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  userName: string;
  greeting: string;
  avatar: string;
}>();
</script>

<style lang="scss" scoped>
.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0 20px 0;

  .text-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .greeting {
       font-size: 14px;
       color: #64748b;
    }
    .username {
       font-size: 24px;
       font-weight: 700;
       color: #0f172a;
    }
  }
  .avatar {
    width: 48px;
    height: 48px;
    background: #fff0f3; // light pink bg
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .emoji {
        font-size: 24px;
    }
  }
}
</style>
