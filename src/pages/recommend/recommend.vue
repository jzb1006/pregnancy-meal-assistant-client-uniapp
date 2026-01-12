<template>
  <PageContainer>
    <u-navbar 
        title=" " 
        :placeholder="true" 
        bgColor="transparent" 
        leftIcon=" "
    ></u-navbar>
    
    <view class="content-container">
        <!-- 1. Header Area: Warm Greeting -->
        <view class="header-section">
            <view class="greeting">
                <text class="hi">Hi, 准妈妈</text>
                <text class="sub">今天想吃点什么呢？</text>
            </view>
            <view class="decoration-icon">🥑</view>
        </view>

        <!-- 2. Meal Selector: Card Style -->
        <view class="meal-group">
            <view 
                class="meal-card" 
                v-for="type in mealTypes" 
                :key="type.value"
                :class="{ active: currentType === type.value }"
                @click="currentType = type.value"
            >
                <view class="card-bg"></view>
                <text class="emoji">{{ type.emoji }}</text>
                <text class="label">{{ type.label }}</text>
                <view class="indicator" v-if="currentType === type.value"></view>
            </view>
        </view>

        <!-- 3. Action Area: Large Floating Button -->
        <view class="action-area">
             <button 
                class="generate-btn"
                :class="{ loading: generating }"
                @click="startRecommend"
                :disabled="generating"
            >
                <text class="btn-icon" v-if="!generating">✨</text>
                <text class="btn-text">{{ generating ? 'AI 大厨正在构思...' : '生成今日食谱' }}</text>
            </button>
        </view>

        <!-- 4. Result Area: Premium Gift Style -->
        <view class="result-placeholder" v-if="generating || content || resultData">
            <!-- Phase 1: Atmospheric Loading (Breathing Island) -->
            <transition name="fade">
                <view class="atmospheric-loading" v-if="generating">
                    <view class="breathing-island">
                        <view class="glow-bg"></view>
                        <text class="central-emoji">{{ getLoadingEmoji() }}</text>
                        <view class="orbit-particle p1"></view>
                        <view class="orbit-particle p2"></view>
                    </view>
                    
                    <view class="tips-container">
                        <text class="loading-status">AI 大厨正在为您甄选...</text>
                        <view class="tip-bubble" :key="currentTipIndex">
                           <text class="tip-text">{{ currentTip }}</text>
                        </view>
                    </view>
                </view>
            </transition>

            <!-- Phase 2: Result Card (Gift Unboxing) -->
            <transition name="slide-up">
                <view class="premium-card" v-if="!generating && (resultData || content)">
                    
                    <!-- Top Gradient Decoration -->
                    <view class="card-header-bg"></view>
                    
                    <!-- Streaming Text (Fallback) -->
                    <view v-if="!resultData && content" class="streaming-content">
                        <text class="text">{{ content }}</text>
                        <view class="cursor"></view>
                    </view>

                    <!-- Structured Result -->
                    <view v-else class="structured-result">
                        <!-- Header -->
                        <view class="dish-header">
                            <view class="meta-badges">
                                <view class="badge calories" v-if="resultData.calories">
                                    🔥 {{ resultData.calories }} kcal
                                </view>
                                <view class="badge time" v-if="resultData.timeCost">
                                    🕐 {{ resultData.timeCost }}
                                </view>
                            </view>
                            <text class="dish-title">{{ resultData.dishName }}</text>
                            
                            <view class="divider-line">
                                <text class="icon">✨</text>
                            </view>
                        </view>

                        <!-- Reason (Quote Style) -->
                        <view class="reason-box">
                            <text class="quote-mark left">“</text>
                            <text class="reason-text">{{ resultData.reason }}</text>
                            <text class="quote-mark right">”</text>
                        </view>

                        <!-- Ingredients Grid -->
                        <view class="section-block">
                            <view class="block-title">
                                <text class="icon">🥬</text> 食材清单
                            </view>
                            <view class="ingredients-grid">
                                <view class="ingredient-chip" v-for="(ing, idx) in resultData.ingredients" :key="idx">
                                    <text class="ing-name">{{ ing }}</text>
                                </view>
                            </view>
                        </view>

                        <!-- Steps Timeline -->
                        <view class="section-block">
                            <view class="block-title">
                                <text class="icon">🍳</text> 烹饪步骤
                            </view>
                            <view class="steps-timeline">
                                <view class="timeline-item" v-for="(step, idx) in resultData.steps" :key="idx">
                                    <view class="step-marker">
                                        <view class="heart-shape">{{ idx + 1 }}</view>
                                        <view class="line" v-if="idx !== resultData.steps.length - 1"></view>
                                    </view>
                                    <view class="step-content">
                                        <text class="text">{{ step }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <!-- Husband Task -->
                        <view class="husband-task-box" v-if="resultData.husbandTask">
                            <view class="task-header">
                                <text class="icon">💪</text> 准爸爸请就位
                            </view>
                            <text class="task-desc">{{ resultData.husbandTask }}</text>
                        </view>

                        <!-- Feedback Actions -->
                        <view class="action-footer">
                             <view class="btn-group">
                                <button 
                                    class="footer-btn dislike" 
                                    @click="handleFeedback('DISLIKE')"
                                    :class="{ active: feedback === 'DISLIKE' }"
                                >
                                    <text>👋 不感兴趣</text>
                                </button>
                                <button 
                                    class="footer-btn like" 
                                    @click="handleFeedback('LIKE')"
                                    :class="{ active: feedback === 'LIKE' }"
                                >
                                    <text>❤️ 收藏食谱</text>
                                </button>
                             </view>
                        </view>
                    </view>
                </view>
            </transition>
        </view>
    </view>
    
    <CustomTabBar :current="1" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';
import PageContainer from '@/components/common/PageContainer.vue';
import CustomTabBar from '@/components/common/CustomTabBar.vue';

const userStore = useUserStore();
const currentType = ref('LUNCH');
const generating = ref(false);
const content = ref('');
const resultData = ref<any>(null);
const feedback = ref<string | null>(null);

// Tips Rotation Logic
const currentTipIndex = ref(0);
let tipInterval: any = null;

const mealTypes = [
    { label: '元气早餐', value: 'BREAKFAST', emoji: '🍳' },
    { label: '营养午餐', value: 'LUNCH', emoji: '🍱' },
    { label: '轻食晚餐', value: 'DINNER', emoji: '🥗' },
];

const pregnancyTips = [
    '💡 孕期饮食要注意营养均衡哦',
    '🥛 每天保证充足的钙质摄入',
    '🍊 适量补充维生素C有助于铁吸收', 
    '🐟 深海鱼富含DHA，促进宝宝大脑发育',
    '🥬 多吃绿叶蔬菜，补充叶酸',
    '💧 每天饮水1500-2000ml',
    '🍎 少食多餐，避免暴饮暴食',
    '🧂 控制盐分摄入，预防水肿',
];

const currentTip = computed(() => pregnancyTips[currentTipIndex.value]);

const getLoadingEmoji = () => {
    const target = mealTypes.find(m => m.value === currentType.value);
    return target ? target.emoji : '🥑';
}

const startTipsRotation = () => {
    stopTipsRotation();
    tipInterval = setInterval(() => {
        currentTipIndex.value = (currentTipIndex.value + 1) % pregnancyTips.length;
    }, 3500);
}

const stopTipsRotation = () => {
    if (tipInterval) {
        clearInterval(tipInterval);
        tipInterval = null;
    }
}

const startRecommend = async () => {
    // Reset
    generating.value = true;
    content.value = '正在连接 AI...';
    resultData.value = null;
    feedback.value = null;
    
    startTipsRotation();
    
    try {
        const result: any = await request({
            url: '/v1/meal/recommend',
            method: 'GET',
            data: { mealType: currentType.value }
        });
        
        // Parse result
        if (result && result.code === 200 && result.data) {
            resultData.value = result.data;
        } else if (typeof result === 'object' && result.dishName) {
            resultData.value = result;
        } else {
            throw new Error('Invalid response');
        }
        
    } catch (e: any) {
        console.error('Recommend Error:', e);
        uni.showToast({ title: e.message || '推荐失败', icon: 'none' });
    } finally {
        // Keep loading for at least 1.5s to show the beautiful animation
        setTimeout(() => {
            generating.value = false;
            stopTipsRotation();
        }, 1500);
    }
}

const handleFeedback = async (action: 'LIKE' | 'DISLIKE') => {
    if (!resultData.value) return;
    
    try {
        await request({
            url: '/v1/feedback',
            method: 'POST',
            data: {
                recipeId: resultData.value.id,
                action: action,
                reason: action === 'DISLIKE' ? 'Not interested' : undefined
            }
        });
        feedback.value = action;
        uni.showToast({ title: action === 'LIKE' ? '已收藏' : '已反馈', icon: 'none' });
    } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' });
    }
}

