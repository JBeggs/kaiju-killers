import { useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getWebGLInfo } from '@/utils/webglDebugger'

export function DebugInfo() {
  const { currentPlayer, lobby } = useGameStore()
  const [webglInfo, setWebglInfo] = useState<string>('Waiting for WebGL context...')

  useEffect(() => {
    // Try to get info from existing WebGL context without creating a new one
    const checkExistingContext = () => {
      const existingCanvas = document.querySelector('canvas')
      if (existingCanvas) {
        // Try to access existing context without creating a new one
        try {
          // Check if canvas already has a WebGL context by looking for WebGL properties
          const canvasAny = existingCanvas as any
          if (canvasAny._context || canvasAny.__webglContext) {
            // Canvas already has a context, try to get WebGL info from Three.js renderer
            const threeRenderer = (window as any).__THREE_RENDERER__
            if (threeRenderer && threeRenderer.getContext) {
              const gl = threeRenderer.getContext()
              if (gl && !gl.isContextLost()) {
                const info = getWebGLInfo(gl as any)
                setWebglInfo(JSON.stringify(info, null, 2))
                return true
              }
            }
          } else {
            // Canvas doesn't have a context yet, but don't create one ourselves
            // to avoid conflicts with Three.js
            setWebglInfo('Waiting for Three.js WebGL context...')
            return false
          }
        } catch (error) {
          console.warn('🔧 Could not access WebGL context for debug info:', error)
          setWebglInfo('WebGL context unavailable (already in use)')
          return true // Don't keep trying
        }
      }
      return false
    }

    // Try immediately
    if (!checkExistingContext()) {
      // If no context exists, check periodically until one does
      const interval = setInterval(() => {
        if (checkExistingContext()) {
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-0 right-0 bg-black bg-opacity-80 text-green-400 p-4 text-xs max-w-sm max-h-96 overflow-auto z-50 font-mono">
      <h3 className="text-white font-bold mb-2">Debug Info</h3>
      
      <div className="mb-2">
        <strong>Current Player:</strong><br/>
        {currentPlayer ? (
          <>
            ID: {currentPlayer.id}<br/>
            Name: {currentPlayer.name}<br/>
            Avatar: {currentPlayer.avatar.name}<br/>
            Model: {currentPlayer.avatar.model ? '✓ Loaded' : '✗ Failed'}<br/>
            Position: [{currentPlayer.position.join(', ')}]
          </>
        ) : 'None'}
      </div>

      <div className="mb-2">
        <strong>Lobby ({lobby.length}):</strong><br/>
        {lobby.map(player => (
          <div key={player.id}>
            {player.name}: {player.avatar.model ? '✓' : '✗'}
          </div>
        ))}
      </div>

      <div className="mb-2">
        <strong>WebGL:</strong><br/>
        <pre className="text-xs">{webglInfo}</pre>
      </div>
    </div>
  )
}
