<template>
  <view class="page-root">
    <!-- Custom Navigation Bar (Full Width) -->
    <view class="custom-nav" :style="{ height: (statusBarHeight + 44) + 'px', paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="left-icon" @click="goBack">
          <text class="back-arrow">❮</text>
        </view>
        <text class="nav-title">数胎动</text>
        <view class="right-placeholder"></view>
      </view>
    </view>

    <!-- Main Content (With Padding) -->
    <view class="content-wrapper">
      <!-- Header Area -->
      <view class="header-card">
        <view class="guide-text">
          <text class="title">今日记录</text>
          <text class="subtitle">孕28周后，每天早中晚各数一次</text>
        </view>
        <view class="help-btn" @click="showGuide = true">
          <text class="icon">📖</text>
          <text class="text">科学指南</text>
        </view>
      </view>

      <!-- Main Counter Area -->
      <view class="counter-container">
        <view class="timer-display">{{ formatTime(seconds) }}</view>
        
        <view 
          class="kick-button"
          :class="{ 'is-active': isAnimating }"
          @touchstart="handleKick"
        >
          <view class="kick-inner">
            <text class="kick-icon">👣</text>
            <text class="kick-text">点击记录</text>
          </view>
        </view>
        
        <view class="count-display">
          <text class="label">本次胎动</text>
          <text class="value">{{ currentCount }}</text>
          <text class="unit">次</text>
        </view>
      </view>

      <!-- Controls -->
      <view class="controls">
        <button class="btn secondary" @click="resetSession" v-if="isActive || currentCount > 0">重新开始</button>
        <button class="btn primary" @click="finishSession" v-if="currentCount > 0">完成记录</button>
      </view>

      <!-- History Panel -->
      <view class="history-panel">
        <view class="panel-header">
          <text class="panel-title">最近记录</text>
          <text class="panel-more" @click="viewAllHistory">全部</text>
        </view>
        <view class="history-list">
          <view class="empty-tip" v-if="historyList.length === 0">
            暂无记录，快开始数胎动吧~
          </view>
          <view 
            class="history-item" 
            v-for="(item, index) in historyList" 
            :key="index"
          >
            <view class="item-left">
              <view class="date-row">
                  <text class="item-date">{{ formatDate(item.startTime) }}</text>
                  <view class="time-tag" :class="getTimeOfDayClass(item.startTime)">
                      {{ getTimeOfDay(item.startTime) }}
                  </view>
              </view>
              <text class="item-sub-info">
                  {{ formatTimeOnly(item.startTime) }} 开始 · 用时{{ formatDuration(item.durationSeconds || item.duration) }}
              </text>
            </view>
            <view class="item-right">
              <view class="count-row">
                  <text class="item-count">{{ item.count }}</text>
                  <text class="item-unit">次</text>
              </view>
              <text class="item-status" :class="getValidationClass(item.count)">{{ getValidationText(item.count) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Disclaimer -->
      <view class="disclaimer">
        <text>⚠️ 结果仅供参考，如感觉胎动明显异常（过少或躁动），请立即就医。</text>
      </view>
    </view>

    <!-- Guide Modal -->
    <view class="modal-mask" v-if="showGuide" @click="showGuide = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">科学数胎动指南</text>
          <view class="close-btn" @click="showGuide = false">×</view>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="guide-content">
             <view class="guide-item">
                <view class="guide-icon">🛌</view>
                <view class="guide-info">
                    <text class="guide-label">最佳姿势</text>
                    <text class="guide-desc">建议采取左侧卧位，环境保持安静，精神集中，避免干扰。</text>
                </view>
             </view>
             <view class="guide-item">
                <view class="guide-icon">⏰</view>
                <view class="guide-info">
                    <text class="guide-label">最佳时间</text>
                    <text class="guide-desc">推荐在早、中、晚饭后各数1小时。此时血糖升高，宝宝较活跃。</text>
                </view>
             </view>
             <view class="guide-item">
                <view class="guide-icon">📝</view>
                <view class="guide-info">
                    <text class="guide-label">计数标准</text>
                    <text class="guide-desc">连续的胎动算作1次。如果宝宝连续踢打，等停下来2-3分钟后再动，才算下一次。</text>
                </view>
             </view>
             <view class="guide-item">
                <view class="guide-icon">🏥</view>
                <view class="guide-info">
                    <text class="guide-label">正常范围</text>
                    <text class="guide-desc">1小时胎动 ≥3 次为正常。若少于3次，可继续数1小时。若2小时仍少于10次，建议就医。</text>
                </view>
             </view>
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
import { ref, onUnmounted } from 'vue'
import { request } from '@/utils/request'
import { safeParseDate } from '@/utils/date'
import { onLoad } from '@dcloudio/uni-app'

// --- State ---
const currentCount = ref(0)
const seconds = ref(3600) // Default 1 hour countdown
const isActive = ref(false)
const isAnimating = ref(false)
const showGuide = ref(false)
let timer: number | null = null
const startTime = ref<number | null>(null)
const statusBarHeight = ref(20)

// Data
const historyList = ref<any[]>([])

// --- Methods ---

const goBack = () => {
    uni.navigateBack()
}

const fetchHistory = async () => {
  try {
    const res: any = await request({ url: '/v1/fetal-movement/history' })
    if (res && res.code === 200) {
      historyList.value = res.data || []
    }
  } catch (e) {
    console.error('Fetch history failed', e)
  }
}

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
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

const getTimeOfDay = (timestamp: string) => {
    const date = safeParseDate(timestamp)
    if (isNaN(date.getTime())) return ''
    const hour = date.getHours()
    if (hour < 6) return '凌晨'
    if (hour < 11) return '上午'
    if (hour < 13) return '中午'
    if (hour < 18) return '下午'
    return '晚上'
}

const getTimeOfDayClass = (timestamp: string) => {
    const date = safeParseDate(timestamp)
    if (isNaN(date.getTime())) return ''
    const hour = date.getHours()
    if (hour < 11) return 'tag-morning'
    if (hour < 18) return 'tag-afternoon'
    return 'tag-evening'
}

const formatDuration = (seconds: number) => {
  if (!seconds && seconds !== 0) return '0分钟'
  const m = Math.floor(seconds / 60)
  return m < 1 ? '不足1分钟' : `${m}分钟`
}

const getValidationText = (count: number) => {
  return count >= 3 ? '正常' : '⚠️ 偏少'
}

const getValidationClass = (count: number) => {
  return count >= 3 ? 'status-normal' : 'status-warning'
}

const startTimer = () => {
  if (!isActive.value) {
    isActive.value = true
    startTime.value = Date.now()
    timer = setInterval(() => {
      if (seconds.value > 0) {
        seconds.value--
      } else {
        finishSession()
      }
    }, 1000)
  }
}

const handleKick = () => {
  // Trigger animation
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
  }, 200)

  // Start timer on first kick if not started
  if (!isActive.value) {
    startTimer()
  }

  currentCount.value++
  
  // Haptic feedback
  uni.vibrateShort()
}

