import { 
  useRef, 
  useCallback, 
  useMemo, 
  memo, 
  useState,
  startTransition
} from 'react'
import { Canvas, useFrame, type RootState } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import type { PerspectiveCamera as PerspectiveCameraType, Vector3Tuple } from 'three'
import { useGameStore } from '@/stores/gameStore'
import { ModernAvatarSystem } from '@/systems/Avatar/ModernAvatarSystem'
import { useKeyboardMovement } from '@/hooks/useKeyboardMovement'

// Movement controller that runs inside Canvas
function MovementController({ 
  updateMovement, 
  onMovementChange 
}: { 
  updateMovement: (delta: number) => any
  onMovementChange: (state: any) => void 
}) {
  useFrame((state, delta) => {
    const result = updateMovement(delta)
    
    // Update parent component with movement state (using React transition)
    startTransition(() => {
      onMovementChange(result)
    })
    
    // Log movement for debugging (only when keys are pressed)
    if (result.isMoving) {
      console.log('🚀 Frame update:', {
        delta: delta.toFixed(4),
        position: result.position.map(v => v.toFixed(2)),
        activeKeys: result.activeKeys
      })
    }
  })

  return null // This component doesn't render anything
}

// Modern camera component with proper typing
function FirstPersonCamera({ 
  position, 
  rotation 
}: { 
  position: Vector3Tuple
  rotation: Vector3Tuple 
}) {
  const cameraRef = useRef<PerspectiveCameraType>(null)
  
  useFrame(() => {
    if (cameraRef.current) {
      const [x, y, z] = position
      const [, rotY] = rotation
      
      // Position camera at avatar's eye level (scaled for tiny avatar)
      const eyeLevel = y + 0.02
      cameraRef.current.position.set(x, eyeLevel, z)
      cameraRef.current.rotation.y = rotY
    }
  })

  return (
    <PerspectiveCamera 
      ref={cameraRef} 
      makeDefault 
      position={position} 
      near={0.001} 
      far={1000}
      fov={75}
    />
  )
}

// Debug panel component
interface DebugPanelProps {
  position: Vector3Tuple
  isMoving: boolean
  activeKeys: string[]
  hookState: {
    position: Vector3Tuple
    rotation: Vector3Tuple
    isMoving: boolean
    activeKeys: string[]
  }
}

const DebugPanel = memo(function DebugPanel({ 
  position, 
  isMoving, 
  activeKeys,
  hookState
}: DebugPanelProps) {
  return (
    <div className="absolute top-4 right-4 bg-black/95 text-white p-4 rounded-lg border-2 border-lime-400 z-50">
      <h3 className="text-xl font-bold mb-2">🎮 AVATAR CONTROLS</h3>
      <div className="space-y-1 text-sm">
        <div>
          View State: ({position[0].toFixed(2)}, {position[2].toFixed(2)})
        </div>
        <div>
          Hook State: ({hookState.position[0].toFixed(2)}, {hookState.position[2].toFixed(2)})
        </div>
        <div>
          Moving: {isMoving ? '🟢 YES' : '⚪ NO'}
        </div>
        <div>
          Keys: <span className="text-lime-300">{activeKeys.join(', ') || 'None'}</span>
        </div>
        <div className="text-yellow-300 mt-2">
          <strong>WASD = Move Avatar</strong><br/>
          <strong>Arrow Keys = Also Work</strong><br/>
          <strong>Check browser console!</strong>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          ✅ Continuous frame updates<br/>
          ✅ AbortController cleanup<br/>
          ✅ Delta time movement<br/>
          ✅ Event capture mode
        </div>
      </div>
    </div>
  )
})

// Position indicator component
interface PositionIndicatorProps {
  position: Vector3Tuple
  isMoving: boolean
}

const PositionIndicator = memo(function PositionIndicator({ 
  position, 
  isMoving 
}: PositionIndicatorProps) {
  return (
    <group>
      {/* Main position indicator */}
      <mesh position={[position[0], position[1] + 0.5, position[2]]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={isMoving ? "#ff0000" : "#00ff00"} />
      </mesh>
      
      {/* Movement trail */}
      <mesh position={[position[0], position[1] + 1.5, position[2]]}>
        <sphereGeometry args={[0.5]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
    </group>
  )
})

// Main component
export const ModernFirstPersonView = memo(function ModernFirstPersonView() {
  const { currentPlayer, lobby } = useGameStore()
  const [movementState, setMovementState] = useState({
    position: [0, 0, 0] as Vector3Tuple,
    rotation: [0, 0, 0] as Vector3Tuple,
    isMoving: false,
    activeKeys: [] as string[]
  })

  // Modern keyboard movement hook
  const { currentState, updateMovement } = useKeyboardMovement({
    speed: 0.2,
    onStateChange: (state) => {
      // Use startTransition to prevent blocking
      startTransition(() => {
        setMovementState(state)
      })
    }
  })

  // Movement will be handled inside Canvas components

  // Memoized WebGL settings for performance
  const glSettings = useMemo(() => ({
    preserveDrawingBuffer: false,
    powerPreference: "default" as const,
    antialias: false,
    alpha: false,
    stencil: false,
    depth: true,
    failIfMajorPerformanceCaveat: false
  }), [])

  const dpr = useMemo(() => [1, 1.5] as [number, number], [])

  const handleCanvasCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement
    
    // Modern canvas setup
    canvas.style.outline = 'none' // Remove focus outline
    canvas.tabIndex = 0 // Make focusable
    canvas.focus() // Auto-focus for immediate input
    
    console.log('✅ Modern canvas setup complete')
    
    // WebGL context loss handling
    const handleContextLost = (e: Event) => {
      e.preventDefault()
      console.error('💥 WebGL context lost!')
    }

    const handleContextRestored = () => {
      console.log('✅ WebGL context restored!')
    }

    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [])

  // Memoized other players list
  const otherPlayers = useMemo(() => 
    lobby.filter(p => p.id !== currentPlayer?.id), 
    [lobby, currentPlayer?.id]
  )

  return (
    <>
      <DebugPanel 
        position={movementState.position}
        isMoving={movementState.isMoving}
        activeKeys={movementState.activeKeys}
        hookState={currentState}
      />
      
      <Canvas 
        className="w-full h-full cursor-none"
        gl={glSettings}
        onCreated={handleCanvasCreated}
        frameloop="always"
        dpr={dpr}
      >
        {/* Modern camera system */}
        <FirstPersonCamera 
          position={movementState.position} 
          rotation={movementState.rotation} 
        />
        
        {/* Movement controller with useFrame inside Canvas */}
        <MovementController 
          updateMovement={updateMovement}
          onMovementChange={setMovementState}
        />
        
        {/* Simple lighting setup */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Other players */}
        {otherPlayers.map(player => (
          <ModernAvatarSystem 
            key={player.id}
            avatar={player.avatar}
            position={player.position}
            rotation={player.rotation}
          />
        ))}
        
        {/* Player's own avatar (invisible in first person) */}
        {currentPlayer && (
          <ModernAvatarSystem 
            key="player-avatar"
            avatar={currentPlayer.avatar}
            position={movementState.position}
            rotation={movementState.rotation}
            visible={false}
          />
        )}
        
        {/* Visual feedback */}
        <PositionIndicator 
          position={movementState.position}
          isMoving={movementState.isMoving}
        />
        
        {/* World elements */}
        <mesh position={[0, 0.5, -5]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#00ffff" />
        </mesh>
        
        <mesh 
          position={[0, -1, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </Canvas>
    </>
  )
})
