import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return

    const checkMobile = () => window.innerWidth < MOBILE_BREAKPOINT
    
    // Set initial state
    setIsMobile(checkMobile())
    
    const handleResize = () => setIsMobile(checkMobile())
    
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}
