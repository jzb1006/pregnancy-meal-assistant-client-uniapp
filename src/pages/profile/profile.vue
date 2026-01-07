<template>
  <PageContainer>
    <!-- Custom Navbar -->
    <u-navbar 
        :title="isEditing ? '编辑档案' : '个人中心'" 
        :bgColor="isEditing ? '#fff' : 'transparent'" 
        :leftIcon="isEditing ? 'close' : ''"
        @leftClick="cancelEdit" 
        :placeholder="isEditing"
        :titleStyle="{ color: isEditing ? '#333' : '#fff', fontWeight: 'bold' }"
    ></u-navbar>

    <!-- DASHBOARD MODE -->
    <view v-if="!isEditing" class="dashboard-container">
        <!-- Header Section -->
        <view class="header-bg">
            <view class="user-info">
                <view class="avatar-box">
                    <u-image src="/static/logo.png" width="70px" height="70px" shape="circle"></u-image>
                </view>
                <view class="text-box">
                    <text class="nickname">准妈妈</text>
                    <text class="status-badge" v-if="pregnancyProgress.weeks >= 0">
                        孕期 {{ pregnancyProgress.weeks }}周 + {{ pregnancyProgress.days }}天
                    </text>
                </view>
            </view>
            
            <!-- Pregnancy Progress Card -->
            <view class="progress-card">
                 <view class="progress-row">
                     <view class="p-item">
                         <text class="label">末次月经</text>
                         <text class="value">{{ model.lmp || '未设置' }}</text>
                     </view>
                     <view class="divider"></view>
                     <view class="p-item">
                         <text class="label">预产期 (预计)</text>
                         <text class="value highlight">{{ derivedDueDate }}</text>
                     </view>
                 </view>
            </view>
        </view>

        <view class="card-area">
            <!-- Health Archive Card -->
             <view class="info-card">
                <view class="card-header">
                    <view class="title-row">
                        <u-icon name="file-text-fill" color="#f43f5e" size="20"></u-icon>
                        <text class="card-title">健康档案</text>
                    </view>
                    <view class="edit-link" @click="startEdit">
                        <u-icon name="edit-pen" color="#94a3b8" size="18"></u-icon>
                        <text>修改</text>
                    </view>
                </view>
                <view class="grid-info">
                    <view class="grid-item">
                        <text class="label">身高</text>
                        <text class="val">{{ model.height }} <text class="unit">cm</text></text>
                    </view>
                    <view class="grid-item">
                        <text class="label">孕前体重</text>
                        <text class="val">{{ model.weight }} <text class="unit">kg</text></text>
                    </view>
                     <view class="grid-item">
                        <text class="label">BMI</text>
                        <text class="val">{{ bmiValue }}</text>
                    </view>
                </view>
            </view>

            <!-- Dietary Preferences Card -->
             <view class="info-card">
                <view class="card-header">
                     <view class="title-row">
                        <u-icon name="heart-fill" color="#f43f5e" size="20"></u-icon>
                        <text class="card-title">饮食偏好</text>
                    </view>
                </view>
                <view class="pref-content">
                    <view class="pref-row">
                        <text class="label">菜系偏好：</text>
                         <view class="tag-wrap">
                             <u-tag :text="getCuisineLabel(model.cuisine)" plain size="mini" type="error" shape="circle"></u-tag>
                         </view>
                    </view>
                     <view class="pref-row">
                        <text class="label">口味偏好：</text>
                        <text class="text-val">{{ model.preferences || '暂无详细描述' }}</text>
                    </view>
                    <view class="pref-row">
                        <text class="label">忌口/过敏：</text>
                        <text class="text-val">{{ model.taboo || '无' }}</text>
                    </view>
                </view>
            </view>

            <!-- Menu List -->
            <view class="menu-list">
                <u-cell-group :border="false">
                     <u-cell icon="star" title="我的收藏" isLink :border="false" clickable @click="handleToFavorites"></u-cell>

                     <u-cell icon="kefu-ermai" title="意见反馈" isLink :border="false"></u-cell>
                     <u-cell icon="info-circle" title="关于我们" isLink :border="false"></u-cell>
                </u-cell-group>
            </view>

            <!-- Logout Button -->
             <view class="logout-box">
                 <u-button type="info" text="退出登录" plain shape="circle" @click="handleLogout"></u-button>
             </view>
        </view>
    </view>

    <!-- EDIT MODE (Refined Split Layout) -->
    <view v-else class="edit-container">
       <u-form labelPosition="top" :model="model" :rules="rules" ref="form1">
           
           <!-- Card 1: Basic Info -->
           <view class="form-card">
                <view class="section-header">
                    <text class="emoji">📝</text>
                    <text class="title">基础档案</text>
                </view>
                
                <div class="grid-row">
                    <div class="grid-col">
                        <u-form-item label="末次月经" prop="lmp" :borderBottom="false" @click="showLmp = true; hideKeyboard()">
                          <view class="bubble-input">
                              <u-input v-model="model.lmp" disabled disabledColor="transparent" placeholder="请选择" border="none"></u-input>
                              <u-icon name="calendar" color="#94a3b8" size="18"></u-icon>
                          </view>
                        </u-form-item>
                    </div>
                    <div class="grid-col">
                        <u-form-item label="出生日期" prop="birthDate" :borderBottom="false" @click="showBirth = true; hideKeyboard()">
                          <view class="bubble-input">
                              <u-input v-model="model.birthDate" disabled disabledColor="transparent" placeholder="请选择" border="none"></u-input>
                              <u-icon name="gift" color="#94a3b8" size="18"></u-icon>
                          </view>
                        </u-form-item>
                    </div>
                </div>

                <div class="grid-row">
                    <div class="grid-col">
                         <u-form-item label="身高 (cm)" prop="height" :borderBottom="false" @click="showHeight = true; hideKeyboard()">
                           <view class="bubble-input">
                               <u-input v-model="model.height" disabled disabledColor="transparent" placeholder="身高" border="none" inputAlign="center"></u-input>
                           </view>
                        </u-form-item>
                    </div>
                    <div class="grid-col">
                         <u-form-item label="体重 (kg)" prop="weight" :borderBottom="false" @click="showWeight = true; hideKeyboard()">
                           <view class="bubble-input">
                               <u-input v-model="model.weight" disabled disabledColor="transparent" placeholder="体重" border="none" inputAlign="center"></u-input>
                           </view>
                        </u-form-item>
                    </div>
                </div>
           </view>

           <!-- Card 2: Preferences -->
           <view class="form-card">
                <view class="section-header">
                    <text class="emoji">🍽️</text>
                    <text class="title">饮食偏好</text>
                </view>

                <u-form-item label="菜系偏好" prop="cuisine" :borderBottom="false">
                    <view class="cuisine-grid">
                        <view 
                            class="cuisine-item-bubble" 
                            v-for="(item, index) in cuisineOptions" 
                            :key="index"
                            :class="{ active: model.cuisine === item.value }"
                            @click="model.cuisine = item.value"
                        >
                            {{ item.label }}
                        </view>
                    </view>
                </u-form-item>

                <u-form-item label="口味详细描述" prop="preferences" :borderBottom="false">
                    <view class="bubble-textarea">
                        <u-textarea v-model="model.preferences" placeholder="例如：清淡、酸辣、多蔬菜..." count height="70" disabledColor="transparent" border="none"></u-textarea>
                    </view>
                </u-form-item>

                <u-form-item label="忌口与过敏源" prop="taboo" :borderBottom="false">
                    <view class="bubble-textarea">
                        <u-textarea v-model="model.taboo" placeholder="例如：海鲜、花生、香菜..." count height="70" border="none"></u-textarea>
                    </view>
                </u-form-item>
           </view>
       </u-form>

        <!-- Sticky Footer Action Area -->
        <view class="action-footer">
            <u-button 
                type="primary" 
                text="保存档案" 
                shape="circle" 
                color="linear-gradient(90deg, #fda4af, #f43f5e)"
                :loading="loading"
                @click="submit"
                customStyle="height: 48px; font-size: 16px; font-weight: bold; box-shadow: 0 8px 16px rgba(244, 63, 94, 0.25);"
            ></u-button>
            <view class="cancel-text" @click="cancelEdit">放弃修改</view>
        </view>
    </view>
    
    <!-- Pickers (Shared) -->
    <u-datetime-picker :show="showLmp" v-model="lmpTimestamp" mode="date" :maxDate="Number(new Date())" @confirm="confirmLmp" @cancel="showLmp = false"></u-datetime-picker>
    <u-datetime-picker :show="showBirth" v-model="birthTimestamp" mode="date" :minDate="new Date(1960, 0, 1).getTime()" :maxDate="Number(new Date())" @confirm="confirmBirth" @cancel="showBirth = false"></u-datetime-picker>
    <u-picker :show="showHeight" :columns="heightColumns" title="选择身高" @confirm="confirmHeight" @cancel="showHeight = false"></u-picker>
    <u-picker :show="showWeight" :columns="weightColumns" title="选择体重" @confirm="confirmWeight" @cancel="showWeight = false"></u-picker>

    <CustomTabBar :current="3" v-if="!isEditing" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';
