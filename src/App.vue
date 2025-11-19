<template>
  <n-config-provider
    :theme="darkTheme"
    :theme-overrides="darkThemeOverrides"
    :hljs="highlightConfig.hljs"
  >
    <n-message-provider>
      <div class="app-container dark">
        <back-to-top v-if="!isSubmitPage" />
        <router-view />
      </div>
    </n-message-provider>
  </n-config-provider>
  <Analytics />
  <iris-mask :is-active="irisMaskActive" :position="irisMaskPosition" />
  <SpeedInsights />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { darkTheme, NConfigProvider, NMessageProvider } from 'naive-ui'
import { highlightConfig } from './plugins/highlight'

import IrisMask from './components/IrisMask.vue'
import BackToTop from './components/BackToTop.vue'

import { darkThemeOverrides } from './config/darkTheme'
import { usePluginStore } from './stores/plugins'

import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from "@vercel/speed-insights/vue"

const store = usePluginStore()
const {
  irisMaskActive,
  irisMaskPosition,
  searchQuery,
  selectedTag,
  currentPage,
  sortBy,
} = storeToRefs(store)

const route = useRoute()
const isSubmitPage = computed(() => route.path === '/submit')
const filterKey = computed(() => {
  return `${searchQuery.value}-${selectedTag.value}-${sortBy.value}-${currentPage.value}`
})

onMounted(() => {
  store.loadPlugins()
  
  // 添加标题闪烁效果
  const originalTitle = document.title
  let flag = false
  setInterval(() => {
    if(flag) {
      document.title = "【新插件】" + originalTitle
    } else {
      document.title = '【_______】' + originalTitle
    }
    flag = !flag
  }, 500)
})
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.app-container {
  min-height: 100vh;
  background: var(--body-color, #f5f5f5);
  display: flex;
  flex-direction: column;
}

.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

@keyframes gridAppear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 28px;
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
  animation: gridAppear 0.3s ease-out;
  animation-delay: 0.7s;
  animation-fill-mode: backwards;
}

@media (max-width: 768px) {
  .app-container {
    padding: 0;
  }
  
  .plugins-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
}
</style>