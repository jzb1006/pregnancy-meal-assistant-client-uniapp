<template>
  <PageContainer :customStyle="{ background: 'linear-gradient(180deg, #FDF4F6 0%, #FFFFFF 100%)' }">
    
    <!-- 0. Custom Navbar -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="back-btn" @click="goBack">
            <text class="icon">❮</text>
        </view>
        <text class="page-title">体重管理</text>
        <view class="placeholder"></view>
    </view>

    <!-- 1. Header Stats -->
    <view class="stats-header fade-in">
        <view class="stat-item">
            <text class="label">当前体重 (kg)</text>
            <text class="value">{{ currentWeight().toFixed(1) }}</text>
        </view>
        <view class="divider"></view>
        <view class="stat-item">
            <text class="label">较孕前</text>
            <text class="value highlight" :class="{ 'gain': weightGain() >= 0 }">
                {{ weightGain() >= 0 ? '+' : '' }}{{ weightGain().toFixed(1) }}
            </text>
        </view>
    </view>
    
    <!-- 1.5 BMI Info Card -->
    <view v-if="stats" class="bmi-card glass-panel fade-in delay-05">
        <view class="bmi-header">
            <text class="bmi-label">BMI指数</text>
            <text class="bmi-value">{{ stats.bmi.toFixed(1) }}</text>
        </view>
        <view class="bmi-category">
            <text class="category-badge" :class="'badge-' + stats.bmiCategory.toLowerCase()">
                {{ BmiCategoryLabels[stats.bmiCategory] }}
            </text>
            <text class="category-advice">{{ BmiCategoryAdvice[stats.bmiCategory] }}</text>
        </view>
    </view>

    <!-- 2. Chart Section -->
    <view class="chart-card glass-panel fade-in delay-1">
        <view class="card-header">
            <text class="title">体重趋势</text>
            <text class="subtitle">孕{{ currentWeek() }}周</text>
        </view>
        
        <view class="chart-container">
            <!-- Canvas for Mini Program Compatibility -->
            <canvas 
                v-if="!showAddPopup && !showCalendar"
                canvas-id="weightChart" 
                id="weightChart" 
                class="weight-chart"
                @touchstart="handleTouch"
            ></canvas>
            
            <view v-if="history.length === 0" class="empty-chart">
                <text>暂无数据，快去记录吧~</text>
            </view>
        </view>
        
        <view class="chart-legend">
           <view class="legend-item">
               <view class="dot line-dot"></view>
               <text>我的体重</text>
           </view>
           <view class="legend-item">
               <view class="dot zone-dot"></view>
               <text>参考/标准范围</text>
           </view>
        </view>
    </view>

    <!-- 3. History List -->
    <view class="history-section fade-in delay-2">
        <text class="section-title">历史记录</text>
        <view class="history-list">
            <view 
                class="history-item glass-panel" 
                v-for="(item, index) in history" 
                :key="item.id || index"
                @longpress="deleteRecord(item)"
            >
                <view class="date-info">
                    <text class="date">{{ formatDate(item.date) }}</text>
                    <text class="week-tag" v-if="item.week">孕{{ item.week }}周</text>
                </view>
                <view class="weight-info">
                    <text class="weight-val">{{ item.weight }} kg</text>
                    <text v-if="item.note" class="note-text">📝 {{ item.note }}</text>
                </view>
            </view>
        </view>
    </view>

    <!-- 4. Add Button -->
    <view class="fab-btn floating-entry" @click="showAddPopup = true">
        <text class="icon">+</text>
        <text class="text">记体重</text>
    </view>

    <!-- 5. Add Popup -->
    <u-popup 
        :show="showAddPopup" 
        @close="showAddPopup = false" 
        mode="bottom" 
        :round="24"
        :z-index="10000"
    >
        <view class="add-popup-content">
            <view class="popup-header">
                <text class="title">记录体重</text>
                <text class="close" @click="showAddPopup = false">×</text>
            </view>
            
            <view class="input-form">
                <view class="date-picker-card" @click="showCalendar = true">
                    <view class="left-section">
                        <view class="icon-wrapper">
                            <text class="icon">📅</text>
                        </view>
                        <view class="label-group">
                            <text class="label">日期</text>
                            <text class="sub-label">记录测量时间</text>
                        </view>
                    </view>
                    <view class="right-section">
                        <text class="value">{{ currentRecordDate === dayjs().format('YYYY-MM-DD') ? '今天' : formatDate(currentRecordDate) }}</text>
                        <text class="arrow">❯</text>
                    </view>
                </view>
                
                <!-- 内嵌体重选择器 -->
                <view class="weight-picker-inline">
                    <text class="picker-label">体重</text>
                    <view class="picker-container">
                        <picker-view 
                            class="weight-picker-view" 
                            :value="[weightInteger - 20, weightDecimal]"
                            @change="onWeightChange"
                            :indicator-style="indicatorStyle"
                        >
                            <picker-view-column>
                                <view class="picker-item" v-for="i in 181" :key="i">{{ i + 19 }}</view>
                            </picker-view-column>
                            <picker-view-column>
                                <view class="picker-item" v-for="i in 10" :key="i">{{ (i - 1) / 10 }}</view>
                            </picker-view-column>
                        </picker-view>
                        <view class="picker-display-overlay">
                            <text class="weight-value">{{ weightInteger }}.{{ weightDecimal }}</text>
                            <text class="weight-unit">kg</text>
                        </view>
                    </view>
                </view>
                
                <view class="note-input-wrapper">
                    <textarea 
                        class="note-textarea" 
                        v-model="currentRecordNote" 
                        placeholder="备注 (可选,如测量时间、身体状况等)" 
                        maxlength="500"
                        :show-confirm-bar="false"
                    />
                    <text class="char-count">{{ currentRecordNote.length }}/500</text>
                </view>
            </view>

            <view class="popup-actions">
                <button class="cancel-btn" @click="showAddPopup = false">取消</button>
                <button class="save-btn" @click="saveRecord">保存记录</button>
            </view>
        </view>
    </u-popup>

     <!-- 日期选择器 -->
     <u-datetime-picker
         :show="showCalendar"
         v-model="currentRecordTs"
         mode="date"
         :maxDate="Number(new Date())"
         @confirm="onDateConfirm"
         @cancel="showCalendar = false"
         confirmColor="#F43F5E"
         :z-index="10010"
     ></u-datetime-picker>

  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, getCurrentInstance, watch } from 'vue';
