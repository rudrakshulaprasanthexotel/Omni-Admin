import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AmeyoLogger from '@/services/ameyoLogger/logger';

const logger = AmeyoLogger.get('ApiClient');

const TOKEN_STORAGE_KEY = 'access_token';

function getStoredToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
	localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
	localStorage.removeItem(TOKEN_STORAGE_KEY);
}

const axiosInstance: AxiosInstance = axios.create({
	timeout: 30_000,
	headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

axiosInstance.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = getStoredToken();
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		logger.debug('Request:', config.method?.toUpperCase(), config.url);
		return config;
	},
	(error) => {
		logger.error('Request interceptor error:', error);
		return Promise.reject(error);
	},
);

axiosInstance.interceptors.response.use(
	(response: AxiosResponse) => response,
	(error) => {
		if (error.response?.status === 401) {
			logger.warn('Unauthorized — clearing token');
			clearStoredToken();
		}
		logger.error(
			'Response error:',
			error.response?.status,
			error.response?.data?.message || error.message,
		);
		return Promise.reject(error);
	},
);


export { axiosInstance };
