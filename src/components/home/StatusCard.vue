<template>
  <view class="status-card-immersive" @click="emit('complete')">
    <!-- Immersive Background with Decoration -->
    <view class="bg-layer">
        <view class="glow-orb top-right"></view>
        <view class="glow-orb bottom-left"></view>
    </view>
    
    <!-- Large Atmospheric Icon (Watermark) -->
    <view class="watermark-icon">
        <text>{{ babyFruitIcon }}</text>
    </view>
    
    <view class="content-layer">
        <!-- Top Row: Date & Tag -->
        <view class="header-row">
            <view class="tag-capsule">
                <text class="tag-icon">👶</text>
                <text class="tag-text">{{ babySizeText ? `宝宝像个${babySizeText}` : '宝宝正在健康发育' }}</text>
            </view>
            <view class="day-badge" v-if="computedStatus && computedStatus.pregnancyDays">
                <text class="label">已孕</text>
                <text class="val">{{ computedStatus.pregnancyDays }}</text>
                <text class="unit">天</text>
            </view>
        </view>
        
        <!-- Center Main: Week Number -->
        <view class="main-stat" v-if="computedStatus">
             <text class="week-num">{{ computedStatus.week || 0 }}</text>
             <view class="week-meta">
                 <text class="week-unit">周</text>
                 <view class="extra-days" v-if="computedStatus.pregnancyDays % 7 > 0">
                     <text>+{{ computedStatus.pregnancyDays % 7 }}天</text>
                 </view>
             </view>
        </view>
        <view class="empty-state" v-else>
            <text class="empty-text">点击开启孕期守护</text>
        </view>

        <!-- Bottom: Progress & Mood/Whisper -->
        <view class="footer-section">
             <!-- Progress Bar -->
             <view class="progress-wrapper">
                <view class="progress-track">
                    <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
                </view>
                <text class="progress-text">{{ progressPercent }}%</text>
             </view>
             
             <!-- Mood & Whisper Area -->
             <view class="mood-whisper-area">
                <!-- State 1: Whisper Display -->
                <view class="whisper-box fade-in" v-if="dailyEncouragement">
                    <text class="whisper-icon">💭</text>
                    <text class="whisper-content">"{{ dailyEncouragement.encouragement }}"</text>
                </view>

                <!-- State 2: Loading -->
                <view class="whisper-loading fade-in" v-else-if="encouragementLoading">
                    <text class="loading-dots">宝宝正在思考...</text>
                </view>

                <!-- State 3: Mood Selector -->
                <view class="mood-selector fade-in" v-else>
                    <text class="mood-prompt">👋 准妈妈，今天心情怎么样？</text>
                    <view class="mood-emojis">
                        <view 
                            class="emoji-item" 
                            v-for="mood in moodOptions" 
                            :key="mood.value"
                            @click.stop="onMoodClick(mood.value)"
                        >
                            <text class="emoji-icon">{{ mood.icon }}</text>
                        </view>
                    </view>
                </view>
             </view>
        </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';

const props = defineProps<{
  status?: any;
  loading?: boolean;
  lmp?: string; 
  dailyEncouragement?: any;
  encouragementLoading?: boolean;
}>();

const emit = defineEmits(['complete', 'moodSelect']);

const moodOptions = [
    { value: 'HAPPY', icon: '😊' },
    { value: 'TIRED', icon: '😫' },
    { value: 'ANXIOUS', icon: '😟' },
    { value: 'EXCITED', icon: '🤩' },
];

const onMoodClick = (mood: string) => {
    emit('moodSelect', mood);
};

