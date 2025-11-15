<template>
  <n-card 
    class="plugin-card" 
    :bordered="false" 
    :style="{ borderRadius: '16px', '--card-index': String(index) }" 
    :content-style="{ padding: '8px 16px' }"
    @click="showDetails"
    role="article"
    :aria-label="`插件: ${plugin.name}`"
    aria-roledescription="插件卡片"
    :aria-expanded="showPluginDetails"
    tabindex="0"
    ref="cardRef"
  >
    <template #header>
      <div 
        class="card-header" 
        role="banner" 
        aria-labelledby="plugin-header-content"
      >
        <div 
          id="plugin-header-content"
          class="plugin-name-container" 
          ref="nameContainer" 
          role="heading" 
          aria-level="2"
          aria-label="插件卡片标题区域"
        >
          <h3 
            class="plugin-name" 
            :class="{ 'marquee': isTextOverflow }"
            ref="pluginNameEl"
            role="heading"
            aria-level="3"
            :aria-label="plugin.name"
            :aria-description="`插件：${plugin.name}，版本 ${plugin.version}`"
          >
            <span 
              class="plugin-name-text" 
              ref="nameTextEl"
              :aria-hidden="isTextOverflow"
            >{{ plugin.name }}</span>
          </h3>
        </div>
        <n-tag 
          type="success" 
          size="small" 
          :bordered="false" 
          class="version-tag"
          role="text"
          :aria-label="`版本号：${plugin.version.startsWith('v') ? plugin.version : 'v' + plugin.version}`"
        >
          {{ plugin.version.startsWith('v') ? plugin.version : 'v' + plugin.version }}
        </n-tag>
      </div>
    </template>
    
    <div class="card-content-wrapper">
      <!-- Logo 显示区域 -->
      <div class="plugin-logo-container">
        <img 
          :src="getLogoUrl()" 
          :alt="`${plugin.name} logo`"
          class="plugin-logo"
          @error="handleLogoError"
        />
      </div>
      
      <div class="card-main-content">
        <n-space vertical class="card-content">
          <p class="description" role="contentinfo" aria-label="插件描述">{{ plugin.desc }}</p>
          <div 
            class="tags-container" 
            role="region" 
            aria-label="插件标签区域"
          >
            <n-space class="tags-space" role="list" aria-label="标签列表">
              <n-tag
                v-for="tag in plugin.tags"
                :key="tag"
                size="small"
                :bordered="false"
                type="info"
                class="plugin-tag"
                role="listitem"
                :aria-label="`标签：${tag}`"
              >
                {{ tag }}
              </n-tag>
            </n-space>
          </div>
          <div class="plugin-meta" role="group" aria-label="插件元数据">
            <span class="author" role="text" :aria-label="`作者: ${plugin.author}`">作者: {{ plugin.author }}</span>
            <n-space align="center" class="stars" role="group" aria-label="星标数">
              <n-icon aria-hidden="true"><star-sharp /></n-icon>
              <span role="text">{{ plugin.stars }}</span>
            </n-space>
          </div>
          <!-- 优化后的按钮区域 -->
          <div class="plugin-links" role="toolbar" aria-label="插件操作区">
            <div class="button-group" role="group" aria-label="插件链接操作">
              <n-button
                type="primary"
                secondary
                size="small"
                @click="(e) => openUrl(plugin.repo, e)"
                class="main-button"
                role="link"
                :aria-label="`查看 ${plugin.name} 的仓库`"
                aria-haspopup="true"
                aria-expanded="false"
              >
                查看仓库
              </n-button>
              <div class="icon-buttons" role="group" aria-label="快捷操作按钮组">
                <n-tooltip placement="top" trigger="hover">
                  <template #trigger>
                    <n-button
                      secondary
                      size="small"
                      circle
                      @click="copyRepoUrl"
                      role="button"
                      :aria-label="`复制 ${plugin.name} 的仓库链接`"
                      :aria-pressed="isCopied"
                      aria-live="polite"
                    >
                      <n-icon size="18" aria-hidden="true">
                        <template v-if="isCopied">
                          <checkmark-outline />
                        </template>
                        <template v-else>
                          <link-outline />
                        </template>
                      </n-icon>
                    </n-button>
                  </template>
                  <span role="tooltip">{{ isCopied ? '已复制链接！' : '复制仓库链接' }}</span>
                </n-tooltip>
                <n-tooltip v-if="plugin.social_link" placement="top" trigger="hover">
                  <template #trigger>
                    <n-button
                      secondary
                      size="small"
                      circle
                      @click="(e) => openUrl(plugin.social_link, e)"
                      role="link"
                      :aria-label="`访问${plugin.author}的主页`"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <n-icon size="18" aria-hidden="true">
                        <person-outline />
                      </n-icon>
                    </n-button>
                  </template>
                  <span role="tooltip">访问作者主页</span>
                </n-tooltip>
              </div>
            </div>
          </div>
        </n-space>
      </div>
    </div>
  </n-card>

  <!-- 插件详情模态框 -->
  <plugin-details
    v-model:show="showPluginDetails"
    :plugin="plugin"
  />
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch } from 'vue'
import {
  NCard,
  NSpace,
  NTag,
  NButton,
  NIcon,
  useMessage,
  NTooltip
} from 'naive-ui'
import { StarSharp, LinkOutline, PersonOutline, CheckmarkOutline } from '@vicons/ionicons5'
import { defineAsyncComponent } from 'vue'
const PluginDetails = defineAsyncComponent(() => import('./PluginDetails.vue'))

