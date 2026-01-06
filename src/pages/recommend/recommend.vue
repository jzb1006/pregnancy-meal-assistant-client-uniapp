<template>
  <PageContainer>
    <u-navbar title="AI 营养师" :placeholder="true" leftIcon=" "></u-navbar>
    
    <view class="content-container">
        <!-- Meal Type Selector -->
        <view class="meal-selector">
            <view 
                class="meal-opt" 
                v-for="type in mealTypes" 
                :key="type.value"
                :class="{ active: currentType === type.value }"
                @click="currentType = type.value"
            >
                <text class="emoji">{{ type.emoji }}</text>
                <text class="label">{{ type.label }}</text>
            </view>
        </view>

        <!-- Generate Button -->
        <view class="action-area">
             <u-button 
                :text="generating ? 'AI 思考中...' : '生成推荐'" 
                shape="circle" 
                :type="generating ? 'info' : 'primary'" 
                :loading="generating"
                color="linear-gradient(90deg, #fda4af, #f43f5e)"
                customStyle="height: 48px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);"
                @click="startRecommend"
            ></u-button>
        </view>

        <!-- Result Area -->
        <view class="result-area" v-if="content || generating">
            <view class="result-card">
                 <!-- Streaming Content -->
                 <Transition name="fade-slide" mode="out-in">
                    <scroll-view 
                        key="streaming"
                        scrollY 
                        :scrollTop="scrollTop"
                        scroll-with-animation="true"
                        v-if="generating || !resultData" 
                        class="streaming-text"
                    >
                        <view v-if="generating" class="loading-container">
                            <view class="ai-spinner">
                                <view class="ring"></view>
                                <view class="ring"></view>
                                <view class="core">AI</view>
                            </view>
                            <text class="loading-title">AI 正在精心为您定制...</text>
                            <view class="tips-carousel">
                                <swiper 
                                    class="tips-swiper" 
                                    vertical 
                                    autoplay 
                                    circular 
                                    :interval="3000" 
                                    :duration="500"
                                    :disable-touch="true"
                                >
                                    <swiper-item v-for="(tip, index) in pregnancyTips" :key="index" class="swiper-item">
                                        <view class="tip-content">
                                            <text class="tip-text">{{ tip }}</text>
                                        </view>
                                    </swiper-item>
                                </swiper>
                            </view>
                        </view>
                        <text v-else class="text">{{ content }}</text>
                        <!-- Anchor for scrolling -->
                        <view style="height: 10px; width: 100%"></view> 
                    </scroll-view>
                 
                    <view v-else key="result" class="recipe-content">
                     <view class="header">
                         <text class="title">{{ resultData.dishName }}</text>
                         <view class="tags">
                             <view class="tag">{{ resultData.calories }} kcal</view>
                             <view class="tag warning" v-if="resultData.timeCost">{{ resultData.timeCost }}</view>
                         </view>
                     </view>

                     <view class="section">
                         <text class="sec-title">推荐理由</text>
                         <text class="sec-body">{{ resultData.reason }}</text>
                     </view>

                     <view class="section">
                         <text class="sec-title">食材清单</text>
                         <view class="ing-list">
                             <text class="ing-item" v-for="(ing, idx) in resultData.ingredients" :key="idx">{{ ing }}</text>
                         </view>
                     </view>

                     <view class="section">
                         <text class="sec-title">烹饪步骤</text>
                         <view class="step-list">
                             <view class="step-item" v-for="(step, idx) in resultData.steps" :key="idx">
                                 <text class="idx">{{ idx + 1 }}</text>
                                 <text class="desc">{{ step }}</text>
                             </view>
                         </view>
                     </view>

                     <!-- Husband Task -->
                     <view class="husband-task" v-if="resultData.husbandTask">
                         <text class="icon">👨‍🍳</text>
                         <text class="label">准爸爸任务：</text>
                         <text class="task-desc">{{ resultData.husbandTask }}</text>
                     </view>

                     <!-- Feedback Actions -->
                     <view class="feedback-actions">
                         <u-button 
                            size="small" 
                            shape="circle" 
                            :plain="true" 
                            :type="feedback === 'DISLIKE' ? 'error' : 'info'"
                            @click="handleFeedback('DISLIKE')"
                         >👎 不感兴趣</u-button>
                         <u-button 
                            size="small" 
                            shape="circle" 
                            :plain="true" 
                            :type="feedback === 'LIKE' ? 'error' : 'info'"
                            @click="handleFeedback('LIKE')"
                         >❤️ 收藏食谱</u-button>
                     </view>
                 </view>
                 </Transition>
            </view>
        </view>
    </view>
    
    <CustomTabBar :current="1" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, nextTick } from 'vue';
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
const scrollTop = ref(0);
const currentTipIndex = ref(0);
let tipInterval: any = null;