import PageContainer from '@/components/common/PageContainer.vue';
import CustomTabBar from '@/components/common/CustomTabBar.vue';
import dayjs from 'dayjs';

const userStore = useUserStore();
const isEditing = ref(false); // Mode Toggle
const loading = ref(false);

const showLmp = ref(false);
const showBirth = ref(false);
const showHeight = ref(false);
const showWeight = ref(false);
const lmpTimestamp = ref(Number(new Date()));
const birthTimestamp = ref(Number(new Date()));

// --- Data Models ---
const heightColumns = reactive([Array.from({length: 61}, (_, i) => i + 140)]);
const weightColumns = reactive([Array.from({length: 131}, (_, i) => (35 + i * 0.5).toFixed(1))]);
const cuisineOptions = [
    { label: '中餐 🥢', value: 'CHINESE' },
    { label: '西餐 🍴', value: 'WESTERN' },
    { label: '日韩 🍱', value: 'JAPANESE_KOREAN' },
    { label: '东南亚 🌶️', value: 'SOUTHEAST_ASIAN' },
    { label: '素食 🥬', value: 'VEGETARIAN' },
    { label: '不限 🌍', value: 'NO_PREFERENCE' },
];

const model = reactive({
    lmp: '',
    birthDate: '',
    height: 160,
    weight: 55,
    cuisine: 'NO_PREFERENCE',
    preferences: '',
    taboo: ''
});

