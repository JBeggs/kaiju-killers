import { useState, useEffect } from 'react'

export function useWebGLPerformance() {
  const [performanceMode, setPerformanceMode] = useState<'auto' | 'low' | 'high'>('auto')
  const [contextLostCount, setContextLostCount] = useState(0)
  const [fps, setFps] = useState(60)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    
    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setFps(currentFPS)
        frameCount = 0
        lastTime = currentTime
        
        // Auto-adjust performance mode based on FPS
        if (performanceMode === 'auto') {
          if (currentFPS < 20) {
            setPerformanceMode('low')
          } else if (currentFPS > 50) {
            setPerformanceMode('high')
          }
        }
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
    
    // Listen for WebGL context loss
    const handleContextLost = () => {
      setContextLostCount(prev => prev + 1)
      // Force low performance mode after context loss
      setPerformanceMode('low')
    }
    
    document.addEventListener('webglcontextlost', handleContextLost)
    
    return () => {
      document.removeEventListener('webglcontextlost', handleContextLost)
    }
  }, [performanceMode])

  const getOptimalSettings = () => {
    switch(performanceMode) {
      case 'low':
        return {
          antialias: false,
          shadows: false,
          pixelRatio: 1,
          frameloop: 'demand' as const,
          powerPreference: 'low-power' as const
        }
      case 'high':
        return {
          antialias: true,
          shadows: true,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          frameloop: 'always' as const,
          powerPreference: 'high-performance' as const
        }
      default: // auto
        return {
          antialias: fps > 30,
          shadows: fps > 40,
          pixelRatio: fps > 45 ? Math.min(window.devicePixelRatio, 2) : 1,
          frameloop: fps > 30 ? 'always' as const : 'demand' as const,
          powerPreference: 'default' as const
        }
    }
  }

  return {
    performanceMode,
    setPerformanceMode,
    contextLostCount,
    fps,
    settings: getOptimalSettings()
  }
}
