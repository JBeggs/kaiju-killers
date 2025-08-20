import { WebGLDebugger } from '@/utils/webglDebugger'

interface WebGLDebugToolsProps {
  canvas?: HTMLCanvasElement | null
}

export function WebGLDebugTools({ canvas }: WebGLDebugToolsProps) {
  const handleForceLoss = () => {
    if (canvas) {
      WebGLDebugger.forceContextLoss(canvas)
    }
  }
  
  const handleForceRestore = () => {
    if (canvas) {
      WebGLDebugger.restoreContext(canvas)
    }
  }
  
  const handleClearSimpleMode = () => {
    localStorage.removeItem('forceSimpleAvatar')
    window.location.reload()
  }
  
  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm font-mono space-y-2">
      <div className="font-bold text-yellow-400">WebGL Debug Tools</div>
      
      <div className="space-y-1">
        <button 
          onClick={handleForceLoss}
          className="block w-full bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
        >
          Force Context Loss
        </button>
        
        <button 
          onClick={handleForceRestore}
          className="block w-full bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
        >
          Force Context Restore
        </button>
        
        <button 
          onClick={handleClearSimpleMode}
          className="block w-full bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
        >
          Clear Simple Mode
        </button>
      </div>
      
      <div className="text-xs text-gray-300">
        Simple Mode: {localStorage.getItem('forceSimpleAvatar') ? 'ON' : 'OFF'}
      </div>
    </div>
  )
}