import PageContainer from '@/components/common/PageContainer.vue';
import { WeightService } from '@/services/weight';
import type { WeightRecord, WeightStats, BmiCategory } from '@/types/weight';
import { BmiCategoryLabels, BmiCategoryAdvice } from '@/types/weight';
import dayjs from 'dayjs';

const history = ref<WeightRecord[]>([]);
const stats = ref<WeightStats | null>(null);
const showAddPopup = ref(false);
const showCalendar = ref(false);
const loading = ref(true);

const currentRecordDate = ref(dayjs().format('YYYY-MM-DD'));
const currentRecordTs = ref(Number(new Date())); // Timestamp for u-datetime-picker
const currentRecordNote = ref('');
const instance = getCurrentInstance();
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;

// Update timestamp when date string changes (e.g. initial load or manual set)
watch(currentRecordDate, (val) => {
    currentRecordTs.value = dayjs(val).valueOf();
}, { immediate: true });

// Redraw chart when popups close (because canvas is re-mounted)
watch([showAddPopup, showCalendar], ([val1, val2]) => {
    if (!val1 && !val2) {
        setTimeout(() => {
            drawChart();
        }, 300); // Slight delay for transition/DOM
    }
});

// 体重选择器数据
const weightInteger = ref(55); // 整数部分,默认55kg
const weightDecimal = ref(0);  // 小数部分,默认0

// picker-view指示器样式
const indicatorStyle = 'height: 50px;';

const goBack = () => {
    uni.navigateBack();
}

// 获取当前体重 (用于显示)
const currentWeight = () => {
    return stats.value?.currentWeight || 0;
}

// 获取体重增量 (用于显示)
const weightGain = () => {
    return stats.value?.weightGain || 0;
}

// 获取当前孕周 (用于显示)
const currentWeek = () => {
    return stats.value?.currentWeek || 0;
};

