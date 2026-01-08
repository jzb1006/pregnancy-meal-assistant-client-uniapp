<template>
  <view class="page-root">
    <!-- Custom Navigation Bar -->
    <view class="custom-nav" :style="{ height: (statusBarHeight + 44) + 'px', paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="left-icon" @click="goBack">
          <text class="back-arrow">❮</text>
        </view>
        <text class="nav-title">宫缩计时</text>
        <view class="right-placeholder"></view>
      </view>
    </view>

    <!-- Content Wrapper -->
    <view class="content-wrapper">
      <!-- Header / Guide Entry -->
      <view class="header-card">
        <view class="guide-text">
          <text class="title">今日记录</text>
          <text class="subtitle">记录宫缩频率，判断是否临产</text>
        </view>
        <view class="help-btn" @click="showGuide = true">
          <text class="icon">📖</text>
          <text class="text">临产指南</text>
        </view>
      </view>

      <!-- Main Timer Area -->
      <view class="timer-container" :class="{ 'is-running': isRunning }">
        <view class="status-badge" v-if="isRunning">
            <view class="dot"></view>
            <text>宫缩中...</text>
        </view>
        <view class="status-badge idle" v-else>
            <text>等待宫缩</text>
        </view>

        <view class="timer-display">{{ formatDuration(currentDuration) }}</view>

        <!-- Main Action Button -->
        <view 
          class="action-btn"
          :class="{ 'stop-btn': isRunning }"
          @click="toggleTimer"
        >
          <view class="btn-inner">
            <text class="btn-icon">{{ isRunning ? '⏸' : '⏱' }}</text>
            <text class="btn-text">{{ isRunning ? '停止宫缩' : '开始宫缩' }}</text>
          </view>
          <!-- Ripple Effect Rings -->
          <view class="ripple r1" v-if="isRunning"></view>
          <view class="ripple r2" v-if="isRunning"></view>
        </view>

        <!-- Last Record Info -->
        <view class="last-info" v-if="lastRecord">
             <text>上一次持续 {{ formatDurationText(lastRecord.durationSeconds) }}</text>
             <text class="separator">|</text>
             <text>距上一次 {{ formatIntervalText(lastRecord.intervalSeconds) }}</text>
        </view>
        <view class="last-info empty" v-else>
            <text>点击开始记录第一次宫缩</text>
        </view>
      </view>

      <!-- History List -->
      <view class="history-panel">
        <view class="panel-header">
          <text class="panel-title">最近记录</text>
          <!-- <text class="panel-more">全部</text> -->
        </view>
        <view class="history-list">
          <view class="empty-tip" v-if="historyList.length === 0">
            暂无记录
          </view>
          
          <view 
            class="history-item" 
            v-for="(item, index) in historyList" 
            :key="index"
          >
            <!-- Left: Date & Duration info -->
            <view class="item-left">
                <view class="date-row">
                    <text class="item-date">{{ formatDate(item.startTime) }}</text>
                    <text class="item-time-start">{{ formatTimeOnly(item.startTime) }}</text>
                </view>
                <view class="item-sub-info">
                    <text>持续</text>
                    <text class="highlight-dur">{{ formatDurationText(item.durationSeconds) }}</text>
                    <text v-if="item.endTime" class="end-time-hint">(~{{ formatTimeOnly(item.endTime) }})</text>
                </view>
            </view>
            
            <!-- Right: Interval Info -->
            <view class="item-right">
                <view class="interval-row">
                    <text class="item-interval" :class="getIntervalClass(item.intervalSeconds)">
                        {{ formatIntervalText(item.intervalSeconds) }}
                    </text>
                    <text class="item-unit">间隔</text>
                </view>
                <view class="status-badge" :class="getIntervalClass(item.intervalSeconds)">
                    {{ getIntervalStatus(item.intervalSeconds) }}
                </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Disclaimer -->
      <view class="disclaimer">
        <text>⚠️ 结果仅供参考。如果出现规律性宫缩（如每5-10分钟一次，持续30秒以上），或伴有见红、破水，请立即就医。</text>
      </view>
    </view>

    <!-- Guide Modal -->
    <view class="modal-mask" v-if="showGuide" @click="showGuide = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">真假宫缩辨别</text>
          <view class="close-btn" @click="showGuide = false">×</view>
        </view>
        <scroll-view scroll-y class="modal-body">
            <view class="contrast-table">
                <view class="table-row header">
                    <text class="cell">特征</text>
                    <text class="cell">假性宫缩</text>
                    <text class="cell highlight">真性宫缩</text>
                </view>
                <view class="table-row">
                    <text class="label">规律性</text>
                    <text class="cell">无规律</text>
                    <text class="cell highlight">有规律，间隔缩短</text>
                </view>
                <view class="table-row">
                    <text class="label">强度</text>
                    <text class="cell">弱，不增强</text>
                    <text class="cell highlight">逐渐增强</text>
                </view>
                <view class="table-row">
                    <text class="label">部位</text>
                    <text class="cell">下腹部</text>
                    <text class="cell highlight">整个腹部/腰背</text>
                </view>
                <view class="table-row">
                    <text class="label">缓解</text>
                    <text class="cell">休息/走动可缓解</text>
                    <text class="cell highlight">难以缓解</text>
                </view>
            </view>
            <view class="tips-box">
                <text class="tips-title">💡 何时去医院？</text>
                <text class="tips-text">初产妇（511原则）：宫缩每5分钟一次，持续约1分钟，规律持续1小时。</text>
                <text class="tips-text">经产妇：宫缩有了规律（如10分钟一次）即可去医院。</text>
                <text class="tips-text">紧急情况：破水、见红（量多如月经）、胎动异常或持续性剧烈腹痛。</text>
                <text class="tips-text" style="margin-top: 12rpx; font-style: italic; color: #795548;">小贴士：真性宫缩来袭时，妈妈通常不得不停下手头的事，也无法与人正常交谈。</text>
            </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-confirm" @click="showGuide = false">我知道了</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { request } from '@/utils/request'
