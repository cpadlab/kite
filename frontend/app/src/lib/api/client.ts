import axios, {
    AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios'

/**
 * Encapsulated In-Memory Token Storage.
 * Keeps tokens in memory to insulate against XSS token harvesting.
 */
let inMemoryAccessToken: string | null = null
let csrfToken: string | null = null

/**
 * Cryptographic random nonce generator for request anti-replay protection.
 */
function generateCryptoNonce(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const array = new Uint8Array(16)
        window.crypto.getRandomValues(array)
        return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
    }
    return Math.random().toString(36).substring(2, 15)
}

/**
 * Set the active in-memory JWT access token.
 */
export function setAccessToken(token: string | null): void {
    inMemoryAccessToken = token
}

/**
 * Retrieve the active in-memory JWT access token.
 */
export function getAccessToken(): string | null {
    return inMemoryAccessToken
}

/**
 * Set the anti-CSRF double-submit token.
 */
export function setCsrfToken(token: string | null): void {
    csrfToken = token
}

/**
 * Clear all authentication session state safely from memory.
 */
export function clearSession(): void {
    inMemoryAccessToken = null
    csrfToken = null
}

/**
 * Standardized API Error Payload.
 */
export interface ApiError {
    statusCode: number
    message: string
    code?: string
    details?: unknown
}

/**
 * Hyper-Secured Axios Client Instance.
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: (import.meta.env.VITE_API_URL as string) || '/api/v1',
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Kite-Client-App': 'kite-web-platform-v1',
    },
})

/**
 * Security Request Interceptor:
 * Injects Authorization headers, anti-CSRF tokens, nonces, and client origin verification headers.
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Inject Bearer Authorization header if token exists in memory
        if (inMemoryAccessToken) {
            config.headers.Authorization = `Bearer ${inMemoryAccessToken}`
        }

        // Inject Anti-CSRF Token if set
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken
        }

        // Anti-Replay & Client Verification Security Headers
        config.headers['X-Kite-Client-Time'] = Date.now().toString()
        config.headers['X-Kite-Request-Nonce'] = generateCryptoNonce()

        return config
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

/**
 * Security Response Interceptor:
 * Sanitizes errors, enforces session invalidation on HTTP 401, handles account locks, and standardizes error responses.
 */
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Extract CSRF token from response headers if provided by server
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

        // Session Expiration Handling
        if (statusCode === 401) {
            clearSession()
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                // Dispatch custom event for reactive UI login redirect
                window.dispatchEvent(new CustomEvent('kite:session-expired'))
            }
        }

        // Account Lockout Handling
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

/**
 * Generic Type-Safe API Request Wrappers.
 */
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
