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
            <view class="core"></view>
         </view>
         <text class="loading-title">AI正在仔细查询...</text>
         <text class="loading-tip">{{ tips[currentTipIndex] }}</text>
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
import { checkFoodSafety } from '@/api/service';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const showModal = ref(false);
const showResultModal = ref(false);
const searchText = ref('');
const analyzing = ref(false);

const tips = [
  "正在查阅《孕期饮食指南》...",
  "不仅仅是能不能吃，还要看吃多少哦。",
  "营养均衡最重要，不要偏食哈。",
  "生冷食物要警惕，细菌寄生虫是大敌。",
  "含糖高的水果也要适量，小心妊娠糖尿病。",
  "正在咨询专业营养师的意见..."
];
const currentTipIndex = ref(0);
let intervalId: number | null = null;

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
    stopCarousel();
    setTimeout(() => { showResultModal.value = false; }, 300); // Reset after close
}

const closeResult = () => {
    closeModal();
}

const startCarousel = () => {
    currentTipIndex.value = 0;
    intervalId = setInterval(() => {
        currentTipIndex.value = (currentTipIndex.value + 1) % tips.length;
    }, 2000);
}

const stopCarousel = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

onUnmounted(() => {
    stopCarousel();
});

const handleSearch = async () => {
    if (!searchText.value.trim()) return;
    
    analyzing.value = true;
    startCarousel();
    // uni.showLoading({ title: 'AI分析中...' }); // Removed native loading
    
    // Minimum loading time 1.5s to show at least one tip
    const startTime = Date.now();
    let fullText = '';
    
    try {
        await checkFoodSafety(userStore.openId, searchText.value.trim(), (chunk) => {
            fullText += chunk;
        });
        
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) {
            await new Promise(r => setTimeout(r, 1500 - elapsed));
        }

        // Parse SSE
        if (fullText.includes("data:")) {
             // 1. Split by "data:" and newlines to get events
             // Standard SSE format: data: val\n\n
             // We want to reconstruct the full string payload
             const events = fullText.split(/\n\n/);
             let payload = '';
             for (const event of events) {
                 if (!event.trim()) continue;
                 // Each event might have multiple lines starting with data:
                 const lines = event.split(/\n/);
                 const eventData = lines
                    .filter(line => line.startsWith("data:"))
                    .map(line => line.replace(/^data:\s*/, ''))
                    .join('\n'); // Restore newlines within event
                 payload += eventData;
             }
             fullText = payload;
        }

        // Parse JSON
        // Robust regex to extract JSON object { ... } or list [ ... ]
        const jsonMatch = fullText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
            fullText = jsonMatch[0];
        } else if (fullText.includes("```")) {
            // Fallback for markdown blocks
            fullText = fullText.replace(/```json/g, "").replace(/```/g, "");
        }
        
        console.log('FoodSafety Parsed JSON:', fullText);
        const result = JSON.parse(fullText);
        
        // Check for backend error response
        if (result.code && result.code !== 0 && result.code !== 200) {
            throw new Error(result.message || 'Analysis Failed');
        }

        analyzing.value = false;
        
        // Prepare result data
        const styles: Record<string, any> = {
            'GREEN': { title: '💡 可以吃', class: 'level-green' },
            'YELLOW': { title: '⚠️ 慎吃', class: 'level-yellow' },
            'RED': { title: '🚫 尽量不吃', class: 'level-red' }
        };
        const style = styles[result.safety_level] || styles['YELLOW'];
        
        resultData.value = {
            levelClass: style.class,
            title: style.title,
            foodName: result.food_name || searchText.value,
            conclusion: result.short_conclusion,
            risk: result.risk_analysis,
            amount: result.suggested_amount
        };
        
        showResultModal.value = true; // Switch to result view
      
    } catch (error: any) {
        analyzing.value = false;
        console.error('Search Error:', error);
        
        let msg = '查询失败，请重试';
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
    border: 1px solid #FFEBEB;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(255, 143, 148, 0.1);
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
        border: 1px solid #F0F0F0;
        
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
    width: 85%;
    max-height: 80vh; // Limit height
    display: flex;       // Enable flex layout
    flex-direction: column;
    border-radius: 24px;
    // padding: 24px; // Removed default padding here, handle in specific modals
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    position: relative; // For positioning elements
}

