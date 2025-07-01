<script lang="ts" setup>
import AiSender from '@/components/AiSender/index.vue';
import WelcomeText from '@/components/WelcomeText/index.vue';
import { useUserStore } from '@/stores';
import { useSessionStore } from '@/stores/modules/session';

const userStore = useUserStore();
const sessionStore = useSessionStore();

const senderValue = ref('');
const sending = ref(false);

async function handleSend(text: string) {
  localStorage.setItem('chatContent', text);
  await sessionStore.createSessionList({
    userId: userStore.userInfo?.userId as number,
    sessionContent: text,
    sessionTitle: text.slice(0, 10),
    remark: text.slice(0, 10),
  });
}
</script>

<template>
  <div class="chat-defaul-wrap">
    <WelcomeText />
    <AiSender v-model="senderValue" :loading="sending" placeholder="请输入问题，Enter发送，Shift+Enter换行" @send="handleSend">
      <template #left-action>
        <ModelSelect />
      </template>
    </AiSender>
  </div>
</template>

<style lang="scss" scoped>
.chat-defaul-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  min-height: 450px;

  .chat-defaul-sender {
    width: 100%;
  }
}
</style>
