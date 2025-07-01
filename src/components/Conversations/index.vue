<template>
  <div class="conversations-wrapper">
    <div class="title">历史对话</div>
    <el-scrollbar class="conversations-scrollbar" @scroll="handleScroll">
      <div v-for="item in items" :key="item[rowKey]" class="conversation-item"
        :class="{ active: item[rowKey] === active }" :style="getItemStyle(item)" @click="handleClick(item)">
        <div class="label" :style="labelStyle">{{ item[labelKey] }}</div>

        <!-- 三个点操作 -->
        <el-dropdown trigger="click" @command="(command) => handleMenuCommand(command, item)" class="menu-dropdown">
          <el-icon class="more-icon" @click.stop>
            <MoreFilled />
          </el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="rename">重命名</el-dropdown-item>
              <el-dropdown-item command="delete">删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div v-if="loadMoreLoading" class="loading">加载中...</div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { CSSProperties, computed, ref } from 'vue';
import type { ConversationsProps } from './type';
import { MoreFilled } from '@element-plus/icons-vue';

const props = withDefaults(defineProps<ConversationsProps>(), {
  rowKey: 'id',
  labelKey: 'sessionTitle',
  labelMaxWidth: 200,
  showTooltip: true,
  itemsStyle: () => ({}),
  itemsActiveStyle: () => ({}),
  itemsHoverStyle: () => ({}),
});

const emit = defineEmits<{
  (e: 'change', item: any): void;
  (e: 'menu-command', command: string, item: any): void;
  (e: 'update:active', val: string | number): void;
}>();

const active = defineModel<string | number>('active');

const labelStyle = computed(() => ({
  maxWidth: typeof props.labelMaxWidth === 'number' ? `${props.labelMaxWidth}px` : props.labelMaxWidth,
}));

function getItemStyle(item: any): CSSProperties {
  const isActive = item[props.rowKey] === active.value;
  return {
    ...(props.itemsStyle || {}),
    ...(isActive ? props.itemsActiveStyle : {}),
  };
}

function handleClick(item: any) {
  active.value = item[props.rowKey];
  emit('change', item);
  emit('update:active', active.value);
}

function handleMenuCommand(command: string, item: any) {
  emit('menu-command', command, item);
}

function handleScroll({ scrollTop, scrollHeight, clientHeight }: any) {
  if (scrollTop + clientHeight >= scrollHeight - 20 && props.loadMore && !props.loadMoreLoading) {
    props.loadMore();
  }
}
</script>

<style lang="scss" scoped>
.conversations-scrollbar {
  max-height: 100%;
  padding: 12px;
  background-color: #f9f9f9;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 12px;
  background-color: #fff;
  transition: all 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

// .conversation-item:hover {
//   transform: translateY(-1px);
//   box-shadow: 0 4px 8px rgba(64, 158, 255, 0.1);
//   background-color: #f4faff;
// }

.conversation-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

.loading {
  padding: 14px;
  text-align: center;
  font-size: 13px;
  color: #999;
}

.conversations-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.title {
  font-size: 16px;
  font-weight: bold;
  padding: 12px;
  color: #333;
  border-bottom: 1px solid #e4e7ed;
}
</style>
