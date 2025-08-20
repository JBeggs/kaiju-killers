import { useState, useEffect } from 'react'
import { useWebGLPerformance } from '@/hooks/useWebGLPerformance'

export function WebGLMonitor() {
  const { performanceMode, setPerformanceMode, fps, contextLostCount } = useWebGLPerformance()
  const [webglStatus, setWebglStatus] = useState<'loading' | 'ok' | 'warning' | 'error'>('loading')
  const [contextLost, setContextLost] = useState(false)
  const [memoryInfo, setMemoryInfo] = useState<any>(null)

  useEffect(() => {
    const checkWebGL = () => {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
      
      if (!gl) {
        setWebglStatus('error')
        return
      }

      const info = {
        renderer: gl.getParameter(gl.RENDERER),
        vendor: gl.getParameter(gl.VENDOR),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
      }
      
      setMemoryInfo(info)
      
      // Check for context loss events on any canvas
      const canvases = document.querySelectorAll('canvas')
      canvases.forEach(canvas => {
        canvas.addEventListener('webglcontextlost', () => {
          setContextLost(true)
          setWebglStatus('error')
        })
        canvas.addEventListener('webglcontextrestored', () => {
          setContextLost(false)
          setWebglStatus('ok')
        })
      })

      setWebglStatus('ok')
    }

    checkWebGL()
    const interval = setInterval(checkWebGL, 5000)
    
    return () => clearInterval(interval)
  }, [])

  if (webglStatus === 'loading') return null

  const getStatusColor = () => {
    switch(webglStatus) {
      case 'ok': return 'bg-green-600'
      case 'warning': return 'bg-yellow-600' 
      case 'error': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusText = () => {
    if (contextLost) return 'WebGL Context Lost!'
    switch(webglStatus) {
      case 'ok': return 'WebGL OK'
      case 'warning': return 'WebGL Warning'
      case 'error': return 'WebGL Error'
      default: return 'WebGL Unknown'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${getStatusColor()} text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm`}>
        <div className={`w-2 h-2 rounded-full ${webglStatus === 'ok' ? 'bg-green-300' : 'bg-red-300'} animate-pulse`} />
        {getStatusText()}
        {contextLost && (
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-xs hover:bg-opacity-30"
          >
            Reload
          </button>
        )}
      </div>
      
      {process.env.NODE_ENV === 'development' && memoryInfo && (
        <div className="mt-2 bg-black bg-opacity-80 text-white p-2 rounded text-xs max-w-xs">
          <div>Renderer: {memoryInfo.renderer}</div>
          <div>FPS: {fps} | Mode: {performanceMode}</div>
          <div>Context Lost: {contextLostCount}x</div>
          <div className="flex gap-1 mt-1">
            <button 
              onClick={() => setPerformanceMode('low')}
              className={`px-2 py-1 text-xs rounded ${performanceMode === 'low' ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              Low
            </button>
            <button 
              onClick={() => setPerformanceMode('auto')}
              className={`px-2 py-1 text-xs rounded ${performanceMode === 'auto' ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              Auto
            </button>
            <button 
              onClick={() => setPerformanceMode('high')}
              className={`px-2 py-1 text-xs rounded ${performanceMode === 'high' ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              High
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
