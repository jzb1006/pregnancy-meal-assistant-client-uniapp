<template>
  <view class="container">
    <!-- Header Image Area -->
    <view class="header-image">
      <text class="emoji-img">🍲</text>
      <view class="header-overlay"></view>
      <view class="header-content">
        <text class="dish-name">{{ recipe.dishName }}</text>
        <view class="tags">
            <text class="tag" v-for="(tag, index) in recipe.tags" :key="index">{{ tag }}</text>
        </view>
      </view>
    </view>

    <!-- Main Content -->
    <view class="content-body">
      <!-- Nutrition & Time -->
      <view class="meta-row">
        <view class="meta-item">
            <text class="meta-icon">🔥</text>
            <text class="meta-label">{{ recipe.nutrition?.calories || 0 }} kcal</text>
        </view>
        <view class="meta-item">
            <text class="meta-icon">⏰</text>
            <text class="meta-label">{{ recipe.cookTime }}</text>
        </view>
        <view class="meta-item">
            <text class="meta-icon">💪</text>
            <text class="meta-label">难度：适中</text>
        </view>
      </view>
      
      <!-- Reason (Why this meal) -->
      <view class="section-card reason-card">
        <view class="section-title-row">
            <text class="section-icon">💡</text>
            <text class="section-title">推荐理由</text>
        </view>
        <text class="reason-text">{{ recipe.reason }}</text>
      </view>

      <!-- Ingredients -->
      <view class="section-card">
        <view class="section-title-row">
            <text class="section-icon">🥦</text>
            <text class="section-title">所需食材</text>
        </view>
        <view class="ingredients-grid">
            <view class="ingredient-item" v-for="(item, index) in recipe.ingredients" :key="index">
                <text class="bullet">•</text>
                <text class="text">{{ item }}</text>
            </view>
        </view>
      </view>

      <!-- Steps -->
      <view class="section-card">
        <view class="section-title-row">
            <text class="section-icon">👨‍🍳</text>
            <text class="section-title">烹饪步骤</text>
        </view>
        <view class="steps-list">
            <view class="step-item" v-for="(step, index) in recipe.steps" :key="index">
                <view class="step-num">{{ index + 1 }}</view>
                <text class="step-text">{{ step }}</text>
            </view>
        </view>
      </view>

      <!-- Husband Task -->
      <view class="section-card task-card" v-if="recipe.husbandTask">
        <view class="section-title-row">
            <text class="section-icon">🦸‍♂️</text>
            <text class="section-title">准爸爸任务</text>
        </view>
        <text class="task-text">{{ recipe.husbandTask }}</text>
      </view>
    </view>
    
    <!-- Floating Action Button -->
    <view class="fab-container">
        <button class="btn-primary" @click="goBack">我学会了 😤</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const recipe = ref<any>({});

onMounted(() => {
    try {
        const data = uni.getStorageSync('CURRENT_RECIPE_DETAIL');
        if (data) {
            recipe.value = data;
            uni.setNavigationBarTitle({ title: data.dishName });
        }
    } catch (e) {
        console.error('Failed to load recipe data', e);
        uni.showToast({ title: '加载失败', icon: 'none' });
        setTimeout(() => uni.navigateBack(), 1500);
    }
});

const goBack = () => {
    uni.navigateBack();
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F8F9FC;
  padding-bottom: 100px;
}

.header-image {
  height: 240px;
  background-color: #FFF5F5;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  .emoji-img {
    font-size: 100px;
  }
  
  .header-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  }
  
  .header-content {
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    
    .dish-name {
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        display: block;
        margin-bottom: 8px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        
        .tag {
            font-size: 12px;
            color: #fff;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(4px);
            padding: 4px 10px;
            border-radius: 12px;
        }
    }
  }
}

.content-body {
    padding: 20px;
    margin-top: -20px; // Overlap header
    position: relative;
    border-radius: 24px 24px 0 0;
    background: #F8F9FC;
    z-index: 10;
}

.meta-row {
    display: flex;
    justify-content: space-around;
    background: #fff;
    padding: 16px;
    border-radius: 16px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    
    .meta-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        
        .meta-icon { font-size: 20px; }
        .meta-label { font-size: 13px; color: #666; font-weight: 500; }
    }
}

.section-card {
    background: #fff;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    
    .section-title-row {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        
        .section-icon { font-size: 20px; margin-right: 8px; }
        .section-title { font-size: 18px; font-weight: 600; color: #333; }
    }
}

.reason-card {
    background: linear-gradient(135deg, #fff, #FFF0F1);
    border: 1px solid #FFEBEB;
    
    .reason-text {
        font-size: 15px;
        color: #555;
        line-height: 1.6;
    }
}

.ingredients-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    
    .ingredient-item {
        display: flex;
        align-items: center;
        
        .bullet { color: #FF8F94; margin-right: 6px; font-size: 16px; }
        .text { font-size: 15px; color: #444; }
    }
}

.steps-list {
    .step-item {
        display: flex;
        margin-bottom: 20px;
        
        &:last-child { margin-bottom: 0; }
        
        .step-num {
            width: 24px;
            height: 24px;
            background: #333;
            color: #fff;
            border-radius: 50%;
            text-align: center;
            line-height: 24px;
            font-size: 14px;
            font-weight: 600;
            margin-right: 12px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        
        .step-text {
            font-size: 15px;
            color: #444;
            line-height: 1.6;
        }
    }
}

.task-card {
    background: #F0F7FF;
    border: 1px dashed #B8D4FF;
    
    .task-text {
        font-size: 15px;
        color: #446688;
        line-height: 1.6;
    }
}

.fab-container {
    position: fixed;
    bottom: 30px;
    left: 20px;
    right: 20px;
    z-index: 100;
    
    .btn-primary {
        background: #333;
        color: #fff;
        height: 50px;
        line-height: 50px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: 600;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        &::after { border: none; }
    }
}
</style>