onUnmounted(() => {
    stopTipsRotation();
});

</script>

<style lang="scss" scoped>
.content-container {
    padding: 20px;
    padding-bottom: 120px;
    min-height: 100vh;
    box-sizing: border-box;
}

/* 1. Header Area */
.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-top: 20px;
    
    .greeting {
        display: flex;
        flex-direction: column;
        
        .hi {
            font-size: 32px;
            font-weight: 800;
            color: #334155;
            margin-bottom: 6px;
            letter-spacing: -1px;
            font-family: serif; /* Elegant font */
        }
        
        .sub {
            font-size: 15px;
            color: #64748b;
            font-weight: 500;
        }
    }
    
    .decoration-icon {
        font-size: 48px;
        filter: drop-shadow(0 8px 16px rgba(0,0,0,0.1));
        animation: float 4s ease-in-out infinite;
    }
}

/* 2. Meal Selector */
.meal-group {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 40px;
    
    .meal-card {
        flex: 1;
        height: 100px;
        background: #ffffff;
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 4px 20px rgba(148, 163, 184, 0.05);
        border: 1px solid rgba(255,255,255,0.5);
        
        .card-bg {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            z-index: 0;
            opacity: 1;
            transition: opacity 0.3s;
        }
        
        .emoji {
            font-size: 32px;
            z-index: 1;
            margin-bottom: 6px;
            filter: grayscale(0.3);
            transition: all 0.3s;
        }
        
        .label {
            font-size: 13px;
            color: #94a3b8;
            font-weight: 600;
            z-index: 1;
        }
        
        /* Active State */
        &.active {
            transform: translateY(-4px);
            box-shadow: 0 12px 30px -8px rgba(251, 113, 133, 0.25);
            
            .card-bg {
                background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
            }
            
            .emoji {
                filter: grayscale(0);
                transform: scale(1.15);
            }
            
            .label {
                color: #e11d48;
            }
        }
    }
}

