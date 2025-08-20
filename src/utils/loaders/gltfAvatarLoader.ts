import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Group } from 'three'
import * as THREE from 'three'
import { Avatar } from '@/types'

export class GLTFAvatarLoader {
  private loader = new GLTFLoader()
  private cache = new Map<string, Group>()
  private loadingPromises = new Map<string, Promise<Avatar>>()

  async loadAvatar(name: string): Promise<Avatar> {
    // If already loading, return the existing promise to prevent duplicate requests
    if (this.loadingPromises.has(name)) {
      console.log('GLTF Avatar already loading, waiting for existing request:', name)
      return this.loadingPromises.get(name)!
    }

    // Check cache first
    if (this.cache.has(name)) {
      const cachedModel = this.cache.get(name)!
      console.log('Loading cached GLTF avatar:', name)
      return {
        id: name,
        name: name,
        model: cachedModel.clone()
      }
    }

    // Create and store the loading promise
    const loadingPromise = this._loadGLTFAvatarInternal(name)
    this.loadingPromises.set(name, loadingPromise)

    try {
      const result = await loadingPromise
      return result
    } finally {
      // Clean up the loading promise once done
      this.loadingPromises.delete(name)
    }
  }

  private async _loadGLTFAvatarInternal(name: string): Promise<Avatar> {
    // REMOVED outer try-catch - let errors crash!
      console.log(`🎯 Loading GLTF avatar: ${name}`)
      
      // Try different GLTF formats
      let avatarPath = ''
      let loadedFormat = 'gltf'
      
        // Try files in priority order (original first - has embedded textures!)
        const tryFiles = [
          { path: `/avatar/${name}.gltf`, format: 'gltf', description: 'original GLTF with embedded textures' },
          { path: `/avatar/${name}-optimized.gltf`, format: 'gltf-optimized', description: 'optimized GLTF' },
          { path: `/avatar/${name}-ultra.gltf`, format: 'gltf-ultra', description: 'ultra-optimized GLTF (may have missing textures)' },
          { path: `/avatar/${name}.glb`, format: 'glb', description: 'GLB binary' }
        ]
        
        // Try to load with fallback chain
        let loadSuccess = false
        for (const tryFile of tryFiles) {
          try {
            const testResponse = await fetch(tryFile.path)
            if (testResponse.ok) {
              avatarPath = tryFile.path
              loadedFormat = tryFile.format
              console.log(`🎯 Found ${tryFile.description}:`, avatarPath)
              loadSuccess = true
              break
            }
          } catch (e) {
            continue // Try next option
          }
        }
        
        if (!loadSuccess) {
          throw new Error(`No GLTF files found for avatar: ${name}`)
        }
      
      console.log(`Loading ${loadedFormat.toUpperCase()} from:`, avatarPath)
      
      // Load the GLTF/GLB file
      return new Promise((resolve, reject) => {
        this.loader.load(
          avatarPath,
          (gltf) => {
            console.log('✅ GLTF loaded successfully:', {
              name,
              format: loadedFormat,
              scenes: gltf.scenes.length,
              animations: gltf.animations.length,
              cameras: gltf.cameras.length,
              scene: gltf.scene.type,
              children: gltf.scene.children.length
            })

            const model = gltf.scene as Group
            
            // Log model structure
            let meshCount = 0
            let materialCount = 0
            model.traverse((child: any) => {
              if (child.isMesh) {
                meshCount++
                if (child.material) {
                  materialCount++
                  console.log(`Mesh found:`, {
                    name: child.name,
                    type: child.type,
                    geometry: child.geometry?.type,
                    material: child.material?.type,
                    hasTexture: !!child.material?.map
                  })
                }
              }
            })

            console.log(`GLTF Model Summary:`, {
              totalMeshes: meshCount,
              totalMaterials: materialCount,
              boundingBox: (model.children[0] as any)?.geometry?.boundingBox || 'not computed',
              modelScale: model.scale.toArray(),
              modelPosition: model.position.toArray(),
              modelVisible: model.visible,
              hasChildren: model.children.length > 0
            })

            // Basic setup - GLTF should come pre-configured
            model.position.set(0, 0, 0)
            model.scale.set(1, 1, 1) // Normal size
            model.visible = true
            
            // Make sure all children are visible and fix texture issues
            model.traverse((child: any) => {
              child.visible = true
              if (child.isMesh) {
                console.log(`GLTF Mesh details:`, {
                  name: child.name,
                  visible: child.visible,
                  position: child.position.toArray(),
                  scale: child.scale.toArray(),
                  hasGeometry: !!child.geometry,
                  hasMaterial: !!child.material,
                  geometryType: child.geometry?.type,
                  materialType: child.material?.type,
                  hasTexture: !!child.material?.map
                })

                // Enhanced texture processing for all GLTF texture types
                if (child.material) {
                  // Check all possible texture types in GLTF materials
                  const textureTypes = [
                    { prop: 'map', name: 'Base Color (Diffuse)' },
                    { prop: 'normalMap', name: 'Normal Map' },
                    { prop: 'roughnessMap', name: 'Roughness Map' },
                    { prop: 'metalnessMap', name: 'Metallic Map' },
                    { prop: 'emissiveMap', name: 'Emissive Map' },
                    { prop: 'aoMap', name: 'Ambient Occlusion Map' },
                    { prop: 'alphaMap', name: 'Alpha Map' }
                  ]
                  
                  let hasValidTextures = false
                  let textureInfo: Array<{
                    type: string
                    hasImage: boolean
                    imageWidth: number
                    imageHeight: number
                    flipY: boolean
                    valid: boolean
                  }> = []
                  
                  // Process each texture type
                  textureTypes.forEach(({ prop, name }) => {
                    const texture = (child.material as any)[prop]
                    if (texture) {
                      const info = {
                        type: name,
                        hasImage: !!texture.image,
                        imageWidth: texture.image?.width || 0,
                        imageHeight: texture.image?.height || 0,
                        flipY: texture.flipY,
                        valid: texture.image && texture.image.width > 0
                      }
                      
                      textureInfo.push(info)
                      
                      if (info.valid) {
                        hasValidTextures = true
                        
                        // Apply proper GLTF texture settings
                        texture.flipY = false // GLTF standard - CRITICAL!
                        texture.wrapS = THREE.ClampToEdgeWrapping
                        texture.wrapT = THREE.ClampToEdgeWrapping
                        texture.minFilter = THREE.LinearFilter
                        texture.magFilter = THREE.LinearFilter
                        texture.generateMipmaps = false
                        texture.needsUpdate = true
                        
                        console.log(`✅ ${name} texture valid for ${child.name}: ${texture.image.width}x${texture.image.height}`)
                      } else {
                        console.warn(`❌ ${name} texture INVALID for ${child.name}`)
                      }
                    }
                  })
                  
                  if (textureInfo.length > 0) {
                    console.log(`🖼️ Texture Summary for ${child.name}:`, textureInfo)
                  } else {
                    console.log(`🔍 Material for ${child.name} has no textures - using material color only`)
                    
                    // If no textures, ensure material has a visible color
                    if (child.material.color) {
                      // Don't override existing colors, just ensure they're visible
                      console.log(`🎨 Using material color for ${child.name}: #${child.material.color.getHexString()}`)
                    } else {
                      // Set a default color if none exists
                      child.material.color = new THREE.Color(0xffffff)
                      console.log(`🎨 Set default white color for ${child.name}`)
                    }
                  }
                  
                  if (!hasValidTextures) {
                    console.warn(`⚠️ NO VALID TEXTURES found for ${child.name} - this mesh will appear white!`)
                    console.warn(`   This is likely because:`)
                    console.warn(`   1. External texture files are missing (.jpg/.png files)`)
                    console.warn(`   2. Texture paths in GLTF are incorrect`)
                    console.warn(`   3. Embedded textures are corrupted`)
                    console.warn(`   Material name: ${child.material.name || 'unnamed'}`)
                  }
                  
                  // Force material update
                  child.material.needsUpdate = true
                }

                // Ensure proper material settings for GLTF
                if (child.material) {
                  child.material.side = THREE.FrontSide
                  child.material.transparent = child.material.transparent || false
                  child.material.needsUpdate = true
                }
              }
            })
            
            // TEMPORARILY SKIP ADVANCED OPTIMIZATION - Debug material issues first
            console.log('⚠️ Skipping advanced optimization for debugging')
            const optimizedModel = gltf.scene || gltf.scenes?.[0]
            
            // Extract animations from GLTF
            const animations = gltf.animations || []
            console.log(`🎬 Found ${animations.length} animations:`, animations.map(a => a.name))
            
            // Create AnimationMixer for this model
            let mixer: THREE.AnimationMixer | undefined
            if (animations.length > 0) {
              mixer = new THREE.AnimationMixer(optimizedModel)
              console.log('🎮 Created AnimationMixer for', name)
            }
            
            // Cache the optimized model
            this.cache.set(name, optimizedModel.clone())

            const avatar: Avatar = {
              id: name,
              name: name,
              model: optimizedModel,
              animations: animations,
              mixer: mixer
            }

            console.log(`🎯 GLTF Avatar ready:`, avatar)
            resolve(avatar)
          },
          (progress) => {
            console.log('GLTF Loading progress:', {
              loaded: progress.loaded,
              total: progress.total,
              percent: Math.round((progress.loaded / progress.total) * 100) + '%'
            })
          },
          (error) => {
            console.error('❌ GLTF Loading failed for:', avatarPath, error)
            
            // If ultra-optimized fails, try falling back to original
            if (loadedFormat === 'gltf-ultra') {
              console.log('🔄 Ultra-optimized failed, falling back to original GLTF')
              this.loader.load(
                `/avatar/${name}.gltf`,
                (fallbackGltf) => {
                  console.log('✅ Fallback GLTF loaded successfully')
                  
                  // TEMPORARILY SKIP ADVANCED OPTIMIZATION - Debug material issues first
                  console.log('⚠️ Skipping advanced optimization for debugging')
                  const optimizedModel = fallbackGltf.scene || fallbackGltf.scenes?.[0]
                  
                  // Extract animations from fallback GLTF
                  const animations = fallbackGltf.animations || []
                  console.log(`🎬 Found ${animations.length} animations in fallback:`, animations.map(a => a.name))
                  
                  // Create AnimationMixer for fallback model
                  let mixer: THREE.AnimationMixer | undefined
                  if (animations.length > 0) {
                    mixer = new THREE.AnimationMixer(optimizedModel)
                    console.log('🎮 Created fallback AnimationMixer for', name)
                  }
                  
                  this.cache.set(name, optimizedModel.clone())
                  resolve({
                    id: name,
                    name: name,
                    model: optimizedModel,
                    animations: animations,
                    mixer: mixer
                  })
                },
                undefined,
                (fallbackError) => {
                  console.error('❌ Fallback GLTF also failed:', fallbackError)
                  reject(new Error(`Failed to load GLTF avatar ${name}. Both ultra and original failed. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`))
                }
              )
            } else {
              reject(new Error(`Failed to load GLTF avatar ${name} from ${avatarPath}: ${error instanceof Error ? error.message : 'Unknown error'}`))
            }
          }
        )
      })
  }

  clearCache() {
    this.cache.clear()
    this.loadingPromises.clear()
  }
}

// Export singleton instance
export const gltfAvatarLoader = new GLTFAvatarLoader()