const resetSession = () => {
  clearInterval(timer!)
  isActive.value = false
  currentCount.value = 0
  seconds.value = 3600
  timer = null
}

const finishSession = async () => {
  clearInterval(timer!)
  isActive.value = false
  
  const duration = 3600 - seconds.value
  const thisStartTime = startTime.value || Date.now()
  
  // Validate before saving suggestions
  if (currentCount.value < 3) {
      uni.showModal({
          title: '胎动计数偏少',
          content: '本次记录1小时内少于3次。建议您休息片刻，吃点东西，再重新数一次。如果持续偏少或感觉不适，请及时就医。',
          showCancel: false,
          confirmText: '知道了'
      })
  }
  
  try {
      uni.showLoading({ title: '保存中' })
      const res: any = await request({
          url: '/v1/fetal-movement/record',
          method: 'POST',
          data: {
              startTime: new Date(thisStartTime).toISOString(),
              durationSeconds: duration,
              count: currentCount.value
          }
      })
      
      if (res && res.code === 200) {
           uni.showToast({ title: '记录已保存', icon: 'success' })
           // Cache for TodoTips
           const today = new Date().toISOString().split('T')[0]
           uni.setStorageSync('LAST_FETAL_MOVEMENT_DATE', today)
           
           fetchHistory() // Refresh list
      }
  } catch(e) {
      uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
      uni.hideLoading()
      // Prepare for next
      seconds.value = 3600
      currentCount.value = 0
  }
}

const viewAllHistory = () => {
  // Simple toast for now
  uni.showToast({ title: '暂无更多历史', icon: 'none' })
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
    padding-top: 20rpx; /* Gap between nav and content */
    padding-bottom: 60rpx;
}