import { onLoad } from '@dcloudio/uni-app'

// --- Constants ---
const STATUS_BAR_HEIGHT = 20

// --- State ---
const statusBarHeight = ref(STATUS_BAR_HEIGHT)
const isRunning = ref(false)
const startTime = ref<number | null>(null)
const currentDuration = ref(0)
const historyList = ref<any[]>([])
const showGuide = ref(false)
let timer: number | null = null

// --- Computed ---
const lastRecord = computed(() => historyList.value[0] || null)

// --- Methods ---

const goBack = () => {
    uni.navigateBack()
}

// Format helpers
const safeParseDate = (dateStr: string | number) => {
    if (!dateStr) return new Date()
    if (typeof dateStr === 'number') return new Date(dateStr)
    try {
        return new Date(dateStr)
    } catch (e) {
        return new Date(dateStr.replace(/-/g, '/'))
    }
}

const formatDate = (timestamp: string) => {
  const date = safeParseDate(timestamp)
  if (isNaN(date.getTime())) return '--月--日'
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatTimeOnly = (timestamp: string) => {
    const date = safeParseDate(timestamp)
    if (isNaN(date.getTime())) return '--:--'
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const formatDurationText = (seconds: number) => {
    if (!seconds && seconds !== 0) return '--'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m > 0) return `${m}分${s}秒`
    return `${s}秒`
}

const formatTime = (timeStr: string) => {
    const date = safeParseDate(timeStr)
    if (isNaN(date.getTime())) return '--:--'
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const formatIntervalText = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '--'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m > 60) return '>60分' // Too long
    if (m > 0) return `${m}分${s}秒`
    return `${s}秒`
}

const getIntervalClass = (seconds: number | null) => {
    if (!seconds) return 'gray'
    const m = Math.floor(seconds / 60)
    if (m < 5) return 'danger' // Very frequent < 5 min
    if (m < 10) return 'warning' // 5-10 min
    return 'normal' // > 10 min
}

const getIntervalStatus = (seconds: number | null) => {
    if (!seconds) return '首条'
    const m = Math.floor(seconds / 60)
    if (m < 5) return '频繁'
    if (m < 10) return '规律'
    return '正常'
}

// Timer Logic
const toggleTimer = () => {
    if (isRunning.value) {
        stopTimer()
    } else {
        startTimer()
    }
}

const startTimer = () => {
    isRunning.value = true
    startTime.value = Date.now()
    currentDuration.value = 0
    timer = setInterval(() => {
        const now = Date.now()
        currentDuration.value = Math.floor((now - startTime.value!) / 1000)
    }, 1000)
    // Haptic
    uni.vibrateShort()
}

