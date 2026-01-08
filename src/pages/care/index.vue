<template>
  <PageContainer :customStyle="{ background: 'linear-gradient(180deg, #FDFBF7 0%, #FFFFFF 100%)' }">
    
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
        <text class="subtitle">记录宝宝成长的每一个脚印 👣</text>
        
        <view class="next-visit-card glass-panel floating-entry">
            <view class="card-bg-decoration"></view>
            <view class="left">
                <view class="label-row">
                    <text class="label-icon">📅</text>
                    <text class="label">下次产检</text>
                </view>
                <text class="name">{{ nextVisit.title }}</text>
                <text class="week-info">第 {{ nextVisit.week }} 周</text>
            </view>
            <view class="right">
                <!-- 待产状态不显示复选框,显示完成图标 -->
                <view v-if="nextVisit.id === 'all-done'" class="done-badge">
                    <text class="icon">🎉</text>
                </view>
                <view v-else class="check-btn" :class="{ checked: nextVisit.done }" @click="toggleCheck(nextVisit)">
                    <text class="icon">{{ nextVisit.done ? '✓' : '' }}</text>
                </view>
            </view>
        </view>
    </view>

    <!-- 2. Timeline -->
    <view class="timeline-container fade-in delay-1">
        
        <view class="timeline-group" v-for="(group, gIndex) in timelineGroups" :key="gIndex">
            
            <!-- Timeline Connector Line -->
            <view class="timeline-line"></view>

            <!-- Group Header Node -->
            <view class="group-header">
                <view class="node-icon">{{ group.icon }}</view>
                <text class="group-title-text">{{ group.title }}</text>
            </view>
            
            <view class="timeline-items">
                <view 
                    class="timeline-item" 
                    v-for="(item, iIndex) in group.items" 
                    :key="iIndex"
                    :class="{ 'is-done': item.done, 'is-active': isItemActive(item) }"
                >
                    <!-- Timeline Dot -->
                    <view class="timeline-dot" :class="{ 'active': isItemActive(item), 'done': item.done }"></view>

                    <view class="content-card glass-panel" @click="toggleDetails(item)">
                        <view class="card-header-row">
                            <view class="header-left">
                                <view class="week-tag" :class="{ 'active-tag': isItemActive(item) }">
                                    <text>{{ item.week }}周</text>
                                </view>
                                <text class="item-title" :class="{ 'title-done': item.done }">{{ item.title }}</text>
                            </view>
                            
                            <view class="action" @click.stop="toggleCheck(item)">
                                <view class="checkbox" :class="{ checked: item.done }">
                                    <text v-if="item.done" class="check-icon">✓</text>
                                </view>
                            </view>
                        </view>
                        
                        <view class="card-main">
                             <text class="item-desc" v-if="!item.expanded">{{ item.shortDesc }}</text>
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
import { getPrenatalTimeline, togglePrenatalCheck } from '@/api/service';
import type { PrenatalCheckGroupVO, PrenatalCheckItemVO } from '@/types/prenatal';

// 扩展类型以包含前端UI状态
interface CareItem extends PrenatalCheckItemVO {
    expanded: boolean;
}

interface CareGroup extends Omit<PrenatalCheckGroupVO, 'items'> {
    items: CareItem[];
}

const currentWeek = ref(0);
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;
const timelineGroups = ref<CareGroup[]>([]);
const loading = ref(false);
const error = ref('');

const goBack = () => {
    uni.navigateBack();
};

// 加载产检时光轴数据
const loadTimeline = async () => {
    loading.value = true;
    error.value = '';
    
    try {
        const data = await getPrenatalTimeline();
        
        // 设置当前孕周
        currentWeek.value = data.currentWeek || 0;
        
        // 转换数据并添加expanded状态
        timelineGroups.value = data.groups.map(group => ({
            ...group,
            items: group.items.map(item => ({
                ...item,
                expanded: false
            }))
        }));
        
        console.log('[产检时光轴] 数据加载成功:', data);
    } catch (err: any) {
        console.error('[产检时光轴] 加载失败:', err);
        error.value = err.message || '加载失败，请稍后重试';
        uni.showToast({
            title: error.value,
            icon: 'none',
            duration: 2000
        });
    } finally {
        loading.value = false;
    }
};

