<template>
  <PageContainer>
    <u-navbar title="记录" @leftClick="goBack" :placeholder="true" autoBack></u-navbar>
    
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
                <view class="card-status-bar">
                    <text class="date">{{ formatDate(item.createTime) }}</text>
                    <view class="tag" :class="getMealTypeClass(item.mealType)">
                        {{ getMealTypeLabel(item.mealType) }}
                    </view>
                </view>
                
                <view class="card-main">
                    <text class="dish-name">{{ item.dishName || '未知食谱' }}</text>
                    <text class="reason">{{ item.reason }}</text>
                </view>
                
                <view class="card-actions">
                    <view 
                        class="action-btn-wrapper"
                        @click.stop="handleFeedback(item, 'DISLIKE')"
                    >
                         <view class="icon-btn dislike" :class="{ active: item.feedbackAction === 'DISLIKE' }">
                            <text class="emoji" :class="{ 'anim-shake': item.feedbackAction === 'DISLIKE' }">👎</text>
                         </view>
                    </view>
                    <view 
                        class="action-btn-wrapper"
                        @click.stop="handleFeedback(item, 'LIKE')"
                    >
                        <view class="icon-btn like" :class="{ active: item.feedbackAction === 'LIKE' }">
                            <text class="emoji" :class="{ 'anim-pop': item.feedbackAction === 'LIKE' }">❤️</text>
                        </view>
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
    return dayjs(time).format('MM月DD日 · HH:mm');
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
    if (!append) {
        loading.value = true;
        currentPage.value = 1;
    }
    
    try {
        const params: any = {
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
    uni.showLoading({ title: '加载中...' });
    
    try {
        const detail: MealVO = await getMealDetail(item.id);
        
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
            recipeId: item.id,
            action: action,
            dishName: item.dishName
        });
        item.feedbackAction = previousAction;
        uni.showToast({ title: '网络错误', icon: 'none' });
    }
}

onShow(() => {
    // Check for pending filter from Profile page
    const pendingFilter = uni.getStorageSync('HISTORY_FILTER_PENDING');
    if (pendingFilter) {
        if (pendingFilter.feedback) {
            feedbackFilter.value = pendingFilter.feedback;
        }
        // Clear it after using
        uni.removeStorageSync('HISTORY_FILTER_PENDING');
        
        // Reset page and fetch
        currentPage.value = 1;
        fetchData();
    } else {
        // Normal load (or if we want to refresh every time)
        // If we want to persist state when switching tabs normally, we might check if list is empty
        // But requested behavior implies fresh load or update
        fetchData();
    }
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
    padding: 16px 20px;
    padding-bottom: 120px; /* Space for tab bar */
    min-height: 100vh;
    box-sizing: border-box;
    /* Warm Paper Gradient */
    background: linear-gradient(180deg, #fdfbf7 0%, #fff 100%); 
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.history-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.03), 
        0 1px 2px rgba(0, 0, 0, 0.02); /* Soft layered shadow */
    position: relative;
    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
    
    &:active {
        transform: scale(0.99);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }

    .card-status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        .date {
            font-size: 13px;
            color: #94a3b8;
            font-weight: 500;
        }
        
        .tag {
            font-size: 11px;
            padding: 3px 10px;
            border-radius: 12px;
            font-weight: 600;
            
            &.breakfast { background: #fff7ed; color: #f97316; }
            &.lunch { background: #f0fdf4; color: #16a34a; }
            &.dinner { background: #f5f3ff; color: #8b5cf6; }
        }
    }
    
    .card-main {
        margin-bottom: 16px;
        
        .dish-name {
            font-size: 18px;
            font-weight: 700;
            color: #334155;
            display: block;
            margin-bottom: 8px;
            line-height: 1.4;
        }
        
        .reason {
            font-size: 14px;
            color: #64748b;
            line-height: 1.6;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            font-weight: 400;
        }
    }
    
    .card-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        
        .icon-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            transition: all 0.3s;
            
            .emoji {
                font-size: 16px;
                opacity: 0.5;
                transition: all 0.3s;
            }
            
            &.like.active {
                background: #fff1f2;
                .emoji { opacity: 1; transform: scale(1.1); }
            }
            
            &.dislike.active {
                background: #f1f5f9;
                .emoji { opacity: 1; }
            }
        }
    }
}

// Animations
@keyframes pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1.1); }
}

@keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-15deg); }
    75% { transform: rotate(15deg); }
}

.anim-pop { animation: pop 0.4s ease-out forwards; }
.anim-shake { animation: shake 0.4s ease-in-out forwards; }
</style>
