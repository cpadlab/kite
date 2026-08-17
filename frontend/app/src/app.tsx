import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { ThemeProvider } from './context/theme.tsx'
import { AuthProvider } from './context/auth.tsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toast'

import Layout from './layout/layout.tsx'
import LoadingScreen from './components/blocks/loading/component.tsx'

const LoginPage = lazy(() => import('./pages/public/login/page.tsx'))
const PublicLayout = lazy(() => import('./pages/public/layout.tsx'))
const TOTPPage = lazy(() => import('./pages/public/totp/page.tsx'))
const DashboardPage = lazy(() => import('./pages/private/home/dashboard/page.tsx'))

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