const rules = {
    lmp: { required: true, message: '请选择末次月经', trigger: ['blur', 'change'] },
    birthDate: { required: true, message: '请选择出生日期', trigger: ['blur', 'change'] },
    height: { required: true, message: '请选择身高', trigger: ['change'] },
    weight: { required: true, message: '请选择体重', trigger: ['change'] }
};

// --- Computed Logic ---
const derivedDueDate = computed(() => {
    if (!model.lmp) return '请设置末次月经';
    // Naegele's rule: LMP + 280 days (40 weeks)
    return dayjs(model.lmp).add(280, 'day').format('YYYY-MM-DD');
});

const pregnancyProgress = computed(() => {
    if (!model.lmp) return { weeks: 0, days: 0 };
    const start = dayjs(model.lmp);
    const now = dayjs();
    const diffDays = now.diff(start, 'day');
    
    if (diffDays < 0) return { weeks: 0, days: 0 }; // LMP in future?
    
    return {
        weeks: Math.floor(diffDays / 7),
        days: diffDays % 7
    };
});

const bmiValue = computed(() => {
    if (!model.height || !model.weight) return '--';
    const h = model.height / 100; // cm to m
    return (model.weight / (h * h)).toFixed(1);
});

// --- Methods ---
const startEdit = () => {
    isEditing.value = true;
};

const cancelEdit = () => {
    isEditing.value = false;
    fetchInfo(); // Revert changes
};

const getCuisineLabel = (val: string) => {
    const found = cuisineOptions.find(o => o.value === val);
    return found ? found.label : val;
};

