<template>
  <view class="pregnancy-calendar" :class="{ expanded: isExpanded }">
    <!-- Header: Switch View -->
    <view class="cal-header" @click="toggleExpand">
        <text class="title">{{ isExpanded ? '孕期全景' : '本周概览' }}</text>
        <view class="toggle-btn">
            <text class="label">{{ isExpanded ? '收起' : '展开' }}</text>
            <u-icon :name="isExpanded ? 'arrow-up' : 'arrow-down'" size="12" color="#94a3b8"></u-icon>
        </view>
    </view>

    <!-- Calendar Area -->
    <scroll-view 
        :scrollY="isExpanded" 
        class="scroll-area" 
        :style="{ height: isExpanded ? '350px' : '80px' }"
        :scroll-into-view="isExpanded ? scrollId : ''"
    >
        <view class="calendar-grid">
            <view 
                v-for="(week, wIdx) in visibleWeeks" 
                :key="wIdx" 
                class="week-row"
                :id="'week-' + week.weekNum"
            >
                <view class="week-label" v-if="isExpanded">孕{{ week.weekNum }}周</view>
                
                <view class="days-container">
                    <view 
                        v-for="(day, dIdx) in week.days" 
                        :key="dIdx"
                        class="day-item"
                        :class="{ 
                            'active': day.isToday, 
                            'selected': day.fullDate === props.activeDate,
                            'today-mark': day.isToday
                        }"
                        :style="getDayStyle(day)"
                        @click="onSelect(day.fullDate)"
                    >
                        <text class="week-day-name" v-if="!isExpanded && wIdx===0">{{ day.weekDayName }}</text>
                        <text class="day-num">{{ day.dayNum }}</text>
                        
                        <!-- Event Marker: Text Label -->
                        <view class="event-capsule" v-if="day.event" :style="{ background: day.event.color }">
                             <text class="tiny-text">{{ day.event.short }}</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>
    </scroll-view>

    <!-- Event Legend / Tip (shown when expanded) -->
    <view class="event-tip" v-if="currentEvent"> <!-- Always show if selected has event -->
        <view class="dot" :style="{ background: currentEvent.color }"></view>
        <text class="msg">{{ currentEvent.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const props = defineProps<{
  activeDate: string; // YYYY-MM-DD
  lmp: string; // YYYY-MM-DD, Last Menstrual Period
}>();

const emit = defineEmits(['dateSelect']);

const isExpanded = ref(false);
const scrollId = ref('');
const currentEvent = ref<any>(null);

// Important Milestones
const MILESTONES = [
    { week: 12, label: 'NT检查', short: 'NT', color: '#f59e0b' },      // Amber
    { week: 16, label: '唐筛', short: '唐筛', color: '#10b981' },        // Emerald
    { week: 24, label: '大排畸', short: '排畸', color: '#ef4444' },      // Red
    { week: 26, label: '糖耐', short: '糖耐', color: '#8b5cf6' },        // Violet
    { week: 40, label: '预产期', short: '发动', color: '#f43f5e' }       // Rose
];

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
    if (isExpanded.value) {
        setTimeout(() => {
            const today = dayjs();
            let targetDate = props.activeDate || today.format('YYYY-MM-DD');
            
            // Scroll to active date or today
            if (props.lmp) {
                const diffWeeks = dayjs(targetDate).diff(dayjs(props.lmp), 'week');
                scrollId.value = 'week-' + (diffWeeks + 1);
            }
        }, 50);
    } else {
        // Collapsing: Auto select Today
        const todayStr = dayjs().format('YYYY-MM-DD');
        if (props.activeDate !== todayStr) {
             emit('dateSelect', todayStr);
        }
    }
}

const onSelect = (date: string) => {
    emit('dateSelect', date);
    
    const dayObj = allPregnancyDays.value.find(d => d.fullDate === date);
    if (dayObj && dayObj.event) {
        currentEvent.value = dayObj.event;
    } else {
        currentEvent.value = null;
    }
}

const getDayStyle = (day: any) => {
    // If selected, override
    if (day.fullDate === props.activeDate) return {};
    
    if (day.event) {
        return {
            border: `1px solid ${day.event.color}40`, // Low opacity border
            background: `${day.event.color}08`, // Very light bg
        };
    }
    return {};
}

// Generate all 280 days (40 weeks) based on LMP
// ... (Logic remains same, hidden for brevity, but needed if replacing block)
// Re-implementing computed/watcher to ensure file integrity

const allPregnancyWeeks = computed(() => {
    if (!props.lmp) return [];
    
    const weeks = [];
    const lmpDate = dayjs(props.lmp);
    
    for (let w = 0; w < 42; w++) { 
        const days = [];
        for (let d = 0; d < 7; d++) {
            const currentDay = lmpDate.add(w * 7 + d, 'day');
            
            let event = null;
            if (d === 0) { 
                 event = MILESTONES.find(m => m.week === w + 1); 
            }

            days.push({
                fullDate: currentDay.format('YYYY-MM-DD'),
                dayNum: currentDay.date(),
                weekDayName: ['日','一','二','三','四','五','六'][currentDay.day()],
                isToday: currentDay.isSame(dayjs(), 'day'),
                event: event
            });
        }
        weeks.push({
            weekNum: w + 1,
            days: days
        });
    }
    return weeks;
});

const allPregnancyDays = computed(() => {
    return allPregnancyWeeks.value.flatMap(w => w.days);
});

const visibleWeeks = computed(() => {
    if (isExpanded.value) {
        return allPregnancyWeeks.value;
    } else {
        const targetDate = props.activeDate || dayjs().format('YYYY-MM-DD');
        const found = allPregnancyWeeks.value.find(w => 
            w.days.some(d => d.fullDate === targetDate)
        );
        return found ? [found] : (allPregnancyWeeks.value.slice(0, 1) || []);
    }
});

watch(() => props.activeDate, (newDate) => {
    if (newDate) {
        const dayObj = allPregnancyDays.value.find(d => d.fullDate === newDate);
        if (dayObj && dayObj.event) {
            currentEvent.value = dayObj.event;
        } else {
            currentEvent.value = null;
        }
    }
}, { immediate: true });

watch(() => props.lmp, (val) => {
    if (val && !props.activeDate) {
         // logic
    }
});
</script>

<style lang="scss" scoped>
.pregnancy-calendar {
  background: white;
  border-radius: 24px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px -10px rgba(253, 164, 175, 0.2);
  transition: all 0.3s ease;
  border: 1px solid #fff5f7;

  &.expanded {
      padding-bottom: 10px;
  }

  .cal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding: 0 4px;
      
      .title {
          font-size: 16px;
          font-weight: 800;
          color: #334155;
      }
      .toggle-btn {
          display: flex;
          align-items: center;
          background: #f8fafc;
          padding: 4px 10px;
          border-radius: 20px;
          .label { font-size: 12px; color: #64748b; margin-right: 4px; }
      }
  }

  .scroll-area {
      transition: height 0.3s ease;
  }

  .week-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      
      .week-label {
          width: 40px;
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
          flex-shrink: 0;
      }

      .days-container {
          flex: 1;
          display: flex;
          justify-content: space-between;

          .day-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 54px; // Slightly taller for label
              border-radius: 10px;
              position: relative;
              transition: all 0.2s;
              border: 1px solid transparent; // prevent layout shift

              .week-day-name {
                  font-size: 10px;
                  color: #94a3b8;
                  margin-bottom: 2px;
              }
              .day-num {
                  font-size: 14px;
                  font-weight: 600;
                  color: #475569;
                  margin-bottom: 2px;
              }

              // Event Capsule
              .event-capsule {
                   background: #f43f5e;
                   padding: 1px 4px;
                   border-radius: 6px;
                   height: 14px;
                   display: flex;
                   align-items: center;
                   justify-content: center;
                   
                   .tiny-text {
                       font-size: 9px; // tiny
                       color: white;
                       line-height: 1;
                       font-weight: bold;
                   }
              }

              // States
              &.today-mark {
                   // Just marking today border if not active
                   // handled via style or class
              }

              &.active { // Today logic
                 // keep simple
              }
              
              &.selected { // Selected state overrides everything
                  background: #f43f5e !important;
                  border-color: #f43f5e !important;
                  box-shadow: 0 4px 10px rgba(244, 63, 94, 0.4);
                  
                  .day-num { color: white; }
                  .week-day-name { color: rgba(255,255,255,0.8); }
                  
                  // Invert capsule if selected? Or keep white text? 
                  // White text on Red bg is fine.
                  .event-capsule {
                      background: white !important;
                      .tiny-text { color: #f43f5e; } // dynamic color hard to do with CSS class, assume rose for selected
                  }
              }
          }
      }
  }

  .event-tip {
      display: flex;
      align-items: center;
      background: #fdf2f8;
      padding: 8px 12px;
      border-radius: 12px;
      margin-top: 10px;
      
      .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
      }
      .msg {
          font-size: 13px;
          color: #be185d;
          font-weight: 600;
      }
  }
}
</style>
