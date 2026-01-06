<template>
  <view class="search-entry-container">
    <!-- Click trigger -->
    <!-- Improved Click trigger -->
    <view class="food-safety-card" @click="openModal">
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

    <!-- Search Input Modal -->
    <view class="modal-overlay" v-if="showModal" @click="closeModal">
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
                v-model="searchText"
                focus
                confirm-type="search"
                @confirm="handleSearch"
            />
        </view>

        <view class="modal-actions">
            <button class="btn-cancel" @click="closeModal">取消</button>
            <button class="btn-confirm" @click="handleSearch">查询</button>
        </view>
      </view>

      <!-- Result Modal -->
      <view class="modal-content result-modal" @click.stop v-else>
        <view class="result-header" :class="resultData.levelClass">
            <text class="result-food-name">{{ resultData.foodName }}</text>
            <text class="result-title">{{ resultData.title }}</text>
        </view>
        
        <view class="result-body">
            <text class="result-conclusion">{{ resultData.conclusion }}</text>
            
            <view class="result-section">
                <text class="section-label">💡 风险分析</text>
                <text class="section-content">{{ resultData.risk }}</text>
            </view>
            
            <view class="result-section">
                <text class="section-label">⚖️ 建议摄入量</text>
                <text class="section-content">{{ resultData.amount }}</text>
            </view>
        </view>

        <button class="btn-block" @click="closeResult">知道了</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { request } from '@/utils/request';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const showModal = ref(false);
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
    // icon: '', // Removed
    title: '',
    foodName: '',
    conclusion: '',
    risk: '',
    amount: ''
});

const openModal = () => {
    showModal.value = true;
    showResultModal.value = false;
    searchText.value = '';
    analyzing.value = false;
}

const closeModal = () => {
    if (analyzing.value) return;
    showModal.value = false;
    // stopCarousel(); // No longer needed as swiper handles autoplay
    setTimeout(() => { showResultModal.value = false; }, 300); // Reset after close
}

const closeResult = () => {
    closeModal();
}

// startCarousel function removed as swiper handles autoplay

const stopCarousel = () => {
    // No-op as swiper handles autoplay
};

onUnmounted(() => {
    stopCarousel();
});

const handleSearch = async () => {
    if (!searchText.value.trim()) return;
    
    analyzing.value = true;
    // Carousel handled by swiper automatically
    
    // Minimum loading time 1.5s to show at least one tip
    const startTime = Date.now();
    
    try {
        // Use normal request instead of stream for mini-program compatibility
        const result: any = await request({
            url: '/v1/food/check-json',
            method: 'GET',
            data: { openId: userStore.openId, query: searchText.value.trim() }
        });
        
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) {
            await new Promise(r => setTimeout(r, 1500 - elapsed));
        }

        // Parse result
        let data = result;
        if (result && result.code === 200 && result.data) {
            data = result.data;
        }
        
        // Check for backend error response
        if (data.code && data.code !== 0 && data.code !== 200) {
            throw new Error(data.message || 'Analysis Failed');
        }

        analyzing.value = false;
        
        // Prepare result data
        const styles: Record<string, any> = {
            'GREEN': { title: '💡 可以吃', class: 'level-green' },
            'YELLOW': { title: '⚠️ 慎吃', class: 'level-yellow' },
            'RED': { title: '🚫 尽量不吃', class: 'level-red' }
        };
        const style = styles[data.safety_level] || styles['YELLOW'];
        
        resultData.value = {
            levelClass: style.class,
            title: style.title,
            foodName: data.food_name || searchText.value,
            conclusion: data.short_conclusion,
            risk: data.risk_analysis,
            amount: data.suggested_amount
        };
        
        showResultModal.value = true; // Switch to result view
      
    } catch (error: any) {
        analyzing.value = false;
        console.error('Search Error:', error);
        
        let msg = '查询失败,请重试';
        if (error.message) msg = error.message;
        if (error.data && error.data.message) msg = error.data.message;
        
        uni.showToast({ title: msg, icon: 'none' });
    } finally {
        stopCarousel();
    }
}
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

