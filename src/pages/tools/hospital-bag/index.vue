<template>
  <view class="hospital-bag-container">
    <!-- Custom Navbar -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="back-btn" @click="goBack">
            <text class="icon">❮</text>
        </view>
        <text class="page-title">待产包清单</text>
        <view class="placeholder"></view>
    </view>

    <!-- 顶部统计卡片 -->
    <view class="status-header">
      <view class="progress-card">
        <view class="title-area">
          <text class="title">待产包准备进度</text>
           <text class="subtitle">已准备 {{ store.checkedCount }} / {{ store.totalCount }}</text>
        </view>
        <view class="progress-bar-bg">
          <view 
            class="progress-bar-fill" 
            :style="{ width: store.progressPercentage + '%' }"
          ></view>
        </view>
        <text class="percentage">{{ store.progressPercentage }}%</text>
      </view>
    </view>

    <!-- 分类 Tabs -->
    <view class="tabs-container">
      <view 
        v-for="cat in store.categories" 
        :key="cat.id"
        class="tab-item"
        :class="{ active: currentTab === cat.id }"
        @click="currentTab = cat.id"
      >
        <text class="tab-text">{{ cat.name }}</text>
        <view class="active-indicator" v-if="currentTab === cat.id"></view>
      </view>
    </view>

    <!-- 物品列表 -->
    <scroll-view scroll-y class="item-list">
      <view class="list-padding">
        <view 
          v-for="item in currentItems" 
          :key="item.id"
          class="item-card"
          @click="store.toggleItem(item.id)"
        >
          <view class="checkbox">
            <view v-if="item.isChecked" class="checked-icon">✓</view>
          </view>
          <view class="item-info">
            <text class="item-name" :class="{ completed: item.isChecked }">{{ item.name }}</text>
            <text class="item-desc" v-if="item.desc">{{ item.desc }}</text>
          </view>
        </view>
        
        <!-- 空状态占位 -->
        <view v-if="currentItems.length === 0" class="empty-state">
          <text>该分类下暂无物品</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHospitalBagStore } from '@/stores/hospital-bag';

const store = useHospitalBagStore();
const currentTab = ref('mom'); // 默认选中妈妈用品
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;

const goBack = () => {
    uni.navigateBack();
};

const currentItems = computed(() => {
  return store.getItemsByCategory(currentTab.value);
});

onMounted(() => {
  store.initData();
});
</script>

<style lang="scss" scoped>
.hospital-bag-container {
  height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 44px;
    box-sizing: content-box;
    background-color: #ffffff;
    flex-shrink: 0;
    
    .back-btn {
        width: 32px;
        height: 32px;
        background: rgba(0, 0, 0, 0.05); /* Slightly visible bg */
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .icon { font-size: 16px; color: #334155; }
        &:active { opacity: 0.7; }
    }
    
    .page-title {
        font-size: 17px;
        font-weight: 600;
        color: #334155;
    }
    
    .placeholder { width: 32px; }
}

.status-header {
  padding: 30rpx;
  background-color: #ffffff;
  flex-shrink: 0;
}

.progress-card {
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  color: white;
  box-shadow: 0 8rpx 20rpx rgba(255, 154, 158, 0.3);
  position: relative;
  overflow: hidden;

  .title-area {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 20rpx;

    .title {
      font-size: 36rpx;
      font-weight: bold;
    }

    .subtitle {
      font-size: 28rpx;
      opacity: 0.9;
    }
  }

  .progress-bar-bg {
    height: 12rpx;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 6rpx;
    margin-top: 10rpx;
    overflow: hidden;

    .progress-bar-fill {
      height: 100%;
      background-color: #ffffff;
      border-radius: 6rpx;
      transition: width 0.3s ease;
    }
  }

  .percentage {
    position: absolute;
    right: 40rpx;
    top: 40rpx;
    font-size: 60rpx;
    font-weight: bold;
    opacity: 0.2;
  }
}

.tabs-container {
  display: flex;
  background-color: #ffffff;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 30rpx 0;
    position: relative;
    color: #666;
    font-size: 30rpx;
    
    &.active {
      color: #333;
      font-weight: bold;
    }

    .active-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 6rpx;
      background-color: #ff9a9e;
      border-radius: 3rpx;
    }
  }
}

.item-list {
  flex: 1;
  height: 0; // 让 scroll-view 自适应剩余高度
  width: 100%;
}

.list-padding {
  padding: 30rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 30rpx);
}

.item-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
  }

  .checkbox {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    border: 2rpx solid #ddd;
    margin-right: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    .checked-icon {
      width: 100%;
      height: 100%;
      background-color: #ff9a9e;
      border-radius: 50%;
      color: white;
      font-size: 28rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
    }
  }

  .item-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .item-name {
      font-size: 32rpx;
      color: #333;
      margin-bottom: 8rpx;
      
      &.completed {
        text-decoration: line-through;
        color: #999;
      }
    }

    .item-desc {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.empty-state {
  padding: 100rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}
</style>
