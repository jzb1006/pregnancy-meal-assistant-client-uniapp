<template>
  <view class="daily-recipe-container">
    <view class="section-header">
      <text class="title">今日推荐</text>
      <text class="more" @click="handleMore">换一换 🔄</text>
    </view>
    
    <!-- Recipe Card -->
    <view class="recipe-card" @click="goToDetail" v-if="!loading && recipe">
      <view class="image-area">
        <text class="emoji-img">🍲</text>
      </view>
      
      <view class="card-info">
        <view class="recipe-title-row">
            <text class="recipe-title">{{ recipe.dishName }}</text>
            <view class="calorie-tag" v-if="recipe.nutrition">
                <text class="tag-text">🔥 {{ recipe.nutrition.calories }} kcal</text>
            </view>
        </view>
        
        <text class="recipe-desc">{{ recipe.reason }}</text>
        
        <view class="footer-row">
            <view class="tags">
                <text class="tag" v-for="(tag, index) in recipe.tags" :key="index">{{ tag }}</text>
            </view>
            <view class="action-btn">
                <text class="btn-text">查看做法</text>
            </view>
        </view>
      </view>
    </view>
    
    <!-- Loading States -->
    <view v-if="loading" class="recipe-card loading-state">
        <view class="card-info" style="align-items: center; justify-content: center; height: 260px; display: flex; flex-direction: column;">
            <text style="font-size: 40px; margin-bottom: 20px;">👩‍🍳</text>
            <text style="color: #333; font-weight: 500; font-size: 15px; margin-bottom: 8px;">定制食谱中...</text>
            <text style="color: #999; font-size: 13px; text-align: center; padding: 0 20px;">{{ tips[currentTipIndex] }}</text>
        </view>
    </view>
    
    <view v-if="!loading && !recipe" class="recipe-card loading-state">
        <view class="card-info" style="align-items: center; justify-content: center; height: 200px; display: flex;">
             <text style="color: #999;">正在生成今日推荐...</text>
        </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { getDailyRecommendation, swapRecommendation, type MealVO } from '@/api/service';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const recipe = ref<MealVO | null>(null);
const loading = ref(false);

const tips = [
  "孕期饮食小贴士：少食多餐，减轻肠胃负担。",
  "正在为您咨询米其林大厨...",
  "补充叶酸有助于宝宝神经发育哦。",
  "稍微等一下，大厨正在重新构思菜单...",
  "多吃深色蔬菜，补充维生素。",
  "由于本次需要重新生成，可能需要 5-10 秒，请耐心等待..."
];
const currentTipIndex = ref(0);
let intervalId: number | null = null;


const loadDailyRecommendation = async () => {
  try {
    const result: any = await getDailyRecommendation(userStore.openId);
    
    // Direct assignment as backend now returns MealVO structure
    recipe.value = result as MealVO;

  } catch (e) {
    console.error('Load Error:', e);
  }
};

onMounted(() => {
  if (userStore.openId) {
    loadDailyRecommendation();
  }
});

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
});

const startCarousel = () => {
    currentTipIndex.value = 0;
    intervalId = setInterval(() => {
        currentTipIndex.value = (currentTipIndex.value + 1) % tips.length;
    }, 2500);
}

const stopCarousel = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

const handleMore = async () => {
    if (loading.value) return;
    
    loading.value = true;
    startCarousel();
    
    const startTime = Date.now();
    
    try {
        const result: any = await swapRecommendation(userStore.openId);
        
        recipe.value = result as MealVO;
        
        uni.showToast({ title: '已为您更换推荐', icon: 'success' });
    } catch (e: any) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 800) {
            await new Promise(r => setTimeout(r, 800 - elapsed));
        }
        
        let msg = e.message || e.errMsg || '刷新失败';
        
        // If e is the response object from reject(res)
        if (e.data && e.data.message) {
            msg = e.data.message;
        }
        
        if (msg.includes('上限') || msg.includes('5次')) {
             uni.showToast({ title: '每天只能换5次哦,明天再来试试吧!', icon: 'none', duration: 2000 });
        } else {
             uni.showToast({ title: msg, icon: 'none' });
        }
    } finally {
        stopCarousel();
        loading.value = false;
    }
}

const goToDetail = () => {
    if (loading.value || !recipe.value) return;
    
    // Store data to local storage for the detail page to pick up
    uni.setStorageSync('CURRENT_RECIPE_DETAIL', recipe.value);
    
    uni.navigateTo({
        url: '/pages/recipe/detail'
    });
}
</script>

<style lang="scss" scoped>
.daily-recipe-container {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 8px;
  
  .title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  .more {
    font-size: 13px;
    color: #FF8F94; 
  }
}

.recipe-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  }
  
  .image-area {
    height: 160px;
    background: #FFF5F5;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .emoji-img { font-size: 80px; }
  }
  
  .card-info {
    padding: 20px;
    
    .recipe-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .recipe-title { font-size: 18px; font-weight: 600; color: #333; }
        
        .calorie-tag {
            background: #F5F7FA;
            padding: 4px 8px;
            border-radius: 8px;
            .tag-text { font-size: 11px; color: #666; }
        }
    }
    
    .recipe-desc {
        font-size: 14px;
        color: #666;
        line-height: 1.6;
        margin-bottom: 12px;
        display: block;
    }
    
    .footer-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .tags {
            display: flex;
            gap: 8px;
            .tag {
                font-size: 11px;
                color: #FF8F94;
                background: rgba(255, 143, 148, 0.1);
                padding: 4px 8px;
                border-radius: 6px;
            }
        }
        
        .action-btn {
            background: #333;
            padding: 8px 16px;
            border-radius: 20px;
            .btn-text { color: #fff; font-size: 12px; font-weight: 500; }
        }
    }
  }
}
</style>