.input-modal {
    .modal-title {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        display: block;
        text-align: center;
        margin-bottom: 8px;
    }
    
    .modal-subtitle {
        font-size: 13px;
        color: #999;
        display: block;
        text-align: center;
        margin-bottom: 24px;
    }
}

.loading-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    
    .ai-spinner {
        position: relative;
        width: 80px;
        height: 80px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .ring {
            position: absolute;
            border-radius: 50%;
            border: 2px solid transparent;
            border-top-color: #FF8F94;
            width: 100%;
            height: 100%;
            animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
            
            &:nth-child(2) {
                width: 70%;
                height: 70%;
                border-top-color: #FFC0CB;
                animation-direction: reverse;
                animation-duration: 1.2s;
            }
        }
        
        .core {
            width: 30%;
            height: 30%;
            background: #FF8F94;
            border-radius: 50%;
            animation: pulse 1s ease-in-out infinite alternate;
            box-shadow: 0 0 20px rgba(255, 143, 148, 0.6);
        }
    }
    
    .loading-title {
        font-size: 18px;
        color: #333;
        font-weight: 600;
        margin-bottom: 12px;
        background: linear-gradient(90deg, #333, #666, #333);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shimmer 3s linear infinite;
    }
    
    .loading-tip {
        font-size: 13px;
        color: #999;
        text-align: center;
        line-height: 1.5;
        height: 40px; 
    }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes pulse {
    from { transform: scale(0.8); opacity: 0.8; }
    to { transform: scale(1.1); opacity: 1; }
}

@keyframes shimmer {
    to { background-position: 200% center; }
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
            font-size: 24px; 
            color: #fff; // White text
            font-weight: 700; 
            display: block; 
            margin-bottom: 8px; 
            letter-spacing: 1px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .result-title { 
            font-size: 32px; 
            font-weight: 800; 
            letter-spacing: 2px;
            color: #fff; // White text
            text-shadow: 0 2px 4px rgba(0,0,0,0.15);
            
            // Remove specific color overrides since we're using white on colored bg
        }
    }
    
    .result-body {
        padding: 0 24px;
        margin-bottom: 24px;
        overflow-y: auto; // Scrollable content
        -webkit-overflow-scrolling: touch;
        flex: 1; // Take remaining space
        
        .result-conclusion {
            font-size: 16px;
            color: #444;
            font-weight: 500;
            margin-bottom: 20px;
            display: block;
            line-height: 1.6;
            text-align: justify;
            background: #F9FAFC;
            padding: 16px;
            border-radius: 12px;
        }
        
        // ... section styles same as before
        .result-section {
            background: #fff;
            padding: 16px;
            border-radius: 16px;
            margin-bottom: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
            border: 1px solid #F0F0F0;
            
            .section-label {
                font-size: 13px;
                color: #888;
                font-weight: 600;
                display: block;
                margin-bottom: 8px;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            .section-content {
                font-size: 15px;
                color: #333;
                line-height: 1.5;
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
    background: #F5F7FA;
    border-radius: 16px;
    padding: 12px 16px;
    margin-bottom: 24px;
    border: 1px solid transparent;
    transition: all 0.3s;
    
    &:focus-within {
        background: #fff;
        border-color: #FF8F94;
        box-shadow: 0 0 0 4px rgba(255, 143, 148, 0.1);
    }
    
    .custom-input {
        font-size: 16px;
        color: #333;
        width: 100%;
        height: 24px;
        line-height: 24px;
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
