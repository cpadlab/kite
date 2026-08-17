import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

import { ThemeProvider } from './context/theme.tsx'
import { AuthProvider } from './context/auth.tsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toast'

import Layout from './layout/layout.tsx'
import LoadingScreen from './components/blocks/loading/component.tsx'

const LoginPage = lazy(() => import('./pages/public/login/page.tsx'))
const PublicLayout = lazy(() => import('./pages/public/layout.tsx'))

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
                            </Route>

                            <Route element={<Layout />}>
                                
                          
                                
                            </Route>
                            
                        </Routes>
                    </Suspense>

                </TooltipProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
