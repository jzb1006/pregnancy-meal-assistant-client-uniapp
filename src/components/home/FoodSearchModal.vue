<template>
  <view class="modal-overlay" v-if="show" @click="close" @touchmove.stop.prevent>
    <!-- Loading View -->
    <view class="modal-content loading-modal" @click.stop v-if="analyzing">
       <view class="ai-spinner">
          <view class="ring"></view>
          <view class="ring"></view>
          <view class="core">AI</view>
       </view>
       <text class="loading-title">AI 正在仔细查询...</text>
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
              <swiper-item v-for="(tip, index) in tips" :key="index" class="swiper-item">
                  <view class="tip-content">
                      <text class="tip-text">{{ tip }}</text>
                  </view>
              </swiper-item>
          </swiper>
       </view>
    </view>

    <!-- Input View -->
    <view class="modal-content input-modal" @click.stop v-else-if="!showResultModal">
      <text class="modal-title">能不能吃？</text>
      <text class="modal-subtitle">输入食物名称，AI 为您专业分析</text>
      
      <view class="input-wrapper">
          <input 
              class="custom-input" 
              placeholder="例如: 螃蟹" 
              placeholder-class="input-placeholder"
              v-model="searchText"
              focus
              confirm-type="search"
              @confirm="handleSearch"
          />
          <view class="search-icon-wrapper" @click="handleSearch">
            <text class="search-btn-icon">🔍</text>
          </view>
      </view>

      <view class="modal-actions">
          <button class="btn-cancel" @click="close">取消</button>
      </view>
    </view>

    <!-- Result Modal (Redesigned) -->
    <view class="modal-content result-modal" @click.stop v-else>
      <view class="result-header-wave" :class="resultData.levelClass">
          <view class="header-inner">
            <text class="result-food-name">{{ resultData.foodName }}</text>
            <view class="verdict-sticker">
                <text class="sticker-icon">{{ resultData.icon }}</text>
                <text class="sticker-text">{{ resultData.title }}</text>
            </view>
          </view>
          <!-- Decorative background elements -->
          <view class="wave-bg"></view>
          <view class="sparkle s1">✨</view>
          <view class="sparkle s2">✨</view>
      </view>
      
      <scroll-view scroll-y class="result-body-scroll">
          <view class="scroll-inner-padding">
            <!-- Conclusion Bubble -->
            <view class="bubble-container">
                <view class="bubble-tail"></view>
                <text class="result-conclusion">{{ resultData.conclusion }}</text>
            </view>
            
            <!-- Info Cards -->
            <view class="info-cards-grid">
                <view class="info-card risk-card">
                    <view class="card-icon-wrapper risk-icon">
                        <text>🛡️</text>
                    </view>
                    <view class="card-text">
                        <text class="card-label">风险分析</text>
                        <text class="card-value">{{ resultData.risk }}</text>
                    </view>
                </view>
                
                <view class="info-card amount-card">
                    <view class="card-icon-wrapper amount-icon">
                        <text>⚖️</text>
                    </view>
                    <view class="card-text">
                        <text class="card-label">推荐用量</text>
                        <text class="card-value">{{ resultData.amount }}</text>
                    </view>
                </view>
            </view>
          </view>
      </scroll-view>

      <view class="modal-footer-simple">
        <button class="btn-primary-soft" @click="close">
            <text>我记住了</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { request } from '@/utils/request';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(['update:show']); 

const showResultModal = ref(false);
const searchText = ref('');
const analyzing = ref(false);

const tips = ref([
  "正在查阅《孕期饮食指南》...",
  "不仅仅是能不能吃，还要看吃多少哦。",
  "营养均衡最重要，不要偏食哈。",
  "生冷食物要警惕，细菌寄生虫是大敌。",
  "含糖高的水果也要适量，小心妊娠糖尿病。",
  "正在咨询专业营养师的意见..."
]);

const resultData = ref({
    levelClass: '',
    title: '',
    foodName: '',
    conclusion: '',
    risk: '',
    amount: '',
    icon: ''
});

// Watch show prop to reset state when opened
watch(() => props.show, (newVal) => {
    if (newVal) {
        showResultModal.value = false;
        searchText.value = '';
        analyzing.value = false;
    }
});

const close = () => {
    if (analyzing.value) return;
    emit('update:show', false);
}

