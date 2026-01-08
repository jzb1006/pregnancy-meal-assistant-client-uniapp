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
                <!-- 待产状态不显示复选框,显示完成图标 -->
                <view v-if="nextVisit.id === 'all-done'" class="done-badge">
                    <text class="icon">✓</text>
                </view>
                <view v-else class="check-btn" :class="{ checked: nextVisit.done }" @click="toggleCheck(nextVisit)">
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
            title: newStatus ? '已标记完成' : '已取消完成',
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
            
            .done-badge {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #10B981;
                display: flex;
                align-items: center;
                justify-content: center;
                
                .icon {
                    font-size: 16px;
                    color: white;
                    font-weight: bold;
                }
            }
            
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
