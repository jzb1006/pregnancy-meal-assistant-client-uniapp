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
        <button class="btn-primary" @click="goBack">我学会了</button>
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
  background-color: #f8fafc;
  padding-bottom: 120px;
}

.header-image {
  height: 280px;
  background: linear-gradient(135deg, #fff1f2 0%, #fff 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  .emoji-img {
    font-size: 110px;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
    animation: float 6s ease-in-out infinite;
  }
  
  .header-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 120px;
    background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
    z-index: 1;
  }
  
  .header-content {
    position: absolute;
    bottom: 30px;
    left: 24px;
    right: 24px;
    z-index: 2;
    
    .dish-name {
        font-size: 26px;
        font-weight: 800;
        color: #fff;
        display: block;
        margin-bottom: 12px;
        text-shadow: 0 4px 8px rgba(0,0,0,0.2);
        letter-spacing: -0.5px;
    }
    
    .tags {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        
        .tag {
            font-size: 12px;
            color: #fff;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(8px);
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 600;
            border: 1px solid rgba(255,255,255,0.3);
        }
    }
  }
}

.content-body {
    padding: 24px;
    margin-top: -24px; // Overlap header
    position: relative;
    border-radius: 32px 32px 0 0;
    background: #f8fafc;
    z-index: 10;
}

.meta-row {
    display: flex;
    justify-content: space-around;
    background: #fff;
    padding: 20px;
    border-radius: 24px;
    margin-bottom: 24px;
    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
    
    .meta-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        
        .meta-icon { font-size: 22px; }
        .meta-label { 
            font-size: 13px; 
            color: #64748b; 
            font-weight: 600; 
        }
    }
}

.section-card {
    background: #fff;
    border-radius: 28px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    border: 1px solid rgba(255,255,255,0.6);
    
    .section-title-row {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        
        .section-icon { font-size: 22px; margin-right: 10px; }
        .section-title { 
            font-size: 18px; 
            font-weight: 700; 
            color: #334155; 
            letter-spacing: -0.3px;
        }
    }
}

.reason-card {
    background: linear-gradient(135deg, #fff, #fff1f2);
    box-shadow: 0 10px 30px -5px rgba(255, 143, 148, 0.15);
    border: 1px solid rgba(255,241,242,0.8);
    
    .reason-text {
        font-size: 15px;
        color: #475569;
        line-height: 1.75;
        font-weight: 400;
        text-align: justify;
    }
}

.ingredients-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    
    .ingredient-item {
        display: flex;
        align-items: center;
        padding: 8px 0;
        
        .bullet { 
            color: #fda4af; 
            margin-right: 8px; 
            font-size: 18px; 
            line-height: 1;
        }
        .text { 
            font-size: 15px; 
            color: #475569; 
            font-weight: 500;
        }
    }
}

.steps-list {
    .step-item {
        display: flex;
        margin-bottom: 24px;
        
        &:last-child { margin-bottom: 0; }
        
        .step-num {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #fda4af 0%, #f43f5e 100%);
            color: #fff;
            border-radius: 50%;
            text-align: center;
            line-height: 28px;
            font-size: 14px;
            font-weight: 700;
            margin-right: 16px;
            flex-shrink: 0;
            box-shadow: 0 4px 10px rgba(244, 63, 94, 0.25);
            margin-top: 2px;
        }
        
        .step-text {
            font-size: 15px;
            color: #334155;
            line-height: 1.75;
            text-align: justify;
        }
    }
}

.task-card {
    background: #f0f9ff;
    box-shadow: 0 10px 30px -5px rgba(186, 230, 253, 0.4);
    border: 1px solid #e0f2fe;
    
    .task-text {
        font-size: 15px;
        color: #0369a1;
        line-height: 1.75;
        font-weight: 500;
    }
}

.fab-container {
    position: fixed;
    bottom: 30px;
    left: 24px;
    right: 24px;
    z-index: 100;
    
    .btn-primary {
        background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%);
        color: #fff;
        height: 54px;
        line-height: 54px;
        border-radius: 27px;
        font-size: 17px;
        font-weight: 700;
        box-shadow: 0 8px 25px -5px rgba(225, 29, 72, 0.4);
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &::after { border: none; }
        
        &:active {
            transform: scale(0.98);
            box-shadow: 0 4px 15px -3px rgba(225, 29, 72, 0.3);
        }
    }
}

@keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(2deg); }
    100% { transform: translateY(0px) rotate(0deg); }
}
</style>
