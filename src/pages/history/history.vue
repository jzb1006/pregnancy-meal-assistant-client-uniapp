<template>
  <PageContainer>
    <u-navbar title="历史记录" @leftClick="goBack" :placeholder="true" autoBack></u-navbar>
    
    <view class="content-container">
        <u-empty 
            v-if="!loading && list.length === 0" 
            mode="history" 
            icon="http://cdn.uviewui.com/uview/empty/history.png"
            text="暂无记录，快去问问AI今天吃什么！"
            marginTop="100"
        >
            <u-button 
                text="开始点餐" 
                shape="circle" 
                type="primary" 
                color="linear-gradient(90deg, #fda4af, #f43f5e)"
                customStyle="margin-top: 20px; width: 120px;"
                @click="goToRecommend"
            ></u-button>
        </u-empty>

        <view class="history-list" v-else>
            <view class="history-card" v-for="(item, index) in list" :key="item.id">
                <view class="card-header">
                    <view class="tag" :class="getMealTypeClass(item.mealType)">
                        {{ getMealTypeLabel(item.mealType) }}
                    </view>
                    <text class="date">{{ formatDate(item.createTime) }}</text>
                </view>
                
                <view class="card-body">
                    <text class="dish-name">{{ item.dishName || '未知食谱' }}</text>
                    <text class="reason">{{ item.reason }}</text>
                </view>
                
                <view class="card-footer">
                    <view 
                        class="action-btn" 
                        :class="{ active: item.feedbackAction === 'DISLIKE' }"
                        @click="handleFeedback(item, 'DISLIKE')"
                    >
                        <text class="icon">👎</text>
                        <text>{{ item.feedbackAction === 'DISLIKE' ? '已不感兴趣' : '不感兴趣' }}</text>
                    </view>
                    <view 
                        class="action-btn" 
                        :class="{ active: item.feedbackAction === 'LIKE' }"
                        @click="handleFeedback(item, 'LIKE')"
                    >
                        <text class="icon">❤️</text>
                        <text>{{ item.feedbackAction === 'LIKE' ? '已收藏' : '收藏' }}</text>
                    </view>
                </view>
            </view>
            
            <u-loadmore :status="loadStatus" v-if="list.length > 0" marginTop="20" marginBottom="20" />
        </view>
    </view>

    <CustomTabBar :current="2" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';
import PageContainer from '@/components/common/PageContainer.vue';
import CustomTabBar from '@/components/common/CustomTabBar.vue';
import dayjs from 'dayjs';

const userStore = useUserStore();
const list = ref<any[]>([]);
const loading = ref(true);
const loadStatus = ref('nomore'); // 'loadmore', 'loading', 'nomore'

const goToRecommend = () => {
    uni.switchTab({ url: '/pages/recommend/recommend' });
}

const goBack = () => {
    uni.navigateBack();
}

const getMealTypeLabel = (type: string) => {
    const map: any = { BREAKFAST: '早餐', LUNCH: '午餐', DINNER: '晚餐' };
    return map[type] || '加餐';
}

const getMealTypeClass = (type: string) => {
    // Return class name for styling
    return type ? type.toLowerCase() : '';
}

const formatDate = (time: string) => {
    return dayjs(time).format('YYYY-MM-DD');
}

const fetchData = async () => {
    if (!userStore.openId) return;
    try {
        const res: any = await request({
            url: '/v1/meal/history',
            data: { openId: userStore.openId }
        });
        
        if (res.code === 200) {
            list.value = res.data.list || [];
        }
    } catch (e) {
        console.error(e);
        uni.showToast({ title: '加载失败', icon: 'none' });
    } finally {
        loading.value = false;
        uni.stopPullDownRefresh();
    }
}

const handleFeedback = async (item: any, action: 'LIKE' | 'DISLIKE') => {
    // Optimistic UI update
    const previousAction = item.feedbackAction;
    if (previousAction === action) return; // Ignore if same action
    
    item.feedbackAction = action;

    try {
        const res: any = await request({
            url: '/v1/feedback',
            method: 'POST',
            data: {
                openId: userStore.openId,
                recipeId: item.id,
                action: action,
                reason: action === 'DISLIKE' ? 'Not interested' : undefined
            }
        });

        if (res.code === 200) {
            uni.showToast({ 
                title: action === 'LIKE' ? '已收藏 ❤️' : '已不推荐 💔', 
                icon: 'none' 
            });
            // Ideally backend returns updated list or status, but simple fetch works
            // fetchData(); // Optional: reload to sync
        } else {
            // Revert on failure
            item.feedbackAction = previousAction;
            uni.showToast({ title: res.msg || '操作失败', icon: 'none' });
        }
    } catch (e) {
        console.error(e);
        item.feedbackAction = previousAction;
        uni.showToast({ title: '网络错误', icon: 'none' });
    }
}

onShow(() => {
    fetchData();
});

onPullDownRefresh(() => {
    fetchData();
});
</script>

<style lang="scss" scoped>
.content-container {
    padding: 15px;
    padding-bottom: 100px;
}

.history-card {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 15px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0,0,0,0.02);

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .tag {
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 600;

            &.breakfast { background: #fff7ed; color: #f97316; }
            &.lunch { background: #f0fdf4; color: #22c55e; }
            &.dinner { background: #f3e8ff; color: #a855f7; }
        }

        .date {
            font-size: 12px;
            color: #94a3b8;
        }
    }

    .card-body {
        margin-bottom: 16px;
        .dish-name {
            font-size: 18px;
            font-weight: bold;
            color: #334155;
            display: block;
            margin-bottom: 6px;
        }
        .reason {
            font-size: 14px;
            color: #64748b;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            overflow: hidden;
        }
    }

    .card-footer {
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid #f1f5f9;
        padding-top: 12px;
        gap: 12px;

        .action-btn {
            display: flex;
            align-items: center;
            font-size: 12px;
            padding: 6px 14px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            color: #64748b;
            background: #f8fafc;
            transition: all 0.2s;

            .icon { margin-right: 4px; font-size: 14px; }

            &.active {
                border-color: #fda4af;
                background: #fff1f2;
                color: #e11d48;
            }

            &:active {
                opacity: 0.8;
                transform: scale(0.98);
            }
        }
    }
}
</style>