const stopTimer = async () => {
    if (!startTime.value) return
    
    const finalDuration = currentDuration.value
    const finalStartTime = startTime.value
    
    // Clear timer
    clearInterval(timer!)
    timer = null
    isRunning.value = false
    currentDuration.value = 0
    
    if (finalDuration < 5) {
        uni.showToast({ title: '时间太短，未记录', icon: 'none' })
        return
    }
    
    const endTime = Date.now()

    try {
        uni.showLoading({ title: '保存中...' })
        const res: any = await request({
            url: '/v1/contraction/record',
            method: 'POST',
            data: {
                startTime: new Date(finalStartTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                durationSeconds: finalDuration,
                painLevel: 1 
            }
        })
        
        if (res && res.code === 200) {
            uni.showToast({ title: '记录已保存', icon: 'success' })
            fetchHistory()
        } else {
             uni.showToast({ title: '保存失败', icon: 'none' })
        }
    } catch(e) {
        uni.showToast({ title: '保存失败', icon: 'none' })
    } finally {
        uni.hideLoading()
    }
}

const fetchHistory = async () => {
    try {
        const res: any = await request({ url: '/v1/contraction/history' })
        if (res && res.code === 200) {
            historyList.value = res.data || []
        }
    } catch(e) {
        console.error(e)
    }
}

onLoad(() => {
    const sys = uni.getSystemInfoSync()
    statusBarHeight.value = sys.statusBarHeight || 20
    fetchHistory()
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
})
</script>

<style lang="scss">
.page-root {
  min-height: 100vh;
  background-color: #F8F9FA;
  box-sizing: border-box;
}

/* Custom Nav */
.custom-nav {
  position: sticky;
  top: 0;
  width: 100%;
  background-color: #fff;
  z-index: 100;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  
  .nav-content {
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20rpx;
  }
  
  .left-icon {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(8px);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      
      .back-arrow { font-size: 16px; color: #1E293B; }
      &:active { transform: scale(0.95); opacity: 0.8; }
  }
  
  .nav-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
  }
  
  .right-placeholder {
      width: 60rpx;
  }
}

.content-wrapper {
    padding: 30rpx;
    padding-top: 20rpx;
    padding-bottom: 60rpx;
}

.header-card {
  margin-bottom: 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 8rpx;
  }
  .subtitle {
    font-size: 24rpx;
    color: #999;
  }

  .help-btn {
    display: flex;
    align-items: center;
    background: #FFF0F5;
    padding: 16rpx 24rpx;
    border-radius: 40rpx;
    box-shadow: 0 4rpx 12rpx rgba(255, 107, 129, 0.2);
    
    .icon { font-size: 28rpx; margin-right: 10rpx; }
    .text { font-size: 26rpx; color: #FF6B81; font-weight: bold; }
  }
}

.timer-container {
    background: #fff;
    border-radius: 32rpx;
    padding: 60rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.05);
    margin-bottom: 40rpx;
    transition: all 0.3s ease;
    
    &.is-running {
        background: #FFF0F5; // Light pink bg when running
    }

    .status-badge {
        padding: 8rpx 24rpx;
        border-radius: 30rpx;
        background: #FF6B81;
        color: #fff;
        font-size: 24rpx;
        display: flex;
        align-items: center;
        margin-bottom: 40rpx;
        
        .dot {
            width: 12rpx;
            height: 12rpx;
            border-radius: 50%;
            background: #fff;
            margin-right: 10rpx;
            animation: pulse-dot 1s infinite;
        }
        
        &.idle {
            background: #F0F0F0;
            color: #999;
        }
    }
    
    .timer-display {
        font-size: 80rpx;
        font-family: monospace;
        font-weight: bold;
        color: #333;
        margin-bottom: 60rpx;
        letter-spacing: 4rpx;
        line-height: 1;
    }
    
    .action-btn {
        width: 280rpx;
        height: 280rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #FFB3C3 0%, #FF8FA3 100%);
        box-shadow: 0 16rpx 40rpx rgba(255, 143, 163, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 60rpx;
        position: relative;
        
        .btn-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 2;
            
            .btn-icon { font-size: 64rpx; margin-bottom: 12rpx; color: #fff; }
            .btn-text { font-size: 32rpx; font-weight: bold; color: #fff; }
        }
        
        &.stop-btn {
            background: linear-gradient(135deg, #FF8FA3 0%, #F44336 100%);
            box-shadow: 0 16rpx 40rpx rgba(244, 67, 54, 0.4);
        }
        
        // Ripple animations
        .ripple {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            border: 2rpx solid rgba(255, 107, 129, 0.5);
            width: 100%; height: 100%;
            animation: ripple-anim 2s infinite;
            
            &.r2 { animation-delay: 1s; }
        }
    }
    
    .last-info {
        font-size: 26rpx;
        color: #666;
        display: flex;
        align-items: center;
        
        .separator { margin: 0 16rpx; color: #ddd; }
        &.empty { color: #ccc; }
    }
}

@keyframes pulse-dot {
    0% { opacity: 1; }
    50% { opacity: 0.3; }
    100% { opacity: 1; }
}

@keyframes ripple-anim {
    0% { width: 100%; height: 100%; opacity: 0.8; border-width: 4rpx; }
    100% { width: 160%; height: 160%; opacity: 0; border-width: 0; }
}

.history-panel {
    background: #fff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    
    .panel-header {
        margin-bottom: 24rpx;
        .panel-title { font-size: 32rpx; font-weight: bold; color: #333; }
    }
    
    .history-list {
        min-height: 200rpx;
    }
    
    .empty-tip {
        text-align: center;
        padding: 40rpx;
        color: #ccc;
        font-size: 28rpx;
    }
    
    .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24rpx 0;
        border-bottom: 1rpx solid #F9F9F9;
        
        &:last-child { border-bottom: none; }
        
        .item-left {
            display: flex;
            flex-direction: column;
            
            .date-row {
                display: flex;
                align-items: center;
                margin-bottom: 8rpx;
                
                .item-date {
                    font-size: 30rpx;
                    font-weight: 600;
                    color: #333;
                    margin-right: 12rpx;
                }
                .item-time-start {
                    font-size: 24rpx;
                    color: #999;
                }
            }
            
            .item-sub-info {
                font-size: 26rpx;
                color: #666;
                display: flex;
                align-items: center;
                
                .highlight-dur {
                    color: #FF6B81;
                    font-weight: 500;
                    margin: 0 6rpx;
                }
                .end-time-hint {
                    color: #ccc;
                    font-size: 22rpx;
                    margin-left: 8rpx;
                }
            }
        }
        
        .item-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            
            .interval-row {
                display: flex;
                align-items: baseline;
                margin-bottom: 6rpx;
                
                .item-interval {
                    font-size: 36rpx;
                    font-weight: bold;
                    margin-right: 4rpx;
                    
                    &.danger { color: #F44336; }
                    &.warning { color: #FF9800; }
                    &.normal { color: #4CAF50; }
                    &.gray { color: #ccc; }
                }
                .item-unit {
                    font-size: 22rpx;
                    color: #999;
                }
            }
            
            .status-badge {
                font-size: 20rpx;
                padding: 2rpx 10rpx;
                border-radius: 6rpx;
                
                &.danger { background: #FFEBEE; color: #D32F2F; }
                &.warning { background: #FFF3E0; color: #EF6C00; }
                &.normal { background: #E8F5E9; color: #2E7D32; }
                &.gray { background: #F5F5F5; color: #999; }
            }
        }
    }
}

.disclaimer {
  padding: 20rpx;
  text-align: center;
  font-size: 22rpx;
  color: #BDBDBD;
  line-height: 1.5;
}

/* Modal Styles */
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 640rpx;
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .modal-header {
    padding: 30rpx 40rpx;
    background: #FFFAFB;
    border-bottom: 1rpx solid #F0F0F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .modal-title { font-size: 34rpx; font-weight: bold; color: #333; }
    .close-btn { font-size: 40rpx; color: #999; }
  }
  
  .modal-body {
    padding: 30rpx;
    max-height: 60vh;
    box-sizing: border-box;
    
    .contrast-table {
        border: 1rpx solid #E0E0E0;
        border-radius: 12rpx;
        margin-bottom: 30rpx;
        overflow: hidden;
        
        .table-row {
            display: flex;
            border-bottom: 1rpx solid #E0E0E0;
            &:last-child { border-bottom: none; }
            
            &.header { background: #F5F5F5; font-weight: bold; }
            
            .label { width: 120rpx; padding: 16rpx; display: flex; align-items: center; justify-content: center; border-right: 1rpx solid #E0E0E0; font-size: 24rpx; color: #666; background: #FAFAFA;}
            .cell { flex: 1; padding: 16rpx; font-size: 24rpx; color: #333;  display: flex; align-items: center; justify-content: center; text-align: center; border-right: 1rpx solid #E0E0E0;
                &:last-child { border-right: none; }
                &.highlight { color: #FF6B81; font-weight: 500; background: #FFF0F5; }
            }
        }
    }
    
    .tips-box {
        background: #FFF8E1;
        padding: 24rpx;
        border-radius: 12rpx;
        
        .tips-title { font-size: 28rpx; font-weight: bold; color: #FF8F00; margin-bottom: 12rpx; display: block; }
        .tips-text { font-size: 24rpx; color: #5D4037; margin-bottom: 8rpx; display: block; line-height: 1.4; }
    }
  }
  
  .modal-footer {
    padding: 20rpx 40rpx 40rpx;
    .btn-confirm {
      background: #333; color: #fff;
      font-size: 30rpx; font-weight: bold;
      border-radius: 50rpx; height: 88rpx; line-height: 88rpx;
    }
  }
}
</style>
