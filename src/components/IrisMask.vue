<template>
  <div class="iris-mask" :class="{ 'is-active': isActive }" ref="irisMask">
    <div class="iris-content"></div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }
})

const irisMask = ref(null)

// 监听激活状态和位置变化
watch([() => props.isActive, () => props.position], ([active, position]) => {
  if (irisMask.value && active) {
    // 设置虹膜遮罩的起始位置
    irisMask.value.style.setProperty('--iris-x', `${position.x}px`)
    irisMask.value.style.setProperty('--iris-y', `${position.y}px`)
  }
}, { immediate: true })
</script>

<style scoped>
.iris-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
}

.iris-mask.is-active {
  opacity: 1;
  visibility: visible;
  animation: irisAnimation 1.2s ease-in-out forwards;
}

.iris-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    #000000,
    #000000 10px,
    #ff9900 10px,
    #ff9900 20px
  );
  transform-origin: var(--iris-x, 50%) var(--iris-y, 50%);
}

@keyframes irisAnimation {
  0% {
    clip-path: circle(0% at var(--iris-x, 50%) var(--iris-y, 50%));
  }
  41.67% {
    clip-path: circle(150% at var(--iris-x, 50%) var(--iris-y, 50%));
  }
  66.67% {
    clip-path: circle(150% at var(--iris-x, 50%) var(--iris-y, 50%));
  }
  100% {
    clip-path: circle(0% at var(--iris-x, 50%) var(--iris-y, 50%));
    opacity: 0;
    visibility: hidden;
  }
}

/* 深色主题适配 */
:global(.dark) .iris-content {
  background: repeating-linear-gradient(
    45deg,
    #000000,
    #000000 10px,
    #ff9900 10px,
    #ff9900 20px
  );
}
</style>