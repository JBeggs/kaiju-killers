import { useRef, useEffect, useState, memo } from 'react'
import { Group, MeshBasicMaterial } from 'three'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Avatar } from '@/types'
import { SimpleAvatarTest } from '@/components/SimpleAvatarTest/SimpleAvatarTest'
import { useAnimationControls } from '@/hooks/useAnimationControls'

interface AvatarSystemProps {
  avatar: Avatar
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export const AvatarSystem = memo(function AvatarSystem({ avatar, position = [0, 0, 0], rotation = [0, 0, 0] }: AvatarSystemProps) {
  const groupRef = useRef<Group>(null)
  const { mixerRef, currentActionRef, registerMixer } = useAnimationControls(avatar)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    // Check if user forced simple avatar mode
    if (localStorage.getItem('forceSimpleAvatar') === 'true') {
      console.log('Simple avatar mode forced by user')
      // Note: Simple avatar fallback would be handled elsewhere if needed
      return
    }

    // Listen for WebGL context restoration
    const handleContextRestored = () => {
      console.log('WebGL context restored - refreshing avatar:', avatar.name)
      // Clear and re-add model to force re-render
      if (groupRef.current && avatar.model) {
        groupRef.current.clear()
        setTimeout(() => {
          setLoadError(false)
          // This will trigger the useEffect to re-add the model
        }, 100)
      }
    }

    // Safety check for addEventListener
    if (typeof window !== 'undefined' && window.addEventListener && typeof window.addEventListener === 'function') {
      window.addEventListener('webgl-context-restored', handleContextRestored)
    } else {
      console.warn('⚠️ window.addEventListener not available in AvatarSystem')
    }
    
    console.log('🔍 AvatarSystem processing:', {
      name: avatar.name,
      modelExists: !!avatar.model,
      modelName: avatar.model?.name,
      modelType: avatar.model?.type,
      isPrimitive: avatar.model?.name === 'PrimitiveAvatar',
      groupRefExists: !!groupRef.current
    })

    // Handle primitive avatars in useEffect too
    if (avatar.model?.name === 'PrimitiveAvatar') {
      console.log('✅ Primitive avatar detected in useEffect - skipping processing')
      return
    }

    if (groupRef.current && avatar.model) {
      // REMOVED try-catch - let errors surface!
        // Clear existing geometry to free memory
        groupRef.current?.clear()
        
        const clonedModel = avatar.model.clone()
        
        // Don't set scale here - will be set later with AVATAR_SCALE
        // clonedModel.scale.set(0.3, 0.3, 0.3) // REMOVED - conflicts with later scaling
        
        // GLTF models should come correctly oriented - don't flip them
        clonedModel.rotation.x = 0  // No flip for GLTF
        clonedModel.rotation.y = 0  // No Y rotation
        clonedModel.rotation.z = 0  // No Z rotation  
        clonedModel.position.y = 0   // At origin for now
        
        clonedModel.traverse((child: any) => {
          // Debug: Find the real Hector mesh
          console.log('🔍 Found child:', {
            name: child.name,
            type: child.type,
            isMesh: child.isMesh,
            isSkinnedMesh: child.isSkinnedMesh,
            hasGeometry: !!child.geometry,
            scale: child.scale,
            children: child.children.length
          })
          
          // Scale and position the actual mesh objects, not just the wrapper
                        if (child.isMesh || child.isSkinnedMesh) {
                console.log('🎯 Scaling and positioning mesh:', child.name || 'unnamed')
                
                // Don't override GLTF mesh scales - let the parent model control scaling
                // child.scale.set(1, 1, 1) // REMOVED - this was making meshes huge!
                
                // Don't modify GLTF mesh transforms - let animations control them
                // child.rotation.x = 0  // REMOVED - interferes with animations  
                // child.position.y = 0  // REMOVED - let animations control position
                // child.position.x = 0  // REMOVED - let animations control position
                // child.position.z = 0  // REMOVED - let animations control position

                // Make sure material is visible
                if (child.material) {
                  child.material.transparent = false
                  child.material.opacity = 1.0
                  child.material.visible = true
                  // Add some brightness to make sure it's visible (only for MeshStandardMaterial)
                  if (child.material.type === 'MeshStandardMaterial' && child.material.emissive) {
                    child.material.emissive.setHex(0x222222) // Slight glow
                  }
                }

                console.log('🦖 Applied to GLTF mesh:', {
                  name: child.name,
                  scale: child.scale.x,
                  rotation: {
                    x: child.rotation.x,
                    y: child.rotation.y,
                    z: child.rotation.z
                  },
                  position: {
                    x: child.position.x,
                    y: child.position.y,
                    z: child.position.z
                  },
                  material: child.material?.type,
                  visible: child.visible
                })
              }
          
          if (child.material) {
            // Handle textures more carefully for GLTF compatibility
            if (child.material.map) {
              const texture = child.material.map
              console.log(`🖼️ Processing texture for ${child.name || 'unnamed'}:`, {
                hasImage: !!texture.image,
                imageSize: texture.image ? `${texture.image.width}x${texture.image.height}` : 'no image',
                flipY: texture.flipY,
                filter: `min:${texture.minFilter} mag:${texture.magFilter}`
              })

              // Only remove clearly invalid textures
              if (!texture.image) {
                console.warn('🔧 Removing texture with no image data')
                child.material.map = null
                child.material.needsUpdate = true
              } else if (texture.image.width <= 0 || texture.image.height <= 0) {
                console.warn('🔧 Removing texture with invalid dimensions')
                child.material.map = null
                child.material.needsUpdate = true
              } else {
                // For GLTF textures, preserve the settings from GLTFLoader
                // Only ensure the texture is marked as needing update
                texture.needsUpdate = true
                console.log(`✅ Texture preserved for ${child.name || 'unnamed'}`)
              }
            }
            
            // Disable unnecessary material features to prevent WebGL errors
            child.material.needsUpdate = true
          }
          
          if (child.geometry) {
            // SIMPLIFIED: Only basic geometry validation to prevent WebGL context loss
            const geometry = child.geometry
            
            try {
              // Basic validation - hide mesh if geometry is invalid
              if (!geometry.attributes.position || geometry.attributes.position.count <= 0) {
                child.visible = false
                return
              }
              
              // SKIP complex geometry processing that might cause WebGL context loss
              console.log('📦 Geometry OK:', geometry.attributes.position.count, 'vertices')
              
            } catch (error) {
              console.warn('🔧 Geometry error, hiding mesh:', error instanceof Error ? error.message : 'Unknown error')
              child.visible = false
            }
          }
        })
        
        groupRef.current?.add(clonedModel)
        
                // Don't override scale here - let the manual scaling handle it
        // clonedModel.scale.set(1, 1, 1) // Removed - conflicts with manual scaling
        clonedModel.position.set(0, 0, 0) // Exactly where camera is targeting
        clonedModel.visible = true

        console.log('🎯 POSITIONING model at camera target:', {
          position: clonedModel.position.toArray(),
          scale: clonedModel.scale.toArray(),
          visible: clonedModel.visible
        })
        
        // Setup animations if available
        if (avatar.animations && avatar.animations.length > 0) {
          console.log(`🎬 Setting up ${avatar.animations.length} animations:`, avatar.animations.map(a => a.name))
          
          // Create new mixer for this cloned model
          const mixer = new THREE.AnimationMixer(clonedModel)
          registerMixer(mixer)
          
          // Find a default animation to play (prefer idle, then walking, then first available)
          let defaultAnimation = avatar.animations.find(anim => anim.name.toLowerCase().includes('idle'))
          if (!defaultAnimation) defaultAnimation = avatar.animations.find(anim => anim.name.toLowerCase().includes('walking'))
          if (!defaultAnimation) defaultAnimation = avatar.animations[0]
          
          if (defaultAnimation) {
            console.log(`🎮 AUTO-PLAYING default animation: ${defaultAnimation.name}`)
            const action = mixer.clipAction(defaultAnimation)
            action.setLoop(THREE.LoopRepeat, Infinity) // Loop forever
            action.reset() // Reset to start
            action.setEffectiveWeight(1) // Full weight
            action.play()
            currentActionRef.current = action
            console.log(`✅ Animation "${defaultAnimation.name}" is now playing and looping!`, {
              isRunning: action.isRunning(),
              enabled: action.enabled,
              weight: action.getEffectiveWeight(),
              duration: defaultAnimation.duration
            })
          }
        } else {
          console.log('📷 No animations available for this avatar')
        }
        
        // PRESERVE TEXTURES - only fix materials that are problematic
        clonedModel.traverse((child: any) => {
          if (child.material) {
            // Check if material has textures - if so, keep them!
            if (child.material.map || child.material.normalMap || child.material.roughnessMap) {
              console.log('🖼️ Preserving textured material for:', child.name)
              // Keep the textured material but ensure it's visible
              child.material.transparent = false
              child.material.opacity = 1.0
              child.visible = true
            } else {
              // Only replace materials that have no textures
              console.log('🔧 Replacing untextured material with white for:', child.name)
              child.material = new MeshBasicMaterial({ color: 0xffffff })
              child.visible = true
            }
          }
        })
        
        console.log('🎯 FINAL GLTF MODEL SETUP:', {
          name: avatar.name,
          groupScale: clonedModel.scale.toArray(),
          groupPosition: clonedModel.position.toArray(),
          groupVisible: clonedModel.visible,
          totalChildren: clonedModel.children.length,
          boundingBox: 'Check if visible now!'
        })

        // REMOVED: Debug marker that was obscuring the main model
        
        // Enhanced debugging for visibility
        console.log('🔍 DETAILED MODEL DEBUG:', {
          modelName: avatar.name,
          modelVisible: clonedModel.visible,
          modelPosition: clonedModel.position.toArray(),
          modelScale: clonedModel.scale.toArray(),
          modelRotation: clonedModel.rotation.toArray(),
          totalMeshes: 0,
          visibleMeshes: 0,
          meshDetails: []
        })
        
        let meshCount = 0
        let visibleMeshCount = 0
        const meshDetails: any[] = []
        
        clonedModel.traverse((child: any) => {
          if (child.isMesh || child.isSkinnedMesh) {
            meshCount++
            if (child.visible) visibleMeshCount++
            
            meshDetails.push({
              name: child.name || 'unnamed',
              type: child.type,
              visible: child.visible,
              position: child.position.toArray(),
              scale: child.scale.toArray(),
              hasGeometry: !!child.geometry,
              hasMaterial: !!child.material,
              materialType: child.material?.type || 'none',
              materialColor: child.material?.color?.getHexString() || 'none'
            })
          }
        })
        
        console.log('🔍 MESH ANALYSIS:', {
          totalMeshes: meshCount,
          visibleMeshes: visibleMeshCount,
          meshDetails: meshDetails.slice(0, 5) // Show first 5 meshes
        })
        
        // REMOVED: Test cube that was obscuring the main model
        
        // REMOVED: Complex debugging was causing WebGL context loss
        console.log('🔍 Model loaded with', meshCount, 'meshes, all simplified for stability')
        
        // Calculate actual size after scaling - fix the method call
        let size = null
        
        try {
          if (clonedModel.children && clonedModel.children.length > 0) {
            // Get bounding box from first child with geometry
            for (const child of clonedModel.children) {
              if ((child as any).geometry) {
                (child as any).geometry.computeBoundingBox()
                const childBox = (child as any).geometry.boundingBox
                if (childBox) {
                  size = {
                    width: (childBox.max.x - childBox.min.x).toFixed(2),
                    height: (childBox.max.y - childBox.min.y).toFixed(2),
                    depth: (childBox.max.z - childBox.min.z).toFixed(2)
                  }
                  break
                }
              }
            }
          }
        } catch (e) {
          console.log('Could not calculate bounding box:', e)
          size = { width: "unknown", height: "unknown", depth: "unknown" }
        }
        
        // Calculate detailed kaiju dimensions for KAIJU KILLER game! 🦖
        const sizeInMeters = size ? {
          width: parseFloat(size.width),
          height: parseFloat(size.height), 
          depth: parseFloat(size.depth)
        } : null
        
        console.log('🦖 KAIJU KILLER - Monster Size Analysis:', {
          name: avatar.name,
          position: position,
          scale: clonedModel.scale.x,
          'SIZE_METERS': sizeInMeters ? `${sizeInMeters.width.toFixed(1)}m × ${sizeInMeters.height.toFixed(1)}m × ${sizeInMeters.depth.toFixed(1)}m` : 'unknown',
          'SIZE_CM': sizeInMeters ? `${(sizeInMeters.width * 100).toFixed(0)}cm × ${(sizeInMeters.height * 100).toFixed(0)}cm × ${(sizeInMeters.depth * 100).toFixed(0)}cm` : 'unknown',
          'SIZE_FEET': sizeInMeters ? `${(sizeInMeters.width * 3.28).toFixed(1)}ft × ${(sizeInMeters.height * 3.28).toFixed(1)}ft × ${(sizeInMeters.depth * 3.28).toFixed(1)}ft` : 'unknown',
          children: clonedModel.children.length,
          visible: clonedModel.visible,
          threat_level: sizeInMeters && sizeInMeters.height > 10 ? 'GODZILLA CLASS' : sizeInMeters && sizeInMeters.height > 5 ? 'BUILDING DESTROYER' : 'MANAGEABLE'
        })
        
        // MANUAL SIZE CONTROL: Set avatar to reasonable human scale
        console.log('🔧 Applying manual scaling for proper avatar size')
        
        // Set avatars to a reasonable size - adjust this value to make smaller/larger
        const AVATAR_SCALE = 1.0  // Full size - normal human scale
        clonedModel.scale.set(AVATAR_SCALE, AVATAR_SCALE, AVATAR_SCALE)
        
        console.log('✅ SCALING FIXED: Avatar scaled to normal human size:', {
          avatarName: avatar.name,
          scale: AVATAR_SCALE,
          finalScale: clonedModel.scale.toArray(),
          status: 'KAIJU_MODE_DISABLED'
        })
        
        setLoadError(false)
      // REMOVED catch block - let errors crash and show us what's wrong!
    } else {
      console.error('❌ AVATAR MODEL IS MISSING - THIS SHOULD CRASH:', avatar)
      throw new Error(`Avatar model is null or undefined: ${JSON.stringify(avatar)}`)
    }

    // Cleanup on unmount to prevent memory leaks
    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener && typeof window.removeEventListener === 'function') {
        window.removeEventListener('webgl-context-restored', handleContextRestored)
      }
      
      if (groupRef.current) {
        groupRef.current.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (child.material.map) child.material.map.dispose()
            child.material.dispose()
          }
        })
      }
    }
  }, [avatar.id, avatar.name, avatar.model])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.set(...position)
      groupRef.current.rotation.set(...rotation)
    }
    
    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  // NO MORE GRACEFUL FALLBACKS - let errors crash!
  
  // Handle primitive avatars specially
  if (avatar.model?.name === 'PrimitiveAvatar') {
    return <SimpleAvatarTest position={position} rotation={rotation} />
  }

  // If there's an error, throw it instead of hiding it
  if (loadError) {
    throw new Error(`AvatarSystem failed to load avatar: ${avatar.name}`)
  }

  // Render the actual avatar model
  return (
    <group position={position} rotation={rotation}>
      <group ref={groupRef}>
        {/* The actual avatar model is added here via groupRef.current?.add(clonedModel) */}
      </group>
      
      {/* Status indicator - removed to see main model clearly */}
    </group>
  )
})
