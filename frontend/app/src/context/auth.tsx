import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { loginService, totpService } from '../lib/api/services/iam'
import { setAccessToken, clearSession } from '../lib/api/client'
import type { LoginCredentials, TokenResponse } from '../types/iam'

export interface AuthUser {
    id: string
    username: string
    email: string
    firstName: string
    lastName: string
    tenantId?: string
    tenantName?: string
    scopes: string[]
    isSuperuser: boolean
}

export interface AuthContextType {
    user: AuthUser | null
    accessToken: string | null
    isAuthenticated: boolean
    requires2FA: boolean
    isLoading: boolean
    error: string | null
    login: (credentials: Omit<LoginCredentials, 'totp_code'>) => Promise<TokenResponse>
    submit2FACode: (code: string) => Promise<TokenResponse>
    logout: () => void
    clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_TOKEN_KEY = 'kite_access_token'

interface DecodedToken {
    sub: string
    username: string
    email: string
    first_name: string
    last_name: string
    tenant_id?: string
    scopes: string[]
    is_superuser?: boolean
    exp: number
}

function decodeJwt(token: string): DecodedToken | null {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            window.atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
        return JSON.parse(jsonPayload) as DecodedToken
    } catch {
        return null
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [accessToken, setAccessTokenState] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [requires2FA, setRequires2FA] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const cachedCredentialsRef = useRef<Omit<LoginCredentials, 'totp_code'> | null>(null)

    useEffect(() => {
        const initializeSession = async () => {
            try {
                const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY)
                if (storedToken) {
                    const decoded = decodeJwt(storedToken)
                    if (decoded && decoded.exp * 1000 > Date.now()) {
                        setAccessToken(storedToken)
                        setAccessTokenState(storedToken)
                        
                        const profile = await loginService.getMe()
                        setUser({
                            id: profile.id,
                            username: profile.username,
                            email: profile.email,
                            firstName: profile.first_name,
                            lastName: profile.last_name,
                            tenantId: profile.tenant_id,
                            tenantName: profile.tenant_name,
                            scopes: profile.scopes,
                            isSuperuser: profile.is_superuser ?? false,
                        })
                        setIsAuthenticated(true)
                    } else {
                        localStorage.removeItem(ACCESS_TOKEN_KEY)
                        clearSession()
                    }
                }
            } catch (err) {
                console.error('Session initialization failed:', err)
                localStorage.removeItem(ACCESS_TOKEN_KEY)
                clearSession()
                setUser(null)
                setIsAuthenticated(false)
            } finally {
                setIsLoading(false)
            }
        }

        initializeSession()
    }, [])

    useEffect(() => {
        const handleSessionExpired = () => {
            logout()
            setError('Your authentication session has expired. Please log in again.')
        }

        window.addEventListener('kite:session-expired', handleSessionExpired)
        return () => {
            window.removeEventListener('kite:session-expired', handleSessionExpired)
        }
    }, [])

    const handleSuccessfulAuthentication = useCallback(async (token: string) => {
        const decoded = decodeJwt(token)
        if (!decoded) {
            throw new Error('Failed to parse authentication payload.')
        }

        localStorage.setItem(ACCESS_TOKEN_KEY, token)
        setAccessToken(token)
        setAccessTokenState(token)

        let tenantName: string | undefined = undefined
        try {
            const profile = await loginService.getMe()
            tenantName = profile.tenant_name
        } catch {}

        setUser({
            id: decoded.sub,
            username: decoded.username,
            email: decoded.email,
            firstName: decoded.first_name,
            lastName: decoded.last_name,
            tenantId: decoded.tenant_id,
            tenantName: tenantName,
            scopes: decoded.scopes,
            isSuperuser: decoded.is_superuser ?? false,
        })
        setIsAuthenticated(true)
        setRequires2FA(false)
        cachedCredentialsRef.current = null
    }, [])

    const login = useCallback(async (credentials: Omit<LoginCredentials, 'totp_code'>): Promise<TokenResponse> => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await loginService.login(credentials)

            if (response.requires_2fa) {
                cachedCredentialsRef.current = credentials
                setRequires2FA(true)
            } else if (response.access_token) {
                handleSuccessfulAuthentication(response.access_token)
            }

            return response
        } catch (err: any) {
            const msg = err?.message || 'Authentication failed. Please verify your credentials.'
            setError(msg)
            cachedCredentialsRef.current = null
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [handleSuccessfulAuthentication])

    const submit2FACode = useCallback(async (code: string): Promise<TokenResponse> => {
        if (!cachedCredentialsRef.current) {
            const err = new Error('Session credentials expired or out of sync. Please log in again.')
            setError(err.message)
            setRequires2FA(false)
            throw err
        }

        setIsLoading(true)
        setError(null)
        try {
            const credentialsWith2FA: LoginCredentials = {
                ...cachedCredentialsRef.current,
                totp_code: code.trim(),
            }

            const response = await loginService.login(credentialsWith2FA)

            if (response.access_token) {
                handleSuccessfulAuthentication(response.access_token)
            } else {
                throw new Error('Verification failed. Unable to authenticate session.')
            }

            return response
        } catch (err: any) {
            const msg = err?.message || 'Invalid two-factor authentication code.'
            setError(msg)
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [handleSuccessfulAuthentication])

    const logout = useCallback(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        clearSession()
        setUser(null)
        setAccessTokenState(null)
        setIsAuthenticated(false)
        setRequires2FA(false)
        setError(null)
        cachedCredentialsRef.current = null
        loginService.logout()
    }, [])

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isAuthenticated,
                requires2FA,
                isLoading,
                error,
                login,
                submit2FACode,
                logout,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
