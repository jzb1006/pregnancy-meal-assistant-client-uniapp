<template>
  <view class="week-calendar">
    <view 
      v-for="(day, index) in weekDays" 
      :key="index"
      class="day-item"
      :class="{ active: day.active }"
      @click="onSelect(day.date)"
    >
       <text class="week-day">{{ day.weekDay }}</text>
       <text class="day-num">{{ day.dayNum }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';

const props = defineProps<{
  activeDate: number
}>();

const emit = defineEmits(['dateSelect']);

const weekDays = computed(() => {
  // Simple current week logic
  // Just showing current 7 days window or real calendar logic
  // For simplicity, let's show Su-Sat of current week
  const start = dayjs().startOf('week'); // Sunday
  return Array.from({ length: 7 }).map((_, i) => {
    const d = start.add(i, 'day');
    return {
       date: d.date(),
       weekDay: ['日','一','二','三','四','五','六'][d.day()],
       dayNum: d.date(),
       active: d.date() === props.activeDate
    };
  });
});

const onSelect = (date: number) => {
    emit('dateSelect', date);
}
</script>

<style lang="scss" scoped>
.week-calendar {
  display: flex;
  justify-content: space-between;
  background: white;
  padding: 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  .day-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 6px;
    border-radius: 12px;
    transition: all 0.2s;
    
    .week-day {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .day-num {
      font-size: 15px;
      font-weight: 600;
      color: #334155;
    }

    &.active {
      background-color: #fda4af; // Rose-300
      box-shadow: 0 4px 6px -1px rgba(253, 164, 175, 0.4);
      
      .week-day, .day-num {
        color: white;
      }
    }
  }
}
</style>
