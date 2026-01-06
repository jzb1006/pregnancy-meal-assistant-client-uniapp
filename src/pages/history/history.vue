<template>
  <PageContainer>
    <u-navbar title="历史记录" @leftClick="goBack" :placeholder="true" autoBack></u-navbar>
    
    <!-- 搜索栏 -->
    <HistorySearchBar v-model="searchKeyword" @search="handleSearch" />
    
    <!-- 筛选标签 -->
    <HistoryFilterTabs 
      v-model:feedback="feedbackFilter" 
      v-model:mealType="mealTypeFilter"
      @change="handleFilterChange"
    />
    
    <view class="content-container">
        <u-empty 
            v-if="!loading && list.length === 0" 
            mode="history" 
            icon="http://cdn.uviewui.com/uview/empty/history.png"
            :text="emptyText"
            marginTop="100"
        >
            <u-button 
                v-if="!hasSearchConditions"
                text="开始点餐" 
                shape="circle" 
                type="primary" 
                color="linear-gradient(90deg, #fda4af, #f43f5e)"
                customStyle="margin-top: 20px; width: 120px;"
                @click="goToRecommend"
            ></u-button>
            <u-button 
                v-else
                text="清除筛选" 
                shape="circle" 
                type="info" 
                customStyle="margin-top: 20px; width: 120px;"
                @click="clearFilters"
            ></u-button>
        </u-empty>

        <view class="history-list" v-else>
            <view 
              class="history-card" 
              v-for="(item, index) in list" 
              :key="item.id"
              @click="goToDetail(item)"
            >
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
                        @click.stop="handleFeedback(item, 'DISLIKE')"
                    >
                        <text class="icon">👎</text>
                        <text>{{ item.feedbackAction === 'DISLIKE' ? '已不感兴趣' : '不感兴趣' }}</text>
                    </view>
                    <view 
                        class="action-btn" 
                        :class="{ active: item.feedbackAction === 'LIKE' }"
                        @click.stop="handleFeedback(item, 'LIKE')"
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
import { ref, computed } from 'vue';
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';
import { getMealHistory, getMealDetail, type PageResult, type MealVO } from '@/api/service';
import PageContainer from '@/components/common/PageContainer.vue';
import CustomTabBar from '@/components/common/CustomTabBar.vue';
import HistorySearchBar from '@/components/history/HistorySearchBar.vue';
import HistoryFilterTabs from '@/components/history/HistoryFilterTabs.vue';
import dayjs from 'dayjs';

const userStore = useUserStore();
const list = ref<any[]>([]);
const loading = ref(true);
const loadStatus = ref<'loadmore' | 'loading' | 'nomore'>('nomore');

// 搜索和筛选状态
const searchKeyword = ref('');
const feedbackFilter = ref('');
const mealTypeFilter = ref('');

// 分页状态
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(0);
const hasMore = ref(false);

// 计算属性：是否有搜索条件
const hasSearchConditions = computed(() => {
  return !!(searchKeyword.value || feedbackFilter.value || mealTypeFilter.value);
});

// 计算属性：空状态提示文本
const emptyText = computed(() => {
  return hasSearchConditions.value 
    ? '未找到匹配的记录，试试调整筛选条件吧 🔍' 
    : '暂无记录，快去问问AI今天吃什么！';
});

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

// 更新加载状态
const updateLoadStatus = () => {
    if (hasMore.value) {
        loadStatus.value = 'loadmore';
    } else {
        loadStatus.value = 'nomore';
    }
}

