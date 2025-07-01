<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import AiSender from '@/components/AiSender/index.vue';
import BubbleList from '@/components/BubbleList/index.vue';
import ModelSelect from '@/components/ModelSelect/index.vue';
import { useFetchStream } from '@/hooks/useFetchStream';
import { useChatStore } from '@/stores/modules/chat';
import { useFilesStore } from '@/stores/modules/files';
import { useModelStore } from '@/stores/modules/model';
import { useUserStore } from '@/stores/modules/user';
import { useScroll } from "@/hooks/useScroll"

const {
  scrollRef,
  scrollToBottom,
  isUserAtBottom,
  showScrollButton
} = useScroll({
  threshold: 50,       // 接近底部的阈值（px）
  buttonOffset: 150,   // 显示按钮的滚动距离阈值（px）
  buttonBottom: 100    // 按钮底部偏移量（px）
})

// 新增：跟踪AI是否正在输出内容
const isAiResponding = ref(false);

onMounted(() => {
  scrollToBottom();
});

// 其他接口定义和变量初始化保持不变
interface MessageItem {
  key: number;
  role: 'ai' | 'user' | 'system';
  avatar: string;
  content: string;
  reasoning_content?: string;
  thinkingStatus?: 'start' | 'thinking' | 'end';
  thinlCollapse?: boolean;
  loading?: boolean;
  typing?: boolean;
  avatarSize?: string;
  placement?: string;
  isMarkdown?: boolean;
}

const route = useRoute();
const chatStore = useChatStore();
const modelStore = useModelStore();
const userStore = useUserStore();

const avatar = computed(() => {
  const userInfo = userStore.userInfo;
  return userInfo?.avatar || 'https://avatars.githubusercontent.com/u/76239030?v=4';
});

const inputValue = ref('');
const bubbleItems = ref<MessageItem[]>([]);
const bubbleListRef = ref<any>(null);

let isThinking = false;

function addMessage(message: string, isUser: boolean) {
  const i = bubbleItems.value.length;
  const obj: MessageItem = {
    key: i,
    avatar: isUser
      ? avatar.value
      : 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    avatarSize: '32px',
    role: isUser ? 'user' : 'system',
    placement: isUser ? 'end' : 'start',
    isMarkdown: !isUser,
    loading: !isUser,
    content: message || '',
    reasoning_content: '',
    thinkingStatus: 'start',
    thinlCollapse: false,
    typing: !isUser,
  };
  bubbleItems.value.push(obj);
}

function handleDataChunk(chunk: any) {
  try {
    // 设置AI正在响应
    isAiResponding.value = true;

    const reasoningChunk = chunk.choices?.[0].delta.reasoning_content;
    if (reasoningChunk) {
      const last = bubbleItems.value[bubbleItems.value.length - 1];
      last.thinkingStatus = 'thinking';
      last.loading = true;
      last.thinlCollapse = true;
      last.reasoning_content = (last.reasoning_content || '') + reasoningChunk;
    }

    const parsedChunk = chunk.choices?.[0].delta.content;
    if (parsedChunk) {
      const thinkStart = parsedChunk.includes('<think>');
      const thinkEnd = parsedChunk.includes('</think>');

      const last = bubbleItems.value[bubbleItems.value.length - 1];

      if (thinkStart) isThinking = true;
      if (thinkEnd) isThinking = false;

      if (isThinking) {
        last.thinkingStatus = 'thinking';
        last.loading = true;
        last.thinlCollapse = true;
        last.reasoning_content = (last.reasoning_content || '') + parsedChunk.replace('<think>', '').replace('</think>', '');
      } else {
        last.thinkingStatus = 'end';
        last.loading = false;
        last.content += parsedChunk;
      }
    }

    // 优化：仅当用户在底部时自动滚动
    nextTick(() => {
      if (isUserAtBottom.value) {
        scrollToBottom();
      }
    });
  } catch (err) {
    console.error('解析数据时出错:', err);
  }
}
function handleError(err: any) {
  console.error('请求错误:', err);
  isAiResponding.value = false;

}
const { loading: isLoading, stream, cancel } = useFetchStream({
  url: '/dev-api/chat/send',
  onError: handleError,
  onMessage: (chunk) => {
    // 你处理消息的逻辑
    console.log('收到chunk', chunk);
  },
});
// 其他方法保持不变...
async function handleSend(chatContent: string) {
  if (isLoading.value) {
    return;
  }

  inputValue.value = '';
  addMessage(chatContent, true);
  addMessage('', false);

  await nextTick();
  // 发送消息后，若用户在底部则滚动到底部
  if (isUserAtBottom.value) {
    scrollToBottom();
  }

  const requestData = {
    messages: bubbleItems.value
      .filter(item => item.role === 'user')
      .map(item => ({ role: item.role, content: item.content })),
    sessionId: route.params?.id !== 'not_login' ? String(route.params?.id) : undefined,
    userId: userStore.userInfo?.userId,
    model: modelStore.currentModelInfo.modelName ?? '',
  };

  cancel(); // 取消可能存在的旧请求

  try {
    isAiResponding.value = true; // 请求开始
    for await (const chunk of stream(requestData)) {
      handleDataChunk(chunk);
    }
  } catch (err) {
    handleError(err);
  } finally {
    isAiResponding.value = false;

  }
}