// --- Baby Size Logic ---
// Simple mapping for demo. In real app, this could be a utility.
const babySizeMap: Record<number, { text: string; icon: string }> = {
    4: { text: '罂粟籽', icon: '🌰' },
    5: { text: '芝麻', icon: '🌱' },
    6: { text: '绿豆', icon: '🫘' },
    7: { text: '蓝莓', icon: '🫐' },
    8: { text: '芸豆', icon: '🫘' },
    9: { text: '葡萄', icon: '🍇' },
    10: { text: '金橘', icon: '🍊' },
    11: { text: '无花果', icon: '🍠' },
    12: { text: '青柠', icon: '🍋' },
    13: { text: '豌豆荚', icon: '🫛' },
    14: { text: '柠檬', icon: '🍋' },
    15: { text: '苹果', icon: '🍎' },
    16: { text: '牛油果', icon: '🥑' },
    17: { text: '大头梨', icon: '🍐' },
    18: { text: '番薯', icon: '🍠' },
    19: { text: '芒果', icon: '🥭' },
    20: { text: '香蕉', icon: '🍌' },
    21: { text: '石榴', icon: '🍅' },
    22: { text: '木瓜', icon: '🍈' },
    23: { text: '柚子', icon: '🍊' },
    24: { text: '哈密瓜', icon: '🍈' },
    25: { text: '花椰菜', icon: '🥦' },
    26: { text: '生菜', icon: '🥬' },
    27: { text: '卷心菜', icon: '🥬' },
    28: { text: '茄子', icon: '🍆' },
    29: { text: '南瓜', icon: '🎃' },
    30: { text: '黄瓜', icon: '🥒' },
    31: { text: '菠萝', icon: '🍍' },
    32: { text: '大薯', icon: '🍠' },
    33: { text: '哈密瓜', icon: '🍈' },
    34: { text: '冬瓜', icon: '🍈' },
    35: { text: '西瓜', icon: '🍉' },
    36: { text: '大西瓜', icon: '🍉' },
    37: { text: '冬瓜', icon: '🍈' },
    38: { text: '大南瓜', icon: '🎃' },
    39: { text: '西瓜', icon: '🍉' },
    40: { text: '大西瓜', icon: '🍉' },
};

const currentWeek = computed(() => computedStatus.value?.week || 0);

const babySizeText = computed(() => {
    const w = currentWeek.value;
    if (w < 4) return '受精卵';
    if (babySizeMap[w]) return babySizeMap[w].text;
    if (w > 40) return '即将见面';
    return '小生命';
});

const babyFruitIcon = computed(() => {
    const w = currentWeek.value;
    if (babySizeMap[w]) return babySizeMap[w].icon;
    return '👶';
});


// --- Existing Logic Preserved ---
const computedStatus = computed(() => {
    if (props.status && props.status.week !== undefined) {
        return props.status;
    }
    
    if (props.lmp) {
        const lmpDate = dayjs(props.lmp);
        if (lmpDate.isValid()) {
            const now = dayjs();
            const diffDays = now.diff(lmpDate, 'day');
            
            if (diffDays >= 0 && diffDays <= 300) { 
                return {
                    week: Math.floor(diffDays / 7),
                    pregnancyDays: diffDays, 
                    tips: '宝宝正在健康发育'
                };
            }
        }
    }
    return null;
});

const progressPercent = computed(() => {
    const s = computedStatus.value;
    if (!s || s.pregnancyDays === undefined) return 0;
    
    let totalDays = s.pregnancyDays;
    if (s.week !== undefined) {
        totalDays = s.week * 7 + (s.pregnancyDays % 7);
    }
    
    const duration = 280; 
    const pct = Math.round((totalDays / duration) * 100);
    return Math.min(100, Math.max(0, pct));
});

</script>

<style lang="scss" scoped>
.status-card-immersive {
    position: relative;
    width: 100%;
    min-height: 240px; /* Slightly taller for mood area */
    border-radius: 32px;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: 0 20px 40px rgba(254, 153, 168, 0.25);
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &:active {
        transform: scale(0.98);
    }
}

/* 1. Background Layer */
.bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
    z-index: 1;
}

.glow-orb {
    position: absolute;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.6;
}

