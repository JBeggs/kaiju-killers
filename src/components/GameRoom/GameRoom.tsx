import { useState, memo, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useWebGLFallbackDetection } from '@/hooks/useWebGLFallbackDetection'
import { ModernFirstPersonView } from '@/views/FirstPerson/ModernFirstPersonView'
import { ThirdPersonView } from '@/views/ThirdPerson/ThirdPersonView'
import { NonWebGLGameView } from '@/views/NonWebGL/NonWebGLGameView'
import { DebugInfo } from '@/components/DebugInfo/DebugInfo'
import { DebugUI } from '@/components/DebugUI/DebugUI'
import { WebGLMonitor } from '@/components/WebGLMonitor/WebGLMonitor'
import { restoreContext } from '@/utils/webglDebugger'

interface GameRoomProps {
  onLeaveGame: () => void
}

export const GameRoom = memo(function GameRoom({ onLeaveGame }: GameRoomProps) {
  const { view, setView, currentPlayer } = useGameStore()
  const { isWebGLSupported, forceNonWebGL, capabilities, isDetecting, setForceNonWebGL } = useWebGLFallbackDetection()
  const [manualOverride, setManualOverride] = useState<'webgl' | 'nonwebgl' | null>(null)

  const effectiveRenderMode = useMemo(() => 
    manualOverride || (forceNonWebGL ? 'nonwebgl' : 'webgl'),
    [manualOverride, forceNonWebGL]
  )

  return (
    <div className="h-screen w-screen relative">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          Player: {currentPlayer?.name || 'Unknown'}
        </div>
        
        <div className="flex bg-black bg-opacity-50 rounded-lg p-1">
          <button
            onClick={() => setManualOverride('webgl')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              effectiveRenderMode === 'webgl' ? 'bg-green-600 text-white' : 'text-white hover:bg-gray-700'
            }`}
            disabled={!isWebGLSupported}
          >
            WebGL
          </button>
          <button
            onClick={() => setManualOverride('nonwebgl')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              effectiveRenderMode === 'nonwebgl' ? 'bg-purple-600 text-white' : 'text-white hover:bg-gray-700'
            }`}
          >
            Non-WebGL
          </button>
        </div>
        
        {effectiveRenderMode === 'webgl' && (
          <div className="flex bg-black bg-opacity-50 rounded-lg p-1 ml-2">
            <button
              onClick={() => setView('third')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === 'third' ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'
              }`}
            >
              3rd
            </button>
            <button
              onClick={() => setView('first')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === 'first' ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'
              }`}
            >
              1st
            </button>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {capabilities && (
          <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs">
            GPU: {capabilities.isLowPowerGPU ? 'Low Power' : 'High Performance'}<br/>
            Recommended: {capabilities.recommendedMode}
          </div>
        )}
        
        {localStorage.getItem('forceSimpleAvatar') === 'true' ? (
          <button
            onClick={() => {
              localStorage.removeItem('forceSimpleAvatar')
              window.location.reload()
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
          >
            Try JSON Avatar
          </button>
        ) : (
          <button
            onClick={() => {
              localStorage.setItem('forceSimpleAvatar', 'true')
              window.location.reload()
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
          >
            Simple Avatar
          </button>
        )}
        
        {effectiveRenderMode === 'webgl' && (
          <button
            onClick={restoreContext}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
          >
            Fix WebGL
          </button>
        )}
        
        <button
          onClick={onLeaveGame}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Leave Game
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-50 text-white p-4 rounded-lg max-w-sm">
        <h3 className="font-semibold mb-2">Controls</h3>
        {effectiveRenderMode === 'nonwebgl' ? (
          <div className="text-sm space-y-1">
            <div>WASD/Arrow Keys: Move camera</div>
            <div>+/-: Zoom in/out</div>
            <div>No WebGL required!</div>
          </div>
        ) : view === 'first' ? (
          <div className="text-sm space-y-1">
            <div>Click to lock mouse cursor</div>
            <div>WASD: Move around</div>
            <div>Mouse: Look around</div>
          </div>
        ) : (
          <div className="text-sm space-y-1">
            <div>Left click + drag: Rotate view</div>
            <div>Right click + drag: Pan</div>
            <div>Scroll wheel: Zoom</div>
          </div>
        )}
      </div>

      <div className="w-full h-full">
        {isDetecting && (
          <div className="flex items-center justify-center h-full bg-gray-900 text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
              <div>Detecting rendering capabilities...</div>
            </div>
          </div>
        )}
        {!isDetecting && effectiveRenderMode === 'nonwebgl' && <NonWebGLGameView />}
        {!isDetecting && effectiveRenderMode === 'webgl' && view === 'first' && <ModernFirstPersonView />}
        {!isDetecting && effectiveRenderMode === 'webgl' && view === 'third' && <ThirdPersonView />}
      </div>

      <DebugUI />
      <DebugInfo />
      <WebGLMonitor />
    </div>
  )
})