// 路由切换时的优化
watch(
  () => route.params?.id,
  async (_id_) => {
    if (_id_) {
      if (_id_ !== 'not_login') {
        // 有缓存则直接赋值
        if (chatStore.chatMap[`${_id_}`] && chatStore.chatMap[`${_id_}`].length) {
          bubbleItems.value = chatStore.chatMap[`${_id_}`] as MessageItem[];
          // 使用nextTick确保DOM更新后滚动
          nextTick(() => {
            scrollToBottom();
          });
          return;
        }

        // 无缓存则请求聊天记录
        await chatStore.requestChatList(`${_id_}`);
        bubbleItems.value = chatStore.chatMap[`${_id_}`] as MessageItem[];

        nextTick(() => {
          scrollToBottom();
        });
      }

      // 本地有未发送内容则发送
      const v = localStorage.getItem('chatContent');
      if (v) {
        nextTick(() => {
          handleSend(v);
        });
        localStorage.removeItem('chatContent');
      }
    }
  },
  { immediate: true, deep: true },
);
watch(bubbleItems, () => {
  nextTick(() => {
    if (isUserAtBottom.value && !isAiResponding.value) {
      scrollToBottom();
    }
  });
}, { deep: true });

// 计算属性：只有当AI没有响应时才显示滚动按钮
const shouldShowScrollButton = computed(() => {
  return !isAiResponding.value && showScrollButton.value;
});
</script>

<template>
  <div class="chat-with-id-container">
    <div class="chat-warp">
      <div id="scrollRef" ref="scrollRef" class="bubble-list-scroll-wrapper">
        <div class="chat-main-content">
          <BubbleList ref="bubbleListRef" :list="bubbleItems" max-height="calc(100vh - 180px)" :virtualScroll="true" />
        </div>
      </div>
      <div v-if="shouldShowScrollButton" class="scroll-to-bottom-btn" @click="scrollToBottom">
        <el-icon>
          <ArrowDownBold />
        </el-icon>
      </div>
      <div class="chat-main-content">
        <AiSender v-model="inputValue" class="chat-defaul-sender" :loading="isLoading"
          placeholder="请输入问题，Enter发送，Shift+Enter换行" @send="handleSend">
          <template #left-action>
            <ModelSelect />
          </template>
        </AiSender>
      </div>
    </div>
  </div>
</template>


<style lang="scss" scoped>
.chat-with-id-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;

  .chat-warp {
    width: 100%;
    height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }

  .bubble-list-scroll-wrapper {
    overflow-y: auto;
    flex: 1;
    max-height: calc(100vh - 180px);
    padding: 16px 0;
  }

  .chat-main-content {
    width: 80%;
    max-width: 850px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .chat-defaul-sender {
    margin-bottom: 32px;
  }
}

.scroll-to-bottom-btn {
  position: absolute;
  bottom: 200px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
}
</style>