// 下次产检: 第一个未完成的项目
const nextVisit = computed(() => {
    for (const group of timelineGroups.value) {
        for (const item of group.items) {
            if (!item.done) return item;
        }
    }
    // 全部完成 - 与后端getNextCheck()返回值保持一致
    return { 
        title: '待产', 
        week: '40', 
        done: false, 
        id: 'all-done',  // 使用后端定义的特殊标识
        shortDesc: '所有产检已完成', 
        details: '恭喜您完成了所有产检项目,安心待产吧!' 
    };
});

const isItemActive = (item: CareItem) => {
    // 检查项目孕周范围是否包含当前孕周
    const weeks = item.week.split('-').map(Number);
    if (weeks.length === 2) {
        return currentWeek.value >= weeks[0] && currentWeek.value <= weeks[1];
    }
    return false;
};

const toggleCheck = async (item: CareItem) => {
    const newStatus = !item.done;
    
    try {
        // 调用API切换状态
        const updatedItem = await togglePrenatalCheck({
            templateCode: item.id,
            done: newStatus,
            checkDate: newStatus ? new Date().toISOString().split('T')[0] : undefined
        });
        
        // 更新本地状态
        item.done = updatedItem.done;
        item.checkDate = updatedItem.checkDate;
        
        // 震动反馈
        uni.vibrateShort({ type: 'light' });
        
        // 提示
        uni.showToast({
            title: newStatus ? '已完成' : '已取消',
            icon: 'success',
            duration: 1500
        });
        
        console.log('[产检时光轴] 状态切换成功:', updatedItem);
    } catch (err: any) {
        console.error('[产检时光轴] 状态切换失败:', err);
        uni.showToast({
            title: err.message || '操作失败',
            icon: 'none',
            duration: 2000
        });
    }
};

const toggleDetails = (item: CareItem) => {
    item.expanded = !item.expanded;
};

onMounted(() => {
    loadTimeline();
});

</script>

<style lang="scss" scoped>
/* Common Styles */
.nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 44px;
    box-sizing: content-box;
    z-index: 100;
    position: relative;
    
    .back-btn {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        
        .icon { font-size: 16px; color: #1E293B; }
        &:active { transform: scale(0.95); opacity: 0.8; }
    }
    
    .page-title {
        font-size: 18px;
        font-weight: 600;
        color: #1E293B;
        letter-spacing: 0.5px;
    }
    
    .placeholder { width: 32px; }
}

/* Header Section */
.header-section {
    padding: 24px 24px 32px;
    position: relative;
    
    .title { 
        font-size: 28px; 
        font-weight: 800; 
        color: #1E293B; 
        display: block; 
        margin-bottom: 8px;
        letter-spacing: -0.5px;
    }
    .subtitle { 
        font-size: 15px; 
        color: #64748B; 
        display: block; 
        margin-bottom: 28px; 
        font-weight: 400;
    }
    
    .next-visit-card {
        padding: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #FFF0F5 0%, #FFFFFF 100%);
        border: 1px solid rgba(255, 209, 220, 0.5);
        position: relative;
        overflow: hidden;
        border-radius: 24px;
        
        /* Decorative circle */
        .card-bg-decoration {
            position: absolute;
            top: -20px;
            right: -20px;
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(255,192,203,0.2) 0%, rgba(255,255,255,0) 70%);
            border-radius: 50%;
            pointer-events: none;
        }

        .left {
            z-index: 1;
            .label-row {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 8px;
                .label-icon { font-size: 14px; }
                .label { font-size: 13px; color: #94A3B8; font-weight: 500; }
            }
            .name { 
                font-size: 22px; 
                font-weight: 700; 
                color: #BE123C; 
                display: block;
                margin-bottom: 4px;
            }
            .week-info {
                font-size: 14px;
                color: #FB7185;
                font-weight: 500;
                background: rgba(255, 255, 255, 0.6);
                padding: 2px 8px;
                border-radius: 6px;
                display: inline-block;
            }
        }
        
        .right {
            z-index: 1;
            .done-badge {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: #10B981;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                
                .icon { font-size: 20px; color: white; }
            }
            
            .check-btn {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: 2px solid #E2E8F0;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                
                .icon {
                    font-size: 22px;
                    color: white;
                    font-weight: bold;
                    transform: scale(0);
                    transition: transform 0.2s;
                }
                
                &.checked {
                    background: #FB7185;
                    border-color: #FB7185;
                    box-shadow: 0 4px 12px rgba(251, 113, 133, 0.3);
                    .icon { transform: scale(1); }
                }
            }
        }
    }
}

