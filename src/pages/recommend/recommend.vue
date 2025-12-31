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
                        <u-loading-icon v-if="generating" mode="semicircle" color="#f43f5e" size="24"></u-loading-icon>
                        <text class="text">{{ content }}</text>
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
let eventSource: EventSource | null = null;

const mealTypes = [
    { label: '早餐', value: 'BREAKFAST', emoji: '🍳' },
    { label: '午餐', value: 'LUNCH', emoji: '🍱' },
    { label: '晚餐', value: 'DINNER', emoji: '🥘' },
];

const startRecommend = () => {
    if (!userStore.openId) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
    }
    
    // Reset
    if (eventSource) eventSource.close();
    generating.value = true;
    content.value = '正在连接 AI 大脑...';
    resultData.value = null;
    feedback.value = null;

    // SSE Connection (H5 Compatible)
    // NOTE: For Mini Program, need to implement manual chunk reading via uni.request({ enableChunked: true })
    const url = `http://localhost:8080/api/v1/meal/recommend/stream?openId=${userStore.openId}&mealType=${currentType.value}`;
    
    // Check if EventSource is supported (H5 / App-Webview)
    if (typeof EventSource !== 'undefined') {
        eventSource = new EventSource(url);
        
        eventSource.addEventListener('start', (e: any) => {
            console.log('SSE Start');
            content.value = ''; // Clear initial message
            scrollTop.value = 0;
        });

        eventSource.addEventListener('chunk', (e: any) => {
            content.value += e.data;
            // Force scroll to bottom with nextTick to ensure render is updated
            nextTick(() => {
                 scrollTop.value = 99999 + Math.random(); 
            });
        });

        eventSource.addEventListener('complete', (e: any) => {
            try {
                const json = JSON.parse(e.data);
                resultData.value = json;
            } catch (err) {
                console.error('Parse Error', err);
            }
            generating.value = false;
            eventSource?.close();
        });

        eventSource.onerror = (err) => {
            console.error('SSE Error', err);
            if (eventSource?.readyState === EventSource.CLOSED) {
                generating.value = false;
            } else {
                eventSource?.close();
                generating.value = false;
            }
        };
    } else {
        // Fallback for non-SSE environments (Basic Request)
        uni.showToast({ title: '当前环境不支持流式传输', icon: 'none' });
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

onUnmounted(() => {
    if (eventSource) eventSource.close();
});
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
    border: 1px solid #f1f5f9;
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
        .label { font-size: 14px; color: #64748b; font-weight: 600; }
        
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
    background: rgba(255, 255, 255, 0.85); // Transparent for glass effect
    backdrop-filter: blur(12px);          // Blur effect
    border-radius: 24px;
    padding: 24px;
    min-height: 200px;
    box-shadow: 0 10px 40px -10px rgba(253, 164, 175, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.6);
    transition: all 0.3s ease;
    
    .streaming-text {
        font-size: 16px;
        color: #334155;
        line-height: 1.8;
        white-space: pre-wrap;
        max-height: 50vh;
        overflow-y: auto;
        width: 100%;
        width: 100%;
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
            .title { font-size: 24px; font-weight: 800; color: #1e293b; display: block; margin-bottom: 12px; }
            .tags {
                display: flex;
                gap: 8px;
                margin-bottom: 24px;
                .tag {
                    font-size: 11px;
                    padding: 4px 12px;
                    background: #f1f5f9;
                    color: #64748b;
                    border-radius: 100px;
                    font-weight: 600;
                    &.warning { background: #fff7ed; color: #ea580c; }
                }
            }
        }
        
        .section {
            margin-bottom: 24px;
            .sec-title {
                font-size: 14px;
                font-weight: 700;
                color: #94a3b8;
                margin-bottom: 10px;
                display: block;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .sec-body { font-size: 15px; color: #334155; line-height: 1.7; }
            
            .ing-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                .ing-item {
                    font-size: 13px;
                    padding: 8px 14px;
                    background: rgba(248, 250, 252, 0.8);
                    border: 1px solid #e2e8f0;
                    border-radius: 10px; // Softer corners
                    color: #475569;
                }
            }
            
            .step-list {
                .step-item {
                    display: flex;
                    margin-bottom: 16px;
                    .idx {
                        width: 26px;
                        height: 26px;
                        background: #ffe4e6;
                        color: #f43f5e;
                        font-size: 13px;
                        font-weight: bold;
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin-right: 14px;
                        flex-shrink: 0;
                        box-shadow: 0 2px 6px rgba(244, 63, 94, 0.2);
                    }
                    .desc { font-size: 15px; color: #334155; line-height: 1.6; flex: 1; }
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
            background: rgba(239, 246, 255, 0.7); // Slightly transparent
            border: 1px solid #dbeafe;
            border-radius: 16px;
            padding: 16px;
            margin-top: 24px;
            display: flex;
            align-items: flex-start;
            backdrop-filter: blur(5px);
            
            .icon { font-size: 20px; margin-right: 10px; }
            .label { font-size: 14px; font-weight: bold; color: #1d4ed8; margin-right: 4px; white-space: nowrap; margin-top: 2px; }
            .task-desc { font-size: 14px; color: #1e3a8a; line-height: 1.6; margin-top: 2px; }
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
        transform: translateY(20px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
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
