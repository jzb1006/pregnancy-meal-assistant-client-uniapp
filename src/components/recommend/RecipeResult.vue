<template>
  <view class="recipe-result">
      <view class="header">
          <text class="dish-name">{{ data.dishName }}</text>
          <view class="calories" v-if="data.calories">
             <text>{{ data.calories }} kcal</text>
          </view>
      </view>
      
      <view class="tags">
          <view class="tag" v-for="tag in data.tags" :key="tag">{{ tag }}</view>
      </view>
      
      <view class="reason">
         <text class="label">推荐理由：</text>
         <text class="text">{{ data.reason }}</text>
      </view>
      
      <view class="actions">
          <view class="btn like" @click="$emit('feedback', data.id, 'LIKE')">
             <text class="btn-text">❤️ 收藏</text>
          </view>
          <view class="btn dislike" @click="$emit('feedback', data.id, 'DISLIKE')">
             <text class="btn-text">💔 无感</text>
          </view>
      </view>
  </view>
</template>

<script setup lang="ts">
export interface RecipeData {
    id?: string;
    dishName: string;
    reason: string;
    tags: string[];
    calories?: number;
    [key: string]: any;
}

defineProps<{
  data: RecipeData;
}>();
defineEmits(['feedback']);
</script>

<style lang="scss" scoped>
.recipe-result {
    padding: 10px;
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        .dish-name { font-size: 20px; font-weight: bold; color: #333; }
        .calories { background: #fee2e2; color: #f43f5e; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    }
    
    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
        .tag {
            background: #f1f5f9;
            color: #475569;
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 12px;
        }
    }
    
    .reason {
        background: #ffffff;
        border: 1px dashed #e2e8f0;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 20px;
        .label { font-weight: bold; color: #333; display: block; margin-bottom: 4px; font-size: 14px;}
        .text { color: #666; font-size: 14px; line-height: 1.6; }
    }
    
    .actions {
        display: flex;
        gap: 12px;
        .btn {
            flex: 1;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 22px;
            font-size: 14px;
            font-weight: 500;
            
            &.like { background: #ffe4e6; color: #e11d48; }
            &.dislike { background: #f1f5f9; color: #64748b; }
            
            .btn-text {
                font-size: 14px;
            }
        }
    }
}
</style>