/* 3. Action Area */
.action-area {
    margin-bottom: 40px;
    
    .generate-btn {
        width: 100%;
        height: 64px;
        background: linear-gradient(90deg, #fb7185, #f43f5e);
        border-radius: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        box-shadow: 0 12px 30px -6px rgba(244, 63, 94, 0.35);
        transition: all 0.3s;
        
        &:disabled {
           opacity: 0.7;
           filter: grayscale(0.2);
           transform: scale(0.98);
        }
        
        &:active:not(:disabled) {
            transform: scale(0.96);
            box-shadow: 0 4px 12px -2px rgba(244, 63, 94, 0.35);
        }

        .btn-text {
            color: #fff;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1px;
        }
    }
}

/* 4. Result Area Container */
.result-placeholder {
    min-height: 400px;
    position: relative;
}

/* Atmospheric Loading */
.atmospheric-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 40px;
    height: 300px;
    
    .breathing-island {
        position: relative;
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 40px;
        
        .central-emoji {
            font-size: 64px;
            z-index: 2;
            animation: breathe 3s ease-in-out infinite;
        }
        
        .glow-bg {
            position: absolute;
            width: 100%; height: 100%;
            background: radial-gradient(circle, rgba(253,164,175,0.4) 0%, rgba(255,255,255,0) 70%);
            border-radius: 50%;
            animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .orbit-particle {
            position: absolute;
            background: #fda4af;
            border-radius: 50%;
            opacity: 0.6;
            
            &.p1 { width: 8px; height: 8px; top: 0; animation: orbit 4s linear infinite; }
            &.p2 { width: 6px; height: 6px; bottom: 10px; right: 10px; animation: orbit 6s linear infinite reverse; }
        }
    }
    
    .tips-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 60px;
        
        .loading-status {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 12px;
            font-weight: 500;
        }
        
        .tip-bubble {
            background: #fff;
            padding: 8px 24px;
            border-radius: 100px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            animation: float-bubble 3s ease-in-out infinite;
            
            .tip-text {
                font-size: 15px;
                color: #475569;
                font-family: serif;
                font-weight: 600;
            }
        }
    }
}

