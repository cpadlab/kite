import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

import { ThemeProvider } from './context/theme.tsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toast'

import Layout from './layout/layout.tsx'
import LoadingScreen from './components/blocks/loading/component.tsx'


function App() {
    return (
        <ThemeProvider>
            <TooltipProvider>
                
                <Toaster />
                
                <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                        
                        <Route element={<Layout />}>
                            
                      
                            
                        </Route>
                        
                    </Routes>
                </Suspense>

            </TooltipProvider>
        </ThemeProvider>
    )
}

export default App
