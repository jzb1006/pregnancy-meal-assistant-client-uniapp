<template>
  <view class="todo-tips-container" v-if="todos.length > 0">
    <view class="section-title">今日待办</view>
    
    <view class="todo-list">
        <view 
            class="todo-item" 
            v-for="(item, index) in todos" 
            :key="index"
            @click="handleTodoClick(item)"
        >
            <view class="check-circle" :class="{ checked: item.done }">
                <text v-if="item.done" class="check-icon">✓</text>
            </view>
            <view class="content">
                <text class="text">{{ item.text }}</text>
                <text class="sub">{{ item.sub }}</text>
            </view>
            <view class="action-btn">
                {{ item.done ? '已完成' : '去完成' }}
            </view>
        </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import dayjs from 'dayjs';

const props = defineProps<{
    status: any // User pregnancy status to determine todos
}>();

const todos = ref<any[]>([
    { 
        id: 'fetal',
        text: '数胎动', 
        sub: '早中晚各一次，守护宝宝', 
        done: false, 
        path: '/pages/tools/fetal-movement/index' 
    },
    { 
        id: 'weight',
        text: '记录体重', 
        sub: '每周记录1-2次', 
        done: false, 
        path: '/pages/weight/index' 
    }
]);

const checkStatus = () => {
    const today = dayjs().format('YYYY-MM-DD');
    
    // Check Fetal Movement
    const lastFetal = uni.getStorageSync('LAST_FETAL_MOVEMENT_DATE');
    const fetalDone = lastFetal === today;
    
    // Check Weight
    const lastWeight = uni.getStorageSync('LAST_WEIGHT_DATE');
    // For weight, we can be lenient (done today or within this week? User requirement says "Daily Todo", so stick to today for simplicity)
    // Actually sub text says "1-2 times a week", but Todo list usually implies "Do it today" or "Done recently".
    // Let's stick to "Done Today" for the checkmark visual, but maybe improve logic later if requested.
    const weightDone = lastWeight === today; 
    
    todos.value = todos.value.map(t => {
        if (t.id === 'fetal') return { ...t, done: fetalDone };
        if (t.id === 'weight') return { ...t, done: weightDone };
        return t;
    });
}

const handleTodoClick = (item: any) => {
    if (!item.done && item.path) {
        uni.navigateTo({ url: item.path });
    }
}

onMounted(() => {
    checkStatus();
});

defineExpose({
    checkStatus
});
</script>

<style lang="scss" scoped>
.todo-tips-container {
    padding: 0 10px;
    margin-bottom: 24px;
}

.section-title {
    font-size: 16px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 12px;
    padding-left: 10px;
}

.todo-item {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    
    .check-circle {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid #E2E8F0;
        margin-right: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.checked {
            background: #F43F5E;
            border-color: #F43F5E;
            .check-icon { color: #fff; font-size: 14px; }
        }
    }
    
    .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .text { font-size: 15px; font-weight: 600; color: #334155; }
        .sub { font-size: 12px; color: #94A3B8; margin-top: 2px; }
    }
    
    .action-btn {
        font-size: 12px;
        padding: 6px 14px;
        background: #F1F5F9;
        color: #64748B;
        border-radius: 100px;
        font-weight: 600;
    }
    
    &:active { opacity: 0.8; }
}
</style>
