<template>
  <PageContainer :customStyle="{ background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%)' }">
    
    <!-- 0. Custom Navbar -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="back-btn" @click="goBack">
            <text class="icon">❮</text>
        </view>
        <text class="page-title">产检时光轴</text>
        <view class="placeholder"></view>
    </view>

    <!-- 1. Header -->
    <view class="header-section fade-in">
        <text class="title">产检时光轴</text>
        <text class="subtitle">守护宝宝的每一步</text>
        
        <view class="next-visit-card glass-panel floating-entry">
            <view class="left">
                <text class="label">下次产检</text>
                <text class="name">{{ nextVisit.title }}</text>
            </view>
            <view class="right">
                <text class="date">{{ nextVisit.week }}周</text>
                <view class="check-btn" :class="{ checked: nextVisit.done }" @click="toggleCheck(nextVisit)">
                    <text class="icon">{{ nextVisit.done ? '✓' : '○' }}</text>
                </view>
            </view>
        </view>
    </view>

    <!-- 2. Timeline -->
    <view class="timeline-container fade-in delay-1">
        
        <view class="timeline-group" v-for="(group, gIndex) in timelineGroups" :key="gIndex">
            <view class="group-title">
                <text class="emoji">{{ group.icon }}</text>
                <text>{{ group.title }}</text>
            </view>
            
            <view class="timeline-items">
                <view 
                    class="timeline-item" 
                    v-for="(item, iIndex) in group.items" 
                    :key="iIndex"
                    :class="{ 'is-done': item.done, 'is-active': isItemActive(item) }"
                >
                    <view class="content-card glass-panel" @click="toggleDetails(item)">
                        <view class="card-header-row">
                            <view class="week-badge" :class="{ 'active-badge': isItemActive(item) }">
                                <text class="week-text">{{ item.week }}周</text>
                            </view>
                            <view class="action" @click.stop="toggleCheck(item)">
                                <view class="checkbox" :class="{ checked: item.done }">
                                    <text v-if="item.done" class="check-icon">✓</text>
                                </view>
                            </view>
                        </view>
                        
                        <view class="card-main">
                            <view class="info">
                                <text class="item-title" :class="{ 'title-done': item.done }">{{ item.title }}</text>
                                <text class="item-desc" v-if="!item.expanded">{{ item.shortDesc }}</text>
                            </view>
                        </view>
                        
                        <view class="card-details" v-if="item.expanded">
                            <view class="divider"></view>
                            <text class="detail-text">{{ item.details }}</text>
                            <view class="tips-box" v-if="item.tips">
                                <text class="tip-icon">💡</text>
                                <text class="tip-content">{{ item.tips }}</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>

    </view>
      
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import PageContainer from '@/components/common/PageContainer.vue';

interface CareItem {
    id: string;
    week: string;
    title: string;
    shortDesc: string;
    details: string;
    tips?: string;
    done: boolean;
    expanded: boolean;
}

interface CareGroup {
    title: string;
    icon: string;
    items: CareItem[];
}

const currentWeek = ref(16); // Mock current week
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;

const goBack = () => {
    uni.navigateBack();
}

// Mock Data
const timelineGroups = ref<CareGroup[]>([
    {
        title: '孕早期 (1-13周)',
        icon: '🌱',
        items: [
            {
                id: '1', week: '6-8', title: '首次产检', shortDesc: '确认宫内孕、胎心胎芽',
                details: 'B超检查确认是否为宫内孕，查看胎心胎芽是否正常发育。建立母子健康手册。',
                tips: '记得空腹验血哦。',
                done: true, expanded: false
            },
            {
                id: '2', week: '11-13', title: 'NT检查', shortDesc: '早期唐氏筛查',
                details: '通过B超测量胎儿颈后透明层厚度，评估染色体异常风险。',
                tips: '主要看宝宝配合程度，不需要空腹。',
                done: false, expanded: false
            }
        ]
    },
    {
        title: '孕中期 (14-27周)',
        icon: '👶',
        items: [
            {
                id: '3', week: '15-20', title: '唐氏筛查', shortDesc: '中期唐筛 / 无创DNA',
                details: '抽取孕妇静脉血，检测胎儿患唐氏综合征的风险。',
                tips: '空腹抽血，建议上午进行。',
                done: false, expanded: false
            },
            {
                id: '4', week: '20-24', title: '大排畸', shortDesc: '四维彩超',
                details: '系统性筛查胎儿结构畸形，包括面部、四肢、内脏等。',
                tips: '可以吃点巧克力让宝宝活跃一点。',
                done: false, expanded: false
            },
            {
                id: '5', week: '24-28', title: '糖耐量试验', shortDesc: '筛查妊娠糖尿病',
                details: '口服75g葡萄糖，分别在空腹、1小时、2小时抽血检测血糖。',
                tips: '前一晚清淡饮食，检查期间禁食禁水。',
                done: false, expanded: false
            }
        ]
    },
    {
        title: '孕晚期 (28-40周)',
        icon: '🤱',
        items: [
            {
                id: '6', week: '28-30', title: '小排畸', shortDesc: '晚期B超筛查',
                details: '再次确认胎儿生长发育情况，补漏筛查。',
                done: false, expanded: false
            },
            {
                id: '7', week: '36-37', title: '胎位监测', shortDesc: '评估分娩方式',
                details: '检查胎位（头位/臀位），骨盆测量，确定生产方式。',
                done: false, expanded: false
            }
        ]
    }
]);

