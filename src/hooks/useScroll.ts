import type { Ref } from 'vue'
import { nextTick, ref, onMounted, onUnmounted } from 'vue'

type ScrollElement = HTMLDivElement | null

interface ScrollReturn {
  scrollRef: Ref<ScrollElement>
  scrollToBottom: () => Promise<void>
  scrollToTop: () => Promise<void>
  scrollToBottomIfAtBottom: () => Promise<void>
  isUserAtBottom: Ref<boolean>
  showScrollButton: Ref<boolean>
}

export function useScroll(options: {
  threshold?: number // 接近底部的阈值
  buttonOffset?: number // 按钮显示的滚动距离阈值
  buttonBottom?: number // 按钮底部偏移量
} = {}): ScrollReturn {
  const { 
    threshold = 100, 
    buttonOffset = 200, 
    buttonBottom = 100 
  } = options
  
  const scrollRef = ref<ScrollElement>(null)
  const isUserAtBottom = ref(true)
  const showScrollButton = ref(false)

const scrollToBottom = async () => {
  await nextTick()
  if (scrollRef.value) {
    scrollRef.value.scrollTo({
      top: scrollRef.value.scrollHeight,
      behavior: 'smooth' // 平滑滚动
    })
    isUserAtBottom.value = true
  }
}

  const scrollToTop = async () => {
    await nextTick()
    if (scrollRef.value) {
      scrollRef.value.scrollTop = 0
      isUserAtBottom.value = false
    }
  }

  const scrollToBottomIfAtBottom = async () => {
    await nextTick()
    if (scrollRef.value) {
      const distanceToBottom = scrollRef.value.scrollHeight - scrollRef.value.scrollTop - scrollRef.value.clientHeight
      if (distanceToBottom <= threshold) {
        scrollRef.value.scrollTop = scrollRef.value.scrollHeight
        isUserAtBottom.value = true
      }
    }
  }

  const handleScroll = () => {
    if (!scrollRef.value) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.value
    
    // 更新是否在底部状态
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    isUserAtBottom.value = distanceToBottom <= threshold
    
    // 更新是否显示回到底部按钮
    // showScrollButton.value = scrollTop > buttonOffset && !isUserAtBottom.value
    showScrollButton.value = !isUserAtBottom.value

  }

  onMounted(() => {
    if (scrollRef.value) {
      scrollRef.value.addEventListener('scroll', handleScroll)
      
      // 初始检查
      handleScroll()
    }
  })

  onUnmounted(() => {
    if (scrollRef.value) {
      scrollRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  // 添加样式计算
  const scrollButtonStyle = computed(() => ({
    position: 'fixed',
    bottom: `${buttonBottom}px`,
    right: '30px',
    display: showScrollButton.value ? 'flex' : 'none'
  }))

  return {
    scrollRef,
    scrollToBottom,
    scrollToTop,
    scrollToBottomIfAtBottom,
    isUserAtBottom,
    showScrollButton
  }
}
