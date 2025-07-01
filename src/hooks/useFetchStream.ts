import { ElMessage } from 'element-plus';
import { onUnmounted, ref } from 'vue';
import router from '@/routers';
import { useUserStore } from '@/stores';
import { useThrottleFn } from '@vueuse/core';

const userStore = useUserStore();

interface UseFetchStreamOptions {
  url: string;
  onError?: (err: any) => void;
  onMessage?: (chunk: any) => void;
}

interface UseFetchStreamReturn {
  loading: ReturnType<typeof ref<boolean>>;
  stream: (data: any) => AsyncGenerator<any, void, unknown>;
  cancel: () => void;
}

// 通用响应码处理逻辑（保持不变）
export function handleResponseCode(res: any): never {
  if (res.code === 403) {
    router.replace({ name: '403' });
    ElMessage.error(res.msg || '没有权限');
  }
  else if (res.code === 401) {
    userStore.logout();
    userStore.openLoginDialog();
  }
  else {
    ElMessage.error(res.msg || '请求出错');
  }
  throw res;
}

export function useFetchStream(options: UseFetchStreamOptions): UseFetchStreamReturn {
  const loading = ref(false);
  let controller: AbortController | null = null;

  // 缓存消息数组
  const messageBuffer: any[] = [];

  // 定时器ID（超时）
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // JSON解析错误日志采样
  let lastWarnTime = 0;

  // 用vueuse的节流函数，每50ms批量触发onMessage
  const flushBuffer = useThrottleFn(() => {
    if (messageBuffer.length > 0) {
      options.onMessage?.([...messageBuffer]);
      messageBuffer.length = 0;
    }
  }, 50);

  async function* stream(data: any): AsyncGenerator<any, void, unknown> {
    loading.value = true;
    controller = new AbortController();

    // 60秒超时取消请求
    timeoutId = setTimeout(() => {
      controller?.abort();
    }, 60_000);

    try {
      const response = await fetch(options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {}),
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed?.code !== 200) {
            handleResponseCode(parsed);
          }
          throw new Error(parsed?.msg || '非流格式响应');
        }
        catch {
          throw new Error(`服务器返回非流数据：${text}`);
        }
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('响应体不可读取');
      }

      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const jsonStr = line.replace(/^data:\s*/, '').trim();
              if (jsonStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(jsonStr);
                // 改为先缓存，等待节流函数统一处理
                messageBuffer.push(parsed);
                flushBuffer();
                yield parsed;
              }
              catch (e) {
                // 限制warn日志频率：5秒最多一次
                const now = Date.now();
                if (now - lastWarnTime > 5000) {
                  console.warn('JSON解析错误:', e, jsonStr);
                  lastWarnTime = now;
                }
              }
            }
          }
        }
      }
    }
    catch (err: any) {
      options.onError?.(err);
      throw err;
    }
    finally {
      loading.value = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  }

  function cancel() {
    controller?.abort();
    controller = null;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  onUnmounted(() => {
    cancel();
  });

  return { loading, stream, cancel };
}
