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
                <view class="avatar-col">
                    <button 
                        class="avatar-wrapper" 
                        open-type="chooseAvatar" 
                        @chooseavatar="onChooseAvatar"
                    >
                        <view class="avatar-box">
                            <u-image :src="userStore.avatar" width="80px" height="80px" shape="circle"></u-image>
                            <view class="edit-hint"><u-icon name="camera-fill" color="#333" size="14"></u-icon></view>
                        </view>
                    </button>
                    <!-- <view class="hint-text">点击更换头像</view> -->
                </view>

                <view class="text-box">
                    <input 
                        type="nickname" 
                        class="nickname-input" 
                        :value="userStore.nickname" 
                        placeholder="点击同步微信昵称"
                        @blur="onNicknameBlur"
                        @change="onNicknameChange" 
                    />
                </view>
            </view>
        </view>
            
        <!-- Pregnancy Progress Card (Moved outside header to avoid clipping) -->
        <view class="progress-card-container">
            <view class="progress-card">
                 <view class="progress-header">
                    <text class="p-title">已孕 {{ pregnancyProgress.weeks }}周 + {{ pregnancyProgress.days }}天</text>
                    <view class="p-subtitle">
                        <text>离预产期还有 {{ pregnancyProgress.totalDays ? Math.max(0, 280 - pregnancyProgress.totalDays) : 280 }} 天</text>
                    </view>
                 </view>

                 <view class="progress-visual">
                    <view class="bar" :style="{ width: progressPercentage + '%' }"></view>
                 </view>

                 <view class="progress-row">
                     <view class="p-item">
                         <text class="label">末次月经</text>
                         <text class="value">{{ model.lmp || '-' }}</text>
                     </view>
                     <view class="p-item align-right">
                         <text class="label">预产期</text>
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
                        <view class="icon-container pink">
                            <u-icon name="file-text-fill" color="#fff" size="16"></u-icon>
                        </view>
                        <text class="card-title">健康档案</text>
                    </view>
                    <view class="edit-btn" @click="startEdit">
                        <text>修改</text>
                        <u-icon name="arrow-right" color="#94a3b8" size="12"></u-icon>
                    </view>
                </view>
                <view class="grid-info">
                    <view class="grid-item">
                        <text class="label">身高</text>
                        <text class="val">{{ model.height }}<text class="unit">cm</text></text>
                    </view>
                    <view class="grid-item">
                        <text class="label">孕前体重</text>
                        <text class="val">{{ model.weight }}<text class="unit">kg</text></text>
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
                        <view class="icon-container orange">
                            <u-icon name="heart-fill" color="#fff" size="16"></u-icon>
                        </view>
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
        days: diffDays % 7,
        totalDays: diffDays
    };
});

