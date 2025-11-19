<template>
  <footer class="pagination-wrapper" v-if="totalPages > 1">
    <div class="pagination-container">
      <n-pagination
        :page="modelValue"
        :page-count="totalPages"
        @update:page="handlePageChange"
        :size="size"
        :show-size-picker="false"
        :show-quick-jumper="showQuickJumper"
        :page-slot="pageSlot"
        aria-label="页面导航"
        ref="paginationRef"
      >
        <template #goto>
          <label 
            id="pagination-goto-label" 
            class="sr-only" 
            :for="quickJumperId"
          >跳转到</label>
        </template>
        <template #goto-icon>
          <span class="sr-only">确认跳转</span>
        </template>
      </n-pagination>
    </div>
  </footer>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { NPagination } from 'naive-ui'

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    default: 'medium'
  }
})

const paginationRef = ref(null)
const quickJumperId = ref('pagination-quick-jumper-' + Math.random().toString(36).substr(2, 9))

onMounted(() => {
  nextTick(() => {
    const input = paginationRef.value?.$el?.querySelector('.n-pagination-quick-jumper input')
    if (input) {
      input.setAttribute('id', quickJumperId.value)
      input.setAttribute('aria-labelledby', 'pagination-goto-label')
      input.setAttribute('role', 'spinbutton')
      input.setAttribute('aria-valuemin', '1')
      input.setAttribute('aria-valuemax', props.totalPages.toString())
      input.setAttribute('aria-valuenow', props.modelValue.toString())
    }
  })
})

const emit = defineEmits(['update:modelValue'])
const screenWidth = ref(window.innerWidth)

const showQuickJumper = computed(() => {
  return screenWidth.value > 768 && props.totalPages > 10
})

const pageSlot = computed(() => {
  if (screenWidth.value <= 480) {
    return 3 
  } else if (screenWidth.value <= 768) {
    return 5 
  } else {
    return 7 
  }
})

const handlePageChange = (page) => {
  emit('update:modelValue', page)
}

const handleResize = () => {
  screenWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
@keyframes pagination-fade-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin: 2rem auto;
  padding: 0;
  position: relative;
  animation: pagination-fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 12px 20px;
  position: relative;
  z-index: 1;
  border-radius: 50px;
  background: var(--pagination-bg, rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(10px);
  width: fit-content;
  box-shadow: var(--shadow-sm);
  will-change: transform, opacity;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: var(--pagination-bg-hover, rgba(255, 255, 255, 0.08));
    transform: translateY(-2px);
  }
}

