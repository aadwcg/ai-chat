<script setup lang="ts">
import Aside from './components/Aside/index.vue';
import Header from './components/Header/index.vue';
import Main from './components/Main/index.vue';
</script>

<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <Header />
    </el-header>
    <el-container class="layout-container-main">
      <Aside />
      <el-main class="layout-main">
        <!-- 路由页面 -->
        <Main />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  .layout-header {
    padding: 0;
  }
  .layout-main {
    height: 100%;
    padding: 0;
  }
  .layout-container-main {
    margin-left: var(--sidebar-left-container-default-width, 0);
    transition: margin-left 0.3s ease;
  }
}

/** 去除菜单右侧边框 */
.el-menu {
  border-right: none;
}
.layout-scrollbar {
  width: 100%;
}
</style>
