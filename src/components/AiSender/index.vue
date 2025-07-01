<!-- ai发消息输入框 -->
<script setup lang="ts">
import { Top } from '@element-plus/icons-vue';
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
  (e: 'send', text: string): void;
}>();

const text = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  if (val !== text.value)
    text.value = val;
});

watch(text, (val) => {
  emit('update:modelValue', val);
});

function triggerSend() {
  const content = text.value.trim();
  if (!content)
    return;
  emit('send', content);
  // text.value = '';
}

function onKeydownEnter(e: KeyboardEvent) {
  if (e.shiftKey)
    return; // Shift+Enter 换行
  e.preventDefault();
  triggerSend();
}
</script>

<template>
  <div class="ai-sender-wrapper">
    <!-- 整体边框容器 -->
    <div class="ai-sender-box">
      <!-- 输入框本体（无边框） -->
      <el-input
        v-model="text"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 6 }"
        :disabled="disabled"
        :placeholder="placeholder"
        class="input-area"
        :border="false"
        @keydown.enter="onKeydownEnter"
      />

      <!-- 操作栏 -->
      <div class="action-bar mt-2 flex justify-between items-center">
        <div class="left-action flex items-center gap-2">
          <slot name="left-action" />
        </div>
        <el-button
          type="primary"
          :icon="Top"
          size="default"
          :loading="loading"
          :disabled="disabled || !text.trim()"
          @click="triggerSend"
        >
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ai-sender-wrapper {
  width: 100%;
  /* max-width: 700px; */
  margin: 0 auto;
}
.ai-sender-box {
  border: 1px solid #dcdfe6;
  border-radius: 18px;
  padding: 12px;
  background-color: #fff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* 改用 outline 显示聚焦效果 */
.ai-sender-box:focus-within {
  border: 1px solid var(--el-color-primary);
  outline: 2px solid var(--el-color-primary);
  outline-offset: 0;
}

.input-area :deep(.el-textarea__inner) {
  border: none !important;
  box-shadow: none !important;
  padding: 0;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
}
</style>