.header-card {
  margin-bottom: 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center; /* Center align items */
  
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

.counter-container {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.05);
  margin-bottom: 40rpx;

  .timer-display {
    font-size: 64rpx;
    font-weight: bold;
    color: #333;
    font-family: monospace;
    margin-bottom: 60rpx;
  }

  .kick-button {
    width: 260rpx;
    height: 260rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFB3C3 0%, #FF8FA3 100%);
    box-shadow: 0 16rpx 40rpx rgba(255, 143, 163, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 60rpx;
    transition: transform 0.1s;
    position: relative;
    overflow: hidden;

    &.is-active {
      transform: scale(0.95);
    }
    
    // Shine effect
    &::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
        opacity: 0;
        transform: scale(0.5);
        transition: opacity 0.3s, transform 0.3s;
    }
    
    &:active::after {
        opacity: 1;
        transform: scale(1);
    }

    .kick-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .kick-icon {
        font-size: 72rpx;
        margin-bottom: 12rpx;
      }
      .kick-text {
        font-size: 30rpx;
        color: #fff;
        font-weight: 600;
      }
    }
  }

  .count-display {
    .label {
      font-size: 28rpx;
      color: #666;
      margin-right: 16rpx;
    }
    .value {
      font-size: 64rpx;
      font-weight: bold;
      color: #FF8FA3;
    }
    .unit {
      font-size: 28rpx;
      color: #999;
      margin-left: 8rpx;
    }
  }
}

.controls {
  display: flex;
  justify-content: space-around;
  margin-bottom: 60rpx;
  
  .btn {
    width: 300rpx;
    height: 96rpx;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.primary {
      background: #333;
      color: #fff;
      box-shadow: 0 8rpx 20rpx rgba(51,51,51,0.2);
    }
    
    &.secondary {
      background: #FFFFFF;
      color: #666;
      border: 1rpx solid #E0E0E0;
    }
  }
}

.history-panel {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .panel-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    .panel-more {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F5F5F5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .item-left {
      display: flex;
      flex-direction: column;
      
      .date-row {
          display: flex;
          align-items: center;
          margin-bottom: 8rpx;
          
          .item-date {
            font-size: 30rpx;
            color: #333;
            font-weight: 600;
            margin-right: 12rpx;
          }
          
          .time-tag {
              font-size: 20rpx;
              padding: 2rpx 8rpx;
              border-radius: 6rpx;
              
              &.tag-morning { background: #E3F2FD; color: #1976D2; }
              &.tag-afternoon { background: #FFF3E0; color: #F57C00; }
              &.tag-evening { background: #F3E5F5; color: #7B1FA2; }
          }
      }
      
      .item-sub-info {
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .item-right {
      text-align: right;
      
      .count-row {
         display: flex;
         align-items: baseline;
         justify-content: flex-end;
         margin-bottom: 6rpx;
         
         .item-count {
            font-size: 40rpx;
            font-weight: bold;
            color: #333;
            margin-right: 4rpx;
         }
         
         .item-unit {
             font-size: 24rpx;
             color: #999;
         }
      }

      .item-status {
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        font-weight: 500;
        display: inline-block;
        
        &.status-normal {
          background: #E8F5E9;
          color: #2E7D32;
        }
        &.status-warning {
          background: #FFEBEE;
          color: #C62828;
        }
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

/* Modal Styles Refined */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24rpx 48rpx rgba(0,0,0,0.1);

  .modal-header {
    padding: 30rpx 40rpx;
    background: #FFFAFB;
    border-bottom: 1rpx solid #F0F0F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .modal-title {
      font-size: 34rpx;
      font-weight: bold;
      color: #333;
    }
    .close-btn {
      font-size: 40rpx;
      color: #999;
      padding: 10rpx;
      line-height: 1;
    }
  }
  
  .modal-body {
    padding: 30rpx 40rpx;
    max-height: 500rpx; // Scrollable
    box-sizing: border-box;
    
    .guide-content {
        padding-bottom: 20rpx;
    }
    
    .guide-item {
      margin-bottom: 40rpx;
      display: flex;
      align-items: flex-start;
      
      .guide-icon {
          font-size: 40rpx;
          margin-right: 24rpx;
          width: 50rpx;
          text-align: center;
          padding-top: 4rpx;
      }
      
      .guide-info {
          flex: 1;
      }
      
      .guide-label {
        font-size: 30rpx;
        font-weight: bold;
        color: #FF8FA3;
        display: block;
        margin-bottom: 12rpx;
      }
      .guide-desc {
        font-size: 28rpx;
        color: #555;
        line-height: 1.6;
        text-align: justify;
      }
    }
  }
  
  .modal-footer {
    padding: 20rpx 40rpx 40rpx;
    
    .btn-confirm {
      background: #333;
      color: #fff;
      font-size: 30rpx;
      font-weight: bold;
      border-radius: 50rpx;
      height: 88rpx;
      line-height: 88rpx;
      box-shadow: 0 8rpx 16rpx rgba(0,0,0,0.1);
      
      &:active {
          transform: scale(0.98);
      }
    }
  }
}
</style>
