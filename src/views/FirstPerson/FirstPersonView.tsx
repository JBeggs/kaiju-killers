import { useRef, useCallback, useMemo, memo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useGameStore } from '@/stores/gameStore'
import { SimpleAvatarSystem } from '@/systems/Avatar/SimpleAvatarSystem'

export const FirstPersonView = memo(function FirstPersonView() {
  const { currentPlayer, lobby } = useGameStore()
  const [avatarPosition, setAvatarPosition] = useState<[number, number, number]>([0, 0, 0])
  const [avatarRotation, setAvatarRotation] = useState<[number, number, number]>([0, 0, 0])
  const [isMoving, setIsMoving] = useState(false)
  const [currentKeys, setCurrentKeys] = useState<string[]>([])
  const keysPressed = useRef(new Set<string>())
  const cameraRef = useRef<any>(null)

  // Simple direct movement system with high priority and debugging
  useEffect(() => {
    console.log('🔧 Setting up keyboard listeners...')
    
    const updateKeys = () => {
      setCurrentKeys(Array.from(keysPressed.current))
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('🔥 ANY KEY DOWN:', e.code, e.key) // Log ALL keys
      
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault() // Stop other handlers
        e.stopPropagation() // Stop bubbling
        keysPressed.current.add(e.code)
        updateKeys()
        console.log('🚀 MOVEMENT Key DOWN:', e.code, 'Keys:', Array.from(keysPressed.current))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      console.log('🔥 ANY KEY UP:', e.code, e.key) // Log ALL keys
      
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault() // Stop other handlers
        e.stopPropagation() // Stop bubbling
        keysPressed.current.delete(e.code)
        updateKeys()
        console.log('🚀 MOVEMENT Key UP:', e.code, 'Keys:', Array.from(keysPressed.current))
      }
    }

    // Add with capture=true to get events first, and make it focusable
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.tabIndex = 0 // Make canvas focusable
      canvas.focus() // Focus the canvas
      canvas.addEventListener('keydown', handleKeyDown, true)
      canvas.addEventListener('keyup', handleKeyUp, true)
      console.log('✅ Keyboard listeners attached to canvas with focus')
    } else {
      // Fallback to document
      document.addEventListener('keydown', handleKeyDown, true)
      document.addEventListener('keyup', handleKeyUp, true)
      document.body.focus()
      console.log('✅ Keyboard listeners attached to document as fallback')
    }

    return () => {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        canvas.removeEventListener('keydown', handleKeyDown, true)
        canvas.removeEventListener('keyup', handleKeyUp, true)
      }
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
      console.log('🧹 Keyboard listeners removed')
    }
  }, [])

  // Direct movement using refs to avoid state re-render issues
  const currentPosition = useRef<[number, number, number]>([0, 0, 0])
  const currentRotation = useRef<[number, number, number]>([0, 0, 0])
  
  // Movement update function - direct manipulation
  useFrame(() => {
    const speed = 0.2 // Faster movement
    let newX = currentPosition.current[0]
    let newZ = currentPosition.current[2]
    let newRotY = currentRotation.current[1]
    let moving = false

    // Check WASD keys
    if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) {
      newZ -= speed
      newRotY = 0
      moving = true
    }
    if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) {
      newZ += speed
      newRotY = Math.PI
      moving = true
    }
    if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) {
      newX -= speed
      newRotY = Math.PI / 2
      moving = true
    }
    if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) {
      newX += speed
      newRotY = -Math.PI / 2
      moving = true
    }

    // Only update if something changed
    if (newX !== currentPosition.current[0] || newZ !== currentPosition.current[2] || moving !== isMoving) {
      currentPosition.current = [newX, 0, newZ]
      currentRotation.current = [0, newRotY, 0]
      
      // Update React state less frequently
      setAvatarPosition([newX, 0, newZ])
      setAvatarRotation([0, newRotY, 0])
      setIsMoving(moving)

      // Update camera immediately
      if (cameraRef.current) {
        cameraRef.current.position.set(newX, 0.1, newZ)
        cameraRef.current.rotation.y = newRotY
      }

      console.log('🚀 DIRECT MOVEMENT:', {
        position: [newX, 0, newZ],
        rotation: newRotY,
        moving,
        keys: Array.from(keysPressed.current)
      })
    }
  })

  const gl = useMemo(() => ({
    preserveDrawingBuffer: false,
    powerPreference: "default" as const,
    antialias: false,
    alpha: false,
    stencil: false,
    depth: true,
    failIfMajorPerformanceCaveat: false
  }), [])

  const dpr = useMemo(() => [1, 1.5] as [number, number], [])

  const handleCanvasCreated = useCallback((state: any) => {
    const canvas = state.gl.domElement
    const webglContext = state.gl.getContext() as WebGLRenderingContext
    
    console.log('WebGL context created, memory info:', {
      maxTextures: webglContext.getParameter(webglContext.MAX_TEXTURE_IMAGE_UNITS),
      maxTextureSize: webglContext.getParameter(webglContext.MAX_TEXTURE_SIZE),
      maxVertexAttribs: webglContext.getParameter(webglContext.MAX_VERTEX_ATTRIBS)
    })
    
    canvas.addEventListener('webglcontextlost', (e: Event) => {
      e.preventDefault()
      console.log('WebGL context lost! Forcing simple avatar mode and reloading...')
      localStorage.setItem('forceSimpleAvatar', 'true')
      setTimeout(() => window.location.reload(), 1000)
    })
    
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored successfully!')
    })
  }, [])

  const otherPlayers = useMemo(() => 
    lobby.filter(p => p.id !== currentPlayer?.id), 
    [lobby, currentPlayer?.id]
  )

  return (
    <>
      {/* Movement Debug Panel */}
      <div className="absolute top-4 right-4 bg-black/95 text-white p-4 rounded-lg border-2 border-lime-400 z-50">
        <h3 className="text-xl font-bold mb-2">🚀 CLEANED CONTROLS</h3>
        <div className="space-y-1 text-sm">
          <div>Position: ({avatarPosition[0].toFixed(2)}, {avatarPosition[2].toFixed(2)})</div>
          <div>Moving: {isMoving ? '🟢 YES' : '⚪ NO'}</div>
          <div>Keys: <span className="text-lime-300">{currentKeys.join(', ') || 'None'}</span></div>
          <div className="text-yellow-300 mt-2">
            <strong>WASD = Move Avatar</strong><br/>
            <strong>Arrow Keys = Also Work</strong><br/>
            <strong>Click canvas to focus!</strong>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            ✅ Simple Avatar System<br/>
            ❌ Old complex systems removed<br/>
            ❌ Conflicting listeners removed
          </div>
        </div>
      </div>
      
    <Canvas 
      className="w-full h-full"
      gl={gl}
      onCreated={handleCanvasCreated}
      frameloop="always"
      dpr={dpr}
    >
      {/* Direct Camera Control */}
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0.1, 0]} near={0.001} far={1000} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Other Players */}
      {otherPlayers.map(player => (
        <SimpleAvatarSystem 
          key={player.id}
          avatar={player.avatar}
          position={player.position}
          rotation={player.rotation}
        />
      ))}
      
      {/* Your avatar - invisible in first person but follows your movement */}
      {currentPlayer && (
        <group visible={false}>
          <SimpleAvatarSystem 
            key="player-avatar"
            avatar={currentPlayer.avatar}
            position={avatarPosition}
            rotation={avatarRotation}
          />
        </group>
      )}
      
      {/* Position Indicator - BIG and BRIGHT - Updates with state */}
      <mesh position={[avatarPosition[0], avatarPosition[1] + 0.5, avatarPosition[2]]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={isMoving ? "#ff0000" : "#00ff00"} />
      </mesh>
      
      {/* Movement Trail - shows immediate position */}
      <mesh position={[avatarPosition[0], avatarPosition[1] + 1.5, avatarPosition[2]]}>
        <sphereGeometry args={[0.5]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
      
      {/* Reference cube for scale */}
      <mesh position={[0, 0.5, -5]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      
      {/* Ground plane */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshLambertMaterial color="#444444" />
      </mesh>
    </Canvas>
    </>
  )
})
