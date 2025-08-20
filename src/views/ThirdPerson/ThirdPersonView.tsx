import { useRef, useCallback, useMemo, memo, useEffect, useState, startTransition } from 'react'
import { Canvas, useFrame, type RootState } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import type { Vector3Tuple } from 'three'
import { useGameStore } from '@/stores/gameStore'
import { ModernAvatarSystem } from '@/systems/Avatar/ModernAvatarSystem'
import { useKeyboardMovement } from '@/hooks/useKeyboardMovement'
import { WebGLStatus } from '@/components/WebGLStatus/WebGLStatus'
import { PerformanceHUD } from '@/components/PerformanceHUD/PerformanceHUD'
import { AnimationControls } from '@/components/AnimationControls/AnimationControls'

// Movement controller for third person view
function ThirdPersonMovementController({ 
  updateMovement, 
  onMovementChange 
}: { 
  updateMovement: (delta: number) => any
  onMovementChange: (state: any) => void 
}) {
  useFrame((state, delta) => {
    // Reduced frame logging - only occasionally
    if (Math.random() < 0.02) {
      console.log('🎮 FRAME ACTIVE:', {
        delta: Number(delta.toFixed(4)),
        clock: Number(state.clock.elapsedTime.toFixed(3))
      })
    }
    
    console.log('CALLING_UPDATE_MOVEMENT', delta)
    let result
    try {
      result = updateMovement(delta)
      console.log('UPDATE_MOVEMENT_RETURNED', result ? 'YES' : 'NO')
      
      // DEBUG: Log the result structure
      console.log('🔍 RESULT_STRUCTURE_DEBUG', {
        resultExists: !!result,
        resultType: typeof result,
        hasPosition: !!(result?.position),
        hasVelocity: !!(result?.velocity),
        hasActiveKeys: !!(result?.activeKeys),
        resultKeys: Object.keys(result || {})
      })
    } catch (error) {
      console.log('❌ UPDATE_MOVEMENT_ERROR', error)
      // Create a fallback result to prevent crashes
      result = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        isMoving: false,
        isRunning: false,
        activeKeys: [],
        velocity: { x: 0, z: 0, speed: 0 }
      }
    }
    
    console.log('🔄 AFTER_RESULT_STRUCTURE_DEBUG')
    
    console.log('🎮 FRAME RESULT:', {
      position: `(${result.position[0].toFixed(4)}, ${result.position[1].toFixed(4)}, ${result.position[2].toFixed(4)})`,
      isMoving: result.isMoving,
      activeKeys: result.activeKeys.join(', '),
      velocity: `(${result.velocity.x.toFixed(6)}, ${result.velocity.z.toFixed(6)}, speed: ${result.velocity.speed.toFixed(6)})`
    })
    // JSON-friendly for parser
    console.log('🔄 BEFORE_TPJ_FRAME_RESULT')
    try {
      console.log('TPJ FRAME_RESULT', JSON.stringify({
        position: result.position.map((v: number) => Number(v.toFixed(4))),
        isMoving: result.isMoving,
        isRunning: result.isRunning,
        activeKeys: result.activeKeys,
        velocity: {
          x: Number(result.velocity.x.toFixed(6)),
          z: Number(result.velocity.z.toFixed(6)),
          speed: Number(result.velocity.speed.toFixed(6))
        }
      }))
    } catch (error) {
      console.log('❌ TPJ_FRAME_RESULT_ERROR', error)
      console.log('🔍 RESULT_FOR_TPJ_DEBUG', {
        result,
        hasPosition: !!result?.position,
        positionType: typeof result?.position,
        hasVelocity: !!result?.velocity,
        velocityType: typeof result?.velocity
      })
    }
    
    console.log('🔄 AFTER_TPJ_FRAME_RESULT')

    // Log all the state we need
    const camPos = state.camera.position.toArray().map((v) => Number(v.toFixed(3)))
    const camTarget = (state as any).controls?.target?.toArray?.() || null
    const clock = state.clock.elapsedTime.toFixed(2)

    const posStr = `(${result.position[0].toFixed(3)}, ${result.position[1].toFixed(3)}, ${result.position[2].toFixed(3)})`
    const camPosStr = camPos ? `(${camPos[0].toFixed(3)}, ${camPos[1].toFixed(3)}, ${camPos[2].toFixed(3)})` : 'n/a'
    const camTargetStr = camTarget ? `(${camTarget[0].toFixed(3)}, ${camTarget[1].toFixed(3)}, ${camTarget[2].toFixed(3)})` : 'n/a'
    console.log('TP FRAME', {
      clock,
      delta: Number(delta.toFixed(4)),
      keys: result.activeKeys.join(', '),
      isMoving: result.isMoving,
      posStr,
      rotY: Number(result.rotation[1].toFixed(3)),
      camPosStr,
      camTargetStr
    })

    // JSON-friendly duplicate for logfile parsing
    console.log('🔄 BEFORE_TPJ_FRAME_JSON')
    try {
      console.log('TPJ FRAME', JSON.stringify({
        clock,
        delta: Number(delta.toFixed(4)),
        keys: result.activeKeys,
        isMoving: result.isMoving,
        isRunning: result.isRunning,
        velocity: result.velocity,
        pos: result.position.map((v: number) => Number(v.toFixed(3))),
        rotY: Number(result.rotation[1].toFixed(3)),
        camPos,
        camTarget,
        hasFocus: typeof document !== 'undefined' && document.activeElement === (state.gl?.domElement as any)
      }))
      // If moving but canvas isn't focused, auto-refocus and log it
      const canvasEl = state.gl?.domElement as HTMLCanvasElement | undefined
      const focused = typeof document !== 'undefined' && document.activeElement === canvasEl
      if (result.isMoving && canvasEl && !focused) {
        try {
          canvasEl.focus()
          console.log('TPJ FOCUS', JSON.stringify({ action: 'refocus', prevActiveTag: (document.activeElement as any)?.tagName || null }))
        } catch {}
      }
    } catch (tpjError) {
      console.log('❌ TPJ_FRAME_ERROR', tpjError)
    }
    
    console.log('🔄 AFTER_TPJ_FRAME_JSON')

    // DEBUG: Log before calling onMovementChange (OUTSIDE try-catch)
    console.log('🔄 ABOUT_TO_CALL_ON_MOVEMENT_CHANGE')
    
    startTransition(() => {
      console.log('🔄 INSIDE_START_TRANSITION_CALLING_ON_MOVEMENT_CHANGE')
      onMovementChange(result)
    })
  })

  return null // This component doesn't render anything
}



