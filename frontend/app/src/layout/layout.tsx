import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { SidebarProvider } from "@/components/ui/sidebar"

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
            <Outlet />
        </SidebarProvider>
    )
}

export default Layout