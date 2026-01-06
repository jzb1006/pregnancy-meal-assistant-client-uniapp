<template>
  <PageContainer>
    <u-navbar title="我的档案" @leftClick="goBack" :placeholder="true" autoBack></u-navbar>
    
    <view class="form-container">
      <u-form labelPosition="left" :model="model" :rules="rules" ref="form1" labelWidth="100">
        
        <!-- Basic Info Section -->
        <view class="section-title">基本信息</view>
        
        <u-form-item label="末次月经" prop="lmp" @click="showLmp = true; hideKeyboard()">
          <u-input v-model="model.lmp" disabled disabledColor="#ffffff" placeholder="请选择日期" border="none"></u-input>
          <u-icon slot="right" name="arrow-right"></u-icon>
        </u-form-item>

        <u-form-item label="出生日期" prop="birthDate" @click="showBirth = true; hideKeyboard()">
          <u-input v-model="model.birthDate" disabled disabledColor="#ffffff" placeholder="请选择日期" border="none"></u-input>
          <u-icon slot="right" name="arrow-right"></u-icon>
        </u-form-item>

        <u-form-item label="身高(cm)" prop="height" borderBottom @click="showHeight = true; hideKeyboard()">
           <u-input 
                v-model="model.height" 
                disabled 
                disabledColor="#ffffff" 
                placeholder="请选择身高" 
                border="none" 
                inputAlign="right"
            ></u-input>
           <u-icon slot="right" name="arrow-right"></u-icon>
        </u-form-item>

        <u-form-item label="体重(kg)" prop="weight" borderBottom @click="showWeight = true; hideKeyboard()">
           <u-input 
                v-model="model.weight" 
                disabled 
                disabledColor="#ffffff" 
                placeholder="请选择体重" 
                border="none" 
                inputAlign="right"
            ></u-input>
           <u-icon slot="right" name="arrow-right"></u-icon>
        </u-form-item>

        <!-- Preferences Section -->
        <view class="section-title">个人偏好</view>

        <u-form-item label="菜系偏好" prop="cuisine" labelPosition="top">
            <view class="cuisine-grid">
                <view 
                    class="cuisine-item" 
                    v-for="(item, index) in cuisineOptions" 
                    :key="index"
                    :class="{ active: model.cuisine === item.value }"
                    @click="model.cuisine = item.value"
                >
                    {{ item.label }}
                </view>
            </view>
        </u-form-item>

        <u-form-item label="口味偏好" prop="preferences" labelPosition="top">
            <u-textarea v-model="model.preferences" placeholder="例如：清淡、酸辣、多蔬菜..." count></u-textarea>
        </u-form-item>

        <u-form-item label="忌口/过敏" prop="taboo" labelPosition="top">
            <u-textarea v-model="model.taboo" placeholder="例如：海鲜、花生、香菜..." count></u-textarea>
        </u-form-item>

      </u-form>

      <view class="submit-btn">
          <u-button 
            type="primary" 
            text="保存档案" 
            shape="circle" 
            color="linear-gradient(90deg, #fda4af, #f43f5e)"
            :loading="loading"
            @click="submit"
          ></u-button>
      </view>
    </view>
    
    <!-- Pickers -->
    <u-datetime-picker
        :show="showLmp"
        v-model="lmpTimestamp"
        mode="date"
        :maxDate="Number(new Date())"
        @confirm="confirmLmp"
        @cancel="showLmp = false"
    ></u-datetime-picker>

    <u-datetime-picker
        :show="showBirth"
        v-model="birthTimestamp"
        mode="date"
        :minDate="new Date(1960, 0, 1).getTime()"
        :maxDate="Number(new Date())"
        @confirm="confirmBirth"
        @cancel="showBirth = false"
    ></u-datetime-picker>

    <u-picker 
        :show="showHeight" 
        :columns="heightColumns" 
        title="选择身高"
        @confirm="confirmHeight" 
        @cancel="showHeight = false"
    ></u-picker>

    <u-picker 
        :show="showWeight" 
        :columns="weightColumns" 
        title="选择体重"
        @confirm="confirmWeight" 
        @cancel="showWeight = false"
    ></u-picker>

    <CustomTabBar :current="3" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useUserStore } from '@/stores/user';
import { request } from '@/utils/request';
import PageContainer from '@/components/common/PageContainer.vue';
import CustomTabBar from '@/components/common/CustomTabBar.vue';
import dayjs from 'dayjs';

const userStore = useUserStore();
const loading = ref(false);
const showLmp = ref(false);
const showBirth = ref(false);
const showHeight = ref(false);
const showWeight = ref(false);
const lmpTimestamp = ref(Number(new Date()));
const birthTimestamp = ref(Number(new Date()));

