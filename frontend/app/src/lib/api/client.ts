import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

let inMemoryAccessToken: string | null = null
let csrfToken: string | null = null

function generateCryptoNonce(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const array = new Uint8Array(16)
        window.crypto.getRandomValues(array)
        return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
    }
    return Math.random().toString(36).substring(2, 15)
}

export function setAccessToken(token: string | null): void {
    inMemoryAccessToken = token
}

export function getAccessToken(): string | null {
    return inMemoryAccessToken
}

export function setCsrfToken(token: string | null): void {
    csrfToken = token
}

export function clearSession(): void {
    inMemoryAccessToken = null
    csrfToken = null
}

export interface ApiError {
    statusCode: number
    message: string
    code?: string
    details?: unknown
}

const getBaseURL = (): string => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined
    if (envUrl) {
        return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`
    }
    return 'http://localhost:8000/api/v1'
}

export const apiClient: AxiosInstance = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Kite-Client-App': 'kite-web-platform-v1',
    },
})

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {

        if (inMemoryAccessToken) {
            config.headers.Authorization = `Bearer ${inMemoryAccessToken}`
        }

        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken
        }

        config.headers['X-Kite-Client-Time'] = Date.now().toString()
        config.headers['X-Kite-Request-Nonce'] = generateCryptoNonce()

        return config
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        const newCsrfToken = response.headers['x-csrf-token'] as string | undefined
        if (newCsrfToken) {
            setCsrfToken(newCsrfToken)
        }
        return response
    },
    (error: AxiosError<{ detail?: string | { message?: string }; message?: string }>) => {
        const statusCode = error.response?.status || 500
        let errorMessage = 'An unexpected network error occurred. Please try again.'

        if (error.response?.data) {
            const data = error.response.data
            if (typeof data.detail === 'string') {
                errorMessage = data.detail
            } else if (data.detail && typeof data.detail.message === 'string') {
                errorMessage = data.detail.message
            } else if (typeof data.message === 'string') {
                errorMessage = data.message
            }
        }

        if (statusCode === 401) {
            clearSession()
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.dispatchEvent(new CustomEvent('kite:session-expired'))
            }
        }

        if (statusCode === 423) {
            errorMessage = errorMessage || 'Account locked due to excessive failed attempts. Please try again later.'
        }

        const apiError: ApiError = {
            statusCode,
            message: errorMessage,
            code: error.code,
        }

        return Promise.reject(apiError)
    }
)

export const api = {
    get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
        apiClient.get<T>(url, config).then((res) => res.data),

    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
        apiClient.post<T>(url, data, config).then((res) => res.data),

    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
        apiClient.put<T>(url, data, config).then((res) => res.data),

    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
        apiClient.patch<T>(url, data, config).then((res) => res.data),

    delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
        apiClient.delete<T>(url, config).then((res) => res.data),
}
