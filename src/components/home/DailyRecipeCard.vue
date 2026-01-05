<template>
  <view class="daily-recipe-container">
    <view class="section-header">
      <text class="title">今日推荐</text>
      <text class="more" @click="handleMore">换一换 🔄</text>
    </view>
    
    <!-- Collapsed Card State -->
    <view class="recipe-card" @click="toggleExpand" v-if="!loading && recipe">
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

    <!-- Expanded Card State (Full Screen Popup) -->
    <view class="popup-overlay" v-if="!loading && recipe && isExpanded">
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

        <view class="content-body">
            <!-- Nutrition & Time -->
            <view class="meta-row">
                <view class="meta-item">
                    <text class="meta-icon">🔥</text>
                    <text class="meta-label">{{ recipe.nutrition ? recipe.nutrition.calories : 0 }} kcal</text>
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
            
            <!-- Reason -->
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

            <!-- Collapse Button -->
            <button class="btn-block" @click.stop="toggleExpand">我学会了 😤</button>
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
const isExpanded = ref(false); // State to toggle expanded view

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

const parseStreamResponse = (input: any): any => {
    // 0. If already an object...
    if (typeof input === 'object' && input !== null && !(input instanceof ArrayBuffer)) {
        return input;
    }
    
    if (!input) return {}; 

    let cleanText = '';

    // 1. Handle ArrayBuffer
    if (input instanceof ArrayBuffer) {
        try {
            // @ts-ignore
            if (typeof TextDecoder !== 'undefined') {
                // @ts-ignore
                const decoder = new TextDecoder('utf-8');
                cleanText = decoder.decode(input);
            } else {
                // @ts-ignore
                cleanText = String.fromCharCode.apply(null, new Uint8Array(input));
                try { cleanText = decodeURIComponent(escape(cleanText)); } catch (e) {}
            }
        } catch (e) {
            console.error("ArrayBuffer Decode Error", e);
            throw new Error("响应解码失败");
        }
    } else {
        cleanText = String(input).trim();
    }

    if (!cleanText) return {};

    // 2. Handle SSE (data: prefix) - Accumulate ALL fragments
    let combinedPayload = '';
    
    if (cleanText.includes("data:")) {
        const events = cleanText.split(/\n\n+/); 
        
        for (const event of events) {
            if (!event.trim()) continue;
            
            const lines = event.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                // Skip [DONE]
                if (trimmed.includes('[DONE]')) continue;
                
                if (trimmed.startsWith('data:')) {
                    combinedPayload += trimmed.replace(/^data:\s*/, '');
                } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                     // Handle data without prefix
                     combinedPayload += trimmed;
                } else if (!trimmed.startsWith('event:') && !trimmed.startsWith('id:') && !trimmed.startsWith(':')) {
                    // Try to catch raw lines that might be part of the content if split weirdly
                    combinedPayload += trimmed;
                }
            }
        }
    } else {
        // Not SSE, use raw text
        combinedPayload = cleanText;
    }
    
    // If we extracted something, use it; otherwise fallback to original
    let textToParse = combinedPayload || cleanText;

    // 3. Handle Markdown
    const codeBlockMatch = textToParse.match(/```json\s*([\s\S]*?)\s*```/) || textToParse.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
        textToParse = codeBlockMatch[1];
    }

    // 4. Extract JSON
    const firstOpen = textToParse.search(/[\{\[]/);
    const lastClose = Math.max(textToParse.lastIndexOf('}'), textToParse.lastIndexOf(']'));
    
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        textToParse = textToParse.substring(firstOpen, lastClose + 1);
    }

    // 5. Attempt Parse
    try {
        return JSON.parse(textToParse);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Input Type:", typeof input, "Text:", textToParse.substring(0, 100));
        throw new Error("解析响应失败 (Format Error)");
    }
};

const loadDailyRecommendation = async () => {
  try {
    let fullText = '';
    const res: any = await getDailyRecommendation(userStore.openId, (chunk) => {
        fullText += chunk;
    });
    
    if (!fullText && res && res.data) {
        fullText = res.data; 
    }

    const result = parseStreamResponse(fullText);
    
    if (result.code && result.code !== 0 && result.code !== 200) {
         throw new Error(result.message || 'Load Error');
    }
    
    let rawData = result;
    if (result.data && (result.code === 200 || result.code === 0)) {
        rawData = result.data;
    }

    // Direct assignment as backend now matches MealVO structure
    recipe.value = rawData as MealVO;

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
    let fullText = '';
    
    try {
        const res: any = await swapRecommendation(userStore.openId, (chunk) => {
            fullText += chunk;
        });

        if (!fullText && res && res.data) {
            fullText = res.data; 
        }

        const result = parseStreamResponse(fullText);
        
        if (result.code && result.code !== 0 && result.code !== 200) {
            throw new Error(result.message || 'Error');
        }
        
        let rawData = result;
        if (result.data && (result.code === 200 || result.code === 0)) {
            rawData = result.data;
        }
        
        recipe.value = rawData as MealVO;
        
        uni.showToast({ title: '已为您更换推荐', icon: 'success' });
    } catch (e: any) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 800) {
            await new Promise(r => setTimeout(r, 800 - elapsed));
        }
        
        // Try to parse error from gathered text if promise failed but some text came?
        // Usually stream error throws.
        
        let msg = e.message || e.errMsg || '刷新失败';
        
        // If e is the response object from reject(res)
        if (e.data && e.data.message) {
            msg = e.data.message;
        }
        
        if (msg.includes('上限') || msg.includes('5次')) {
             uni.showToast({ title: '每天只能换5次哦，明天再来试试吧！', icon: 'none', duration: 2000 });
        } else {
             uni.showToast({ title: msg, icon: 'none' });
        }
    } finally {
        stopCarousel();
        loading.value = false;
        isExpanded.value = false; // Collapse on swap
    }
}

