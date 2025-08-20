import { useState, useEffect } from 'react'
import { WebGLFallbackDetection, WebGLCapabilities } from '@/utils/webglFallbackDetection'

export function useWebGLFallbackDetection() {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true)
  const [forceNonWebGL, setForceNonWebGL] = useState(false)
  const [capabilities, setCapabilities] = useState<WebGLCapabilities | null>(null)
  const [isDetecting, setIsDetecting] = useState(true)

  useEffect(() => {
    const detector = WebGLFallbackDetection.getInstance()

    const detectCapabilities = async () => {
      try {
        setIsDetecting(true)
        const caps = await detector.detectCapabilities()
        setCapabilities(caps)
        
        const shouldForceNonWebGL = 
          !caps.hasWebGL || 
          caps.contextLost || 
          caps.recommendedMode !== 'webgl'
          
        setIsWebGLSupported(caps.hasWebGL && !caps.contextLost)
        setForceNonWebGL(shouldForceNonWebGL)
        
        console.log('WebGL Detection Result:', {
          hasWebGL: caps.hasWebGL,
          contextLost: caps.contextLost,
          recommendedMode: caps.recommendedMode,
          forceNonWebGL: shouldForceNonWebGL
        })
      } catch (error) {
        console.error('WebGL detection failed:', error)
        setIsWebGLSupported(false)
        setForceNonWebGL(true)
      } finally {
        setIsDetecting(false)
      }
    }

    const handleContextLoss = () => {
      console.warn('WebGL context lost - forcing non-WebGL mode')
      setIsWebGLSupported(false)
      setForceNonWebGL(true)
      detector.onContextLoss()
    }

    const handleContextRestore = () => {
      console.log('WebGL context restored - re-detecting capabilities')
      detectCapabilities()
    }

    window.addEventListener('webglcontextlost', handleContextLoss)
    window.addEventListener('webglcontextrestored', handleContextRestore)

    detectCapabilities()

    return () => {
      window.removeEventListener('webglcontextlost', handleContextLoss)
      window.removeEventListener('webglcontextrestored', handleContextRestore)
    }
  }, [])

  return {
    isWebGLSupported,
    forceNonWebGL,
    capabilities,
    isDetecting,
    setForceNonWebGL
  }
}
