<script setup lang="ts">
import type { BubbleProps } from './types';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import { ref } from 'vue';

const props = defineProps<{
  list: BubbleProps[];
  maxHeight?: string;
}>();
function highlightBlock(str: string, lang?: string) {
  return `<pre class="code-block-wrapper"><div class="code-block-header"><span class="code-block-header__lang">${lang}</span><span class="code-block-header__copy">${'复制代码'}</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`;
}
const md = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(code, language) {
    const validLang = !!(language && hljs.getLanguage(language));
    if (validLang) {
      const lang = language ?? '';
      return highlightBlock(hljs.highlight(code, { language: lang }).value, lang);
    }
    return highlightBlock(hljs.highlightAuto(code).value, '');
  },
});
const listRef = ref<HTMLElement | null>(null);

function preprocessContent(raw: string): string {
  let value = raw ?? '';

  // 数学公式处理
  value = value.replace(/\\\( *(.*?) *\\\)/g, '$$$1$$');
  value = value.replace(/\\\[ *(.*?) *\\\]/g, '$$$$$1$$$$');
  value = value.replaceAll('\\[', '$$$$');
  value = value.replaceAll('\\]', '$$$$');

  // 思考过程处理 <think>...</think>
  value = value.replace(/<think>([\s\S]*?)(?=<\/think>|$)/g, (match: string, content: string) => {
    const processedContent = content
      .split('\n')
      .map(line => line.trim() ? `>${line}` : line)
      .join('\n')
      .replace(/(\r?\n)+/g, '\n>\n');

    return `>Thinking...${processedContent}`;
  });
  value = value.replaceAll('</think>', '');

  return value;
}
function renderMarkdown(content: string): string {
  return md.render(preprocessContent(content));
}
</script>

<template>
  <div ref="listRef" class="bubble-list">
    <slot name="default" :list="list">
      <div v-for="item in list" :key="item.key" class="bubble-item" :class="item.role">
        <div class="avatar">
          <img :src="item.avatar" :alt="item.role">
        </div>
        <div class="bubble-container" :class="item.role">
          <div v-if="item.reasoning_content" class="thinking-chain" :class="{ collapsed: !item.thinlCollapse }">
            <div class="thinking-header">
              <span class="status">
                {{ item.thinkingStatus === 'thinking' ? '思考中...' : '思考完成' }}
              </span>
              <button class="toggle-btn" :class="{ inline: !item.thinlCollapse }"
                @click="item.thinlCollapse = !item.thinlCollapse">
                {{ item.thinlCollapse ? '收起' : '展开' }}
              </button>
            </div>
            <transition name="thinking-fade">
              <div v-show="item.thinlCollapse" class="thinking-text-wrapper">
                <p class="thinking-text">
                  {{ item.reasoning_content }}
                </p>
              </div>
            </transition>
          </div>
          <div class="bubble-wrapper">
            <div class="bubble-content" :class="item.role">
              <div v-if="item.loading && !item.content && !item.reasoning_content" class="bubble-loading">
                <span class="jump-dot dot-1" />
                <span class="jump-dot dot-2" />
                <span class="jump-dot dot-3" />
              </div>
              <div v-else class="markdown-body" v-html="renderMarkdown(item.content)" />
            </div>
          </div>
        </div>
      </div>
    </slot>
    <slot name="scroll-to-bottom" />
  </div>
</template>

<style lang="scss" scoped>
.bubble-list {
  padding: 16px;
  box-sizing: border-box;
}

.bubble-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.bubble-item.user {
  flex-direction: row-reverse;
}

.bubble-item.system {
  flex-direction: row;
  padding: 20px 0;
}

.avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin: 0 8px;
}

.bubble-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.thinking-chain {
  background-color: #fff;
  padding: 16px 14px;
  border-radius: 8px;
  color: #666;
  font-size: 13px;
  border: 1px solid #e0e0e0;
  width: 100%;
  max-width: 100%;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-sizing: border-box;
}

.thinking-chain.collapsed {
  width: 200px;
  padding: 16px 10px;
  background-color: #fff;
}

.thinking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

.status {
  color: #333;
  font-size: 13px;
  white-space: nowrap;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.toggle-btn.inline {
  margin-left: 4px;
  padding: 0;
}

.thinking-header:not(.inline) .toggle-btn {
  margin-left: auto;
}

.thinking-text {
  margin-top: 6px;
  white-space: pre-wrap;
  font-style: italic;
  color: #999;
  font-size: 13px;
}

.bubble-content {
  max-width: 800px; // 限制最大宽度，防止太宽
  min-width: 80px;  // 最小宽度，避免太窄
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  box-sizing: border-box;
  word-wrap: break-word; // 强制长单词换行
}

.bubble-content.user {
  background: #f4f6fa;
}

.bubble-content.system {
  background: #fff;
}

.bubble-loading {
  display: flex;
  gap: 6px;
  align-items: center;
  height: 20px;
  padding: 4px 10px;
}

.jump-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: jump 0.6s infinite ease-in-out;
  background-color: var(--el-color-primary);
}

.dot-1 {
  animation-delay: 0s;
}

.dot-2 {
  animation-delay: 0.15s;
}

.dot-3 {
  animation-delay: 0.3s;
}

@keyframes jump {

  0%,
  100% {
    transform: translateY(3px);
  }

  50% {
    transform: translateY(-3px);
  }
}

.thinking-text-wrapper {
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: 500px;
  opacity: 1;
}

.thinking-fade-enter-from,
.thinking-fade-leave-to {
  max-height: 0;
  opacity: 0;
}

.thinking-fade-enter-active,
.thinking-fade-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.bubble-container .system {
  width: 100%;
}

.bubble-content.user .markdown-body {
  background: #f4f6fa;
}
</style>