/* Premium Card (The Result) */
.premium-card {
    background: #fff;
    border-radius: 32px;
    overflow: hidden;
    position: relative;
    box-shadow: 
        0 20px 60px -12px rgba(253, 164, 175, 0.2),
        0 0 1px rgba(0,0,0,0.02);
    margin-bottom: 40px;
    border: 1px solid rgba(255,241,242, 0.8);
    
    .card-header-bg {
        height: 100px;
        background: linear-gradient(135deg, #fff1f2 0%, #fff 100%);
        position: absolute;
        top: 0; left: 0; right: 0;
        z-index: 0;
    }
    
    .structured-result {
        position: relative;
        z-index: 1;
        padding: 40px 24px;
    }
    
    /* Dish Header */
    .dish-header {
        text-align: center;
        margin-bottom: 30px;
        
        .meta-badges {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 16px;
            
            .badge {
                font-size: 12px;
                padding: 4px 12px;
                border-radius: 100px;
                background: rgba(255,255,255,0.6);
                backdrop-filter: blur(4px);
                border: 1px solid rgba(0,0,0,0.05);
                color: #64748b;
                font-weight: 600;
                
                &.calories { color: #e11d48; background: rgba(255,228,230, 0.5); }
            }
        }
        
        .dish-title {
            font-size: 28px;
            font-weight: 800;
            color: #1e293b;
            line-height: 1.3;
            text-shadow: 0 2px 20px rgba(251, 113, 133, 0.1);
            letter-spacing: -0.5px;
            display: block;
            margin-bottom: 20px;
        }
        
        .divider-line {
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.3;
            
            &::before, &::after {
                content: '';
                height: 1px;
                width: 40px;
                background: #cbd5e1;
            }
            .icon { margin: 0 10px; font-size: 12px; }
        }
    }
    
    /* Reason Quote */
    .reason-box {
        text-align: center;
        margin-bottom: 40px;
        padding: 0 10px;
        position: relative;
        
        .reason-text {
            font-size: 16px;
            color: #475569;
            line-height: 1.8;
            font-weight: 500; 
            font-family: serif;
        }
        
        .quote-mark {
            font-family: serif;
            font-size: 40px;
            color: #ffd4db;
            position: absolute;
            line-height: 1;
            
            &.left { top: -10px; left: 0; }
            &.right { bottom: -20px; right: 0; }
        }
    }
    
    /* Section Shared */
    .section-block {
        margin-bottom: 40px;
        
        .block-title {
            text-align: center;
            font-size: 14px;
            color: #94a3b8;
            font-weight: 700;
            margin-bottom: 24px;
            text-transform: uppercase;
            letter-spacing: 1px;
            
            .icon { margin-right: 6px; }
        }
    }
    
    /* Ingredients Grid */
    .ingredients-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
        
        .ingredient-chip {
            /* Pill shape with auto width */
            width: auto;
            min-width: 60px;
            padding: 8px 16px;
            background: linear-gradient(135deg, #fffcfc 0%, #fefce8 100%);
            border-radius: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
                0 4px 10px rgba(0,0,0,0.03),
                inset 0 2px 4px rgba(255,255,255,1);
            border: 1px solid rgba(254, 240, 138, 0.4);
            transition: transform 0.2s;
            margin-bottom: 4px;
            
            &:active {
                transform: scale(0.95);
            }
            
            .ing-name {
                font-size: 14px;
                font-weight: 600;
                color: #78350f;
                text-align: center;
                line-height: 1.4;
            }
        }
    }
    
    /* Timeline */
    .steps-timeline {
        padding: 0 10px;
        
        .timeline-item {
            display: flex;
            margin-bottom: 24px;
            
            .step-marker {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-right: 16px;
                width: 24px;
                flex-shrink: 0;
                
                .heart-shape {
                    width: 24px;
                    height: 24px;
                    background: #ffe4e6;
                    color: #f43f5e;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 4px;
                }
                
                .line {
                    width: 1px;
                    flex: 1;
                    background: repeating-linear-gradient(to bottom, #fecdd3 0, #fecdd3 4px, transparent 4px, transparent 8px);
                }
            }
            
            .step-content {
                padding-top: 2px;
                .text {
                    font-size: 15px;
                    color: #334155;
                    line-height: 1.6;
                }
            }
        }
    }
    
    /* Husband Task */
    .husband-task-box {
        background: #f0f9ff;
        border: 1px dashed #bae6fd;
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        margin-bottom: 30px;
        
        .task-header {
            color: #0284c7;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .task-desc {
            color: #0c4a6e;
            font-size: 15px;
        }
    }
    
    /* Footer */
    .action-footer {
        .btn-group {
            display: flex;
            gap: 16px;
            
            .footer-btn {
                flex: 1;
                height: 50px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                font-weight: 700;
                border: none;
                
                &.like {
                    background: #f43f5e;
                    color: #fff;
                    box-shadow: 0 8px 20px -4px rgba(244, 63, 94, 0.4);
                }
                
                &.dislike {
                    background: #f1f5f9;
                    color: #64748b;
                }
                
                &:active { transform: scale(0.98); }
            }
        }
    }
    
    /* Streaming Fallback */
    .streaming-content {
        padding: 40px 24px;
        font-size: 16px;
        line-height: 1.8;
        color: #334155;
        
        .cursor {
            display: inline-block;
            width: 2px;
            height: 18px;
            background: #f43f5e;
            animation: blink 1s infinite;
            margin-left: 4px;
            vertical-align: middle;
        }
    }
}

/* Animations */
@keyframes float {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(-10px) rotate(5deg); }
}

@keyframes breathe {
    0%, 100% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.1); filter: brightness(1.1); }
}

@keyframes pulse-glow {
    0%, 100% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(1.5); opacity: 0.1; }
}

@keyframes orbit {
    from { transform: rotate(0deg) translateX(50px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
}

@keyframes float-bubble {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from { transform: translateY(40px); opacity: 0; }
</style>
