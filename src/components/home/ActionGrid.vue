<template>
  <view class="action-grid">
     <view 
        class="action-item" 
        v-for="(item, index) in actions" 
        :key="index"
        :class="[item.variant]"
        @click="onClick(item.route)"
     >
        <view class="icon-box">
             <!-- Use u-icon or text emoji as fallback -->
             <u-icon :name="item.iconName" size="24" color="#fff" v-if="item.iconName"></u-icon>
             <text v-else style="font-size: 24px">🍽️</text>
        </view>
        <view class="text-box">
            <text class="title">{{ item.title }}</text>
            <text class="subtitle">{{ item.subtitle }}</text>
        </view>
     </view>
  </view>
</template>

<script setup lang="ts">
export interface ActionItem {
    title: string;
    subtitle: string;
    icon?: any;
    iconName?: string; // string for u-icon
    variant: 'peach' | 'mint';
    route: string;
}

defineProps<{
    actions: ActionItem[];
}>();

const emit = defineEmits(['click']);

const onClick = (route: string) => {
    emit('click', route);
}
</script>

<style lang="scss" scoped>
.action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;

    .action-item {
        border-radius: 20px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 140px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        color: white;

        .icon-box {
            width: 40px;
            height: 40px;
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }

        .text-box {
            display: flex;
            flex-direction: column;
            .title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 4px;
            }
            .subtitle {
                font-size: 11px;
                opacity: 0.8;
            }
        }

        &.peach {
             background: linear-gradient(135deg, #fda4af 0%, #f43f5e 100%);
        }
        &.mint {
             background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%);
        }
    }
}
</style>