const handleSearch = async () => {
    if (!searchText.value.trim()) return;
    
    analyzing.value = true;
    const startTime = Date.now();
    
    try {
        const result: any = await request({
            url: '/v1/food/check-json',
            method: 'GET',
            data: { query: searchText.value.trim() }
        });
        
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) {
            await new Promise(r => setTimeout(r, 1500 - elapsed));
        }

        let data = result;
        if (result && result.code === 200 && result.data) {
            data = result.data;
        }
        
        if (data.code && data.code !== 0 && data.code !== 200) {
            throw new Error(data.message || 'Analysis Failed');
        }

        analyzing.value = false;
        
        const styles: Record<string, any> = {
            'GREEN': { title: '可以吃', class: 'level-green', icon: '✅' },
            'YELLOW': { title: '慎吃', class: 'level-yellow', icon: '⚠️' },
            'RED': { title: '尽量不吃', class: 'level-red', icon: '🚫' }
        };
        const style = styles[data.safety_level] || styles['YELLOW'];
        
        resultData.value = {
            levelClass: style.class,
            title: style.title,
            foodName: data.food_name || searchText.value,
            conclusion: data.short_conclusion,
            risk: data.risk_analysis,
            amount: data.suggested_amount,
            icon: style.icon
        };
        
        showResultModal.value = true;
      
    } catch (error: any) {
        analyzing.value = false;
        console.error('Search Error:', error);
        let msg = '查询失败,请重试';
        if (error.message) msg = error.message;
        uni.showToast({ title: msg, icon: 'none' });
    }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(30, 41, 59, 0.4); 
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    padding-bottom: 40px; /* offset for visual balance */
}

.modal-content {
    background: #fff;
    width: 90%; /* Increased width from 86% to 90% */
    max-width: 360px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    border-radius: 32px; /* Softer rounded corners */
    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
    animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
}

/* --- Input Modal --- */
.input-modal {
    padding: 32px 24px;
    
    .modal-title {
        font-size: 20px;
        font-weight: 700;
        color: #1E293B;
        text-align: center;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
    }
    .modal-subtitle {
        font-size: 13px;
        color: #64748B;
        text-align: center;
        margin-bottom: 28px;
    }
    
    .input-wrapper {
        position: relative;
        margin-bottom: 24px;
        
        .custom-input {
            width: 100%;
            height: 56px;
            background: #F1F5F9;
            border-radius: 20px;
            padding: 0 50px 0 20px;
            font-size: 16px;
            color: #334155;
            transition: all 0.2s;
            box-sizing: border-box;
            
            &:focus {
                background: #fff;
                border: 2px solid #F43F5E;
                box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.1);
            }
        }
        
        .search-icon-wrapper {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            border-radius: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            
            .search-btn-icon {
                font-size: 18px;
            }
            
            &:active { transform: translateY(-50%) scale(0.95); }
        }
    }
    
    .modal-actions {
        display: flex;
        justify-content: center;
        .btn-cancel {
            background: transparent;
            color: #94A3B8;
            font-size: 15px;
            &::after { border: none; }
        }
    }
}

/* --- Loading Modal --- */
.loading-modal {
    padding: 40px 24px;
    align-items: center;
    background: linear-gradient(180deg, #FFFFFF 0%, #FFF1F2 100%);
    
    .ai-spinner {
        position: relative;
        width: 80px;
        height: 80px;
        margin-bottom: 24px;
        .ring {
            position: absolute; width: 100%; height: 100%;
            border: 3px solid transparent; border-top-color: #F43F5E;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            &:nth-child(2) {
                width: 70%; height: 70%; top: 15%; left: 15%;
                animation-duration: 2s; border-top-color: #FDA4AF;
                animation-direction: reverse;
            }
        }
        .core {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            font-size: 16px; font-weight: 800; color: #F43F5E;
            animation: pulse 1.5s ease-in-out infinite;
        }
    }
    
    .loading-title {
        font-size: 16px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 20px;
    }
    
    .tips-carousel {
        width: 100%;
        height: 40px;
        background: rgba(255,255,255,0.8);
        border-radius: 12px;
        border: 1px solid rgba(255, 228, 230, 0.5);
        .tips-swiper { height: 100%; }
        .tip-text { 
            font-size: 13px; 
            color: #64748b; 
            text-align: center; 
            line-height: 40px; 
            display: block; // Ensure text centers properly
        }
    }
}