const progressPercentage = computed(() => {
    const { totalDays } = pregnancyProgress.value;
    if (!totalDays || totalDays <= 0) return 0;
    const p = (totalDays / 280) * 100;
    return Math.min(Math.max(p, 0), 100).toFixed(1);
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

             // Sync avatar/nickname from backend if available and local is default
             if (data.nickname && data.nickname !== '准妈妈') {
                 userStore.setNickname(data.nickname);
             }
             if (data.avatar && data.avatar !== '/static/logo.png') {
                 userStore.setAvatar(data.avatar);
             }
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
            cuisinePreference: model.cuisine,
            nickname: userStore.nickname, // Sync nickname
            avatar: userStore.avatar      // Sync avatar path
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

const onChooseAvatar = (e: any) => {
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
        // Save to store (and potentially upload if we had an endpoint)
        // Since we are pure frontend for now in this context, we just save the local path
        // Note: Temp paths might expire, but for uni-app simple usage it's often okay for session
        // Better: uni.saveFile to persist it locally
        uni.saveFile({
            tempFilePath: avatarUrl,
            success: (saveRes) => {
                userStore.setAvatar(saveRes.savedFilePath);
                uni.showToast({ title: '头像已更新', icon: 'none' });
            },
            fail: () => {
                // Fallback to temp path if save fails
                userStore.setAvatar(avatarUrl);
            }
        });
    }
};

const onNicknameBlur = (e: any) => {
    const val = e.detail.value;
    if (val) {
        userStore.setNickname(val);
    }
};

// Handle confirm/enter as well
const onNicknameChange = (e: any) => {
     const val = e.detail.value;
    if (val) {
        userStore.setNickname(val);
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
    background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
    padding: 120px 24px 80px 24px;
    border-bottom-left-radius: 40px;
    border-bottom-right-radius: 40px;
    color: #fff;
    position: relative;
    margin-bottom: 0px; /* Reduced margin since card is now outside */
    box-shadow: 0 10px 30px rgba(255, 154, 158, 0.3);
    overflow: hidden;

    /* Decorative circles */
    &::before {
        content: '';
        position: absolute;
        top: -50px;
        right: -50px;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
        border-radius: 50%;
    }
    &::after {
        content: '';
        position: absolute;
        bottom: 20px;
        left: -30px;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
        border-radius: 50%;
    }
    
    .user-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px; /* Reduced from 40px */
        position: relative;
        z-index: 2;
        
        .avatar-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-right: 0;
            margin-bottom: 16px;

            .hint-text {
                 font-size: 11px; 
                 color: rgba(255,255,255,0.8); 
                 margin-top: 6px;
                 letter-spacing: 1px;
            }
        }

        .avatar-wrapper {
            padding: 0;
            margin: 0;
            background: transparent;
            border: none;
            outline: none;
            position: relative;
            
            &::after { border: none; }
        }

        .avatar-box {
            border: 4px solid rgba(255,255,255,0.4);
            border-radius: 50%;
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            position: relative;
            padding: 3px;
            
            .edit-hint {
                position: absolute;
                bottom: 2px;
                right: 2px;
                background: #fff;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: #333;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
        }
        
        .text-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            
            .nickname-input {
                font-size: 24px;
                font-weight: 700;
                color: #fff;
                margin-bottom: 8px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                background: transparent;
                border: none;
                min-width: 120px;
                height: 36px;
                line-height: 36px;
                text-align: center;
            }
        }
    }
}

.progress-card-container {
    padding: 0 20px;
    margin-top: -60px; /* Overlap header */
    margin-bottom: 30px;
    position: relative;
    z-index: 10;

    .progress-card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 28px;
        padding: 24px 20px;
        box-shadow: 0 15px 35px rgba(255, 154, 158, 0.2);
        color: #333;
        
        .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            
            .p-title {
                font-size: 16px;
                font-weight: 700;
                color: #1e293b;
            }
            .p-subtitle {
                font-size: 12px;
                color: #64748b;
                display: flex;
                align-items: center;
                gap: 4px;
            }
        }
        
        .progress-visual {
            height: 12px;
            background: #f1f5f9;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 20px;
            position: relative;
            
            .bar {
                height: 100%;
                background: linear-gradient(90deg, #ff9a9e, #f43f5e);
                border-radius: 6px;
                transition: width 1s ease-in-out;
                box-shadow: 0 2px 6px rgba(244, 63, 94, 0.2);
            }
        }

        .progress-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            
            .p-item {
                display: flex;
                flex-direction: column;
                
                .label { 
                    font-size: 11px; 
                    color: #94a3b8; 
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .value { 
                    font-size: 15px; 
                    font-weight: 700; 
                    color: #334155; 
                    font-family: 'DIN', sans-serif;
                }
                .highlight { color: #f43f5e; } /* Highlight Due Date */
                
                &.align-right {
                    align-items: flex-end;
                }
            }
            .divider { display: none; }
        }
    }
}


