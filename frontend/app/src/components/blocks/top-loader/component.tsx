import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NProgress from 'nprogress'
import { routePreloaders } from '@/lib/api/route-cache'

NProgress.configure({
    showSpinner: false,
    speed: 300,
    minimum: 0.15,
    easing: 'ease',
})

export const SuspenseTopLoader: React.FC = () => {
    
    useEffect(() => {
        NProgress.start()
        return () => {
            NProgress.done()
        }
    }, [])

    return null
}

export const TopProgressBar: React.FC = () => {

    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        
        NProgress.start()
        const timer = setTimeout(() => {
            NProgress.done()
        }, 150)

        return () => {
            clearTimeout(timer)
            NProgress.done()
        }

    }, [location.pathname, location.search])

    useEffect(() => {
        
        const handleGlobalLinkClick = async (e: MouseEvent) => {
            
            const target = e.target as HTMLElement | null
            const anchor = target?.closest('a')
            if (!anchor) return

            const href = anchor.getAttribute('href')
            if (!href || href.startsWith('http') || href.startsWith('#') || anchor.target === '_blank') return

            const currentPath = window.location.pathname
            const targetPath = href.split('?')[0]

            if (currentPath === targetPath) return

            e.preventDefault()
            e.stopPropagation()

            NProgress.start()

            if (routePreloaders[targetPath]) {
                try {
                    await routePreloaders[targetPath]()
                } catch (err) {
                    console.error('Failed to pre-load route data:', err)
                }
            }

            NProgress.done()
            navigate(href)
        }

        window.addEventListener('click', handleGlobalLinkClick, true)
        return () => {
            window.removeEventListener('click', handleGlobalLinkClick, true)
        }

    }, [navigate])

    return null
}
