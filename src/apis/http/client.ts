import axios from 'axios'
import axiosRetry from 'axios-retry'
import { applyInterceptors } from '@/apis/http/interceptors'
import { config } from '@/core/constants/config'

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
})

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    if (error.code === 'ERR_CANCELED') return false
    return error.response?.status === 429 || (error.response?.status ?? 0) >= 500
  },
})

applyInterceptors(apiClient)
