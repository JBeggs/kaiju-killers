import { useEffect, useRef, useCallback, startTransition } from 'react'
import type { Vector3Tuple } from 'three'

// Movement key configuration - easily extensible
const MOVEMENT_KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'], 
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight']
} as const

const RUN_KEYS = ['ShiftLeft', 'ShiftRight'] as const

type MovementDirection = keyof typeof MOVEMENT_KEYS
type MovementState = {
  position: Vector3Tuple
  rotation: Vector3Tuple
  isMoving: boolean
  isRunning: boolean
  velocity: { x: number; z: number; speed: number }
  activeKeys: string[]
}

interface UseKeyboardMovementOptions {
  speed?: number
  onStateChange?: (state: MovementState) => void
  initialPosition?: Vector3Tuple
}

export function useKeyboardMovement({
  speed = 0.2,
  onStateChange,
  initialPosition = [0, 0, 0]
}: UseKeyboardMovementOptions = {}) {
  const keysPressed = useRef(new Set<string>())
  const currentPosition = useRef<Vector3Tuple>(initialPosition)
  const currentRotation = useRef<Vector3Tuple>([0, 0, 0])
  
  // Log cleanup completion once
  useEffect(() => {
    console.log('✅ LOGGING OPTIMIZED: Reduced console spam from movement system')
  }, [])
  
  const updateMovement = useCallback((deltaTime = 0.016) => {
    let moveX = 0
    let moveZ = 0
    let newRotY = currentRotation.current[1]
    let isMoving = false
    const runPressed = RUN_KEYS.some(k => keysPressed.current.has(k))
    const activeKeys = Array.from(keysPressed.current)
    
    // Only log when keys are actually pressed (reduce spam)
    if (keysPressed.current.size > 0) {
      console.log('🎮 MOVEMENT ACTIVE:', {
        activeKeys: activeKeys.join(', '),
        currentPos: `(${currentPosition.current[0].toFixed(3)}, ${currentPosition.current[1].toFixed(3)}, ${currentPosition.current[2].toFixed(3)})`,
        deltaTime: Number(deltaTime.toFixed(4))
      })
    }

    // Calculate movement based on pressed keys
    const directions = Object.entries(MOVEMENT_KEYS) as [MovementDirection, readonly string[]][]
    
    for (const [direction, keys] of directions) {
      const isPressed = keys.some(key => keysPressed.current.has(key))
      if (isPressed) {
        isMoving = true
        const runMultiplier = runPressed ? 1.8 : 1.0
        const frameSpeed = speed * runMultiplier * (deltaTime * 60) // Frame rate independent
        
        // Reduced key logging - only show direction
        
        switch (direction) {
          case 'forward':
            moveZ -= frameSpeed
            newRotY = 0
            break
          case 'backward':
            moveZ += frameSpeed
            newRotY = Math.PI
            break
          case 'left':
            moveX -= frameSpeed
            newRotY = Math.PI / 2
            break
          case 'right':
            moveX += frameSpeed
            newRotY = -Math.PI / 2
            break
        }
      }
    }

    // Update position/rotation if there's movement
    if (isMoving) {
      currentPosition.current = [
        currentPosition.current[0] + moveX,
        currentPosition.current[1],
        currentPosition.current[2] + moveZ
      ]
      
      // Face the movement vector (diagonals supported). Three.js yaw: 0 faces -Z.
      const len = Math.hypot(moveX, moveZ)
      if (len > 1e-6) {
        newRotY = Math.atan2(-moveX, -moveZ)
      }
      currentRotation.current = [0, newRotY, 0]
    }

    // Notify state change in transition to avoid blocking (only if something changed)
    if (onStateChange && (isMoving || keysPressed.current.size === 0)) {
      startTransition(() => {
        onStateChange({
          position: [...currentPosition.current],
          rotation: [...currentRotation.current],
          isMoving,
          isRunning: runPressed,
          velocity: { x: moveX, z: moveZ, speed: Math.hypot(moveX, moveZ) },
          activeKeys
        })
      })
    }

    // Return current state for immediate use
    const returnState = {
      position: currentPosition.current,
      rotation: currentRotation.current,
      isMoving,
      isRunning: runPressed,
      velocity: { x: moveX, z: moveZ, speed: Math.hypot(moveX, moveZ) },
      activeKeys
    }
    
    // Log movement completion only when significant change
    if (isMoving && Math.random() < 0.1) {
      console.log('✅ MOVEMENT COMPLETE:', {
        position: `(${returnState.position[0].toFixed(2)}, ${returnState.position[1].toFixed(2)}, ${returnState.position[2].toFixed(2)})`,
        activeKeys: returnState.activeKeys.join(', ')
      })
    }
    
    return returnState
  }, [speed, onStateChange])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const allKeys = [...Object.values(MOVEMENT_KEYS).flat(), ...RUN_KEYS]
    
    if (allKeys.includes(event.code as any)) {
      event.preventDefault()
      event.stopPropagation()
      
      if (!keysPressed.current.has(event.code)) {
        keysPressed.current.add(event.code)
        console.log('🎮 Key pressed:', event.code, 'Active keys:', Array.from(keysPressed.current))
        // JSON-friendly log for parser
        try {
          console.log('TPJ KEYS', JSON.stringify({ type: 'down', code: event.code, keys: Array.from(keysPressed.current) }))
        } catch {}
      }
    }
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const allKeys = [...Object.values(MOVEMENT_KEYS).flat(), ...RUN_KEYS]
    
    if (allKeys.includes(event.code as any)) {
      event.preventDefault()
      event.stopPropagation()
      
      if (keysPressed.current.has(event.code)) {
        keysPressed.current.delete(event.code)
        console.log('🎮 Key released:', event.code, 'Active keys:', Array.from(keysPressed.current))
        // JSON-friendly log for parser
        try {
          console.log('TPJ KEYS', JSON.stringify({ type: 'up', code: event.code, keys: Array.from(keysPressed.current) }))
        } catch {}
      }
    }
  }, [])

  useEffect(() => {
    // Modern event handling with proper cleanup
    const controller = new AbortController()
    const { signal } = controller
    
    // Add listeners with abort signal for automatic cleanup
    window.addEventListener('keydown', handleKeyDown, { signal, capture: true })
    window.addEventListener('keyup', handleKeyUp, { signal, capture: true })
    
    return () => {
      controller.abort()
      keysPressed.current.clear()
    }
  }, [handleKeyDown, handleKeyUp])

  return {
    currentState: {
      position: currentPosition.current,
      rotation: currentRotation.current,
      isMoving: keysPressed.current.size > 0,
      isRunning: RUN_KEYS.some(k => keysPressed.current.has(k)),
      velocity: { x: 0, z: 0, speed: 0 },
      activeKeys: Array.from(keysPressed.current)
    },
    updateMovement
  }
}
