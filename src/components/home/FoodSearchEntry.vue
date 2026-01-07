<template>
  <view class="search-entry-container">
    <!-- Click trigger -->
    <view class="food-safety-card" @click="emit('open')">
      <view class="card-header">
        <view class="title-row">
            <text class="icon">🤰</text>
            <text class="title">孕期能不能吃？</text>
        </view>
        <text class="subtitle">AI 智能风险评估</text>
      </view>
      
      <view class="search-mock-bar">
        <text class="search-icon">🔍</text>
        <text class="placeholder-text">查一查：螃蟹、咖啡、小龙虾...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const emit = defineEmits(['open']);
</script>

<style lang="scss" scoped>
.search-entry-container {
  margin-bottom: 20px;
}

.food-safety-card {
    background: linear-gradient(135deg, #FFF0F1, #FFFFFF);
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 16px rgba(255, 143, 148, 0.15);
    transition: all 0.2s;
    border: 1px solid rgba(255,255,255,0.6);
    
    &:active {
        transform: scale(0.98);
        background: #FFF5F5;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-left: 4px;
        
        .title-row {
            display: flex;
            align-items: center;
            gap: 6px;
            .icon { font-size: 20px; }
            .title { 
                font-size: 18px; 
                font-weight: 700; 
                color: #333;
                letter-spacing: 0.5px;
            }
        }
        
        .subtitle {
            font-size: 12px;
            color: #FF8F94;
            background: rgba(255, 143, 148, 0.1);
            padding: 4px 8px;
            border-radius: 10px;
            font-weight: 500;
        }
    }

    .search-mock-bar {
        background: #fff;
        height: 44px;
        border-radius: 22px;
        display: flex;
        align-items: center;
        padding: 0 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        
        .search-icon {
            font-size: 16px;
            margin-right: 8px;
            color: #999;
        }

        .placeholder-text {
            font-size: 14px;
            color: #BBB;
        }
    }
}
</style>
