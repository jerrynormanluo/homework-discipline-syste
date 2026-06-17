// API 配置
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

const WS_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://your-production-api.com';

export { API_BASE_URL, WS_URL };