/* --- Result Modal Refined (Soft Healing V2) --- */
.result-modal {
    padding: 0;
    background: #FFFFFF;
    box-sizing: border-box; 
    
    .result-header-wave {
        position: relative;
        padding: 40px 20px 50px; /* Extra bottom padding for the wave overlap */
        background: #F8FAFC;
        border-radius: 0 0 40px 40px; /* The Wave Effect */
        text-align: center;
        overflow: visible; /* Allow sticker or sparkles to pop */
        z-index: 2;
        transition: all 0.3s ease;

        /* Pastel Themes */
        &.level-green { 
            background: linear-gradient(180deg, #D1FAE5 0%, #E0F2FE 100%);
            .sticker-text { color: #047857; }
            .sticker-icon { text-shadow: 0 2px 4px rgba(16, 185, 129, 0.2); }
        }
        &.level-yellow { 
            background: linear-gradient(180deg, #FEF3C7 0%, #FFF7ED 100%);
            .sticker-text { color: #B45309; }
        }
        &.level-red { 
            background: linear-gradient(180deg, #FEE2E2 0%, #FFF1F2 100%);
            .sticker-text { color: #BE123C; }
        }

        .header-inner {
            position: relative;
            z-index: 5;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .result-food-name {
            font-size: 28px;
            font-weight: 800;
            color: #1E293B;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 0 rgba(255,255,255,0.5);
        }

        .verdict-sticker {
            background: #FFFFFF;
            padding: 8px 24px;
            border-radius: 999px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
            display: flex;
            align-items: center;
            gap: 8px;
            transform: scale(1);
            animation: stickerPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            
            .sticker-icon { font-size: 20px; }
            .sticker-text { font-size: 18px; font-weight: 800; }
        }

        /* Sparkle Decorations */
        .sparkle {
            position: absolute;
            font-size: 16px;
            opacity: 0.6;
            animation: float 3s ease-in-out infinite;
            &.s1 { top: 20%; right: 15%; animation-delay: 0s; transform: rotate(15deg); }
            &.s2 { bottom: 30%; left: 15%; animation-delay: 1.5s; font-size: 12px; transform: rotate(-10deg); }
        }
    }
    
    .result-body-scroll {
        flex: 1;
        min-height: 0;
        
        .scroll-inner-padding {
            padding: 24px;
            padding-top: 10px; /* Slightly pull up closer to wave */
        }
        
        .bubble-container {
            position: relative;
            background: #F1F5F9; /* Default neutral bubble */
            padding: 20px;
            border-radius: 20px;
            border-top-left-radius: 4px; /* Callout shape origin */
            margin-bottom: 24px;
            
            .result-conclusion {
                font-size: 15px;
                color: #334155;
                line-height: 1.6;
                text-align: justify;
                font-weight: 500;
            }
        }

        .info-cards-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .info-card {
            background: #fff;
            padding: 16px;
            border-radius: 20px;
            border: 1px solid #F1F5F9;
            box-shadow: 0 2px 6px rgba(0,0,0,0.02);
            display: flex;
            gap: 16px;
            align-items: flex-start;

            .card-icon-wrapper {
                width: 44px;
                height: 44px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
            }

            .card-text {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .card-label {
                font-size: 12px;
                color: #94A3B8;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .card-value {
                font-size: 14px;
                color: #475569;
                line-height: 1.4;
            }

            /* Variants */
            &.risk-card {
                .card-icon-wrapper { background: #EEF2FF; color: #6366F1; }
            }
            &.amount-card {
                .card-icon-wrapper { background: #FFF7ED; color: #F97316; }
            }
        }
    }
    
    .modal-footer-simple {
        padding: 16px 24px 32px;
        
        .btn-primary-soft {
            background: #1E293B;
            color: #FFFFFF;
            width: 100%;
            height: 52px;
            line-height: 52px;
            border-radius: 26px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 8px 20px -4px rgba(30,41,59,0.25);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            
            &:active { transform: scale(0.98); background: #0F172A; }
            &::after { border: none; }
        }
    }
}

@keyframes stickerPop {
    0% { transform: scale(0.5); opacity: 0; }
    60% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
}
@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

/* Animations */
@keyframes popIn {
    0% { opacity: 0; transform: scale(0.9) translateY(20px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes pulse { 50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.9); } }

.input-placeholder {
    color: #CBD5E1;
}
</style>
