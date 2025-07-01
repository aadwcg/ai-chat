<!-- 欢迎提示词 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTimeGreeting } from '@/hooks/useTimeGreeting';
import { useUserStore } from '@/stores';

const greeting = useTimeGreeting();
const userStore = useUserStore();

const username = computed(() => userStore.userInfo?.username ?? '我是 Element Plus X');
const fullText = computed(() => `${greeting.value}好，${username.value}`);

const displayedText = ref('');
const currentIndex = ref(0);

onMounted(() => {
  const step = 1;
  const interval = 45;

  const timer = setInterval(() => {
    displayedText.value += fullText.value[currentIndex.value] ?? '';
    currentIndex.value += step;

    if (currentIndex.value >= fullText.value.length) {
      clearInterval(timer);
    }
  }, interval);
});
</script>

<template>
  <div
    class="welcome-text w-full flex flex-wrap items-center justify-center text-center text-lg font-semibold mb-32px mt-12px font-size-32px line-height-32px"
  >
    <span>{{ displayedText }}</span>
  </div>
</template>

<style scoped lang="scss">
:deep {
  .typer-container {
    overflow: initial;
  }
}
</style>