const toggleExpand = () => {
    if (loading.value) return;
    
    isExpanded.value = !isExpanded.value;
    
    if (isExpanded.value) {
        // uni.hideTabBar(); // Removed as per user request
    } else {
        // uni.showTabBar(); // Removed as per user request
    }
}
</script>

<style lang="scss" scoped>
/* Scoped styles ... */

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

/* FULL SCREEN POPUP OVERLAY */
.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    background: #F8F9FC;
    overflow-y: scroll; /* Force scroll behavior */
    -webkit-overflow-scrolling: touch; /* Smooth scroll on iOS */
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); /* Smoother spring-like curve */
    
    .header-image {
      height: 280px; /* Slightly taller for impact */
      background-color: #FFF5F5;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .emoji-img { font-size: 100px; }
      
      .header-overlay {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 120px;
        background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
      }
      
      .header-content {
        position: absolute;
        bottom: 24px;
        left: 20px;
        right: 20px;
        
        .dish-name {
            font-size: 30px;
            font-weight: 700;
            color: #fff;
            display: block;
            margin-bottom: 10px;
            text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            .tag {
                font-size: 12px;
                color: #fff;
                background: rgba(255,255,255,0.25);
                backdrop-filter: blur(8px);
                padding: 4px 12px;
                border-radius: 14px;
            }
        }
      }
    }

    .content-body {
        padding: 24px;
        margin-top: -24px;
        position: relative;
        border-radius: 24px 24px 0 0;
        background: #F8F9FC;
        /* Ensure enough space for the button and safe area */
        padding-bottom: calc(100px + env(safe-area-inset-bottom));
    }

    .meta-row {
        display: flex;
        justify-content: space-around;
        background: #fff;
        padding: 16px;
        border-radius: 20px;
        margin-bottom: 24px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        
        .meta-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            .meta-icon { font-size: 22px; }
            .meta-label { font-size: 13px; color: #555; font-weight: 600; }
        }
    }

    .section-card {
        background: #fff;
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.03);
        border: none;
        
        .section-title-row {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            .section-icon { font-size: 22px; margin-right: 10px; }
            .section-title { font-size: 18px; font-weight: 700; color: #333; }
        }
    }

    .reason-card {
        background: linear-gradient(135deg, #fff, #FFF0F1);
        border: 1px solid #FFEBEB;
        .reason-text { font-size: 15px; color: #555; line-height: 1.7; letter-spacing: 0.5px; }
    }

    .ingredients-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        .ingredient-item {
            display: flex;
            align-items: flex-start;
            .bullet { color: #FF8F94; margin-right: 8px; font-size: 16px; line-height: 1.4; }
            .text { font-size: 15px; color: #444; line-height: 1.4; }
        }
    }

    .steps-list {
        .step-item {
            display: flex;
            margin-bottom: 24px;
            &:last-child { margin-bottom: 0; }
            .step-num {
                width: 26px; height: 26px;
                background: #333; color: #fff;
                border-radius: 50%;
                text-align: center; line-height: 26px;
                font-size: 14px; font-weight: 600;
                margin-right: 14px; flex-shrink: 0; margin-top: 2px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            }
            .step-text { font-size: 15px; color: #444; line-height: 1.7; }
        }
    }

    .task-card {
        background: #F0F7FF;
        border: 1px dashed #B8D4FF;
        .task-text { font-size: 15px; color: #446688; line-height: 1.6; }
    }

    .btn-block {
        background: #222;
        color: #fff;
        height: 56px;
        line-height: 56px;
        border-radius: 28px;
        font-size: 18px;
        font-weight: 600;
        width: 100%;
        margin-top: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        &::after { border: none; }
        transition: transform 0.2s;
        
        &:active {
            transform: scale(0.96);
        }
    }
}

@keyframes slideUp {
    from { transform: translateY(100vh); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>
