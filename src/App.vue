<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useUserStore } from '@/stores/user';

onLaunch(() => {
  console.log("App Launch");
  uni.hideTabBar();
  
  const userStore = useUserStore();
  if (!userStore.openId) {
      // Delay slightly to ensure framework is ready
      setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/login' });
      }, 100);
  }
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
	/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
	@import "uview-plus/index.scss";
</style>
