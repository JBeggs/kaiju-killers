import { useRef, useEffect, memo } from 'react'
import { Group } from 'three'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Avatar } from '@/types'
import { useAnimationControls } from '@/hooks/useAnimationControls'

interface SimpleAvatarSystemProps {
  avatar: Avatar
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export const SimpleAvatarSystem = memo(function SimpleAvatarSystem({ 
  avatar, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0] 
}: SimpleAvatarSystemProps) {
  const groupRef = useRef<Group>(null)
  const { mixerRef, registerMixer } = useAnimationControls(avatar)

  useEffect(() => {
    if (groupRef.current && avatar.model) {
      console.log('🎯 Setting up simple avatar:', avatar.name)
      
      // Clear existing
      groupRef.current.clear()
      
      // Clone and add the model
      const clonedModel = avatar.model.clone()
      
      // Simple scaling - normal human size
      clonedModel.scale.set(1.0, 1.0, 1.0) // Full size
      console.log('✅ SIMPLE AVATAR SCALING FIXED:', {
        avatarName: avatar.name,
        scale: [1.0, 1.0, 1.0],
        status: 'NORMAL_HUMAN_SIZE'
      })
      
      // Ensure it's visible
      clonedModel.visible = true
      clonedModel.traverse((child: any) => {
        if (child.isMesh) {
          child.visible = true
          // Keep existing materials - don't modify them
        }
      })
      
      groupRef.current.add(clonedModel)
      
      // Setup animations if available
      if (avatar.animations && avatar.animations.length > 0) {
        console.log(`🎬 Setting up animations for ${avatar.name}`)
        const mixer = new THREE.AnimationMixer(clonedModel)
        registerMixer(mixer)
        
        // Auto-play idle animation
        const idleAnim = avatar.animations.find(anim => 
          anim.name.toLowerCase().includes('idle')
        ) || avatar.animations[0]
        
        if (idleAnim) {
          const action = mixer.clipAction(idleAnim)
          action.setLoop(THREE.LoopRepeat, Infinity)
          action.play()
          console.log(`▶️ Playing: ${idleAnim.name}`)
        }
      }
    }
  }, [avatar.id, avatar.model, registerMixer])

  // Simple position/rotation updates and animation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.set(...position)
      groupRef.current.rotation.set(...rotation)
    }
    
    // Update animations
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Model is added via groupRef.current?.add(clonedModel) */}
    </group>
  )
})
