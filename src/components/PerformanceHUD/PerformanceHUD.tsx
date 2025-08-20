import { useState, useEffect } from 'react'
import { AdvancedOptimizer } from '@/utils/optimization/advancedOptimizer'
import { PerformanceMonitor } from '@/utils/optimization/performanceMonitor'

export function PerformanceHUD() {
  const [fps, setFps] = useState(60)
  const [memory, setMemory] = useState(0)
  const [optimizationLevel, setOptimizationLevel] = useState('loading...')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const perfMonitor = new PerformanceMonitor()
    
    perfMonitor.onFpsUpdate((currentFps) => {
      setFps(currentFps)
      
      // Update optimization level based on performance
      const level = AdvancedOptimizer.getOptimizationLevel()
      setOptimizationLevel(`${level.geometry.toUpperCase()} (${currentFps} FPS)`)
    })

    // Update memory usage
    const updateMemory = () => {
      const memInfo = (performance as any).memory
      if (memInfo) {
        setMemory(Math.round(memInfo.usedJSHeapSize / 1024 / 1024))
      }
    }
    
    updateMemory()
    const memoryInterval = setInterval(updateMemory, 2000)

    // Toggle visibility with key (modern event handling)
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only toggle on 'P' key if not a movement key (avoid conflicts)
      if ((e.key === 'P' || e.key === 'p') && !e.ctrlKey && !e.altKey) {
        e.stopPropagation() // Prevent bubbling to movement handler
        setIsVisible(!isVisible)
      }
    }
    
    // Use capture: false to run after movement handler
    window.addEventListener('keydown', handleKeyPress, { capture: false })
    
    return () => {
      clearInterval(memoryInterval)
      window.removeEventListener('keydown', handleKeyPress, { capture: false })
    }
  }, [isVisible])

  const getFpsColor = () => {
    if (fps >= 50) return 'text-green-400'
    if (fps >= 30) return 'text-yellow-400' 
    return 'text-red-400'
  }

  const getOptimizationColor = () => {
    if (optimizationLevel.includes('LOW')) return 'text-green-400'
    if (optimizationLevel.includes('MEDIUM')) return 'text-yellow-400'
    if (optimizationLevel.includes('HIGH')) return 'text-orange-400'
    return 'text-red-400'
  }

  if (!isVisible) {
    return (
      <div className="fixed top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        Press 'P' for Performance HUD
      </div>
    )
  }

  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg border border-gray-600 font-mono text-sm min-w-[300px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-cyan-400 font-bold">⚡ PERFORMANCE HUD</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={getFpsColor()}>{fps}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className="text-blue-400">{memory} MB</span>
        </div>
        
        <div className="flex justify-between">
          <span>Optimization:</span>
          <span className={getOptimizationColor()}>{optimizationLevel}</span>
        </div>
        
        <hr className="border-gray-600 my-2" />
        
        <div className="text-xs text-gray-400">
          <div>🎯 Dynamic quality adjustment active</div>
          <div>📦 Model optimization: {fps >= 50 ? 'MINIMAL' : fps >= 30 ? 'MODERATE' : 'AGGRESSIVE'}</div>
          <div>🖼️ Texture compression: {fps >= 50 ? 'OFF' : fps >= 30 ? 'MEDIUM' : 'HIGH'}</div>
        </div>

        <div className="mt-3 space-y-1 text-xs">
          <button 
            onClick={() => AdvancedOptimizer.clearCache()}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded w-full"
          >
            🗑️ Clear Optimization Cache
          </button>
          
          <div className="text-gray-500 text-center">Press 'P' to hide</div>
        </div>
      </div>
    </div>
  )
}