const fetchData = async (append = false) => {
    if (!userStore.openId) return;
    
    if (!append) {
        loading.value = true;
        currentPage.value = 1;
    }
    
    try {
        const params: any = {
            openId: userStore.openId,
            page: currentPage.value,
            size: pageSize.value
        };
        
        // 添加搜索条件
        if (searchKeyword.value) {
            params.dishName = searchKeyword.value;
        }
        if (feedbackFilter.value) {
            params.feedbackAction = feedbackFilter.value;
        }
        if (mealTypeFilter.value) {
            params.mealType = mealTypeFilter.value;
        }
        
        const result: PageResult<MealVO> = await getMealHistory(params);
        
        if (append) {
            list.value = [...list.value, ...(result.list || [])];
        } else {
            list.value = result.list || [];
        }
        
        // 更新分页状态
        totalPages.value = result.pages || 0;
        hasMore.value = currentPage.value < totalPages.value;
        updateLoadStatus();
    } catch (e) {
        console.error('获取历史记录失败:', e);
        console.error('请求参数:', {
            openId: userStore.openId,
            searchKeyword: searchKeyword.value,
            feedbackFilter: feedbackFilter.value,
            mealTypeFilter: mealTypeFilter.value,
            page: currentPage.value
        });
        uni.showToast({ title: '加载失败', icon: 'none' });
    } finally {
        loading.value = false;
        updateLoadStatus();
        uni.stopPullDownRefresh();
    }
}

const loadMore = async () => {
    if (!hasMore.value || loadStatus.value === 'loading') return;
    
    loadStatus.value = 'loading';
    currentPage.value += 1;
    await fetchData(true);
}

const handleSearch = () => {
    // 搜索时重置到第一页
    currentPage.value = 1;
    fetchData();
}

const handleFilterChange = () => {
    // 筛选变化时重置到第一页
    currentPage.value = 1;
    fetchData();
}

const clearFilters = () => {
    // 清除所有筛选条件
    searchKeyword.value = '';
    feedbackFilter.value = '';
    mealTypeFilter.value = '';
    currentPage.value = 1;
    fetchData();
}

const goToDetail = async (item: any) => {
    if (!userStore.openId) return;
    
    uni.showLoading({ title: '加载中...' });
    
    try {
        const detail: MealVO = await getMealDetail(userStore.openId, item.id);
        
        // 存储到本地，供详情页使用
        uni.setStorageSync('CURRENT_RECIPE_DETAIL', detail);
        
        uni.hideLoading();
        
        // 跳转到详情页
        uni.navigateTo({
            url: '/pages/recipe/detail'
        });
    } catch (e) {
        console.error('获取菜单详情失败:', e);
        console.error('请求参数:', {
            openId: userStore.openId,
            recipeId: item.id,
            dishName: item.dishName
        });
        uni.hideLoading();
        uni.showToast({ title: '加载详情失败', icon: 'none' });
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
        } else {
            // Revert on failure
            console.error('反馈提交失败:', res.msg);
            item.feedbackAction = previousAction;
            uni.showToast({ title: res.msg || '操作失败', icon: 'none' });
        }
    } catch (e) {
        console.error('反馈提交异常:', e);
        console.error('请求参数:', {
            openId: userStore.openId,
            recipeId: item.id,
            action: action,
            dishName: item.dishName
        });
        item.feedbackAction = previousAction;
        uni.showToast({ title: '网络错误', icon: 'none' });
    }
}

onShow(() => {
    fetchData();
});

onPullDownRefresh(() => {
    // 下拉刷新时重置筛选条件
    searchKeyword.value = '';
    feedbackFilter.value = '';
    mealTypeFilter.value = '';
    currentPage.value = 1;
    fetchData();
});

onReachBottom(() => {
    loadMore();
});
</script>

<style lang="scss" scoped>
.content-container {
    padding: 15px;
    padding-bottom: 100px;
}

.history-card {
    background: #fff;
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 15px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: all 0.2s;

    &:active {
        transform: scale(0.98);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .tag {
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 600;

            &.breakfast { background: #fff7ed; color: #f97316; }
            &.lunch { background: #f0fdf4; color: #22c55e; }
            &.dinner { background: #f3e8ff; color: #a855f7; }
        }

        .date {
            font-size: 11px;
            color: #94a3b8;
        }
    }

    .card-body {
        margin-bottom: 16px;
        .dish-name {
            font-size: 16px;
            font-weight: bold;
            color: #334155;
            display: block;
            margin-bottom: 6px;
        }
        .reason {
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
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
            font-size: 11px;
            padding: 6px 14px;
            border-radius: 20px;
            color: #64748b;
            background: #f8fafc;
            box-shadow: 0 2px 6px rgba(0,0,0,0.04);
            transition: all 0.2s;

            .icon { margin-right: 4px; font-size: 13px; }

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