// Determine "Next Visit": First Undone item
const nextVisit = computed(() => {
    for (const group of timelineGroups.value) {
        for (const item of group.items) {
            if (!item.done) return item;
        }
    }
    // All done mock
    return { title: '待产', week: '40', done: false };
});

const isItemActive = (item: CareItem) => {
    // Check if item week range includes current week (simplified logic)
    const weeks = item.week.split('-').map(Number);
    if (weeks.length === 2) {
        return currentWeek.value >= weeks[0] && currentWeek.value <= weeks[1];
    }
    return false;
};

const toggleCheck = (item: any) => {
    item.done = !item.done;
    uni.vibrateShort({ type: 'light' });
};

const toggleDetails = (item: CareItem) => {
    item.expanded = !item.expanded;
};

onMounted(() => {
    // In real app, load state from storage
});

</script>

<style lang="scss" scoped>
.nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 44px;
    box-sizing: content-box;
    
    .back-btn {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(4px);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .icon { font-size: 16px; color: #334155; }
        &:active { opacity: 0.7; }
    }
    
    .page-title {
        font-size: 17px;
        font-weight: 600;
        color: #334155;
    }
    
    .placeholder { width: 32px; }
}

.header-section {
    padding: 20px 24px;
    
    .title { font-size: 24px; font-weight: 700; color: #0F172A; display: block; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #64748B; display: block; margin-bottom: 24px; }
    
    .next-visit-card {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%);
        border: 1px solid #DBEAFE;
        
        .label { font-size: 12px; color: #64748B; display: block; margin-bottom: 4px; }
        .name { font-size: 18px; font-weight: 700; color: #3B82F6; }
        
        .right {
            display: flex;
            align-items: center;
            gap: 12px;
            .date { font-size: 14px; color: #94A3B8; font-weight: 500; }
            .check-btn {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 2px solid #CBD5E1;
                display: flex;
                align-items: center;
                justify-content: center;
                color: transparent;
                transition: all 0.3s;
                
                &.checked {
                    background: #3B82F6;
                    border-color: #3B82F6;
                    color: white;
                }
            }
        }
    }
}

.timeline-container {
    padding: 0 20px 40px;
}

.timeline-group {
    margin-bottom: 30px;
    
    .group-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        font-size: 16px;
        font-weight: 600;
        color: #334155;
        
        .emoji { font-size: 20px; }
    }
    
    .timeline-items {
        display: flex;
        flex-direction: column;
        gap: 16px;
        
        .timeline-item {
            transition: transform 0.2s;
            &:active { transform: scale(0.99); }
            
            &.is-done {
                .content-card { 
                    background: rgba(255, 255, 255, 0.6); 
                    border-color: rgba(255, 255, 255, 0.4);
                }
                .week-badge { background: #E2E8F0; color: #94A3B8; }
                .title-done { color: #94A3B8; text-decoration: line-through; }
            }
            
            &.is-active {
                 .content-card { 
                     border: 1px solid #FECDD3; 
                     box-shadow: 0 8px 20px rgba(244, 63, 94, 0.1);
                 }
            }
            
            .content-card {
                padding: 20px;
                transition: all 0.3s ease;
                
                .card-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    
                    .week-badge {
                        background: #EFF6FF;
                        padding: 4px 10px;
                        border-radius: 8px;
                        
                        .week-text {
                            font-size: 13px;
                            font-weight: 600;
                            color: #3B82F6;
                        }
                        
                        &.active-badge {
                            background: #FFE4E6;
                            .week-text { color: #F43F5E; }
                        }
                    }
                    
                    .action { padding: 4px; }
                    .checkbox {
                        width: 24px; height: 24px;
                        border-radius: 50%; /* Circle checkbox looks better here */
                        border: 2px solid #CBD5E1;
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        font-size: 14px;
                        transition: all 0.3s;
                        
                        .check-icon { color: white; font-size: 14px; }
                        
                        &.checked {
                            background: #3B82F6;
                            border-color: #3B82F6;
                        }
                    }
                }

                .card-main {
                    .info {
                        .item-title { font-size: 17px; font-weight: 700; color: #1E293B; display: block; margin-bottom: 6px; }
                        .item-desc { font-size: 14px; color: #64748B; line-height: 1.5; }
                    }
                }
                
                .card-details {
                    margin-top: 16px;
                    animation: slideDown 0.3s ease-out;
                    
                    .divider { height: 1px; background: #F1F5F9; margin: 8px 0 12px; }
                    .detail-text { font-size: 14px; color: #475569; line-height: 1.6; display: block; margin-bottom: 12px; }
                    
                    .tips-box {
                        background: #FFF1F2;
                        border-radius: 12px;
                        padding: 12px;
                        display: flex;
                        gap: 10px;
                        align-items: flex-start;
                        
                        .tip-icon { font-size: 16px; margin-top: 1px; }
                        .tip-content { font-size: 13px; color: #BE123C; line-height: 1.5; flex: 1; }
                    }
                }
            }
        }
    }
}

.glass-panel {
    background: white;
    box-shadow: 0 4px 12px rgba(148, 163, 184, 0.1);
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.6);
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Animations */
.fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