const mealTypes = [
    { label: '早餐', value: 'BREAKFAST', emoji: '🍳' },
    { label: '午餐', value: 'LUNCH', emoji: '🍱' },
    { label: '晚餐', value: 'DINNER', emoji: '🥘' },
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

const startRecommend = async () => {
    if (!userStore.openId) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
    }
    
    // Reset
    generating.value = true;
    content.value = '正在连接 AI...';
    resultData.value = null;
    feedback.value = null;
    
    try {
        // Use normal request instead of SSE for mini-program compatibility
        const result: any = await request({
            url: '/v1/meal/recommend',
            method: 'GET',
            data: { openId: userStore.openId, mealType: currentType.value }
        });
        
        // Parse result
        if (result && result.code === 200 && result.data) {
            resultData.value = result.data;
        } else if (typeof result === 'object' && result.dishName) {
            // Direct MealVO object
            resultData.value = result;
        } else {
            throw new Error('Invalid response');
        }
        
    } catch (e: any) {
        console.error('Recommend Error:', e);
        uni.showToast({ title: e.message || '推荐失败', icon: 'none' });
    } finally {
        generating.value = false;
    }
}

const handleFeedback = async (action: 'LIKE' | 'DISLIKE') => {
    if (!resultData.value) return;
    
    try {
        await request({
            url: '/v1/feedback',
            method: 'POST',
            data: {
                openId: userStore.openId,
                recipeId: resultData.value.id, // Assuming ID is in result
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

</script>

<style lang="scss" scoped>
.content-container {
    padding: 20px;
    padding-bottom: 100px;
}

.meal-selector {
    display: flex;
    justify-content: space-between;
    background: #fff;
    padding: 6px;
    border-radius: 100px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    margin-bottom: 40px;
    
    .meal-opt {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 10px 0;
        border-radius: 100px;
        transition: all 0.3s;
        
        .emoji { margin-right: 6px; font-size: 16px; }
        .label { font-size: 13px; color: #64748b; font-weight: 600; }
        
        &.active {
            background: #fff1f2;
            .label { color: #f43f5e; }
        }
    }
}

.action-area {
    margin-bottom: 30px;
}

.result-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 24px;
    padding: 24px;
    min-height: 200px;
    box-shadow: 0 10px 40px -10px rgba(253, 164, 175, 0.3);
    transition: all 0.3s ease;
    
    .streaming-text {
        font-size: 14px;
        color: #334155;
        line-height: 1.8;
        white-space: pre-wrap;
        word-wrap: break-word;
        height: auto;
        max-height: 60vh;
        width: 100%;
        box-sizing: border-box; 
        padding: 16px;
        // animation handled by Transition component
        
        .text { 
           // Blinking cursor effect
           &::after {
               content: '';
               display: inline-block;
               width: 2px;
               height: 18px;
               background: #f43f5e;
               margin-left: 2px;
               vertical-align: middle;
               animation: blink 1s infinite;
           }
        }
    }
    
    .recipe-content {
        animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1); // Smooth entrance
        
        .header {
            .title { font-size: 18px; font-weight: 700; color: #1e293b; display: block; margin-bottom: 8px; letter-spacing: 0.5px; }
            .tags {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                .tag {
                    font-size: 11px;
                    padding: 3px 10px;
                    background: #f1f5f9;
                    color: #64748b;
                    border-radius: 100px;
                    
                    &.warning { background: #fff7ed; color: #ea580c; }
                }
            }
        }
        
        .section {
            margin-bottom: 20px;
            .sec-title {
                font-size: 13px;
                font-weight: 600;
                color: #94a3b8;
                margin-bottom: 8px;
                display: block;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .sec-body { font-size: 13px; color: #334155; line-height: 1.6; }
            
            .ing-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                .ing-item {
                    font-size: 13px;
                    padding: 6px 12px;
                    background: rgba(248, 250, 252, 0.8);
                    border-radius: 10px;
                    color: #475569;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.03);
                }
            }
            
            .step-list {
                .step-item {
                    display: flex;
                    margin-bottom: 12px;
                    
                    .idx { 
                        width: 20px; 
                        height: 20px; 
                        background: #ffe4e6; 
                        color: #f43f5e; 
                        font-size: 12px; 
                        font-weight: bold; 
                        border-radius: 50%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        margin-right: 10px; 
                        flex-shrink: 0;
                        box-shadow: 0 2px 6px rgba(244, 63, 94, 0.2);
                    }
                    .desc { font-size: 13px; color: #334155; line-height: 1.6; flex: 1; }
                }
            }
        }
        
        .feedback-actions {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #f1f5f9;
        }
        
        .husband-task {
            background: rgba(239, 246, 255, 0.7);
            border-radius: 16px;
            padding: 16px;
            margin-top: 24px;
            display: flex;
            align-items: flex-start;
            backdrop-filter: blur(5px);
            box-shadow: 0 2px 10px rgba(219, 234, 254, 0.3);
            
            .icon { font-size: 20px; margin-right: 10px; }
            .label { font-size: 13px; font-weight: bold; color: #1d4ed8; margin-right: 4px; white-space: nowrap; margin-top: 2px; }
            .task-desc { font-size: 13px; color: #1e3a8a; line-height: 1.6; margin-top: 2px; }
        }
    }
}

// Keyframes
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

@keyframes slideUpFade {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0; /* Remove horizontal padding here */
    width: 100%;
    
    .ai-spinner {
        position: relative;
        width: 100px;
        height: 100px;
        margin-bottom: 32px;
        
        .ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 4px solid transparent;
            border-top-color: #f43f5e;
            border-radius: 50%;
            animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
            filter: drop-shadow(0 0 8px rgba(244, 63, 94, 0.3));
            
            &:nth-child(2) {
                width: 70%;
                height: 70%;
                top: 15%;
                left: 15%;
                animation-delay: -0.5s;
                border-top-color: #fda4af;
                animation-duration: 2s;
                border-width: 3px;
            }
        }
        
        .core {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 20px;
            font-weight: 800;
            color: #f43f5e;
            animation: pulse 2s ease-in-out infinite;
            letter-spacing: 1px;
        }
    }
    
    .loading-title {
        font-size: 16px;
        color: #334155;
        font-weight: 700;
        margin-bottom: 24px;
        opacity: 0.9;
        letter-spacing: 0.5px;
    }
    
    .tips-carousel {
        background: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(254, 226, 226, 0.6);
        border-radius: 20px;
        padding: 0 12px;
        width: 80%; /* Relative width */
        max-width: 300px;
        height: 50px;
        margin: 0 auto; /* Ensure horizontal centering */
        box-shadow: 0 8px 24px rgba(253, 164, 175, 0.15);
        backdrop-filter: blur(5px);
        overflow: hidden;

        .tips-swiper {
            width: 100%;
            height: 100%;
            
            .swiper-item {
                width: 100%;
                height: 100%;
                
                .tip-content {
                    width: 100%;
                    height: 100%;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .tip-text {
                    font-size: 14px;
                    color: #64748b;
                    line-height: 1.5;
                    font-weight: 500;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    overflow: hidden;
                }
            }
        }
    }
}

// Vue Transition Classes
.fade-slide-enter-active {
    animation: slideUpFade 0.5s ease-out;
}
.fade-slide-leave-active {
    transition: opacity 0.3s ease;
}
.fade-slide-leave-to {
    opacity: 0;
}
</style>
