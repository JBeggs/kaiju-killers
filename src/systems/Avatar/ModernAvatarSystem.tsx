import { useRef, useEffect, memo, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Object3D, Mesh, AnimationMixer, MeshStandardMaterial } from 'three'
import * as THREE from 'three'
import type { Vector3Tuple } from 'three'
import type { Avatar } from '@/types'
import { analyzeModel, createNormalizedContainer, logModelAnalysis } from '@/utils/loaders/gltfInspector'

// Modern animation hook with proper cleanup
function useModernAnimationControls(avatar: Avatar) {
  const mixerRef = useRef<AnimationMixer | null>(null)
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)

  const registerMixer = useCallback((mixer: AnimationMixer) => {
    mixerRef.current = mixer
  }, [])

  const playAnimation = useCallback((animationName: string) => {
    const mixer = mixerRef.current
    if (!mixer || !avatar.animations) return false

    const animation = avatar.animations.find(anim => anim.name === animationName)
    if (!animation) return false

    // Stop current animation with crossfade
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.2)
    }

    // Play new animation with fade in
    const newAction = mixer.clipAction(animation)
    newAction.reset()
    newAction.fadeIn(0.2)
    newAction.setLoop(THREE.LoopRepeat, Infinity)
    newAction.play()
    
    currentActionRef.current = newAction
    
    console.log(`🎭 Playing animation: ${animationName}`)
    return true
  }, [avatar.animations])

  const cleanup = useCallback(() => {
    if (currentActionRef.current) {
      currentActionRef.current.stop()
    }
    if (mixerRef.current) {
      mixerRef.current.stopAllAction()
    }
  }, [])

  return {
    mixerRef,
    registerMixer,
    playAnimation,
    cleanup
  }
}

// Props interface with better typing
interface ModernAvatarSystemProps {
  avatar: Avatar
  position?: Vector3Tuple
  rotation?: Vector3Tuple
  scale?: number
  visible?: boolean
  isMoving?: boolean
  isRunning?: boolean
  label?: string
}