// Generate picker columns
// Height: 140cm - 200cm
const heightColumns = reactive([
    Array.from({length: 61}, (_, i) => i + 140)
]);

// Weight: 35.0kg - 100.0kg (step 0.5)
const weightColumns = reactive([
    Array.from({length: 131}, (_, i) => (35 + i * 0.5).toFixed(1))
]);

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

const cuisineOptions = [
    { label: '中餐 🥢', value: 'CHINESE' },
    { label: '西餐 🍴', value: 'WESTERN' },
    { label: '日韩 🍱', value: 'JAPANESE_KOREAN' },
    { label: '东南亚 🌶️', value: 'SOUTHEAST_ASIAN' },
    { label: '素食 🥬', value: 'VEGETARIAN' },
    { label: '不限 🌍', value: 'NO_PREFERENCE' },
];

const goBack = () => {
    uni.navigateBack();
}

const hideKeyboard = () => {
    uni.hideKeyboard();
}

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
    if (!userStore.openId) {
        uni.showToast({ title: '未找到用户信息，请重新登录', icon: 'none' });
        setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 1500);
        return;
    }

    try {
        const res: any = await request({
            url: '/v1/user/info',
            data: { openId: userStore.openId }
        });
        
        console.log('Profile Fetch Res:', res);

        if (res && res.code === 200) {
             const data = res.data || {}; // Safety check
             
             model.lmp = data.lmp ? dayjs(data.lmp).format('YYYY-MM-DD') : '';
             model.birthDate = data.birthDate ? dayjs(data.birthDate).format('YYYY-MM-DD') : '';
             
             if (model.lmp) lmpTimestamp.value = dayjs(model.lmp).valueOf();
             if (model.birthDate) birthTimestamp.value = dayjs(model.birthDate).valueOf();

             // Setup fields with defaults if missing
             const h = Number(data.height);
             const w = Number(data.weight);
             if (!isNaN(h)) model.height = h;
             if (!isNaN(w)) model.weight = w;

             model.cuisine = data.cuisinePreference || 'NO_PREFERENCE';
             model.preferences = data.preferences || '';
             model.taboo = data.dietaryRestrictions || '';

        } else {
             // Handle 401 specifically if needed, otherwise generic error
             const msg = res?.message || res?.msg || '获取档案失败';
             uni.showToast({ title: msg, icon: 'none' });
             
             if (res?.code === 401 || res?.code === 403) {
                 setTimeout(() => uni.redirectTo({ url: '/pages/login/login' }), 1500);
             }
        }
    } catch (e: any) {
        console.error('Fetch Info Error:', e);
        const errMsg = e?.errMsg || '网络请求失败';
        uni.showToast({ title: `加载失败: ${errMsg}`, icon: 'none' });
    } finally {
        // loading.value = false; // Not using loading for fetch currently
    }
}

const submit = async () => {
    if (!model.lmp || !model.birthDate) {
        uni.showToast({ title: '请填写完整日期', icon: 'none' });
        return;
    }
    
    loading.value = true;
    try {
        const payload = {
            openId: userStore.openId,
            lmp: model.lmp,
            birthDate: model.birthDate,
            height: model.height,
            weight: model.weight,
            dietaryRestrictions: model.taboo,
            preferences: model.preferences,
            cuisinePreference: model.cuisine
        };
        
        const res: any = await request({
            url: '/v1/user/profile',
            method: 'POST',
            data: payload
        });
        
        if (res.code === 200) {
            uni.showToast({ title: '档案已更新', icon: 'success' });
            // User requested to stay on page
        } else {
            uni.showToast({ title: res.message || res.msg || '更新失败', icon: 'none' });
        }
    } catch (e: any) {
        console.error(e);
        const errorData = e?.data || {};
        const msg = errorData.message || errorData.msg || '网络请求失败';
        uni.showToast({ title: msg, icon: 'none' });
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchInfo();
});
</script>

<style lang="scss" scoped>
.form-container {
    background: white;
    padding: 20px;
    border-radius: 16px;
    margin-top: 10px;
    padding-bottom: 100px; 

    .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin: 20px 0 10px 0;
    }

    .row-container {
        display: flex;
        align-items: center;
        width: 100%;
        .slider-box { flex: 1; margin-right: 15px; }
        .input-box { width: 70px; }
    }

    .cuisine-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        .cuisine-item {
            width: 30%;
            text-align: center;
            padding: 10px 0;
            border-radius: 12px;
            font-size: 11px;
            color: #64748b;
            background: #f8f9fc;
            box-shadow: 0 2px 6px rgba(0,0,0,0.03);
            
            &.active {
                background: #ffe4e6;
                color: #f43f5e;
                box-shadow: 0 2px 8px rgba(244, 63, 94, 0.15);
                font-weight: bold;
            }
        }
    }
    .submit-btn { margin-top: 40px; }
}
</style>