.card-area {
    padding: 0 16px;
    z-index: 10;
    position: relative;
    
    .info-card {
        background: #fff;
        border-radius: 24px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.03);
        transition: transform 0.2s;

        &:active {
            transform: scale(0.995);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            
            .title-row {
                display: flex;
                align-items: center;
                gap: 12px;
                
                .icon-container {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    
                    &.pink { background: linear-gradient(135deg, #ff9a9e, #f43f5e); }
                    &.orange { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
                }

                .card-title { font-size: 17px; font-weight: 700; color: #1e293b; letter-spacing: 0.5px; }
            }
            
            .edit-btn {
                background: #f1f5f9;
                padding: 6px 12px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: #64748b;
                font-weight: 500;
            }
        }
        
        .grid-info {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border-radius: 16px;
            padding: 20px 24px;
            
            .grid-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                
                .label { font-size: 11px; color: #94a3b8; margin-bottom: 6px; }
                .val { 
                    font-size: 18px; 
                    font-weight: 700; 
                    color: #334155; 
                    font-family: 'DIN', sans-serif;
                    white-space: nowrap;
                    
                    &.highlight { color: #f43f5e; }
                }
                .unit { font-size: 10px; color: #94a3b8; font-weight: normal; margin-left: 2px;}
            }
        }

        .pref-content {
            .pref-row {
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                font-size: 14px;
                &:last-child { margin-bottom: 0; }
                
                .label {
                    color: #94a3b8;
                    width: 70px;
                    flex-shrink: 0;
                }
                .text-val {
                    color: #475569;
                    font-weight: 500;
                    flex: 1;
                }
                .tag-wrap { display: flex; }
            }
        }
    }
    
    .menu-list {
        background: #fff;
        border-radius: 24px;
        overflow: hidden;
        margin-bottom: 30px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.03);
        padding: 8px 0; /* Add some padding so items aren't crammed */
    }
    
    .logout-box {
        margin-bottom: 60px;
        padding: 0 20px;
    }
}

/* Edit Mode Unique Styles */
.edit-container {
    padding: 24px;
    padding-top: 110px;
    background: #f8f9fc;
    min-height: 100vh;
    padding-bottom: 120px; /* Space for sticky footer */

    .form-card {
        background: #fff;
        border-radius: 28px;
        padding: 24px;
        margin-bottom: 24px; /* Spacing between cards */
        box-shadow: 0 10px 40px rgba(0,0,0,0.04);
        border: 1px solid rgba(255,255,255,0.8);

        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            
            .emoji { font-size: 22px; margin-right: 10px; }
            .title { font-size: 18px; font-weight: 700; color: #1e293b; letter-spacing: 0.5px; }
        }

        .grid-row {
            display: flex;
            gap: 16px;
            margin-bottom: 0px; 
            .grid-col { flex: 1; min-width: 0; }
        }

        /* Bubble Input Styles */
        .bubble-input {
            background: #f1f5f9; /* Lighter background */
            border-radius: 16px;
            padding: 4px 16px;
            display: flex;
            align-items: center;
            height: 52px;
            width: 100%;
            transition: all 0.2s;
            border: 1px solid transparent;
            
            &:active {
                background: #e2e8f0;
            }
        }
        
        .bubble-textarea {
            background: #f1f5f9;
            border-radius: 16px;
            padding: 12px;
            width: 100%;
        }

        /* Cuisine Bubbles */
        .cuisine-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            .cuisine-item-bubble {
                padding: 10px 16px;
                border-radius: 20px;
                font-size: 13px;
                color: #64748b;
                background: #f1f5f9;
                border: 1px solid transparent;
                transition: all 0.2s;
                font-weight: 500;
                
                &.active {
                    background: #fff1f2;
                    color: #f43f5e;
                    border-color: #fecdd3;
                    box-shadow: 0 4px 12px rgba(244, 63, 94, 0.15);
                }
            }
        }

        // Force labels to not wrap
        :deep(.u-form-item__body__left__content__label) {
            white-space: nowrap !important;
            word-break: keep-all;
            color: #64748b !important;
            font-size: 13px !important;
            margin-bottom: 8px !important;
            font-weight: 600;
        }
        
        // Remove standard form item border
        :deep(.u-form-item__body) {
            padding: 12px 0 !important;
        }
    }
    
    .action-footer {
        position: fixed;
        bottom: 0; 
        left: 0;
        right: 0;
        background: rgba(255,255,255,0.9);
        backdrop-filter: blur(10px);
        padding: 16px 32px;
        padding-bottom: calc(16px + constant(safe-area-inset-bottom));
        padding-bottom: calc(16px + env(safe-area-inset-bottom));
        box-shadow: 0 -10px 30px rgba(0,0,0,0.05);
        z-index: 100;
        border-top-left-radius: 30px;
        border-top-right-radius: 30px;
        
        .cancel-text {
            text-align: center;
            font-size: 14px;
            color: #94a3b8;
            margin-top: 12px;
            padding-bottom: 0;
        }
    }
}
</style>
