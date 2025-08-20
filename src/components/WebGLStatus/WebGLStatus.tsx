import { useState, useEffect } from 'react'

export function WebGLStatus() {
  const [contextLost, setContextLost] = useState(false)
  const [contextLossCount, setContextLossCount] = useState(0)
  const [lastContextLoss, setLastContextLoss] = useState<Date | null>(null)

  useEffect(() => {
    const handleContextLost = () => {
      setContextLost(true)
      setContextLossCount(prev => prev + 1)
      setLastContextLoss(new Date())
      console.warn('WebGL Status: Context Lost detected')
    }

    const handleContextRestored = () => {
      setContextLost(false)
      console.log('WebGL Status: Context Restored detected')
    }

    window.addEventListener('webglcontextlost', handleContextLost)
    window.addEventListener('webglcontextrestored', handleContextRestored)
    window.addEventListener('webgl-context-restored', handleContextRestored)

    return () => {
      window.removeEventListener('webglcontextlost', handleContextLost)
      window.removeEventListener('webglcontextrestored', handleContextRestored)
      window.removeEventListener('webgl-context-restored', handleContextRestored)
    }
  }, [])

  const getStatusColor = () => {
    if (contextLost) return 'bg-red-600'
    if (contextLossCount > 0) return 'bg-yellow-600'
    return 'bg-green-600'
  }

  const getStatusText = () => {
    if (contextLost) return 'WebGL Context Lost'
    if (contextLossCount > 0) return `WebGL OK (${contextLossCount} losses)`
    return 'WebGL OK'
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm">
      <div className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor()}`}></div>
      <span className="font-mono">{getStatusText()}</span>
      
      {lastContextLoss && (
        <div className="text-xs text-gray-300 mt-1">
          Last loss: {lastContextLoss.toLocaleTimeString()}
        </div>
      )}
      
      {contextLost && (
        <div className="text-xs text-yellow-300 mt-1">
          Avatar may be invisible - recovering...
        </div>
      )}
    </div>
  )
}
