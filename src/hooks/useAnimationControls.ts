import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import { Avatar } from '@/types'

// Global animation state management for shared access between components
const animationState = new Map<string, {
  mixer: THREE.AnimationMixer | null
  currentAction: THREE.AnimationAction | null
}>()

export function useAnimationControls(avatar: Avatar) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)

  // Register animation state globally so other components can access it
  const registerMixer = useCallback((mixer: THREE.AnimationMixer) => {
    mixerRef.current = mixer
    animationState.set(avatar.id, {
      mixer: mixer,
      currentAction: null
    })
  }, [avatar.id])

  // Play animation function that can be called from anywhere
  const playAnimation = useCallback((animationName: string) => {
    const state = animationState.get(avatar.id)
    if (!state?.mixer || !avatar.animations) return

    const animation = avatar.animations.find(anim => anim.name === animationName)
    if (!animation) return

    // Stop current animation
    if (state.currentAction) {
      state.currentAction.stop()
    }

    // Play new animation
    const newAction = state.mixer.clipAction(animation)
    newAction.reset()
    newAction.play()
    
    // Update state
    state.currentAction = newAction
    currentActionRef.current = newAction
    
    console.log(`🎭 Playing animation: ${animationName}`)
  }, [avatar.id, avatar.animations])

  // Get current state
  const getCurrentState = useCallback(() => {
    return animationState.get(avatar.id)
  }, [avatar.id])

  return {
    mixerRef,
    currentActionRef,
    registerMixer,
    playAnimation,
    getCurrentState
  }
}