export const ThirdPersonView = memo(function ThirdPersonView() {
  // MASSIVE LOGGING - TRACK EVERY RENDER
  const viewRenderCount = useRef(0)
  const viewComponentId = useRef(`thirdperson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  viewRenderCount.current++
  
  // LOG ONLY FIRST FEW RENDERS AND OCCASIONALLY
  if (viewRenderCount.current <= 3 || (viewRenderCount.current % 50 === 1)) {
    console.log('🎬 THIRDPERSON_VIEW_RENDER', {
      componentId: viewComponentId.current,
      renderCount: viewRenderCount.current,
      timestamp: Date.now()
    })
  }
  
  const { currentPlayer, lobby } = useGameStore()
  
  // LOG GAMESTORE STATE - ONLY EVERY 10TH RENDER
  if (viewRenderCount.current % 10 === 1) {
    console.log('🎮 GAMESTORE_STATE', {
      currentPlayerExists: !!currentPlayer,
      currentPlayerId: currentPlayer?.id,
      currentPlayerName: currentPlayer?.name,
      avatarExists: !!currentPlayer?.avatar,
      avatarName: currentPlayer?.avatar?.name,
      lobbyExists: !!lobby,
      timestamp: Date.now()
    })
  }
  console.log('GAMESTORE_CHECK', currentPlayer?.avatar?.name || 'NO_AVATAR') // Simple log
  
  // Canvas reference removed - not needed in current implementation
  const cameraRef = useRef<any>(null)
  const canvasElRef = useRef<HTMLCanvasElement | null>(null)
  const controlsRef = useRef<any>(null) // kept for potential future use
  
  // Movement state for player avatar
  const [movementState, setMovementState] = useState({
    position: [0, 0, 0] as Vector3Tuple,
    rotation: [0, 0, 0] as Vector3Tuple,
    isMoving: false,
    isRunning: false,
    activeKeys: [] as string[]
  })
  
  // LOG MOVEMENT STATE CHANGES - REDUCE FREQUENCY
  const prevMovementState = useRef(movementState)
  const movementStateChanged = JSON.stringify(movementState) !== JSON.stringify(prevMovementState.current)
  if (movementStateChanged && (movementState.isMoving || Math.random() < 0.05)) {
    console.log('🏃 MOVEMENT_STATE_CHANGED', {
      componentId: viewComponentId.current,
      renderCount: viewRenderCount.current,
      oldState: prevMovementState.current,
      newState: movementState,
      timestamp: Date.now()
    })
    console.log('MOVEMENT_STATE_CHANGE', `${movementState.position.join(',')}_${movementState.isMoving}`) // Simple log
    prevMovementState.current = movementState
  }

  // Modern keyboard movement hook - RESET TO ORIGIN
  // ONLY LOG KEYBOARD HOOK CREATION ONCE
  const keyboardHookCreated = useRef(false)
  if (!keyboardHookCreated.current) {
    console.log('🎮 CREATING_KEYBOARD_MOVEMENT_HOOK', {
      componentId: viewComponentId.current,
      renderCount: viewRenderCount.current,
      timestamp: Date.now()
    })
    console.log('KEYBOARD_HOOK_CREATE', viewRenderCount.current) // Simple log
    keyboardHookCreated.current = true
  }
  
  const { updateMovement } = useKeyboardMovement({
    speed: 0.2,
    initialPosition: [0, 0, 0], // Start from origin
    onStateChange: useCallback((state: {
      position: [number, number, number]
      rotation: [number, number, number]
      isMoving: boolean
      isRunning: boolean
      activeKeys: string[]
      velocity: { x: number; z: number; speed: number }
    }) => {
      // DEBUG: Log every onStateChange call
      console.log('🔄 ON_STATE_CHANGE_CALLED', {
        position: state.position.map((n: number) => Number(n.toFixed(4))),
        isMoving: state.isMoving,
        isRunning: state.isRunning,
        activeKeys: state.activeKeys,
        timestamp: Date.now()
      })
      // REDUCE LOGGING TO PREVENT RENDER LOOPS - Only log when moving or occasionally
      if (state.isMoving || Math.random() < 0.01) {
        console.log('🔄 KEYBOARD_HOOK_STATE_CHANGE', {
          componentId: viewComponentId.current,
          renderCount: viewRenderCount.current,
          position: `(${state.position[0].toFixed(4)}, ${state.position[1].toFixed(4)}, ${state.position[2].toFixed(4)})`,
          positionArray: state.position.map((n: number) => Number(n.toFixed(4))),
          isMoving: state.isMoving,
          activeKeys: state.activeKeys.join(', '),
          velocity: `(${state.velocity.x.toFixed(6)}, ${state.velocity.z.toFixed(6)}, speed: ${state.velocity.speed.toFixed(6)})`,
          timestamp: Date.now()
        })
        console.log('KEYBOARD_STATE_CHANGE', `${state.position.join(',')}_${state.isMoving}`) // Simple log
      }
      
      // Use startTransition to prevent blocking
      startTransition(() => {
        if (state.isMoving || Math.random() < 0.01) {
          console.log('🔄 MOVEMENT STATE UPDATED:', {
            position: `(${state.position[0].toFixed(4)}, ${state.position[1].toFixed(4)}, ${state.position[2].toFixed(4)})`,
            positionArray: state.position.map((n: number) => Number(n.toFixed(4))),
            isMoving: state.isMoving,
            activeKeys: state.activeKeys.join(', '),
            velocity: `(${state.velocity.x.toFixed(6)}, ${state.velocity.z.toFixed(6)}, speed: ${state.velocity.speed.toFixed(6)})`
          })
          try {
            console.log('TPJ MOVEMENT_STATE', JSON.stringify({
              position: state.position.map((n: number) => Number(n.toFixed(4))),
              isMoving: state.isMoving,
              isRunning: state.isRunning,
              activeKeys: state.activeKeys,
              velocity: {
                x: Number(state.velocity.x.toFixed(6)),
                z: Number(state.velocity.z.toFixed(6)),
                speed: Number(state.velocity.speed.toFixed(6))
              }
            }))
          } catch {}
        }
        
        // Create clean state object for setMovementState
        const cleanState = {
          position: state.position as Vector3Tuple,
          rotation: state.rotation as Vector3Tuple,
          isMoving: state.isMoving,
          isRunning: state.isRunning,
          activeKeys: state.activeKeys,
          velocity: state.velocity
        }
        
        // DEBUG: Log setMovementState call
        console.log('🔄 SET_MOVEMENT_STATE_CALLED', {
          position: cleanState.position.map((n: number) => Number(n.toFixed(4))),
          isMoving: cleanState.isMoving,
          activeKeys: cleanState.activeKeys,
          timestamp: Date.now()
        })
        
        setMovementState(cleanState)
      })
    }, []) // Empty dependency array to prevent recreation
  })

  // Debug: Log when movement state changes
  useEffect(() => {
    const posStr = `(${movementState.position[0].toFixed(2)}, ${movementState.position[1].toFixed(2)}, ${movementState.position[2].toFixed(2)})`
    console.log('🎯 ThirdPerson movementState updated:', {
      position: posStr,
      isMoving: movementState.isMoving,
      activeKeys: movementState.activeKeys.join(', ')
    })
  }, [movementState])
  
  // Add global helper functions for debugging
  useEffect(() => {
    // Add global functions to control avatar mode
    if (typeof window !== 'undefined') {
      (window as any).enableHector = () => {
        try {
          localStorage.removeItem('forceSimpleAvatar')
          console.log('✅ Hector enabled! Reloading page...')
          if (window.location && typeof window.location.reload === 'function') {
            window.location.reload()
          } else {
            console.warn('⚠️ window.location.reload not available, please refresh manually')
          }
        } catch (error) {
          console.error('❌ Error in enableHector:', error)
          console.log('🔧 Try manually: localStorage.removeItem("forceSimpleAvatar"); then refresh page')
        }
      }

      (window as any).disableHector = () => {
        try {
          localStorage.setItem('forceSimpleAvatar', 'true')
          console.log('✅ Simple avatar fallback enabled! Reloading page...')
          if (window.location && typeof window.location.reload === 'function') {
            window.location.reload()
          } else {
            console.warn('⚠️ window.location.reload not available, please refresh manually')
          }
        } catch (error) {
          console.error('❌ Error in disableHector:', error)
          console.log('🔧 Try manually: localStorage.setItem("forceSimpleAvatar", "true"); then refresh page')
        }
      }
    }

    console.log('🔍 Debug commands available:')
    console.log('  enableHector()  - Enable Hector avatar')
    console.log('  disableHector() - Use simple avatar fallback')

    // Add comprehensive WebGL diagnostics
    const checkWebGLSupport = () => {
      console.log('🔍 DIAGNOSTIC: Checking WebGL support...')
      
      try {
        const canvas = document.createElement('canvas')
        
        const results = {
          webgl1: false,
          webgl1Error: undefined as any,
          webgl1HasGetParameter: false,
          webgl2: false,
          webgl2Error: undefined as any,
          webgl2HasGetParameter: false,
          vendor: 'unknown',
          renderer: 'unknown'
        }
        
        // Test WebGL 1.0
        try {
          const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
          if (gl1) {
            results.webgl1 = true
            results.webgl1HasGetParameter = typeof (gl1 as any).getParameter === 'function'
          }
        } catch (e) {
          results.webgl1Error = e
        }
        
        // Test WebGL 2.0
        try {
          const gl2 = canvas.getContext('webgl2')
          if (gl2) {
            results.webgl2 = true
            results.webgl2HasGetParameter = typeof gl2.getParameter === 'function'
          }
        } catch (e) {
          results.webgl2Error = e
        }
        
        console.log('🔍 DIAGNOSTIC: WebGL Support Analysis:', results)
        
        // Try to get additional info if WebGL 1.0 is available
        if (results.webgl1) {
          try {
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
            if (gl && typeof (gl as any).getParameter === 'function') {
              const info = {
                version: (gl as any).getParameter((gl as any).VERSION),
                renderer: (gl as any).getParameter((gl as any).RENDERER),
                vendor: (gl as any).getParameter((gl as any).VENDOR)
              }
              console.log('🔍 DIAGNOSTIC: WebGL 1.0 test successful:', info)
            }
          } catch (infoError) {
            console.warn('🔍 DIAGNOSTIC: Could not get WebGL info:', infoError)
          }
        }
        
        return results
      } catch (error) {
        console.error('🔍 DIAGNOSTIC: WebGL check failed:', error)
        return null
      }
    }

    checkWebGLSupport()
  }, [])

  const gl = useMemo(() => ({
    antialias: true,
    alpha: false,
    depth: true,
    failIfMajorPerformanceCaveat: false, // Allow low-performance contexts
    precision: "mediump" as const // More compatible than highp
  }), [])

  const handleCanvasCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement as HTMLCanvasElement
    canvasElRef.current = canvas
    canvas.style.outline = 'none'
    canvas.tabIndex = 0
    canvas.focus()
    console.log('✅ Canvas created successfully - WebGL context stable (focused for keyboard)')
  }, [])

  // Camera and player position calculations (now using movement state)
  const playerPosition = useMemo(() => movementState.position, [movementState.position])
  const cameraPosition: [number, number, number] = useMemo(() => [
    playerPosition[0] + 10,
    playerPosition[1] + 8,
    playerPosition[2] + 10
  ], [playerPosition])

  const otherPlayers = useMemo(() => 
    lobby.filter(p => p.id !== currentPlayer?.id), 
    [lobby, currentPlayer?.id]
  )

  function ThirdPersonCameraFollower({ target }: { target: [number, number, number] }) {
    useFrame(() => {
      console.log('🎥 CAMERA_FOLLOWER_USEFRAME')
      if (controlsRef.current) {
        controlsRef.current.target.set(target[0], target[1], target[2])
        controlsRef.current.update()
      }
    })
    return null
  }

  // Follow camera locked near the avatar's head and looking forward in avatar's heading
  function FollowCamera({ target, yaw }: { target: [number, number, number]; yaw: number }) {
    useFrame((state) => {
      // Avatar forward unit vector derived from yaw (rotation around Y)
      // Forward should match movement heading: yaw=0 => (0,0,-1)
      const fwdX = -Math.sin(yaw)
      const fwdZ = -Math.cos(yaw)
      // Camera desired position: slightly above head and a bit behind the avatar
      const headHeight = 1.6
      const behind = 3.5
      let desiredX = target[0] - fwdX * behind
      let desiredY = target[1] + headHeight
      let desiredZ = target[2] - fwdZ * behind

      // Maintain a minimum distance to prevent clipping
      const minDistance = 2.6
      const dx = desiredX - target[0]
      const dy = desiredY - target[1]
      const dz = desiredZ - target[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < minDistance && dist > 0.0001) {
        const s = minDistance / dist
        desiredX = target[0] + dx * s
        desiredY = target[1] + dy * s
        desiredZ = target[2] + dz * s
      }

      // Smooth camera movement
      const cam = state.camera
      const lerp = 0.2
      cam.position.x += (desiredX - cam.position.x) * lerp
      cam.position.y += (desiredY - cam.position.y) * lerp
      cam.position.z += (desiredZ - cam.position.z) * lerp

      // Look where the avatar is looking: a point ahead in forward direction
      const lookAhead = 10
      const lookX = target[0] + fwdX * lookAhead
      const lookY = target[1] + headHeight * 0.9
      const lookZ = target[2] + fwdZ * lookAhead
      cam.lookAt(lookX, lookY, lookZ)

      // Camera diagnostics for parser
      try {
        console.log('TPJ CAM', JSON.stringify({
          target,
          yaw: Number(yaw.toFixed(3)),
          desired: [Number(desiredX.toFixed(3)), Number(desiredY.toFixed(3)), Number(desiredZ.toFixed(3))],
          actual: cam.position.toArray().map((n: number) => Number(n.toFixed(3))),
          forward: [Number(fwdX.toFixed(3)), 0, Number(fwdZ.toFixed(3))],
          lookAt: [Number(lookX.toFixed(3)), Number(lookY.toFixed(3)), Number(lookZ.toFixed(3))]
        }))
      } catch {}
    })
    return null
  }

  return (
    <>
      <div 
        className="w-full h-full relative"
        onPointerDown={() => {
          // Ensure keyboard focus returns to canvas when user clicks anywhere in the view
          try { canvasElRef.current?.focus() } catch {}
        }}
      >
        <Canvas 
          className="w-full h-full"
          gl={gl}
          onCreated={handleCanvasCreated}
          frameloop="always"
          dpr={1}
          shadows
          onError={(error) => {
            console.error('❌ CANVAS ERROR:', error)
            // Don't re-throw - let scene load with fallback
          }}
        >
        <PerspectiveCamera 
          ref={cameraRef} 
          makeDefault 
          position={[cameraPosition[0], cameraPosition[1], cameraPosition[2]]}
        />
        {/* Follow camera for strict 3rd-person */}
        <FollowCamera 
          target={[movementState.position[0], movementState.position[1], movementState.position[2]]}
          yaw={movementState.rotation[1]}
        />
        
        {/* TEMPORARY: Free camera so you can look around */}
        <OrbitControls 
          target={[0, 0, 0]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={50}
          ref={controlsRef}
        />
        
        {/* Simple lighting setup - same as First Person */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Movement controller for third person view */}
        <ThirdPersonMovementController 
          updateMovement={updateMovement}
          onMovementChange={setMovementState}
        />

        {/* Keep OrbitControls target locked to avatar position */}
        <ThirdPersonCameraFollower target={[movementState.position[0], movementState.position[1], movementState.position[2]]} />
        
        {/* Current Player Avatar (controllable) */}
        {(() => {
          // REDUCE AVATAR RENDER CHECK LOGGING
          if (viewRenderCount.current % 20 === 1) {
            console.log('🔍 AVATAR RENDER CHECK:', {
              currentPlayerExists: !!currentPlayer,
              currentPlayerId: currentPlayer?.id,
              currentPlayerName: currentPlayer?.name,
              avatarExists: !!currentPlayer?.avatar,
              avatarName: currentPlayer?.avatar?.name,
              movementStatePosition: movementState.position,
              aboutToRenderAvatar: !!(currentPlayer && currentPlayer.avatar),
              viewComponentId: viewComponentId.current,
              viewRenderCount: viewRenderCount.current,
              timestamp: Date.now()
            })
          }
          console.log('AVATAR_RENDER_CHECK', `${currentPlayer?.avatar?.name || 'NO_AVATAR'}_${viewRenderCount.current}`) // Simple log
          return null
        })()}
        
        {/* MASSIVE LOGGING BEFORE CONDITIONAL RENDER */}
        {(() => {
          console.log('🚨 CONDITIONAL_RENDER_CHECK', {
            currentPlayerTruthy: !!currentPlayer,
            currentPlayerType: typeof currentPlayer,
            currentPlayerKeys: currentPlayer ? Object.keys(currentPlayer) : [],
            avatarTruthy: !!(currentPlayer?.avatar),
            avatarType: typeof currentPlayer?.avatar,
            avatarKeys: currentPlayer?.avatar ? Object.keys(currentPlayer.avatar) : [],
            willRenderAvatar: !!(currentPlayer && currentPlayer.avatar),
            viewComponentId: viewComponentId.current,
            viewRenderCount: viewRenderCount.current,
            timestamp: Date.now()
          })
          console.log('CONDITIONAL_CHECK', `${!!currentPlayer}_${!!(currentPlayer?.avatar)}_${viewRenderCount.current}`) // Simple log
          return null
        })()}
        
        {currentPlayer && (
          <>
            {            console.log('🎯 RENDERING AVATAR SYSTEM:', {
              playerId: currentPlayer.id,
              avatarName: currentPlayer.avatar.name,
              position: `(${movementState.position[0].toFixed(3)}, ${movementState.position[1].toFixed(3)}, ${movementState.position[2].toFixed(3)})`,
              positionArray: movementState.position.map(n => Number(n.toFixed(4))),
              scale: 1.0
            })}
            
            {/* PARENT COMPONENT RENDER TRACKING */}
            {(() => {
              console.log('🏗️ PARENT_RENDERING_AVATAR_SYSTEM', {
                parentComponent: 'ThirdPersonView',
                playerKey: currentPlayer.id,
                avatarName: currentPlayer.avatar.name,
                avatarObject: currentPlayer.avatar,
                avatarModel: !!currentPlayer.avatar.model,
                avatarAnimations: currentPlayer.avatar.animations?.length || 0,
                position: movementState.position,
                timestamp: Date.now(),
                note: 'About to render ModernAvatarSystem with these props'
              })
              console.log('PARENT_RENDER_AVATAR', currentPlayer.avatar.name) // Simple log for parser
              return null
            })()}
            
            <ModernAvatarSystem 
            avatar={currentPlayer.avatar}
              position={movementState.position}
              rotation={movementState.rotation}
              isMoving={movementState.isMoving}
              isRunning={movementState.isRunning}
              label="current"
              scale={1.0}
            />
            {/* COMPREHENSIVE CRASH POSITION DEBUGGING */}
            {(() => {
              console.log('🦸 CRASH POSITION FLOW - ThirdPersonView → ModernAvatarSystem:', {
                timestamp: Date.now(),
                position: `(${movementState.position[0].toFixed(3)}, ${movementState.position[1].toFixed(3)}, ${movementState.position[2].toFixed(3)})`,
                rotation: `(${movementState.rotation[0].toFixed(3)}, ${movementState.rotation[1].toFixed(3)}, ${movementState.rotation[2].toFixed(3)})`,
                isMoving: movementState.isMoving,
                isRunning: movementState.isRunning,
                activeKeys: movementState.activeKeys.join(', '),
                positionArray: movementState.position.map(n => Number(n.toFixed(4))),
                rotationArray: movementState.rotation.map(n => Number(n.toFixed(4)))
              })
              
              // JSON version for parsing
              console.log('TPJ CRASH_FLOW', JSON.stringify({
                source: 'ThirdPersonView',
                target: 'ModernAvatarSystem',
                position: movementState.position.map(n => Number(n.toFixed(4))),
                rotation: movementState.rotation.map(n => Number(n.toFixed(4))),
                moving: movementState.isMoving,
                keys: movementState.activeKeys
              }))
              
              return null
            })()}
            
            {/* Debug: Visual position indicator */}
            <mesh position={[movementState.position[0], movementState.position[1] + 2, movementState.position[2]]}>
              <sphereGeometry args={[0.5]} />
              <meshBasicMaterial color={movementState.isMoving ? "#ff0000" : "#00ff00"} />
            </mesh>
          </>
        )}
        
        {/* Other Players - REMOVED for debugging */}
        {(() => {
          console.log('🔍 OTHER PLAYERS DISABLED:', {
            otherPlayersCount: otherPlayers.length,
            note: 'Other players disabled for debugging'
          })
          return null
        })()}
        
        {/* Simple world elements - same as First Person */}
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

        {/* Third Person Debug Panel */}
        <div className="absolute top-4 right-4 bg-black/95 text-white p-4 rounded-lg border-2 border-blue-400 z-50">
          <h3 className="text-xl font-bold mb-2">🎮 THIRD PERSON</h3>
          <div className="space-y-1 text-sm">
            <div>
              Position: ({movementState.position[0].toFixed(2)}, {movementState.position[2].toFixed(2)})
            </div>
            <div>
              Moving: {movementState.isMoving ? '🟢 YES' : '⚪ NO'}
            </div>
            <div>
              Keys: <span className="text-lime-300">{movementState.activeKeys.join(', ') || 'None'}</span>
            </div>
            <div className="text-yellow-300 mt-2">
              <strong>WASD = Move Avatar</strong><br/>
              <strong>Mouse = Orbit Camera</strong><br/>
              <strong>Scroll = Zoom</strong>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              ✅ Same simple room<br/>
              ✅ Avatar control<br/>
              ✅ Watch your avatar move
            </div>
          </div>
        </div>

        <WebGLStatus />
        <PerformanceHUD />
        
        {/* Animation Controls - outside Canvas for current player */}
        {currentPlayer && currentPlayer.avatar.animations && (
          <AnimationControls 
            avatar={currentPlayer.avatar} 
          />
        )}
      </div>
    </>
  )
})