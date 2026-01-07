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
                        class="action-btn-wrapper"
                        @click.stop="handleFeedback(item, 'DISLIKE')"
                    >
                        <view class="action-btn dislike" :class="{ active: item.feedbackAction === 'DISLIKE' }">
                            <text class="icon" :class="{ 'anim-shake': item.feedbackAction === 'DISLIKE' }">👎</text>
                            <text class="label">{{ item.feedbackAction === 'DISLIKE' ? '已不感兴趣' : '不感兴趣' }}</text>
                        </view>
                    </view>
                    <view 
                        class="action-btn-wrapper"
                        @click.stop="handleFeedback(item, 'LIKE')"
                    >
                        <view class="action-btn like" :class="{ active: item.feedbackAction === 'LIKE' }">
                            <text class="icon" :class="{ 'anim-pop': item.feedbackAction === 'LIKE' }">❤️</text>
                            <text class="label">{{ item.feedbackAction === 'LIKE' ? '已收藏' : '收藏' }}</text>
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
    padding: 10px;
    padding-bottom: 100px;
}

.history-card {
    background: #fff;
    border-radius: 24px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid rgba(255, 255, 255, 0.8);

    &:active {
        transform: scale(0.98);
        box-shadow: 0 5px 20px -5px rgba(0, 0, 0, 0.08);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .tag {
            font-size: 11px;
            padding: 6px 14px;
            border-radius: 100px;
            font-weight: 600;
            letter-spacing: 0.5px;

            &.breakfast { background: #fff7ed; color: #f97316; }
            &.lunch { background: #f0fdf4; color: #22c55e; }
            &.dinner { background: #f3e8ff; color: #a855f7; }
        }

        .date {
            font-size: 12px;
            color: #94a3b8;
            font-weight: 500;
        }
    }

    .card-body {
        margin-bottom: 20px;
        .dish-name {
            font-size: 18px;
            font-weight: 700;
            color: #334155;
            display: block;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
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

    .card-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        border-top: 1px solid #f8fafc;
        padding-top: 16px;
        gap: 12px;

        .action-btn-wrapper {
            position: relative;
        }

        .action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 36px;
            padding: 0 16px;
            border-radius: 18px;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            background: #f8fafc;
            color: #94a3b8;
            border: 1px solid transparent;

            .icon {
                font-size: 14px;
                margin-right: 6px;
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                display: inline-block;
            }

            .label {
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.3px;
            }

            // Button Types
            &.like {
                &:active {
                    transform: scale(0.92);
                }

                &.active {
                    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
                    color: #e11d48;
                    box-shadow: 0 8px 20px -6px rgba(255, 154, 158, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.4);

                    .icon {
                        color: #e11d48;
                    }

                    .label {
                        color: #be123c;
                    }
                }
            }

            &.dislike {
                &:active {
                    transform: scale(0.92);
                }

                &.active {
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #cbd5e1;
                    
                    .icon {
                        filter: grayscale(1);
                        opacity: 0.8;
                    }
                }
            }
        }
    }
}

// Animations
@keyframes pop {
    0% { transform: scale(1); }
    40% { transform: scale(1.4); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); }
}

@keyframes shake {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(-15deg); }
    50% { transform: rotate(15deg); }
    75% { transform: rotate(-8deg); }
    100% { transform: rotate(0deg); }
}

.anim-pop {
    animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.anim-shake {
    animation: shake 0.5s ease-in-out forwards;
}
</style>