const showPluginDetails = ref(false)
const props = defineProps({
  plugin: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  },
  seed: {
    type: [Number, String],
    default: 0
  }
})

const isTextOverflow = ref(false)
const nameContainer = ref(null)
const nameTextEl = ref(null)
const pluginNameEl = ref(null)
const cardRef = ref(null)
const resizeObserver = ref(null)

const checkTextOverflow = () => {
  nextTick(() => {
    if (nameContainer.value && nameTextEl.value) {
      const containerWidth = nameContainer.value.clientWidth
      const textWidth = nameTextEl.value.scrollWidth
      const wasOverflow = isTextOverflow.value
      
      isTextOverflow.value = textWidth > containerWidth

      if (isTextOverflow.value && (wasOverflow !== isTextOverflow.value)) {
        updateMarqueeAnimation(containerWidth, textWidth)
      }
    }
  })
}

const updateMarqueeAnimation = (containerWidth, textWidth) => {
  if (pluginNameEl.value) {
    const translateDistance = textWidth - containerWidth + 20
    pluginNameEl.value.style.setProperty('--translate-distance', `-${translateDistance}px`)
  }
}

function replayCardAppearAnimation() {
  const el = cardRef.value && (cardRef.value.$el || cardRef.value)
  if (!el) return
  el.style.animation = 'none'
  void el.offsetWidth
  el.style.animation = ''
}

onMounted(() => {
  checkTextOverflow()
  if (nameContainer.value && window.ResizeObserver) {
    resizeObserver.value = new ResizeObserver(() => {
      checkTextOverflow()
    })
    resizeObserver.value.observe(nameContainer.value)
  } else {
    window.addEventListener('resize', checkTextOverflow)
  }
})

watch([
  () => props.index,
  () => props.seed
], () => {
  replayCardAppearAnimation()
}, { immediate: true })

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  } else {
    window.removeEventListener('resize', checkTextOverflow)
  }
})

const message = useMessage()
const isCopied = ref(false)

const copyRepoUrl = async (e) => {
  e.stopPropagation()
  if (props.plugin.repo) {
    try {
      await navigator.clipboard.writeText(props.plugin.repo)
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000) 
    } catch (err) {
      message.error('复制失败，请手动复制')
    }
  }
}

const openUrl = (url, e) => {
  e?.stopPropagation() 
  if (url) {
    window.open(url, '_blank')
  }
}

const showDetails = () => {
  showPluginDetails.value = true
}

// 获取logo URL的逻辑
const getLogoUrl = () => {
  // 如果插件有logo字段，直接使用
  if (props.plugin.logo) {
    return props.plugin.logo
  }
  
  // 如果没有logo但有repo，尝试从GitHub仓库获取logo
  if (props.plugin.repo) {
    const githubRepoPattern = /github\.com\/([^\/]+)\/([^\/]+)/
    const match = props.plugin.repo.match(githubRepoPattern)
    
    if (match) {
      const [, owner, repo] = match
      return `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/master/logo.png`
    }
  }
  
  // 默认返回占位符logo
  return '/plugin_default.png'
}

// 处理logo加载错误
const handleLogoError = (event) => {
  // 如果logo加载失败，使用默认logo
  event.target.src = '/plugin_default.png'
}
</script>

<style scoped>
@keyframes cardAppear {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.plugin-card {
  position: relative;
  overflow: visible;
  contain: content;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  border: 2px solid var(--border-base);
  box-shadow: var(--shadow-sm);
  background-color: var(--bg-card);
  min-height: 180px;
  max-height: max-content;
  display: flex;
  flex-direction: column;
  min-width: 100%;
  animation: cardAppear 0.5s cubic-bezier(0.23, 1, 0.32, 1) backwards;
  animation-delay: calc(0.4s + (var(--card-index, 0) * 0.08s));
  border-radius: 4px;
}

.plugin-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-color);
  box-shadow: 0 0 15px rgba(255, 153, 0, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 2px solid var(--primary-color);
  background: linear-gradient(90deg, var(--bg-card) 0%, rgba(255, 153, 0, 0.1) 100%);
  border-radius: 4px 4px 0 0;
  min-height: 44px;
}

:deep(.n-card__header) {
  margin-bottom: 0 !important;
  padding-bottom: 6px !important;
}

:deep(.n-card-header) {
  margin-bottom: 0 !important;
  padding-bottom: 6px !important;
}