/* Timeline Layout */
.timeline-container {
    padding: 0 24px 60px;
    position: relative;
}

.timeline-group {
    position: relative;
    padding-left: 32px; /* Make space for the line */
    margin-bottom: 24px;
    
    /* Vertical Line */
    .timeline-line {
        position: absolute;
        left: 11px; /* Center of the 24px icon roughly */
        top: 36px;
        bottom: -24px; /* Connect to next group */
        width: 2px;
        background: #F1F5F9;
        z-index: 0;
    }
    
    &:last-child .timeline-line {
        display: none;
    }

    .group-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        position: relative;
        
        .node-icon {
            width: 24px; 
            height: 24px; 
            font-size: 24px; 
            z-index: 1; 
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FDFBF7; /* Match bg to hide line behind */
        }
        
        .group-title-text {
            font-size: 18px;
            font-weight: 700;
            color: #334155;
        }
    }
    
    .timeline-items {
        display: flex;
        flex-direction: column;
        gap: 20px;
        
        .timeline-item {
            position: relative;
            
            /* The dot on the timeline */
            .timeline-dot {
                position: absolute;
                left: -26px; /* Adjust based on padding-left of group */
                top: 24px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #E2E8F0;
                border: 2px solid #fff;
                box-shadow: 0 0 0 1px #CBD5E1;
                z-index: 2;
                transition: all 0.3s;
                
                &.active {
                    background: #FB7185;
                    box-shadow: 0 0 0 3px rgba(251, 113, 133, 0.2);
                    transform: scale(1.2);
                }
                
                &.done {
                    background: #10B981;
                    box-shadow: none;
                }
            }
            
            &.is-active .content-card {
                border: 1px solid rgba(254, 205, 211, 0.6);
                background: linear-gradient(145deg, #FFF9FA 0%, #FFFFFF 100%);
                box-shadow: 0 10px 25px -5px rgba(251, 113, 133, 0.15), 0 4px 10px -3px rgba(251, 113, 133, 0.05);
            }
            
            .content-card {
                padding: 16px 20px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                
                .card-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                    
                    .header-left {
                         flex: 1;
                         
                         .week-tag {
                             display: inline-block;
                             background: #F1F5F9;
                             padding: 2px 8px;
                             border-radius: 6px;
                             margin-bottom: 8px;
                             
                             text { 
                                 font-size: 12px; 
                                 font-weight: 600; 
                                 color: #64748B; 
                             }
                             
                             &.active-tag {
                                 background: #FFE4E6;
                                 text { color: #F43F5E; }
                             }
                         }
                         
                         .item-title {
                             font-size: 16px;
                             font-weight: 700;
                             color: #1E293B;
                             line-height: 1.4;
                             display: block;
                             
                             &.title-done {
                                 color: #94A3B8;
                                 text-decoration-line: line-through;
                                 text-decoration-color: #CBD5E1;
                             }
                         }
                    }

                    .checkbox {
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        border: 2px solid #CBD5E1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                        margin-top: 4px;
                        
                        .check-icon { font-size: 14px; color: white; }
                        
                        &.checked {
                            background: #10B981;
                            border-color: #10B981;
                        }
                    }
                }
                
                .card-main {
                    margin-top: 8px;
                    .item-desc {
                        font-size: 14px;
                        color: #64748B;
                        line-height: 1.5;
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
                        padding: 12px 14px;
                        display: flex;
                        gap: 12px;
                        
                        .tip-icon { font-size: 18px; }
                        .tip-content { font-size: 13px; color: #BE123C; line-height: 1.5; flex: 1; }
                    }
                }
            }
        }
    }
}

/* Components */
.glass-panel {
    background: white;
    box-shadow: 0 4px 20px -5px rgba(148, 163, 184, 0.1);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.8);
}

.floating-entry {
    box-shadow: 0 15px 35px -5px rgba(251, 113, 133, 0.15), 0 5px 15px -3px rgba(251, 113, 133, 0.05);
    transform: translateY(0);
    transition: transform 0.3s;
    &:active { transform: translateY(2px); }
}

/* Animations */
@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in { animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
.delay-1 { animation-delay: 0.1s; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