:deep(.n-pagination) {
  gap: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
  
  &:hover .n-pagination-item:not(:hover):not(.n-pagination-item--active) {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

:deep(.n-pagination .n-pagination-item) {
  color: var(--pagination-text, #ffffff) !important;
  background: var(--pagination-item-bg, rgba(255, 255, 255, 0.08)) !important;
  border: none !important;
  backdrop-filter: blur(8px);
  min-width: 32px;
  height: 32px;
  border-radius: 6px;
  font-weight: 500;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: transform, background-color, color;
  transform-origin: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

@keyframes page-num-scale {
  0% { transform: scale(0.9); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

:deep(.n-pagination .n-pagination-item--clickable:hover) {
  color: var(--primary-color) !important;
  background-color: var(--primary-light) !important;
  border-color: var(--primary-color) !important;
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

:deep(.n-pagination .n-pagination-item--active) {
  color: white !important;
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  font-weight: 700 !important;
  box-shadow: 0 2px 12px rgba(96, 165, 250, 0.3);
  animation: page-num-scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

:deep(.n-pagination .n-pagination-prefix),
:deep(.n-pagination .n-pagination-suffix) {
  color: var(--text-secondary) !important;
  margin: 0 8px;
  font-size: 14px;
}

:deep(.n-pagination .n-pagination-quick-jumper) {
  margin-left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.n-pagination .n-pagination-quick-jumper .n-input) {
  width: 60px !important;
}

:deep(.n-pagination .n-pagination-quick-jumper .n-input .n-input__input-el) {
  text-align: center;
  font-size: 13px !important;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ===== 响应式 ===== */

/* 平板设备 (768px - 1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  .pagination-wrapper {
    margin: 1.5rem 0;
    padding: 0.75rem 0;
  }
  
  :deep(.n-pagination) {
    --n-item-size: 30px;
    --n-item-font-size: 13px;
    --n-item-padding: 0 12px;
  }
  
  :deep(.n-pagination .n-pagination-item) {
    min-width: 30px;
    height: 30px;
  }
}

/* 手机设备 (最大 768px) */
@media (max-width: 768px) {
  .pagination-wrapper {
    margin: 1.25rem 0;
    padding: 0.5rem 12px;
    background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
    border-radius: 12px;
  }
  
  :deep(.n-pagination) {
    --n-item-size: 36px;
    --n-item-font-size: 14px;
    --n-item-padding: 0 10px;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  :deep(.n-pagination .n-pagination-item) {
    min-width: 36px;
    height: 36px;
    min-height: 36px;
    border-radius: 8px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
  
  :deep(.n-pagination .n-pagination-item--button) {
    padding: 0 8px !important;
    font-weight: 600;
  }

  :deep(.n-pagination .n-pagination-item--disabled) {
    background-color: transparent !important;
    border-color: transparent !important;
    color: var(--text-tertiary) !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  }

  :deep(.n-pagination .n-pagination-quick-jumper) {
    display: none;
  }

  :deep(.n-pagination .n-pagination-prefix),
  :deep(.n-pagination .n-pagination-suffix) {
    font-size: 12px;
    margin: 0 4px;
    order: 10; 
    width: 100%;
    text-align: center;
    margin-top: 8px;
    opacity: 0.8;
  }
}

/* 小屏手机设备 (最大 480px) */
@media (max-width: 480px) {
  .pagination-wrapper {
    margin: 1rem 0;
    padding: 0.5rem 8px;
  }
  
  :deep(.n-pagination) {
    --n-item-size: 34px;
    --n-item-font-size: 13px;
    gap: 4px;
  }
  
  :deep(.n-pagination .n-pagination-item) {
    min-width: 34px;
    height: 34px;
    min-height: 34px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }

  :deep(.n-pagination .n-pagination-prefix),
  :deep(.n-pagination .n-pagination-suffix) {
    display: none; 
  }

  :deep(.n-pagination .n-pagination-item--button:first-child) {
    margin-right: 8px;
  }
  
  :deep(.n-pagination .n-pagination-item--button:last-child) {
    margin-left: 8px;
  }
}

  /* 超小屏幕设备 (最大 360px) */
@media (max-width: 360px) {
  .pagination-wrapper {
    margin: 0.75rem 0;
    padding: 0.5rem 4px;
  }
  
  :deep(.n-pagination) {
    --n-item-size: 28px;
    --n-item-font-size: 11px;
    gap: 2px;
    flex-wrap: nowrap;
  }
  
  :deep(.n-pagination .n-pagination-item) {
    min-width: 28px;
    height: 28px;
    min-height: 28px;
    padding: 0 4px !important;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }

  :deep(.n-pagination .n-pagination-item--button) {
    padding: 0 4px !important;
  }

  :deep(.n-pagination .n-pagination-item--disabled) {
    min-width: 20px;
    padding: 0 2px !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .pagination-wrapper {
    margin: 0.5rem 0;
    padding: 0.25rem 0;
  }
  
  :deep(.n-pagination) {
    --n-item-size: 28px;
    --n-item-font-size: 12px;
  }
  
  :deep(.n-pagination .n-pagination-item) {
    min-width: 28px;
    height: 28px;
  }
}

@media (hover: none) and (pointer: coarse) {
  :deep(.n-pagination .n-pagination-item) {
    min-width: 40px;
    min-height: 40px;
  }
  
  :deep(.n-pagination .n-pagination-item--clickable:hover) {
    transform: none;
    box-shadow: none;
  }
  
  :deep(.n-pagination .n-pagination-item--clickable:active) {
    transform: scale(0.95);
    background-color: var(--primary-light) !important;
  }
}

/* 高分辨率屏幕 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  :deep(.n-pagination .n-pagination-item) {
    border-width: 0.5px;
  }
  
  :deep(.n-pagination .n-pagination-item--active) {
    box-shadow: 0 1px 6px rgba(96, 165, 250, 0.4);
  }
}

/* 无障碍 */
@media (prefers-reduced-motion: reduce) {
  :deep(.n-pagination .n-pagination-item) {
    transition: none !important;
  }
  
  :deep(.n-pagination .n-pagination-item--clickable:hover) {
    transform: none;
  }
}

@media (prefers-color-scheme: dark) {
  .pagination-wrapper {
    background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
  }
  
  :deep(.n-pagination .n-pagination-item--active) {
    box-shadow: 0 2px 12px rgba(96, 165, 250, 0.4);
  }
}
</style>