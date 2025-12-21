import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：如果是 FormData，删除 Content-Type 让浏览器自动设置（包含 boundary）
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    // 提供更详细的错误信息
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      error.message = '无法连接到服务器，请确认后端服务是否运行在 ' + API_BASE_URL;
    } else if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      if (status === 404) {
        error.message = '请求的资源不存在 (404)';
      } else if (status === 500) {
        error.message = '服务器内部错误 (500)';
      } else if (status === 413) {
        error.message = '文件太大，请选择较小的图片';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

