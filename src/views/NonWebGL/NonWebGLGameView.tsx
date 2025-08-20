import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { Sprite2DAvatarFallback } from '@/systems/Avatar/Sprite2DAvatarFallback'

export function NonWebGLGameView() {
  const { currentPlayer, lobby } = useGameStore()
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, zoom: 1 })
  const containerRef = useRef<HTMLDivElement>(null)

  // DISABLED: Camera controls - conflicts with FirstPerson avatar movement
  // If you need NonWebGL controls, use different keys than WASD
  useEffect(() => {
    console.log('🚫 NonWebGL keyboard controls disabled to prevent WASD conflicts')
    // const handleKeyDown = (e: KeyboardEvent) => {
    //   const speed = 5
    //   // Only use non-conflicting keys if needed
    // }
    // window.addEventListener('keydown', handleKeyDown)
    // return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Follow current player
  useEffect(() => {
    if (currentPlayer) {
      setCameraPosition(prev => ({
        ...prev,
        x: -currentPlayer.position[0] * 50,
        y: currentPlayer.position[2] * 50
      }))
    }
  }, [currentPlayer?.position])

  const renderAvatar = (player: any, key: string) => {
    const commonProps = {
      position: player.position,
      rotation: player.rotation,
      color: player.id === currentPlayer?.id ? "#4a90e2" : "#e74c3c",
      name: player.avatar?.name || player.id
    }

    // Only sprite2d mode available (other fallbacks removed during cleanup)
    return <Sprite2DAvatarFallback key={key} {...commonProps} />
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-blue-400 to-green-400">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 text-white p-3 rounded-lg">
        <h3 className="text-sm font-bold mb-2">Non-WebGL Game View</h3>
        
        <div className="space-y-2 text-xs">
          <div>
            <label className="block mb-1">Render Mode:</label>
            <div className="bg-gray-800 text-white p-1 rounded text-xs">
              2D Sprites (Only Available)
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Other modes removed during cleanup
            </div>
          </div>
          
          <div>
            <div>Players: {lobby.length}</div>
            <div>Camera: ({cameraPosition.x}, {cameraPosition.y})</div>
            <div>Zoom: {cameraPosition.zoom.toFixed(1)}x</div>
          </div>
          
          <div className="text-xs text-gray-300 mt-2">
            ⚠️ Controls: DISABLED<br/>
            (Prevents conflict with WebGL mode)<br/>
            Camera follows current player
          </div>
        </div>
      </div>

      {/* Game World */}
      <div 
        ref={containerRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${cameraPosition.x}px, ${cameraPosition.y}px) scale(${cameraPosition.zoom})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Ground Grid */}
        <div className="absolute inset-0">
          {Array.from({length: 21}, (_, i) => (
            <div key={`grid-v-${i}`} 
                 className="absolute bg-white opacity-20" 
                 style={{
                   left: `${i * 50}px`,
                   top: 0,
                   width: '1px',
                   height: '1000px',
                   transform: 'translateX(-500px)'
                 }} 
            />
          ))}
          {Array.from({length: 21}, (_, i) => (
            <div key={`grid-h-${i}`} 
                 className="absolute bg-white opacity-20" 
                 style={{
                   top: `${i * 50}px`,
                   left: 0,
                   height: '1px',
                   width: '1000px',
                   transform: 'translateY(-500px)'
                 }} 
            />
          ))}
        </div>

        {/* Center Origin Marker */}
        <div className="absolute w-4 h-4 bg-red-500 rounded-full" 
             style={{
               left: '50%',
               top: '50%',
               transform: 'translate(-50%, -50%)'
             }} 
        />

        {/* Reference Objects */}
        <div className="absolute w-6 h-6 bg-red-600 rounded" 
             style={{
               left: '50%',
               top: '50%',
               transform: 'translate(-150px, -25px)'
             }} 
        />
        <div className="absolute w-6 h-6 bg-blue-600 rounded" 
             style={{
               left: '50%',
               top: '50%',
               transform: 'translate(100px, -25px)'
             }} 
        />

        {/* Current Player */}
        {currentPlayer && renderAvatar(currentPlayer, currentPlayer.id)}

        {/* Other Players */}
        {lobby.filter(p => p.id !== currentPlayer?.id).map(player => 
          renderAvatar(player, player.id)
        )}
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded-lg">
        <div className="flex justify-between items-center text-xs">
          <div>Mode: Non-WebGL (sprite2d)</div>
          <div>Status: {currentPlayer ? 'In Game' : 'No Player'}</div>
          <div>Performance: Excellent (No GPU)</div>
        </div>
      </div>
    </div>
  )
}