const handleToFavorites = () => {
    // Set flag for History page to pick up
    uni.setStorageSync('HISTORY_FILTER_PENDING', { feedback: 'LIKE' });
    uni.switchTab({ url: '/pages/history/history' });
};

const handleLogout = () => {
    uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
            if (res.confirm) {
                userStore.logout();
                uni.reLaunch({ url: '/pages/login/login' });
            }
        }
    });
};

const hideKeyboard = () => uni.hideKeyboard();

const confirmLmp = (e: any) => {
    showLmp.value = false;
    model.lmp = dayjs(e.value).format('YYYY-MM-DD');
}
const confirmBirth = (e: any) => {
    showBirth.value = false;
    model.birthDate = dayjs(e.value).format('YYYY-MM-DD');
}
const confirmHeight = (e: any) => {
    model.height = Number(e.value[0]);
    showHeight.value = false;
}
const confirmWeight = (e: any) => {
    model.weight = Number(e.value[0]);
    showWeight.value = false;
}

const fetchInfo = async () => {
    try {
        const res: any = await request({ url: '/v1/user/info' });
        if (res && res.code === 200 && res.data) {
             const data = res.data;
             model.lmp = data.lmp ? dayjs(data.lmp).format('YYYY-MM-DD') : '';
             model.birthDate = data.birthDate ? dayjs(data.birthDate).format('YYYY-MM-DD') : '';
             if (model.lmp) lmpTimestamp.value = dayjs(model.lmp).valueOf();
             if (model.birthDate) birthTimestamp.value = dayjs(model.birthDate).valueOf();
             
             const h = Number(data.height);
             const w = Number(data.weight);
             if (!isNaN(h)) model.height = h;
             if (!isNaN(w)) model.weight = w;

             model.cuisine = data.cuisinePreference || 'NO_PREFERENCE';
             model.preferences = data.preferences || '';
             model.taboo = data.dietaryRestrictions || '';
        }
    } catch (e) {
        console.error(e);
    }
}

const submit = async () => {
    if (!model.lmp || !model.birthDate) {
        uni.showToast({ title: '日期不完整', icon: 'none' });
        return;
    }
    loading.value = true;
    try {
        const payload = {
            lmp: model.lmp,
            birthDate: model.birthDate,
            height: model.height,
            weight: model.weight,
            dietaryRestrictions: model.taboo,
            preferences: model.preferences,
            cuisinePreference: model.cuisine
        };
        const res: any = await request({ url: '/v1/user/profile', method: 'POST', data: payload });
        
        if (res.code === 200) {
            uni.showToast({ title: '已保存', icon: 'success' });
            setTimeout(() => {
                isEditing.value = false; // Switch back to dashboard
            }, 800);
        } else {
             uni.showToast({ title: res.message || '保存失败', icon: 'none' });
        }
    } catch (e) {
        uni.showToast({ title: '请求失败', icon: 'none' });
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchInfo();
});
</script>

<style lang="scss" scoped>
/* Dashboard Styles */
.dashboard-container {
    padding-bottom: 120px;
    background: #f8f9fc;
    min-height: 100vh;
}