// Canvas Drawing Logic
const drawChart = () => {
    if (history.value.length === 0) return;
    if (!stats.value) return; // 确保stats已加载

    const ctx = uni.createCanvasContext('weightChart', instance);
    const width = 310; // approximate width based on container padding
    const height = 200;
    const padding = 20;
    
    // 1. Data Prep
    const weights = history.value.map(h => h.weight);
    const prePregnancyWeight = stats.value.prePregnancyWeight; // 从stats获取孕前体重
    const minW = Math.min(...weights, prePregnancyWeight) - 2;
    const maxW = Math.max(...weights, prePregnancyWeight) + 5;
    const rangeW = maxW - minW || 10;
    
    const startTime = dayjs(history.value[0].date).valueOf();
    const endTime = dayjs(history.value[history.value.length - 1].date).valueOf();
    const timeRange = endTime - startTime || 1;

    // Helper: Map data to pixel coords
    const getX = (dateStr: string) => {
        const t = dayjs(dateStr).valueOf();
        // Map 0 to width
        return ((t - startTime) / timeRange) * (width - 2 * padding) + padding;
    };
    
    const getY = (w: number) => {
        // Map minW to height-padding, maxW to padding
        return height - padding - ((w - minW) / rangeW) * (height - 2 * padding);
    };

    // 2. Clear
    ctx.clearRect(0, 0, width, height);

    // 3. Draw Scientific Standard Weight Range
    // 基于BMI分类的推荐增重标准(中国营养学会)
    const weightGainRanges: Record<string, { min: number, max: number, weeklyMin: number, weeklyMax: number }> = {
        'UNDERWEIGHT': { min: 12.5, max: 18, weeklyMin: 0.44, weeklyMax: 0.58 },    // 偏瘦
        'NORMAL': { min: 11.5, max: 16, weeklyMin: 0.35, weeklyMax: 0.50 },        // 正常
        'OVERWEIGHT': { min: 7, max: 11.5, weeklyMin: 0.23, weeklyMax: 0.33 },     // 超重
        'OBESE': { min: 5, max: 9, weeklyMin: 0.17, weeklyMax: 0.27 },             // 肥胖
        'ALL': { min: 11.5, max: 16, weeklyMin: 0.35, weeklyMax: 0.50 }            // 默认使用正常标准
    };
    
    const bmiCategory = stats.value?.bmiCategory || 'NORMAL';
    const range = weightGainRanges[bmiCategory] || weightGainRanges['NORMAL'];
    
    // 计算参考范围曲线
    // 孕早期(0-13周)增重较少,孕中晚期(14-40周)按周增重
    const calculateStandardWeight = (week: number, isMax: boolean): number => {
        if (week <= 13) {
            // 孕早期总增重约1-2kg
            return prePregnancyWeight + (isMax ? 2 : 1) * (week / 13);
        } else {
            // 孕中晚期线性增重
            const earlyGain = isMax ? 2 : 1;
            const weeklyGain = isMax ? range.weeklyMax : range.weeklyMin;
            return prePregnancyWeight + earlyGain + (week - 13) * weeklyGain;
        }
    };
    
    // 绘制参考范围区域
    if (history.value.length > 0) {
        ctx.beginPath();
        
        // 绘制上边界(最大推荐增重)
        for (let i = 0; i < history.value.length; i++) {
            const record = history.value[i];
            const week = record.week || 0;
            const maxWeight = calculateStandardWeight(week, true);
            const x = getX(record.date);
            const y = getY(maxWeight);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        // 绘制下边界(最小推荐增重) - 反向
        for (let i = history.value.length - 1; i >= 0; i--) {
            const record = history.value[i];
            const week = record.week || 0;
            const minWeight = calculateStandardWeight(week, false);
            const x = getX(record.date);
            const y = getY(minWeight);
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.setFillStyle('rgba(76, 209, 55, 0.15)');
        ctx.fill();
    }

    // 4. Draw Grid Lines
    ctx.setStrokeStyle('#F1F5F9');
    ctx.setLineWidth(1);
    [0.25, 0.5, 0.75].forEach(ratio => {
        const y = height * ratio;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    });

    // 5. Draw Curve
    ctx.beginPath();
    ctx.setStrokeStyle('#F43F5E');
    ctx.setLineWidth(3);
    ctx.setLineCap('round');
    ctx.setLineJoin('round');

    // Store point coordinates for hit testing or drawing reference
    const points: {x: number, y: number}[] = [];

    if (history.value.length > 0) {
        const startX = getX(history.value[0].date);
        const startY = getY(history.value[0].weight);
        ctx.moveTo(startX, startY);
        points.push({x: startX, y: startY});

        for (let i = 1; i < history.value.length; i++) {
            const x = getX(history.value[i].date);
            const y = getY(history.value[i].weight);
            ctx.lineTo(x, y);
            points.push({x, y});
        }
    }
    ctx.stroke();

    // 6. Draw Vertical Reference Line & Range Text (if active)
    if (activePointIndex.value !== -1 && points[activePointIndex.value]) {
        const p = points[activePointIndex.value];
        ctx.beginPath();
        ctx.setStrokeStyle('#F43F5E'); 
        ctx.setLineWidth(1);
        ctx.setLineDash([4, 4]); 
        ctx.moveTo(p.x, 0); 
        ctx.lineTo(p.x, height); 
        ctx.stroke();
        ctx.setLineDash([]); 

        // 计算当前点的科学标准体重范围
        const currentRecord = history.value[activePointIndex.value];
        const currentWeek = currentRecord.week || 0;
        
        // 使用与绘制时相同的标准
        const weightGainRanges: Record<string, { weeklyMin: number, weeklyMax: number }> = {
            'UNDERWEIGHT': { weeklyMin: 0.44, weeklyMax: 0.58 },
            'NORMAL': { weeklyMin: 0.35, weeklyMax: 0.50 },
            'OVERWEIGHT': { weeklyMin: 0.23, weeklyMax: 0.33 },
            'OBESE': { weeklyMin: 0.17, weeklyMax: 0.27 },
            'ALL': { weeklyMin: 0.35, weeklyMax: 0.50 }
        };
        
        const bmiCategory = stats.value?.bmiCategory || 'NORMAL';
        const range = weightGainRanges[bmiCategory] || weightGainRanges['NORMAL'];
        
        const calculateStd = (week: number, isMax: boolean): number => {
            if (week <= 13) {
                return prePregnancyWeight + (isMax ? 2 : 1) * (week / 13);
            } else {
                const earlyGain = isMax ? 2 : 1;
                const weeklyGain = isMax ? range.weeklyMax : range.weeklyMin;
                return prePregnancyWeight + earlyGain + (week - 13) * weeklyGain;
            }
        };
        
        const minStd = calculateStd(currentWeek, false).toFixed(1);
        const maxStd = calculateStd(currentWeek, true).toFixed(1);
        
        // Prepare Text Lines
        const dateText = formatDate(currentRecord.date);
        const weightText = `体重: ${currentRecord.weight}kg`;
        const stdText = `标准: ${minStd}-${maxStd}kg`;

        ctx.setFontSize(10);
        ctx.setFillStyle('#F43F5E');
        
        // Ensure text stays within bounds
        let txtX = p.x + 6;
        if (p.x > width - 100) { // Increased offset trigger
            txtX = p.x - 105; 
        }

        // Draw multiple lines
        ctx.fillText(dateText, txtX, 14);
        ctx.fillText(weightText, txtX, 26);
        ctx.setFillStyle('#F43F5E'); // Ensure color consistency with setFillStyle
        ctx.setGlobalAlpha(0.8); // Slightly dim standard text
        ctx.fillText(stdText, txtX, 38);
        ctx.setGlobalAlpha(1.0); // Reset alpha
    }

    // 7. Draw Dots
    history.value.forEach((item, index) => {
        const x = getX(item.date);
        const y = getY(item.weight);
        
        ctx.beginPath();
        // Highlight active point
        if (index === activePointIndex.value) {
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.setFillStyle('#FFFFFF');
            ctx.setStrokeStyle('#F43F5E');
            ctx.setLineWidth(4);
        } else {
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.setFillStyle('#FFFFFF');
            ctx.setStrokeStyle('#F43F5E');
            ctx.setLineWidth(2);
        }
        ctx.fill();
        ctx.stroke();
    });

    ctx.draw();
}

const activePointIndex = ref(-1);

const handleTouch = (e: any) => {
    let x = 0, y = 0;
    if (e.touches && e.touches.length > 0) {
        x = e.touches[0].x;
        y = e.touches[0].y;
    } else {
        return;
    }

    // Convert click to data space (Simplified re-calc)
    // For better performance, we should cache calculated points, but this is fine for now
    const width = 310;
    const padding = 20;
    
    // ... (re-calc logic same as drawChart) ...
    if (history.value.length === 0) return;
    const startTime = dayjs(history.value[0].date).valueOf();
    const endTime = dayjs(history.value[history.value.length - 1].date).valueOf();
    const timeRange = endTime - startTime || 1;
    const getX = (dateStr: string) => ((dayjs(dateStr).valueOf() - startTime) / timeRange) * (width - 2 * padding) + padding;

    // Find nearest point
    let nearestIndex = -1;
    let minDist = Infinity;

    history.value.forEach((item, index) => {
        const px = getX(item.date);
        // We mainly care about X distance for the "vertical line" feel, but overall distance is good too
        // Let's use X distance primarily for selection to make it easier to slide active finger?
        // Or pure distance. Let's stick to Distance for now to avoid selecting far-away points
        // Actually, for a time-series, finding nearest X is usually better UX
        const dist = Math.abs(x - px); 
        
        if (dist < 30) { // Increased hit area
            if (dist < minDist) {
                minDist = dist;
                nearestIndex = index;
            }
        }
    });

    if (nearestIndex !== -1) {
        if (activePointIndex.value !== nearestIndex) {
            uni.vibrateShort({ type: 'light' });
            activePointIndex.value = nearestIndex;
            drawChart(); // Redraw with line
            
            // Only toast user weight, standard range is now on chart
            // const item = history.value[nearestIndex];
            // uni.showToast({ title: `${formatDate(item.date)}: ${item.weight}kg`, icon: 'none' }); 
        }
        return; // Handled as point click
    }
    
    // Clear selection if clicking empty space
    if (activePointIndex.value !== -1) {
         activePointIndex.value = -1;
         drawChart();
    }
};

onMounted(async () => {
    await loadData();
});

const loadData = async () => {
    try {
        loading.value = true;
        
        // 并行加载统计和历史数据
        const [statsData, historyData] = await Promise.all([
            WeightService.getWeightStats(),
            WeightService.getWeightHistory()
        ]);
        
        stats.value = statsData;
        // Ensure history is sorted by date ascending for the chart
        history.value = historyData.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
        
        // 确保canvas节点存在后绘制图表
        setTimeout(() => {
            drawChart();
        }, 100);
    } catch (error: any) {
        console.error('[Weight] 加载数据失败:', error);
        
        // 处理用户档案不存在的情况
        if (error.message && error.message.includes('用户不存在')) {
            uni.showModal({
                title: '提示',
                content: '请先完善个人档案信息',
                showCancel: false,
                success: () => {
                    uni.navigateTo({ url: '/pages/profile/profile' });
                }
            });
        } else {
            uni.showToast({ title: '加载失败,请重试', icon: 'none' });
        }
    } finally {
        loading.value = false;
    }
};

const formatDate = (date: string) => dayjs(date).format('MM月DD日');

const onDateConfirm = (e: any) => {
    // u-datetime-picker returns an object { value, mode, ... }
    // value is timestamp
    currentRecordDate.value = dayjs(e.value).format('YYYY-MM-DD');
    showCalendar.value = false;
};

// 体重选择器change事件
const onWeightChange = (e: any) => {
    const value = e.detail.value;
    weightInteger.value = value[0] + 20; // 加回偏移量
    weightDecimal.value = value[1];
};

// 获取当前选择的体重值
const getCurrentWeight = () => {
    return weightInteger.value + weightDecimal.value / 10;
};

const saveRecord = async () => {
    const weight = getCurrentWeight();
    
    // 验证体重范围(理论上picker已限制范围,但仍保留验证)
    if (weight < 20 || weight > 200) {
        uni.showToast({ title: '体重范围应在20-200kg之间', icon: 'none' });
        return;
    }
    
    try {
        await WeightService.saveWeightRecord({
            date: currentRecordDate.value,
            weight,
            note: currentRecordNote.value || undefined
        });
        
        showAddPopup.value = false;
        // 重置为默认值
        weightInteger.value = 55;
        weightDecimal.value = 0;
        currentRecordNote.value = '';
        
        uni.showToast({ title: '记录成功', icon: 'success' });
        
        // Cache for TodoTips
        const today = dayjs().format('YYYY-MM-DD');
        uni.setStorageSync('LAST_WEIGHT_DATE', today);
        
        await loadData();
    } catch (error: any) {
        console.error('[Weight] 保存记录失败:', error);
        uni.showToast({ 
            title: error.message || '保存失败,请重试', 
            icon: 'none' 
        });
    }
};

// 删除记录
const deleteRecord = async (record: WeightRecord) => {
    if (!record.id) return;
    
    uni.showModal({
        title: '确认删除',
        content: `确定要删除 ${formatDate(record.date)} 的体重记录吗?`,
        success: async (res) => {
            if (res.confirm) {
                try {
                    await WeightService.deleteWeightRecord(record.id!);
                    uni.showToast({ title: '删除成功', icon: 'success' });
                    await loadData();
                } catch (error: any) {
                    console.error('[Weight] 删除记录失败:', error);
                    uni.showToast({ 
                        title: error.message || '删除失败,请重试', 
                        icon: 'none' 
                    });
                }
            }
        }
    });
};

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

.stats-header {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 20px 0;
    
    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        
        .label { font-size: 14px; color: #94A3B8; }
        .value { font-size: 32px; font-weight: 700; color: #334155; font-family: 'Outfit', sans-serif;}
        
        .highlight {
            color: #334155;
            &.gain { color: #F43F5E; }
        }
    }
    
    .divider {
        width: 1px;
        height: 40px;
        background: #E2E8F0;
    }
}


.glass-panel {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 8px 32px rgba(255, 182, 193, 0.1);
    border-radius: 24px;
    padding: 20px;
}

.bmi-card {
    margin: 0 20px 24px;
    
    .bmi-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 12px;
        
        .bmi-label { font-size: 16px; font-weight: 600; color: #334155; }
        .bmi-value { font-size: 28px; font-weight: 700; color: #F43F5E; font-family: 'Outfit', sans-serif; }
    }
    
    .bmi-category {
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .category-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            align-self: flex-start;
            
            &.badge-underweight { background: #DBEAFE; color: #1E40AF; }
            &.badge-normal { background: #D1FAE5; color: #065F46; }
            &.badge-overweight { background: #FEF3C7; color: #92400E; }
            &.badge-obese { background: #FEE2E2; color: #991B1B; }
        }
        
        .category-advice {
            font-size: 13px;
            color: #64748B;
            line-height: 1.5;
        }
    }
}


.chart-card {
    margin: 0 20px 24px;
    
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 20px;
        
        .title { font-size: 18px; font-weight: 600; color: #334155; }
        .subtitle { font-size: 14px; color: #94A3B8; }
    }
    
    .chart-container {
        height: 200px;
        width: 100%;
        position: relative;
        
        .weight-chart {
            width: 100%;
            height: 100%;
        }
        
        .empty-chart {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            color: #CBD5E1;
            font-size: 14px;
        }
    }
    
    .chart-legend {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 16px;
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #64748B;
            
            .dot { width: 8px; height: 8px; border-radius: 50%; }
            .line-dot { background: #F43F5E; }
            .zone-dot { background: #86EFAC; opacity: 0.5; }
        }
    }
}

.history-section {
    padding: 0 20px 120px;
    
    .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 16px;
        display: block;
        padding-left: 4px;
    }
    
    .history-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-radius: 16px;
        transition: transform 0.2s;
        
        &:active { transform: scale(0.98); }
        
        .date-info {
            display: flex;
            align-items: center;
        }
        
        .date { font-size: 15px; color: #334155; font-weight: 500; }
        .week-tag { 
            font-size: 12px; 
            color: #94A3B8; 
            background: #F8FAFC; 
            padding: 4px 8px; 
            border-radius: 6px;
            margin-left: 8px;
        }
        
        .weight-info {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
        }
        
        .weight-val { font-size: 18px; font-weight: 600; color: #F43F5E; }
        .note-text { 
            font-size: 12px; 
            color: #94A3B8; 
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.fab-btn {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: #F43F5E;
    color: white;
    padding: 12px 32px;
    border-radius: 50px;
    box-shadow: 0 10px 25px rgba(244, 63, 94, 0.4);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 100;
    transition: transform 0.2s;
    
    &:active { transform: translateX(-50%) scale(0.95); }
    
    .icon { font-size: 24px; font-weight: 300; }
    .text { font-size: 16px; font-weight: 600; }
}

.add-popup-content {
    padding: 24px;
    background: white;
    
    .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        
        .title { font-size: 20px; font-weight: 700; color: #334155; }
        .close { font-size: 24px; color: #94A3B8; padding: 4px; }
    }
    
    .input-form {
        margin-bottom: 30px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        
        .date-picker-card {
            background: #F8FAFC;
            padding: 16px;
            border-radius: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
            border: 1px solid transparent;
            
            &:active {
                background: #FFF1F2;
                border-color: #FECDD3;
                transform: scale(0.99);
            }
            
            .left-section {
                display: flex;
                align-items: center;
                gap: 12px;
                
                .icon-wrapper {
                    width: 40px;
                    height: 40px;
                    background: #FFFFFF;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 6px rgba(148, 163, 184, 0.05);
                    
                    .icon { font-size: 20px; }
                }
                
                .label-group {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    
                    .label { 
                        font-size: 15px; 
                        font-weight: 600; 
                        color: #334155; 
                    }
                    .sub-label { 
                        font-size: 11px; 
                        color: #94A3B8; 
                    }
                }
            }
            
            .right-section {
                display: flex;
                align-items: center;
                gap: 8px;
                
                .value { 
                    font-size: 15px; 
                    color: #F43F5E; 
                    font-weight: 600;
                    font-family: 'Outfit', sans-serif;
                }
                
                .arrow {
                    font-size: 12px;
                    color: #CBD5E1;
                    font-weight: 700;
                }
            }
        }
        
        .weight-picker-inline {
            margin: 20px 0;
            
            .picker-label {
                display: block;
                font-size: 14px;
                color: #64748B;
                margin-bottom: 12px;
                padding-left: 4px;
            }
            
            .picker-container {
                position: relative;
                background: #F8FAFC;
                border-radius: 16px;
                padding: 16px;
                height: 200px;
            }
            
            .weight-picker-view {
                width: 100%;
                height: 100%;
            }
            
            .picker-item {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 50px;
                font-size: 20px;
                color: #64748B;
                font-family: 'Outfit', sans-serif;
            }
            
            .picker-display-overlay {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: baseline;
                gap: 8px;
                pointer-events: none;
                z-index: 10;
                
                .weight-value {
                    font-size: 48px;
                    font-weight: 700;
                    color: #F43F5E;
                    font-family: 'Outfit', sans-serif;
                    text-shadow: 0 2px 8px rgba(244, 63, 94, 0.2);
                }
                
                .weight-unit {
                    font-size: 18px;
                    color: #94A3B8;
                    font-weight: 500;
                    padding-bottom: 6px;
                }
            }
        }
        
        .note-input-wrapper {
            background: #F8FAFC;
            padding: 12px;
            border-radius: 16px;
            position: relative;
            
            .note-textarea {
                width: 100%;
                min-height: 80px;
                font-size: 14px;
                color: #334155;
                line-height: 1.5;
                background: transparent;
                border: none;
            }
            
            .char-count {
                position: absolute;
                bottom: 8px;
                right: 12px;
                font-size: 11px;
                color: #94A3B8;
            }
        }
    }
    
    .popup-actions {
        display: flex;
        gap: 16px;
        
        .cancel-btn {
            background: #F1F5F9;
            color: #64748B;
            border: none;
            border-radius: 16px;
            padding: 16px;
            font-size: 16px;
            font-weight: 600;
            width: 100px;
            
            &:active { opacity: 0.8; }
        }
        
        .save-btn {
            flex: 1;
            background: #F43F5E;
            color: white;
            border: none;
            border-radius: 16px;
            padding: 16px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 8px 20px rgba(244, 63, 94, 0.25);
            
            &:active { opacity: 0.9; transform: scale(0.98); }
        }
    }
}

/* Animations */
.fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
.delay-05 { animation-delay: 0.05s; }
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
