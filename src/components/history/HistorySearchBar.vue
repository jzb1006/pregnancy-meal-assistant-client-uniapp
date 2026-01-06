<template>
  <view class="search-bar-container">
    <view class="search-input-wrapper">
      <u-icon name="search" size="18" color="#94a3b8"></u-icon>
      <input 
        class="search-input"
        v-model="localValue"
        placeholder="搜索菜单名称..."
        @input="handleInput"
        confirm-type="search"
        @confirm="handleSearch"
      />
      <u-icon 
        v-if="localValue" 
        name="close-circle-fill" 
        size="18" 
        color="#cbd5e1"
        @click="handleClear"
      ></u-icon>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
}>();

const localValue = ref(props.modelValue);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal;
});

const handleInput = (e: any) => {
  const value = e.detail.value;
  localValue.value = value;
  emit('update:modelValue', value);
  
  // 防抖处理：500ms 后自动搜索
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    emit('search', value);
  }, 500);
};

const handleSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  emit('search', localValue.value);
};

const handleClear = () => {
  localValue.value = '';
  emit('update:modelValue', '');
  emit('search', '');
};
</script>

<style lang="scss" scoped>
.search-bar-container {
  padding: 12px 15px;
  background: #fff;
  border-bottom: 1px solid #f1f5f9;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 20px;
  padding: 8px 16px;
  gap: 8px;
  
  .search-input {
    flex: 1;
    font-size: 14px;
    color: #334155;
    border: none;
    background: transparent;
    
    &::placeholder {
      color: #94a3b8;
    }
  }
}
</style>

