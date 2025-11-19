import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export const usePluginStore = defineStore('plugins', () => {
  const plugins = ref(null)
  const searchQuery = ref('')
  const selectedTag = ref(null)
  const currentPage = ref(1)
  const pageSize = ref(12)
  const isDarkMode = ref(true)
  const isLoading = ref(true)
  const sortBy = ref('default')
  const randomSeed = ref(0)
  
  // API相关状态
  const currentApiIndex = ref(0)
  
  // 虹膜遮罩相关状态
  const irisMaskActive = ref(false)
  const irisMaskPosition = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  
  // 从环境变量解析API端点
  const apiEndpoints = computed(() => {
    const endpointsStr = import.meta.env.VITE_API_ENDPOINTS
    
    if (!endpointsStr) {
      // 默认API端点
      return [
        { name: '官方API', url: 'https://api.soulter.top/astrbot/plugins' }
      ]
    }
    
    // 解析格式：名称:URL|名称:URL
    const endpoints = endpointsStr.split('|').map(item => {
      const colonIndex = item.indexOf(':')
      if (colonIndex === -1) {
        // 如果没有找到冒号，返回默认值
        return { name: item.trim(), url: '' }
      }
      const name = item.substring(0, colonIndex).trim()
      const url = item.substring(colonIndex + 1).trim()
      return { name, url }
    })
    return endpoints
  })
  
  const currentApi = computed(() => apiEndpoints.value[currentApiIndex.value])
  
  function switchApi(index) {
    const endpoints = apiEndpoints.value
    if (index >= 0 && index < endpoints.length) {
      currentApiIndex.value = index
      loadPlugins()
    }
  }
  
  function triggerIrisAnimation(position = null, callback = null) {
    // 设置虹膜遮罩位置，如果没有提供位置则使用屏幕中心
    if (position) {
      irisMaskPosition.value = position
    } else {
      irisMaskPosition.value = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    }
    
    // 激活虹膜遮罩
    irisMaskActive.value = true
    
    // 动画完成后执行回调
    setTimeout(() => {
      if (callback) callback()
      // 延迟关闭遮罩
      setTimeout(() => {
        irisMaskActive.value = false
      }, 400)
    }, 800)
  }
  

  watch(sortBy, (value) => {
    if (value === 'random') {
      randomSeed.value = Math.random()
    }
  })

  const toggleTheme = () => {
    // 主题切换已禁用，始终使用深色模式
    isDarkMode.value = true
  }

  function stableHash(input, seedNumber) {
    let h = (Math.floor(seedNumber * 1e9) ^ 5381) >>> 0
    for (let i = 0; i < input.length; i += 1) {
      h = (((h << 5) + h) + input.charCodeAt(i)) >>> 0 
    }
    return h >>> 0
  }

  const allTags = computed(() => {
    const tags = new Set()
    if (plugins.value) {
      plugins.value.forEach(plugin => {
        if (plugin.tags) {
          plugin.tags.forEach(tag => tags.add(tag))
        }
      })
    }
    return Array.from(tags).sort()
  })

  const tagOptions = computed(() => 
    allTags.value.map(tag => ({ label: tag, value: tag }))
  )

  const filteredPlugins = computed(() => {
    if (!plugins.value) return []
    
    let filtered = plugins.value.filter(plugin => {
      const searchValue = searchQuery.value ? searchQuery.value.toLowerCase() : ''
      if (!searchValue && !selectedTag.value) return true
      
      const matchesSearch = !searchValue || 
        (plugin.name && plugin.name.toLowerCase().includes(searchValue)) ||
        (plugin.display_name && plugin.display_name.toLowerCase().includes(searchValue)) ||
        (plugin.id && plugin.id.toLowerCase().includes(searchValue)) ||
        (plugin.desc && plugin.desc.toLowerCase().includes(searchValue)) ||
        (plugin.author && plugin.author.toLowerCase().includes(searchValue))
      
      const matchesTag = !selectedTag.value || 
        (Array.isArray(plugin.tags) && plugin.tags.includes(selectedTag.value))
      
      return matchesSearch && matchesTag
    })

    if (sortBy.value === 'stars') {
      filtered.sort((a, b) => (b.stars || 0) - (a.stars || 0))
    } else if (sortBy.value === 'updated') {
      filtered.sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0)
        const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0)
        return dateB - dateA
      })
    } else if (sortBy.value === 'random') {
      filtered.sort((a, b) => {
        const ha = stableHash(a.id || a.name || '', randomSeed.value)
        const hb = stableHash(b.id || b.name || '', randomSeed.value)
        return ha - hb
      })
    } else {
      filtered.sort((a, b) => {
        const indexA = plugins.value.findIndex(p => (p.id || p.name) === (a.id || a.name))
        const indexB = plugins.value.findIndex(p => (p.id || p.name) === (b.id || b.name))
        return indexA - indexB
      })
    }

    return filtered
  })

  const totalPages = computed(() => {
    if (sortBy.value === 'random') {
      return filteredPlugins.value.length > 0 ? 1 : 0
    }
    return Math.ceil(filteredPlugins.value.length / pageSize.value)
  })

  const paginatedPlugins = computed(() => {
    if (sortBy.value === 'random') {
      return filteredPlugins.value.slice(0, pageSize.value)
    }
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredPlugins.value.slice(start, end)
  })

  async function loadPlugins() {
    isLoading.value = true
    try {
      const response = await fetch(currentApi.value.url, { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // 处理不同API的数据格式
      let pluginData = []
      if (Array.isArray(data)) {
        // 社区API格式 (数组)
        pluginData = data.map((plugin, index) => {
          const tags = plugin.tags ?
            (Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags])
            : []
          const machineName = plugin.id || plugin.name || `plugin-${index}`
          const displayName = plugin.display_name || plugin.name || machineName

          return {
            ...plugin,
            id: machineName,
            name: displayName,
            display_name: displayName,
            tags
          }
        })
      } else {
        // 官方API格式 (对象)
        pluginData = Object.entries(data).map(([keyName, details]) => {
          const tags = details.tags ?
            (Array.isArray(details.tags) ? details.tags : [details.tags])
            : []
          const machineName = keyName
          const displayName = details.display_name || details.name || machineName

          return {
            ...details,
            id: machineName,
            name: displayName,
            display_name: displayName,
            tags
          }
        })
      }
      
      plugins.value = pluginData
    } catch (error) {
      console.error('Error loading plugins:', error)
      plugins.value = []
    } finally {
      isLoading.value = false
    }
  }

  function setDarkMode(value) {
    // 强制使用深色模式
    isDarkMode.value = true
  }

  function setSearchQuery(query) {
    searchQuery.value = query
  }

  function setSelectedTag(tag) {
    selectedTag.value = tag
  }

  function setCurrentPage(page) {
    currentPage.value = page
  }

  function setSortBy(value) {
    sortBy.value = value
    if (value === 'random') {
      randomSeed.value = Math.random()
    }
    currentPage.value = 1
  }

  function refreshRandomOrder() {
    if (sortBy.value === 'random') {
      randomSeed.value = Math.random()
    }
  }

  return {
    // 状态
    plugins,
    searchQuery,
    selectedTag,
    currentPage,
    isDarkMode,
    sortBy,
    isLoading,
    randomSeed,
    currentApiIndex,
    apiEndpoints,
    irisMaskActive,
    irisMaskPosition,
    // 计算属性
    allTags,
    tagOptions,
    filteredPlugins,
    totalPages,
    paginatedPlugins,
    currentApi,
    // 动作
    loadPlugins,
    setDarkMode,
    setSearchQuery,
    setSelectedTag,
    setCurrentPage,
    setSortBy,
    toggleTheme,
    refreshRandomOrder,
    switchApi,
    triggerIrisAnimation
  }
})
