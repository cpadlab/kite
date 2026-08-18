import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import NProgress from 'nprogress'

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

    return null

}