.plugin-name-container {
  max-width: 75%;
  overflow: hidden;
  position: relative;
}

.plugin-name-container:has(.plugin-name.marquee) {
  mask: linear-gradient(to right, 
    transparent 0%, 
    black 10px, 
    black calc(100% - 10px), 
    transparent 100%);
  -webkit-mask: linear-gradient(to right, 
    transparent 0%, 
    black 10px, 
    black calc(100% - 10px), 
    transparent 100%);
}

.card-header h3 {
  margin: 0;
  font-size: 1.25em;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: -0.3px;
  font-family: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  white-space: nowrap;
  --translate-distance: 0px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.plugin-name-text {
  display: inline-block;
  transition: transform 0.3s ease;
}

.plugin-name.marquee .plugin-name-text {
  animation: marqueeSlide 6s ease-in-out infinite;
}

.plugin-name.marquee:hover .plugin-name-text {
  animation-play-state: paused;
}

@keyframes marqueeSlide {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(var(--translate-distance));
  }
  70% {
    transform: translateX(var(--translate-distance));
  }
  100% {
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .plugin-name-container {
    max-width: 70%;
  }
  
  @keyframes marqueeSlide {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(var(--translate-distance));
    }
    75% {
      transform: translateX(var(--translate-distance));
    }
    100% {
      transform: translateX(0);
    }
  }
}

@media (max-width: 480px) {
  .plugin-name-container {
    max-width: 65%;
  }
  
  .card-header h3 {
    font-size: 1.1em;
  }
}

.version-tag {
  background-color: var(--primary-color) !important;
  color: #000000 !important;
  border: none !important;
  padding: 2px 10px !important;
  font-weight: 700;
  flex-shrink: 0;
  border-radius: 3px;
}

.card-content-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.plugin-logo-container {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: rgba(255, 153, 0, 0.1);
  border: 1px solid var(--primary-color);
  overflow: hidden;
}

.plugin-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.card-main-content {
  flex: 1;
  min-width: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 120px;
}

.description {
  margin: 4px 0;
  line-height: 1.5;
  font-size: 0.9em;
  height: 3em; 
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  text-overflow: ellipsis;
  color: var(--text-secondary);
}

.tags-container {
  margin: 2px 0;
  min-height: 24px;
  display: flex;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.tags-container::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  width: 28px;
  height: 100%;
  background: linear-gradient(to right, rgba(0,0,0,0), var(--bg-card));
  pointer-events: none;
}

.tags-space {
  width: 100%;
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
}

.plugin-tag {
  transition: all 0.2s ease;
  margin-bottom: 2px;
  background-color: rgba(255, 153, 0, 0.2) !important;
  color: var(--primary-color) !important;
  border: 1px solid var(--primary-color) !important;
  padding: 2px 8px !important;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  border-radius: 3px;
  font-weight: 600;
}

.plugin-tag:hover {
  transform: scale(1.05);
  background-color: rgba(255, 153, 0, 0.4) !important;
  box-shadow: 0 0 8px rgba(255, 153, 0, 0.3);
}

.plugin-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85em;
  padding: 4px 0;
  margin: 0px 0;
  border-top: 1px solid var(--border-base);
  color: var(--text-secondary);
  min-height: 28px;
}

.author {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--primary-color);
}

.stars {
  color: var(--primary-color);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.plugin-links {
  margin-top: 2px;
  min-height: 28px;
  display: flex;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.button-group :deep(.main-button) {
  border-radius: 4px;
  height: 28px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color) !important;
  border: 1px solid var(--primary-color) !important;
  color: #000000 !important;
  font-weight: 700;
}

.button-group :deep(.main-button:hover) {
  background-color: var(--primary-hover) !important;
  box-shadow: 0 0 10px rgba(255, 153, 0, 0.5);
}

.icon-buttons :deep(.n-button) {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background-color: rgba(255, 153, 0, 0.1);
  border: 1px solid var(--primary-color);
  transition: all 0.2s ease;
  border-radius: 4px;
}

.icon-buttons :deep(.n-button:hover) {
  color: #000000;
  border-color: var(--primary-color);
  background-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 0 8px rgba(255, 153, 0, 0.4);
}

@media (max-width: 480px) {
  .button-group :deep(.n-button) {
    font-size: 0.9em;
    height: 28px;
  }
  
  .button-group :deep(.main-button) {
    padding: 0 12px;
  }
  
  .icon-buttons :deep(.n-button) {
    width: 28px;
    height: 28px;
  }
  
  .icon-buttons :deep(.n-button .n-icon) {
    font-size: 16px;
  }
  
  .plugin-logo-container {
    width: 50px;
    height: 50px;
  }
}

:deep(.n-card) {
  height: 100%;
}

:deep(.n-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tags-container:empty::before {
  content: '';
  display: block;
  height: 28px;
}

.plugin-name-text {
  will-change: transform;
}

.plugin-name.marquee .plugin-name-text {
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>