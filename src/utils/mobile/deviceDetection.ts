export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth <= 768
  )
}

export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return (
    window.innerWidth > 768 && 
    window.innerWidth <= 1024 && 
    'ontouchstart' in window
  )
}

export const isDesktop = (): boolean => {
  return !isMobile() && !isTablet()
}

export const getOptimalSettings = () => {
  const mobile = isMobile()
  const tablet = isTablet()
  
  return {
    antialias: !mobile,
    shadowMapSize: mobile ? 512 : tablet ? 1024 : 2048,
    pixelRatio: mobile ? 1 : Math.min(window.devicePixelRatio, 2),
    fov: mobile ? 80 : 75,
    maxDistance: mobile ? 15 : 20,
    minDistance: mobile ? 3 : 2
  }
}
