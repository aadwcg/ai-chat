// utils/request.ts
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/routers';
import { useUserStore } from '@/stores';

const userStore = useUserStore();

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_WEB_BASE_API,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

request.interceptors.request.use(
  (config) => {
    const token = userStore.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

request.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    const res = response.data;
    if (res.code === 200)
      return res;
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
    return Promise.reject(res);
  },
  (error: AxiosError) => {
    ElMessage.error(error.message || '网络错误');
    return Promise.reject(error);
  },
);

export default request;

// export const get = <T = any>(url: string, config?: AxiosRequestConfig) => request.get<any, T>(url, config);
export const get = <T = any>(url: string, params?: any, config?: AxiosRequestConfig) =>
  request.get<any, T>(url, { ...config, params });
export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => request.post<any, T>(url, data, config);
export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => request.put<any, T>(url, data, config);
export const del = <T = any>(url: string, config?: AxiosRequestConfig) => request.delete<any, T>(url, config);
