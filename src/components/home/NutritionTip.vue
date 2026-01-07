<template>
  <view class="nutrition-tip-container">
    <view class="tip-content">
      <text class="tip-icon">💡</text>
      <text class="tip-text">{{ currentTip }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getNutritionTip } from '@/api/service';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const currentTip = ref("正在加载今日贴士...");

const fallbackTips = [
  "孕中期多吃含铁食物（红肉、动物肝脏），预防贫血。",
  "少食多餐可以有效缓解孕期胃部不适。",
  "每天喝足量的水，有助于羊水代谢循环。",
  "深海鱼类含有丰富的DHA，有助于宝宝大脑发育。",
  "补充叶酸不仅仅是备孕期，孕早期同样重要。",
  "适当晒晒太阳，促进钙的吸收。",
  "避免食用生冷、未煮熟的食物，预防细菌感染。"
];

onMounted(async () => {
  try {
    const res = await getNutritionTip();
    if (res) {
      currentTip.value = res;
    } else {
      useFallback();
    }
  } catch (e) {
    console.error(e);
    useFallback();
  }
});

const useFallback = () => {
    currentTip.value = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
}
</script>

<style lang="scss" scoped>
.nutrition-tip-container {
  margin-bottom: 20px;
}

.tip-content {
  background: #FEF7EA;
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(253, 230, 200, 0.3);

  .tip-icon {
    font-size: 18px;
    margin-top: 1px;
  }

  .tip-text {
    font-size: 13px;
    color: #925F17;
    line-height: 1.5;
  }
}
</style>