.glow-orb.top-right {
    top: -20px;
    right: -20px;
    background: rgba(255, 255, 255, 0.4);
}

.glow-orb.bottom-left {
    bottom: -40px;
    left: -20px;
    background: rgba(255, 182, 193, 0.5);
}

/* 2. Watermark Icon */
.watermark-icon {
    position: absolute;
    right: -10px;
    bottom: 20px;
    font-size: 140px;
    opacity: 0.15;
    z-index: 2;
    transform: rotate(-10deg);
    pointer-events: none;
}

/* 3. Content Layer */
.content-layer {
    position: relative;
    z-index: 3;
    padding: 24px 28px;
    height: 100%;
    min-height: 240px; /* Ensure minimum height */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

/* Top Row */
.header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.tag-capsule {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(4px);
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    .tag-icon {
        font-size: 14px;
        margin-right: 6px;
    }
    .tag-text {
        font-size: 13px;
        color: #fff;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
}

.day-badge {
    display: flex;
    align-items: baseline;
    color: rgba(255, 255, 255, 0.9);
    
    .label { font-size: 12px; margin-right: 4px; }
    .val { font-size: 18px; font-weight: 700; margin-right: 1px;}
    .unit { font-size: 12px; }
}

/* Main Stat */
.main-stat {
    margin-top: 10px;
    display: flex;
    align-items: baseline;
    
    .week-num {
        font-size: 72px;
        font-weight: 800;
        line-height: 1;
        color: #fff;
        text-shadow: 0 4px 12px rgba(255, 116, 139, 0.3);
        letter-spacing: -2px;
    }
    
    .week-meta {
        margin-left: 8px;
        display: flex;
        flex-direction: column;
        
        .week-unit {
            font-size: 20px;
            font-weight: 600;
            color: rgba(255,255,255,0.95);
        }
        
        .extra-days {
            margin-top: 4px;
            background: #fff;
            padding: 2px 8px;
            border-radius: 10px;
            
            text {
                color: #FB8CA0;
                font-size: 11px;
                font-weight: 700;
            }
        }
    }
}

.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    
    .empty-text {
        font-size: 24px;
        color: #fff;
        font-weight: 700;
        opacity: 0.9;
    }
}

/* Footer Section */
.footer-section {
    margin-top: auto;
    padding-top: 16px;
}

.progress-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .progress-track {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        overflow: hidden;
        margin-right: 12px;
    }
    
    .progress-fill {
        height: 100%;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(255,255,255,0.5);
    }
    
    .progress-text {
        font-size: 12px;
        font-weight: 700;
        color: rgba(255,255,255,0.9);
        width: 30px;
        text-align: right;
    }
}

/* Mood & Whisper Area - Key New Feature */
.mood-whisper-area {
    min-height: 48px;
    display: flex;
    align-items: center;
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 12px;
}

.mood-selector {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
    
    .mood-prompt {
        font-size: 13px;
        color: rgba(255,255,255,0.9);
        margin-right: auto;
    }
    
    .mood-emojis {
        display: flex;
        gap: 8px;
        
        .emoji-item {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            transition: transform 0.1s;
            
            &:active {
                transform: scale(0.9);
                background: rgba(255,255,255,0.4);
            }
            
            .emoji-icon {
                font-size: 18px;
            }
        }
    }
}

.whisper-box {
    display: flex;
    align-items: flex-start;
    
    .whisper-icon {
        font-size: 14px;
        margin-right: 8px;
        margin-top: 2px;
    }
    
    .whisper-content {
        font-size: 13px;
        color: #fff;
        line-height: 1.5;
        font-weight: 500;
        font-style: italic;
    }
}

.whisper-loading {
    display: flex;
    align-items: center;
    .loading-dots {
        font-size: 13px;
        color: rgba(255,255,255,0.8);
    }
}

/* Animation */
.fade-in {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