export const ModernAvatarSystem = memo(function ModernAvatarSystem({
  avatar,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1, // world-scale by default; model normalized to ~1.8m
  visible = true,
  isMoving = false,
  isRunning = false,
  label
}: ModernAvatarSystemProps) {
  // COMPONENT LIFECYCLE TRACKING
  const renderCount = useRef(0)
  const componentId = useRef(`avatar_${avatar.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const lastProps = useRef<any>({})
  
  renderCount.current++
  
  // GLOBAL INSTANCE GUARD - Prevent multiple instances of same avatar
  const globalKey = `instance_${avatar.name}`
  if ((window as any)[globalKey] && (window as any)[globalKey] !== componentId.current) {
    console.log('🚫 DUPLICATE_AVATAR_INSTANCE_DETECTED', {
      avatar: avatar.name,
      existingInstance: (window as any)[globalKey],
      newInstance: componentId.current,
      action: 'BLOCKING_NEW_INSTANCE'
    })
    console.log('DUPLICATE_INSTANCE_BLOCK', avatar.name) // Simple log for parser
    try {
      console.log('TPJ AVATAR_INSTANCE', JSON.stringify({
        avatar: avatar.name,
        status: 'duplicate_blocked',
        existingInstance: (window as any)[globalKey],
        newInstance: componentId.current
      }))
    } catch {}
    return null // Block this duplicate instance
  }
  if (!(window as any)[globalKey]) {
    (window as any)[globalKey] = componentId.current
    try {
      console.log('TPJ AVATAR_INSTANCE', JSON.stringify({
        avatar: avatar.name,
        status: 'primary_registered',
        instance: componentId.current
      }))
    } catch {}
  }
  
  // DETECT PROP CHANGES
  const propChanges = {
    position: JSON.stringify(position) !== JSON.stringify(lastProps.current.position),
    rotation: JSON.stringify(rotation) !== JSON.stringify(lastProps.current.rotation),
    scale: scale !== lastProps.current.scale,
    isMoving: isMoving !== lastProps.current.isMoving,
    isRunning: isRunning !== lastProps.current.isRunning,
    visible: visible !== lastProps.current.visible
  }
  lastProps.current = { position, rotation, scale, isMoving, isRunning, visible }
  
  // 🚨 COMPREHENSIVE RENDER LOGGING
  console.log('🎬 MODERN_AVATAR_SYSTEM_RENDER', {
    avatar: avatar.name,
    componentId: componentId.current,
    renderCount: renderCount.current,
    position: `(${position[0].toFixed(4)}, ${position[1].toFixed(4)}, ${position[2].toFixed(4)})`,
    scale,
    isMoving,
    isRunning,
    visible,
    label,
    propChanges,
    changedProps: Object.keys(propChanges).filter(key => propChanges[key as keyof typeof propChanges]),
    timestamp: Date.now()
  })
  console.log('AVATAR_RENDER_START', `${avatar.name}_${renderCount.current}`) // Simple log for parser
  
  // 🚨 LEGACY LOG (keeping for compatibility)
  console.log('🚨 AVATAR SYSTEM EXECUTING!', { 
    avatar: avatar.name, 
    timestamp: Date.now(),
    position: `(${position[0].toFixed(4)}, ${position[1].toFixed(4)}, ${position[2].toFixed(4)})`,
    isMoving,
    renderCount: renderCount.current
  })
  // JSON-friendly execution log for parser
  try {
    console.log('TPJ AVATAR_EXEC', JSON.stringify({
      avatar: avatar.name,
      ts: Date.now(),
      position: position.map(n => Number(n.toFixed(4))),
      isMoving,
      isRunning,
      label
    }))
  } catch {}
  
  // 🚨 CRASH DEBUG: Log all incoming props
  console.log('🎯 CRASH PROPS RECEIVED:', {
    avatar: avatar.name,
    position: position.map(n => Number(n.toFixed(4))),
    rotation: rotation.map(n => Number(n.toFixed(4))),
    scale,
    visible,
    isMoving,
    isRunning,
    label
  })
  
  // JSON version for parsing
  console.log('TPJ CRASH_PROPS', JSON.stringify({
    avatar: avatar.name,
    position: position.map(n => Number(n.toFixed(4))),
    rotation: rotation.map(n => Number(n.toFixed(4))),
    scale,
    visible,
    moving: isMoving
  }))
  
  const groupRef = useRef<Group>(null)
  const { mixerRef, registerMixer, playAnimation, cleanup } = useModernAnimationControls(avatar)
  const containerRef = useRef<THREE.Group | null>(null)
  const pivotRef = useRef<THREE.Group | null>(null)
  const hasSetupRunRef = useRef<boolean>(false)
  const lastWorldLogRef = useRef<number>(0)
  
  // DEBUG: Log props received
  console.log('🔄 AVATAR_PROPS_RECEIVED', {
    avatar: avatar.name,
    position: position.map(n => Number(n.toFixed(4))),
    isMoving,
    isRunning,
    scale,
    visible,
    renderCount: renderCount.current,
    timestamp: Date.now()
  })

  // JSON: render state snapshot (after refs are declared)
  try {
    console.log('TPJ AVATAR_RENDER', JSON.stringify({
      avatar: avatar.name,
      componentId: componentId.current,
      renderCount: renderCount.current,
      groupRefExists: !!groupRef.current,
      avatarModelExists: !!avatar.model,
      animationCount: avatar.animations?.length || 0,
      animations: (avatar.animations || []).map(c => c.name)
    }))
  } catch {}
  const lastPositionLogRef = useRef<number>(0)
  const strippedClipsRef = useRef<THREE.AnimationClip[] | null>(null)
  const currentClipNameRef = useRef<string | null>(null)
  const playStrippedRef = useRef<((name: string) => void) | null>(null)
  const avatarMetricsRef = useRef<{ height: number; bboxMin: number[]; bboxMax: number[] } | null>(null)

  // Remove root-motion by filtering position tracks from clips
  const getRootMotionStrippedClips = useCallback(() => {
    if (!avatar.animations || avatar.animations.length === 0) return [] as THREE.AnimationClip[]
    return avatar.animations.map((clip) => {
      const filteredTracks = clip.tracks.filter((track) => {
        // Track name format: `${nodePath}.${property}` e.g. "Hips.position" or "Armature/Hips.position"
        // We strip any position tracks to prevent internal translation (root motion)
        const endsWith = (suffix: string) => track.name.endsWith(suffix)
        const isPosition = endsWith('.position')
        return !isPosition
      })
      // Preserve name/duration; build a new clip with filtered tracks
      return new THREE.AnimationClip(clip.name, clip.duration, filteredTracks)
    })
  }, [avatar.animations])

  // Memoized model setup to avoid unnecessary recalculations
  const setupModel = useCallback(() => {
    // GUARD: Prevent duplicate execution - use avatar name as key
    const setupKey = `setup_${avatar.name}`
    if ((window as any).__currentSetup === setupKey) {
      console.log('🚫 SETUP_MODEL_DUPLICATE_PREVENTED', { avatar: avatar.name, setupKey })
      console.log('SETUP_MODEL_DUPLICATE_BLOCK', avatar.name) // Simple log for parser
      return containerRef.current // Return existing container if available
    }
    
    console.log('🔧 SETUP_MODEL_CALLED', {
      hasGroupRef: !!groupRef.current,
      hasAvatarModel: !!avatar.model,
      avatarName: avatar.name,
      timestamp: Date.now(),
      setupKey,
      callCount: (window as any).__setupModelCallCount = ((window as any).__setupModelCallCount || 0) + 1
    })
    console.log('SETUP_MODEL_START', avatar.name) // Simple log for parser
    
    if (!groupRef.current) {
      console.log('❌ SETUP_MODEL_FAILED_NO_GROUP_REF')
      console.log('SETUP_MODEL_FAIL_NO_GROUP', avatar.name) // Simple log for parser
      try { console.log('TPJ SETUP_FAIL', JSON.stringify({ avatar: avatar.name, reason: 'no_group_ref' })) } catch {}
      return null
    }
    
    if (!avatar.model) {
      console.log('❌ SETUP_MODEL_FAILED_NO_AVATAR_MODEL', avatar.name)
      console.log('SETUP_MODEL_FAIL_NO_MODEL', avatar.name) // Simple log for parser
      try { console.log('TPJ SETUP_FAIL', JSON.stringify({ avatar: avatar.name, reason: 'no_avatar_model' })) } catch {}
      return null
    }
    // Only mark as "in setup" after preconditions are satisfied
    ;(window as any).__currentSetup = setupKey

    console.log('✅ SETUP_MODEL_PROCEEDING', { 
      avatar: avatar.name,
      groupChildren: groupRef.current.children.length,
      groupChildNames: groupRef.current.children.map(child => child.name || 'unnamed'),
      modelType: avatar.model.constructor.name,
      modelHasChildren: avatar.model.children?.length || 0
    })
    console.log('SETUP_MODEL_PROCEED', avatar.name) // Simple log for parser
    console.log('🎯 Setting up modern avatar:', avatar.name)
    
    // Clear existing content
    console.log('🧹 CLEARING_GROUP_CONTENT', {
      avatar: avatar.name,
      childrenBeforeClear: groupRef.current.children.length
    })
    console.log('GROUP_CLEAR_START', avatar.name) // Simple log for parser
    groupRef.current.clear()
    console.log('GROUP_CLEAR_END', avatar.name) // Simple log for parser
    
    // Clone the model and normalize inside a container so we control one root
    console.log('🔄 CLONING_MODEL', {
      avatar: avatar.name,
      originalModelChildren: avatar.model.children?.length || 0,
      originalModelType: avatar.model.constructor.name
    })
    console.log('MODEL_CLONE_START', avatar.name) // Simple log for parser
    const clonedModel = avatar.model.clone()
    console.log('MODEL_CLONE_END', avatar.name) // Simple log for parser
    
    console.log('📊 ANALYZING_CLONED_MODEL', {
      avatar: avatar.name,
      clonedModelChildren: clonedModel.children?.length || 0
    })
    console.log('MODEL_ANALYZE_START', avatar.name) // Simple log for parser
    const analysis = analyzeModel(clonedModel)
    console.log('MODEL_ANALYZE_END', avatar.name) // Simple log for parser
    logModelAnalysis(avatar.name, analysis)
    try {
      const height = Number((analysis.size.y).toFixed(3))
      avatarMetricsRef.current = {
        height,
        bboxMin: analysis.boundingBox.min.toArray().map(n => Number(n.toFixed(3))),
        bboxMax: analysis.boundingBox.max.toArray().map(n => Number(n.toFixed(3)))
      }
      console.log('TPJ AVATAR_METRICS', JSON.stringify({
        name: avatar.name,
        height: avatarMetricsRef.current.height,
        bboxMin: avatarMetricsRef.current.bboxMin,
        bboxMax: avatarMetricsRef.current.bboxMax
      }))
    } catch {}
    console.log('🏗️ CREATING_NORMALIZED_CONTAINER', {
      originalModelExists: !!clonedModel,
      targetHeight: 1.8,
      avatar: avatar.name,
      timestamp: Date.now()
    })
    console.log('CONTAINER_CREATE_START', avatar.name) // Simple log for parser
    
    const container = createNormalizedContainer(clonedModel, { centerToGround: true, targetHeight: 1.8 })
    container.name = 'AvatarContainer'
    containerRef.current = container
    pivotRef.current = container.getObjectByName('AvatarPivot') as THREE.Group | null
    
    console.log('CONTAINER_CREATE_END', avatar.name) // Simple log for parser
    console.log('✅ NORMALIZED_CONTAINER_CREATED', {
      containerScale: `(${container.scale.x.toFixed(6)}, ${container.scale.y.toFixed(6)}, ${container.scale.z.toFixed(6)})`,
      containerChildren: container.children.length,
      pivotExists: !!pivotRef.current
    })
    
    // Apply desired global scale (post-normalization)
    const originalHeight = analysis.size.y
    const normalizedScaleFactor = originalHeight > 0 ? 1.8 / originalHeight : 1
    const finalScale = normalizedScaleFactor * scale
    const finalHeight = originalHeight * finalScale
    
    console.log(`🎯 ${avatar.name} SCALING ANALYSIS:`, {
      originalHeight,
      normalizedHeight: 1.8,
      normalizedScaleFactor,
      scaleMultiplier: scale,
      finalScale,
      finalHeight,
      containerScaleBefore: container.scale.toArray(),
    })
    container.scale.multiplyScalar(scale)
    
    console.log(`🎯 ${avatar.name} SCALING RESULT:`, {
      containerScale: `(${container.scale.x.toFixed(6)}, ${container.scale.y.toFixed(6)}, ${container.scale.z.toFixed(6)})`,
      scaleX: container.scale.x,
      scaleY: container.scale.y, 
      scaleZ: container.scale.z,
      expectedFinalHeight: finalHeight
    })
    
    // DEBUG: Check if scaling actually worked by measuring the container
    const bbox = new THREE.Box3().setFromObject(container)
    const actualHeight = bbox.max.y - bbox.min.y
    console.log(`🔍 SCALING VERIFICATION - ${avatar.name}:`, {
      expectedHeight: finalHeight,
      actualHeight: actualHeight,
      scalingWorked: Math.abs(actualHeight - finalHeight) < 0.5,
      boundingBox: {
        min: [bbox.min.x.toFixed(3), bbox.min.y.toFixed(3), bbox.min.z.toFixed(3)],
        max: [bbox.max.x.toFixed(3), bbox.max.y.toFixed(3), bbox.max.z.toFixed(3)]
      }
    })
    
    container.visible = true
    
    // Traverse and ensure visibility without modifying materials
    container.traverse((child: Object3D) => {
      child.visible = true
      
      // Cast to Mesh for material access
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh
        // Keep original materials intact - don't modify
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })

    // Skeleton diagnostics (once on setup)
    try {
      const skelInfo: any[] = []
      const meshInfo: any[] = []
      container.traverse((obj: any) => {
        if (obj.isSkinnedMesh && obj.skeleton) {
          const bones = obj.skeleton.bones || []
          skelInfo.push({
            name: obj.name,
            boneCount: bones.length,
            rootBone: obj.skeleton.bones[0]?.name || null,
            bonesPreview: bones.slice(0, 10).map((b: any) => b.name)
          })
        } else if (obj.isMesh) {
          meshInfo.push({ name: obj.name, hasMaterial: !!obj.material, geoAttrs: Object.keys(obj.geometry?.attributes || {}) })
        }
      })
      console.log('TPJ SKEL', JSON.stringify({ avatar: avatar.name, skinnedMeshes: skelInfo }))
      console.log('TPJ MESH', JSON.stringify({ avatar: avatar.name, meshes: meshInfo.slice(0, 20) }))
    } catch {}
    
    // Add to group
    console.log('➕ ADDING_CONTAINER_TO_GROUP', {
      containerExists: !!container,
      groupExists: !!groupRef.current,
      containerChildren: container.children.length,
      containerName: container.name,
      avatar: avatar.name,
      groupChildrenBefore: groupRef.current.children.length,
      timestamp: Date.now()
    })
    console.log('GROUP_ADD_START', avatar.name) // Simple log for parser
    
    // MASSIVE LOGGING BEFORE ADD
    console.log('🚨 BEFORE_GROUP_ADD', {
      avatar: avatar.name,
      groupExists: !!groupRef.current,
      containerExists: !!container,
      groupChildren: groupRef.current?.children.length || 0,
      containerParent: container.parent?.name || 'NO_PARENT',
      containerName: container.name,
      containerChildren: container.children.length,
      timestamp: Date.now()
    })
    
    if (!groupRef.current) {
      console.log('❌ GROUP_REF_NULL_DURING_ADD', { avatar: avatar.name })
      console.log('GROUP_ADD_FAIL', avatar.name) // Simple log for parser
      return container
    }
    
    try {
      groupRef.current.add(container)
      console.log('GROUP_ADD_SUCCESS', avatar.name) // Simple log for parser
      
      // MASSIVE LOGGING AFTER ADD
      console.log('🎉 AFTER_GROUP_ADD_SUCCESS', {
        avatar: avatar.name,
        groupChildren: groupRef.current.children.length,
        groupChildNames: groupRef.current.children.map(c => c.name || 'unnamed'),
        containerParent: container.parent?.name || 'NO_PARENT',
        containerInGroup: groupRef.current.children.includes(container),
        timestamp: Date.now()
      })
    } catch (error) {
      console.log('GROUP_ADD_FAIL', avatar.name) // Simple log for parser
      const err = error as any
      console.log('❌ GROUP_ADD_ERROR', {
        avatar: avatar.name,
        error: err?.message || String(err),
        errorStack: err?.stack,
        timestamp: Date.now()
      })
    }
    
    console.log('GROUP_ADD_END', avatar.name) // Simple log for parser
    console.log('✅ CONTAINER_ADDED_TO_GROUP', {
      groupChildren: groupRef.current.children.length,
      groupChildNames: groupRef.current.children.map(c => c.name || 'unnamed'),
      avatar: avatar.name,
      success: true,
      timestamp: Date.now()
    })
    
    // Setup animations
    if (avatar.animations && avatar.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(container)
      registerMixer(mixer)

      const strippedClips = getRootMotionStrippedClips()
      strippedClipsRef.current = strippedClips
      // JSON list of available clip names for diagnostics
      try {
        console.log('TPJ CLIPS', JSON.stringify({
          avatar: avatar.name,
          clips: strippedClips.map(c => c.name)
        }))
      } catch {}
      // Diagnostics: report stripped tracks per clip
      try {
        const originalPositionTrackCount = avatar.animations.reduce((acc, clip) => acc + clip.tracks.filter(t => t.name.endsWith('.position')).length, 0)
        const strippedPositionTrackCount = strippedClips.reduce((acc, clip) => acc + clip.tracks.filter(t => t.name.endsWith('.position')).length, 0)
        console.log('TP ANIM STRIP', {
          avatar: avatar.name,
          clips: avatar.animations.map(c => c.name),
          originalPositionTrackCount,
          strippedPositionTrackCount
        })
      } catch {}
      // Helper to play from stripped clips by name
      const playStrippedByName = (name: string) => {
        const clip = strippedClips.find((c) => c.name === name) || strippedClips[0]
        if (!clip) return
        const action = mixer.clipAction(clip)
        action.reset()
        action.fadeIn(0.2)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
        currentClipNameRef.current = clip.name
      }
      playStrippedRef.current = playStrippedByName

      // Auto-play preferred animation on load (prefer Smoking > Idle > Standing)
      const preferredOnLoad =
        strippedClips.find(c => /smok/i.test(c.name)) ||
        strippedClips.find(c => /idle/i.test(c.name)) ||
        strippedClips.find(c => /standing/i.test(c.name)) ||
        strippedClips[0]

      if (preferredOnLoad) {
        setTimeout(() => playStrippedByName(preferredOnLoad.name), 100)
      }

      console.log(`🎬 Setup ${avatar.animations.length} animations for ${avatar.name} (root motion stripped)`) 
    }
    
    // Detailed diagnostics for container and pivot
    try {
      const groupWorld = new THREE.Vector3()
      groupRef.current.getWorldPosition(groupWorld)
      const containerWorld = new THREE.Vector3()
      container.getWorldPosition(containerWorld)
      const pivot = pivotRef.current
      const pivotLocal = pivot ? pivot.position.toArray().map(n => Number(n.toFixed(3))) : null
      const pivotWorld = (() => {
        if (!pivot) return null
        const v = new THREE.Vector3()
        pivot.getWorldPosition(v)
        return v.toArray().map(n => Number(n.toFixed(3)))
      })()
      console.log('TP CONTAINER', {
        label: label || avatar.name,
        propsPos: `(${position[0].toFixed(3)}, ${position[1].toFixed(3)}, ${position[2].toFixed(3)})`,
        groupWorld: `(${groupWorld.x.toFixed(3)}, ${groupWorld.y.toFixed(3)}, ${groupWorld.z.toFixed(3)})`,
        containerLocal: `(${container.position.x.toFixed(3)}, ${container.position.y.toFixed(3)}, ${container.position.z.toFixed(3)})`,
        containerWorld: `(${containerWorld.x.toFixed(3)}, ${containerWorld.y.toFixed(3)}, ${containerWorld.z.toFixed(3)})`,
        containerScale: `(${container.scale.x.toFixed(3)}, ${container.scale.y.toFixed(3)}, ${container.scale.z.toFixed(3)})`,
        pivotLocal: pivotLocal ? `(${pivotLocal[0]}, ${pivotLocal[1]}, ${pivotLocal[2]})` : null,
        pivotWorld: pivotWorld ? `(${pivotWorld[0]}, ${pivotWorld[1]}, ${pivotWorld[2]})` : null
      })

      // JSON-friendly duplicate for logfile parsing
      console.log('TPJ CONTAINER', JSON.stringify({
        label: label || avatar.name,
        propsPos: position.map(n => Number(n.toFixed(3))),
        groupWorld: groupWorld.toArray().map(n => Number(n.toFixed(3))),
        containerLocal: container.position.toArray().map(n => Number(n.toFixed(3))),
        containerWorld: containerWorld.toArray().map(n => Number(n.toFixed(3))),
        containerScale: container.scale.toArray().map(n => Number(n.toFixed(3))),
        pivotLocal,
        pivotWorld
      }))
    } catch {}

    console.log('🎉 SETUP_MODEL_COMPLETE', {
      avatar: avatar.name,
      containerReturned: !!container,
      timestamp: Date.now(),
      totalCallCount: (window as any).__setupModelCallCount,
      setupKey
    })
    console.log('SETUP_MODEL_END', avatar.name) // Simple log for parser
    
    // Clear the setup guard
    delete (window as any).__currentSetup
    
    return container
  }, [avatar.model, avatar.name, avatar.animations, scale, registerMixer, playAnimation])
  
  // TRACK SETUPMODEL DEPENDENCY CHANGES
  const prevDeps = useRef<any>({})
  const currentDeps = {
    avatarModel: avatar.model,
    avatarName: avatar.name,
    avatarAnimations: avatar.animations,
    scale,
    registerMixer,
    playAnimation
  }
  
  const depChanges = {
    avatarModel: prevDeps.current.avatarModel !== currentDeps.avatarModel,
    avatarName: prevDeps.current.avatarName !== currentDeps.avatarName,
    avatarAnimations: prevDeps.current.avatarAnimations !== currentDeps.avatarAnimations,
    scale: prevDeps.current.scale !== currentDeps.scale,
    registerMixer: prevDeps.current.registerMixer !== currentDeps.registerMixer,
    playAnimation: prevDeps.current.playAnimation !== currentDeps.playAnimation
  }
  
  if (Object.values(depChanges).some(changed => changed)) {
    console.log('🔄 SETUPMODEL_DEPENDENCIES_CHANGED', {
      avatar: avatar.name,
      componentId: componentId.current,
      renderCount: renderCount.current,
      depChanges,
      changedDeps: Object.keys(depChanges).filter(key => depChanges[key as keyof typeof depChanges]),
      note: 'setupModel useCallback will be recreated due to these dependency changes'
    })
    console.log('SETUPMODEL_DEPS_CHANGED', avatar.name) // Simple log for parser
  }
  
  prevDeps.current = currentDeps

  // COMPONENT MOUNT/UNMOUNT TRACKING
  useEffect(() => {
    console.log('🎭 COMPONENT_MOUNTED', {
      avatar: avatar.name,
      componentId: componentId.current,
      timestamp: Date.now()
    })
    console.log('COMPONENT_MOUNT', avatar.name) // Simple log for parser
    
    return () => {
      console.log('🎭 COMPONENT_UNMOUNTED', {
        avatar: avatar.name,
        componentId: componentId.current,
        timestamp: Date.now()
      })
      console.log('COMPONENT_UNMOUNT', avatar.name) // Simple log for parser
      try {
        const key = `instance_${avatar.name}`
        if ((window as any)[key] === componentId.current) {
          delete (window as any)[key]
          console.log('TPJ AVATAR_INSTANCE', JSON.stringify({
            avatar: avatar.name,
            status: 'primary_unregistered',
            instance: componentId.current
          }))
        }
      } catch {}
    }
  }, []) // Empty dependency array = mount/unmount only

  // Effect for model setup - WAIT FOR GROUP REF TO BE READY
  useEffect(() => {
    console.log('🚀 SETUP_MODEL_USEEFFECT_TRIGGERED', { 
      avatar: avatar.name,
      componentId: componentId.current,
      renderCount: renderCount.current,
      timestamp: Date.now(),
      groupRefExists: !!groupRef.current,
      avatarModelExists: !!avatar.model,
      callStack: new Error().stack?.split('\n').slice(1, 6).map(line => line.trim())
    })
    console.log('SETUP_USEEFFECT_START', avatar.name) // Simple log for parser
    
    // WAIT FOR GROUP REF TO BE READY
    if (!groupRef.current) {
      console.log('⏳ WAITING_FOR_GROUP_REF', { avatar: avatar.name })
      // Try again on next frame
      const timer = setTimeout(() => {
        if (groupRef.current) {
          console.log('✅ GROUP_REF_READY_DELAYED', { avatar: avatar.name })
          const model = setupModel()
          console.log('🏁 SETUP_MODEL_DELAYED_COMPLETED', {
            avatar: avatar.name,
            modelReturned: !!model,
            timestamp: Date.now()
          })
        } else {
          console.log('❌ GROUP_REF_STILL_NULL', { avatar: avatar.name })
        }
      }, 0)
      return () => clearTimeout(timer)
    }
    
    // TRACK WHAT TRIGGERS THIS USEEFFECT
    console.log('🔍 USEEFFECT_DEPENDENCY_CHECK', {
      avatar: avatar.name,
      avatarName: avatar.name,
      dependencies: '[avatar.name]',
      note: 'This useEffect should only run when avatar.name changes'
    })
    
    const model = setupModel()
    
    console.log('🏁 SETUP_MODEL_USEEFFECT_COMPLETED', {
      avatar: avatar.name,
      componentId: componentId.current,
      modelReturned: !!model,
      timestamp: Date.now()
    })
    console.log('SETUP_USEEFFECT_END', avatar.name) // Simple log for parser
    
    return () => {
      console.log('🧹 SETUP_MODEL_CLEANUP_TRIGGERED', { 
        avatar: avatar.name,
        timestamp: Date.now()
      })
      console.log('SETUP_CLEANUP_START', avatar.name) // Simple log for parser
      cleanup()
      // Proper cleanup of Three.js resources
      if (model) {
        model.traverse((child: Object3D) => {
          if ((child as Mesh).isMesh) {
            const mesh = child as Mesh
            if (mesh.geometry) mesh.geometry.dispose()
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                  if ('map' in mat && (mat as MeshStandardMaterial).map) {
                    (mat as MeshStandardMaterial).map!.dispose()
                  }
                  mat.dispose()
                })
              } else {
                if ('map' in mesh.material && (mesh.material as MeshStandardMaterial).map) {
                  (mesh.material as MeshStandardMaterial).map!.dispose()
                }
                mesh.material.dispose()
              }
            }
          }
        })
      }
    }
  }, [avatar.name]) // Only re-run if avatar changes, not on every prop change

  // Modern useFrame with stable reference and COMPREHENSIVE LOGGING
  const frameCallback = useCallback((_state: any, delta: number) => {
    const frameTime = _state.clock?.elapsedTime || 0
    
    // DEBUG: Log frame execution
    console.log('🔄 AVATAR_FRAME_EXEC', {
      avatar: avatar.name,
      position: position.map(n => Number(n.toFixed(4))),
      isMoving,
      delta: Number(delta.toFixed(4)),
      frameTime: Number(frameTime.toFixed(3)),
      timestamp: Date.now()
    })
    
    // STEP 1: Log what we're trying to apply (throttled)
    if (frameTime - lastPositionLogRef.current > 0.5 || isMoving) {  // Log every 500ms or when moving
      console.log(`📍 CRASH FRAME START - ${avatar.name} (t=${frameTime.toFixed(2)}):`, {
        propsPosition: `(${position[0].toFixed(4)}, ${position[1].toFixed(4)}, ${position[2].toFixed(4)})`,
        propsRotation: `(${rotation[0].toFixed(4)}, ${rotation[1].toFixed(4)}, ${rotation[2].toFixed(4)})`,
        isMoving,
        groupRefExists: !!groupRef.current,
        containerRefExists: !!containerRef.current,
        pivotRefExists: !!pivotRef.current
      })
      lastPositionLogRef.current = frameTime
    }
    
    // Declare position tracking variables outside if block for scope access
    let positionChanged = false
    let rotationChanged = false
    
    // Ensure group transform matches props every frame to avoid any missed updates
    if (groupRef.current) {
      const g = groupRef.current
      
      // Get current position BEFORE any changes
      const beforePos = [g.position.x, g.position.y, g.position.z]
      const beforeRot = [g.rotation.x, g.rotation.y, g.rotation.z]
      
      // Position update
      positionChanged = (
        g.position.x !== position[0] ||
        g.position.y !== position[1] ||
        g.position.z !== position[2]
      )
      
      // Always set position and log the attempt
      console.log(`🎯 CRASH POSITION ATTEMPT - ${avatar.name}:`, {
        propsPosition: `(${position[0].toFixed(4)}, ${position[1].toFixed(4)}, ${position[2].toFixed(4)})`,
        currentGroupPos: `(${beforePos[0].toFixed(4)}, ${beforePos[1].toFixed(4)}, ${beforePos[2].toFixed(4)})`,
        positionChanged,
        isMoving
      })
      
      console.log('AVATAR_3D_POSITION_SET_START', position)
      g.position.set(position[0], position[1], position[2])
      console.log('AVATAR_3D_POSITION_SET_COMPLETE', [g.position.x, g.position.y, g.position.z])
      
      // Verify the position was actually set
      const afterPos = [g.position.x, g.position.y, g.position.z]
      console.log(`✅ CRASH POSITION SET RESULT - ${avatar.name}:`, {
        expected: `(${position[0].toFixed(4)}, ${position[1].toFixed(4)}, ${position[2].toFixed(4)})`,
        actual: `(${afterPos[0].toFixed(4)}, ${afterPos[1].toFixed(4)}, ${afterPos[2].toFixed(4)})`,
        match: afterPos.every((v, i) => Math.abs(v - position[i]) < 0.0001)
      })
      
      // DEBUG: Check if scale is being maintained
      console.log(`🔍 SCALE CHECK - ${avatar.name}:`, {
        groupScale: [g.scale.x.toFixed(6), g.scale.y.toFixed(6), g.scale.z.toFixed(6)],
        childrenCount: g.children.length,
        firstChildScale: g.children[0] ? [g.children[0].scale.x.toFixed(6), g.children[0].scale.y.toFixed(6), g.children[0].scale.z.toFixed(6)] : 'no children'
      })
      
      if (positionChanged) {
        console.log(`🚀 CRASH POSITION CHANGE DETECTED - ${avatar.name}:`, {
          from: `(${beforePos[0].toFixed(4)}, ${beforePos[1].toFixed(4)}, ${beforePos[2].toFixed(4)})`,
          to: `(${position[0].toFixed(4)}, ${position[1].toFixed(4)}, ${position[2].toFixed(4)})`,
          magnitude: Math.sqrt(
            Math.pow(position[0] - beforePos[0], 2) +
            Math.pow(position[1] - beforePos[1], 2) +
            Math.pow(position[2] - beforePos[2], 2)
          ).toFixed(4)
        })
      }
      
      // Rotation update
      rotationChanged = (
        g.rotation.x !== rotation[0] ||
        g.rotation.y !== rotation[1] ||
        g.rotation.z !== rotation[2]
      )
      
      if (rotationChanged) {
        console.log(`🔄 CRASH ROTATION CHANGE - ${avatar.name}:`, {
          from: `(${beforeRot[0].toFixed(4)}, ${beforeRot[1].toFixed(4)}, ${beforeRot[2].toFixed(4)})`,
          to: `(${rotation[0].toFixed(4)}, ${rotation[1].toFixed(4)}, ${rotation[2].toFixed(4)})`
        })
        g.rotation.set(rotation[0], rotation[1], rotation[2])
      }
      
      // Get world position after all updates
      const worldPos = new THREE.Vector3()
      g.getWorldPosition(worldPos)
      
      // Log world position every frame when moving for diagnosis
      console.log('TPJ CRASH_WORLD', JSON.stringify({
        avatar: avatar.name,
        frameTime: Number(frameTime.toFixed(2)),
        localPos: [g.position.x, g.position.y, g.position.z].map(n => Number(n.toFixed(4))),
        worldPos: worldPos.toArray().map(n => Number(n.toFixed(4))),
        positionChanged,
        rotationChanged,
        isMoving
      }))
      
      // Minimal container analysis (only on position changes)
      if (positionChanged && !containerRef.current) {
        console.warn(`⚠️ CRASH NO CONTAINER - ${avatar.name}: containerRef.current is null`)
      }
    } else {
      console.error(`❌ CRASH NO GROUP REF - ${avatar.name}: groupRef.current is null!`)
    }
    
    // SUMMARY: Key diagnostic info every frame when moving
    if (isMoving || positionChanged) {
      const groupExists = !!groupRef.current
      const containerExists = !!containerRef.current
      const pivotExists = !!pivotRef.current
      
      console.log(`🔍 CRASH MOVEMENT SUMMARY - ${avatar.name}:`, {
        propsMoving: isMoving,
        propsPosition: position.map(n => Number(n.toFixed(3))),
        hasGroupRef: groupExists,
        hasContainer: containerExists,
        hasPivot: pivotExists,
        actualGroupPos: groupExists ? [
          groupRef.current!.position.x,
          groupRef.current!.position.y, 
          groupRef.current!.position.z
        ].map(n => Number(n.toFixed(3))) : null,
        positionUpdated: positionChanged || false,
        frameTime: Number(frameTime.toFixed(2))
      })
    }

    // Update animation mixer & auto-switch animation based on movement state
    if (mixerRef.current) {
      mixerRef.current.update(delta)
      try {
        const clips = strippedClipsRef.current
        const playByName = playStrippedRef.current
        if (clips && playByName) {
          const want: string | null = (() => {
            const findBy = (patterns: RegExp[]) => {
              for (const p of patterns) {
                const hit = clips.find(c => p.test(c.name))
                if (hit) return hit.name
              }
              return null
            }
            if (isMoving) {
              const moving = findBy([
                isRunning ? /run/i : /$^/,
                /walk/i,
                /move/i,
                /locomotion/i,
                /forward/i
              ])
              if (moving) return moving
              // Fallback: first non-idle clip
              const nonIdle = clips.find(c => !/idle|stand|tpose/i.test(c.name))
              if (nonIdle) return nonIdle.name
            }
            const idle = findBy([/smok/i, /idle/i, /stand/i, /tpose/i])
            if (idle) return idle
            return clips[0] ? clips[0].name : null
          })()
          if (want && want !== currentClipNameRef.current) {
            currentClipNameRef.current = want
            playByName(want)
            console.log('TPJ ANIM', JSON.stringify({ clip: want, moving: isMoving }))
          }
        }
      } catch {}
    }

    // Per-frame world space diagnostics (throttled)
    try {
      const now = _state.clock?.elapsedTime || 0
      if (now - lastWorldLogRef.current > 0.1) {
        lastWorldLogRef.current = now
        const groupWorld = new THREE.Vector3()
        const containerWorld = new THREE.Vector3()
        if (groupRef.current) groupRef.current.getWorldPosition(groupWorld)
        if (containerRef.current) containerRef.current.getWorldPosition(containerWorld)
        const payload = {
          clock: Number(now.toFixed(3)),
          propsPos: [Number(position[0].toFixed(3)), Number(position[1].toFixed(3)), Number(position[2].toFixed(3))],
          groupWorld: groupWorld.toArray().map(n => Number(n.toFixed(3))),
          containerWorld: containerWorld.toArray().map(n => Number(n.toFixed(3)))
        }
        console.log('TPJ WORLD', JSON.stringify({ ...payload, avatarHeight: avatarMetricsRef.current?.height ?? null }))
      }
    } catch {}
  }, [position, rotation, isMoving])

  useFrame(frameCallback)

  // Memoized group props for performance
  const groupProps = useMemo(() => ({ 
    position, 
    rotation, 
    scale: [scale, scale, scale] as [number, number, number], 
    visible 
  }), [position, rotation, scale, visible])
  
  // DEBUG: Log when position changes
  const prevPosition = useRef(position)
  if (JSON.stringify(position) !== JSON.stringify(prevPosition.current)) {
    console.log('🎯 AVATAR_POSITION_CHANGE', {
      avatar: avatar.name,
      oldPosition: prevPosition.current,
      newPosition: position,
      groupExists: !!groupRef.current,
      timestamp: Date.now()
    })
    prevPosition.current = position
  }

  return (
    <group 
      ref={groupRef} 
      {...groupProps}
      onUpdate={(self) => {
        // DEBUG: Always log what we see in onUpdate
        console.log('🔍 GROUP_ONUPDATE_DEBUG', {
          avatar: avatar.name,
          selfExists: !!self,
          avatarModelExists: !!avatar.model,
          hasSetupRun: hasSetupRunRef.current,
          groupRefCurrent: !!groupRef.current,
          selfIsSameAsGroupRef: self === groupRef.current
        })
        
        // Set groupRef.current to self if it's not set yet
        if (!groupRef.current && self) {
          groupRef.current = self
          console.log('🔧 GROUP_REF_SET_FROM_ONUPDATE', { avatar: avatar.name })
        }
        
        // One-time setup trigger once the group is mounted and model exists
        if (!hasSetupRunRef.current && self && avatar.model) {
          try {
            try {
              console.log('TPJ GROUP_ONUPDATE', JSON.stringify({
                avatar: avatar.name,
                hasSelf: !!self,
                groupPosition: self.position.toArray().map(n => Number(n.toFixed(4))),
                hasAvatarModel: !!avatar.model,
                hasContainer: !!containerRef.current,
                hasPivot: !!pivotRef.current
              }))
            } catch {}
            const result = setupModel()
            hasSetupRunRef.current = !!result
            if (!hasSetupRunRef.current) {
              // If setup failed due to race, allow another attempt on next update
              console.log('⚠️ SETUP_MODEL_ONUPDATE_FAILED_RETRYING_LATER', { avatar: avatar.name })
            } else {
              console.log('✅ SETUP_MODEL_ONUPDATE_SUCCESS', { avatar: avatar.name })
            }
          } catch (e) {
            console.warn('❌ SETUP_MODEL_ONUPDATE_ERROR', (e as any)?.message || e)
          }
        }
        if (Math.random() < 0.01) { // Only log occasionally
          console.log('🎯 GROUP_UPDATE_CALLBACK', {
            avatar: avatar.name,
            groupPosition: self.position.toArray(),
            propsPosition: position,
            groupScale: self.scale.toArray(),
            propsScale: scale
          })
        }
      }}
    >
      {label && (
        <mesh position={[0, 2.2, 0]}> 
          <boxGeometry args={[0.01, 0.01, 0.01]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
      
      {/* Debug: Small bright indicator to show avatar position */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color={isMoving ? "#ff0000" : "#00ff00"} />
      </mesh>
      
      {/* DEBUG: Red sphere to show where avatar group is positioned */}
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.3]} />
        <meshBasicMaterial color="red" />
      </mesh>
      
      {/* DEBUG: Green sphere at ground level */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshBasicMaterial color="lime" />
      </mesh>
      
      {/* Debug: Ground shadow to show position */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.5} />
      </mesh>
    </group>
  )
})
