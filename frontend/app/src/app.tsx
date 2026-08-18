import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'

import { ThemeProvider } from './context/theme.tsx'
import { AuthProvider, useAuth } from './context/auth.tsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toast'

import LoadingScreen from './components/blocks/loading/component.tsx'

const PublicLayout = lazy(() => import('./pages/public/layout.tsx'))
const Layout = lazy(() => import('./layout/layout.tsx'))

const LoginPage = lazy(() => import('./pages/public/login/page.tsx'))
const PlatformTenantsPage = lazy(() => import('./pages/private/platform/tenants/page.tsx'))
const TOTPPage = lazy(() => import('./pages/public/totp/page.tsx'))
const DashboardPage = lazy(() => import('./pages/private/home/dashboard/page.tsx'))
const SettingsSecurityPage = lazy(() => import('./pages/private/settings/security/page.tsx'))

function SuperUserGuard() {

    const { user, isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return <LoadingScreen />
    }

    if (!isAuthenticated || !user?.isSuperuser) {
        return <Navigate to="/" replace />
    }

    return <Outlet />

}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <TooltipProvider>
                    
                    <Toaster />

                    <Suspense fallback={<LoadingScreen />}>
                        <Routes>

                            <Route element={<PublicLayout />}>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/login/totp" element={<TOTPPage />} />
                            </Route>

                            <Route element={<Layout />}>
                                
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/settings/security" element={<SettingsSecurityPage />} />

                                <Route element={<SuperUserGuard />}>
                                    <Route path="/platform/tenants" element={<PlatformTenantsPage />} />
                                </Route>

                            </Route>

                            <Route path="/404" element={<div className="flex min-h-screen items-center justify-center font-semibold text-lg text-muted-foreground bg-background">404 - Page Not Found</div>} />
                            <Route path="*" element={<Navigate to="/404" replace />} />

                        </Routes>
                    </Suspense>

                </TooltipProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