/* Custom Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6); // Darker background for better focus
    z-index: 10000; // Z-index higher than TabBar (999)
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
}

.modal-content {
    background: #fff;
    width: 75%;
    max-width: 320px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    position: relative;
}

.input-modal {
    padding: 24px 20px 20px;
    
    .modal-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        display: block;
        text-align: center;
        margin-bottom: 6px;
    }
    
    .modal-subtitle {
        font-size: 11px;
        color: #999;
        display: block;
        text-align: center;
        margin-bottom: 20px;
    }
}

.loading-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
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

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
}

.result-modal {
    padding: 0; // Remove default padding to allow header to span full width
    overflow: hidden;
    background: #fff;
    
    .result-header {
        text-align: center;
        padding: 40px 20px; // More padding for impact
        position: relative;
        color: #fff; // White text for better contrast on colored backgrounds
        
        &.level-green { background: linear-gradient(135deg, #4CAF50, #81C784); }
        &.level-yellow { background: linear-gradient(135deg, #FF9800, #FFB74D); }
        &.level-red { background: linear-gradient(135deg, #F44336, #E57373); }
        
        // Removed result-icon styles

        .result-food-name { 
            font-size: 18px; 
            color: #fff;
            font-weight: 700; 
            display: block; 
            margin-bottom: 6px; 
            letter-spacing: 0.5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .result-title { 
            font-size: 24px; 
            font-weight: 800; 
            letter-spacing: 1px;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
    }
    
    .result-body {
        padding: 24px 20px;
        margin-bottom: 24px;
        overflow-y: auto; // Scrollable content
        -webkit-overflow-scrolling: touch;
        flex: 1; // Take remaining space
        
        .result-conclusion {
            font-size: 14px;
            color: #333;
            line-height: 1.6;
            margin-bottom: 16px;
            text-align: left;
            background: #F9FAFC;
            padding: 16px;
            border-radius: 12px;
        }
        
        // ... section styles same as before
        .result-section {
            background: #fff;
            padding: 16px;
            border-radius: 16px;
            margin-bottom: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.04);
            
            .section-label {
                font-size: 13px;
                font-weight: 600;
                color: #666;
                display: block;
                margin-bottom: 6px;
            }
            .section-content {
                font-size: 13px;
                color: #555;
                line-height: 1.6;
            }
        }
    }
    
    .btn-block {
        background: #333;
        color: #fff;
        border-radius: 28px;
        font-size: 16px;
        height: 50px;
        line-height: 50px;
        width: calc(100% - 48px);
        margin: 0 auto 24px;
        font-weight: 600;
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        transition: transform 0.2s;
        flex-shrink: 0; // Don't shrink
        
        &:active {
            transform: scale(0.98);
        }
         &::after { border: none; }
    }
}

.input-wrapper {
    margin-bottom: 16px;
    width: 100%;
    box-sizing: border-box;
    
    .custom-input {
        width: 100%;
        height: 42px;
        background: #F8F8F8;
        border-radius: 12px;
        padding: 0 14px;
        font-size: 14px;
        color: #333;
        border: none;
        box-sizing: border-box;
        
        &::placeholder {
            color: #BBB;
        }
    }
}

.modal-actions {
    display: flex;
    gap: 12px;
    
    button {
        flex: 1;
        height: 44px;
        line-height: 44px;
        border-radius: 22px;
        font-size: 15px;
        font-weight: 500;
        
        &::after { border: none; }
    }
    
    .btn-cancel {
        background: #F5F7FA;
        color: #666;
    }
    
    .btn-confirm {
        background: #333; // Dark theme brand
        color: #fff;
    }
}

@keyframes popIn {
    0% { transform: scale(0.9); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}
</style>
