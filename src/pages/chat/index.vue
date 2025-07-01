<script lang="ts" setup>
import { useRoute } from 'vue-router';
import ChatDefaul from './chatDefaul/index.vue';
import ChatWithId from './chatWithId/index.vue';

const route = useRoute();
const sessionId = computed(() => route.params?.id);
</script>

<template>
  <div class="chat-container">
    <ChatDefaul v-if="!sessionId" />
    <ChatWithId v-else />
  </div>
</template>

<style lang="scss" scoped>
.chat-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: calc(100% - 32px);
  height: 100%;
  padding: 0 16px;
  overflow-anchor: none;
}
</style>
