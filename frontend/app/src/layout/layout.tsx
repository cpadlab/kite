import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { SidebarProvider } from "@/components/ui/sidebar"
import { LeftBar } from './components/sidebar/component'

const Layout = () => {
    
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return null
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-dvh max-h-dvh h-dvh overflow-hidden w-full">

                <LeftBar />

                <main className="flex flex-col flex-1 overflow-hidden">
                    {/* <Header /> */}
                    <div className="flex-1 overflow-auto p-4">
                        <Outlet />
                    </div>
                </main>
                
            </div>
        </SidebarProvider>
    )
}

export default Layout