.header-bg {
    background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
    padding: 100px 12px 60px 12px; /* Reduced side padding */
    border-bottom-left-radius: 20px; /* Gently reduced radius */
    border-bottom-right-radius: 20px;
    color: #fff;
    position: relative;
    margin-bottom: 50px;
    
    .user-info {
        display: flex;
        align-items: center;
        margin-bottom: 30px;
        
        .avatar-box {
            border: 3px solid rgba(255,255,255,0.6);
            border-radius: 50%;
            margin-right: 15px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        
        .text-box {
            .nickname {
                font-size: 22px;
                font-weight: bold;
                display: block;
                margin-bottom: 6px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
            .status-badge {
                background: rgba(255,255,255,0.25);
                backdrop-filter: blur(5px);
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 500;
            }
        }
    }

    .progress-card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 20px;
        position: absolute;
        bottom: -30px;
        left: 12px;
        right: 12px;
        box-shadow: 0 8px 20px rgba(255, 107, 129, 0.15);
        color: #333;
        
        .progress-row {
            display: flex;
            justify-content: space-around;
            align-items: center;
            
            .p-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                .label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
                .value { font-size: 16px; font-weight: bold; color: #475569; }
                .highlight { color: #f43f5e; } /* Highlight Due Date */
            }
            .divider { width: 1px; height: 30px; background: #eee; }
        }
    }
}

.card-area {
    padding: 0 10px;
    
    .info-card {
        background: #fff;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.02);

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            
            .title-row {
                display: flex;
                align-items: center;
                gap: 8px;
                .card-title { font-size: 16px; font-weight: bold; color: #1e293b; }
            }
            
            .edit-link {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 13px;
                color: #94a3b8;
            }
        }
        
        .grid-info {
            display: flex;
            justify-content: space-between;
            padding: 0 10px;
            
            .grid-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                .label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
                .val { font-size: 18px; font-weight: bold; color: #334155; }
                .unit { font-size: 12px; color: #94a3b8; font-weight: normal; margin-left: 2px;}
            }
        }

        .pref-content {
            .pref-row {
                margin-bottom: 8px;
                display: flex;
                align-items: flex-start;
                font-size: 14px;
                &:last-child { margin-bottom: 0; }
                
                .label {
                    color: #94a3b8;
                    width: 80px;
                    flex-shrink: 0;
                }
                .text-val {
                    color: #475569;
                    line-height: 1.4;
                }
                .tag-wrap { display: flex; }
            }
        }
    }
    
    .menu-list {
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 24px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }
    
    .logout-box {
        margin-bottom: 40px;
    }
}

/* Edit Mode Unique Styles */
.edit-container {
    padding: 12px;
    padding-top: 100px;
    background: #f8f9fc;
    min-height: 100vh;
    padding-bottom: 150px; /* Space for sticky footer */

    .form-card {
        background: #fff;
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 16px; /* Spacing between cards */
        box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        border: 1px solid rgba(255,255,255,0.6);

        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            
            .emoji { font-size: 20px; margin-right: 8px; }
            .title { font-size: 17px; font-weight: bold; color: #334155; }
        }

        .grid-row {
            display: flex;
            gap: 12px;
            margin-bottom: 0px; 
            .grid-col { flex: 1; min-width: 0; }
        }

        /* Bubble Input Styles */
        .bubble-input {
            background: #f8fafc; /* Lighter background */
            border-radius: 14px;
            padding: 4px 12px;
            display: flex;
            align-items: center;
            height: 46px;
            width: 100%;
            transition: all 0.2s;
            border: 1px solid transparent;
            
            &:active {
                background: #f1f5f9;
            }
        }
        
        .bubble-textarea {
            background: #f8fafc;
            border-radius: 14px;
            padding: 8px;
            width: 100%;
        }

        /* Cuisine Bubbles */
        .cuisine-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            .cuisine-item-bubble {
                padding: 8px 14px;
                border-radius: 18px;
                font-size: 12px;
                color: #64748b;
                background: #f8fafc;
                border: 1px solid transparent;
                transition: all 0.2s;
                font-weight: 500;
                
                &.active {
                    background: #fff1f2;
                    color: #f43f5e;
                    border-color: #fecdd3;
                    box-shadow: 0 2px 8px rgba(244, 63, 94, 0.1);
                }
            }
        }

        // Force labels to not wrap
        :deep(.u-form-item__body__left__content__label) {
            white-space: nowrap !important;
            word-break: keep-all;
            color: #64748b !important;
            font-size: 13px !important;
            margin-bottom: 4px !important;
        }
        
        // Remove standard form item border
        :deep(.u-form-item__body) {
            padding: 10px 0 !important;
        }
    }
    
    .action-footer {
        position: fixed;
        bottom: 0; 
        left: 0;
        right: 0;
        background: #ffffff; /* Solid white */
        padding: 12px 24px;
        padding-bottom: calc(12px + constant(safe-area-inset-bottom));
        padding-bottom: calc(12px + env(safe-area-inset-bottom));
        box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
        z-index: 100;
        
        .cancel-text {
            text-align: center;
            font-size: 14px;
            color: #94a3b8;
            margin-top: 10px;
            padding-bottom: 0;
        }
    }
}
</style>
