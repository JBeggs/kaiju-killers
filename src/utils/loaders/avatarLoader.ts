import { ObjectLoader, Group } from 'three'
import { Avatar } from '@/types'
import { ModelOptimizer } from '@/utils/optimization/modelOptimizer'
import { MeshSimplifier } from '@/utils/optimization/meshSimplifier'

export class AvatarLoader {
  private loader = new ObjectLoader()
  private cache = new Map<string, Group>()
  private loadingPromises = new Map<string, Promise<Avatar>>()

  async loadAvatar(name: string): Promise<Avatar> {
    // If already loading, return the existing promise to prevent duplicate requests
    if (this.loadingPromises.has(name)) {
      console.log('Avatar already loading, waiting for existing request:', name)
      return this.loadingPromises.get(name)!
    }

    // Check cache first (synchronously)
    if (this.cache.has(name)) {
      const cachedModel = this.cache.get(name)!
      console.log('Loading cached avatar:', name)
      return {
        id: name,
        name: name,
        model: cachedModel.clone()
      }
    }

    // Create and store the loading promise
    const loadingPromise = this._loadAvatarInternal(name)
    this.loadingPromises.set(name, loadingPromise)

    try {
      const result = await loadingPromise
      return result
    } finally {
      // Clean up the loading promise once done
      this.loadingPromises.delete(name)
    }
  }

  private async _loadAvatarInternal(name: string): Promise<Avatar> {
    try {
      // Try to load optimized versions first, fallback chain
      let response
      let loadedVersion = 'original'
      
      try {
        console.log('Trying optimized avatar:', `/avatar/${name}-optimized.json`)
        response = await fetch(`/avatar/${name}-optimized.json`)
        if (!response.ok) throw new Error('Optimized not found')
        loadedVersion = 'optimized'
      } catch {
        try {
          console.log('Trying original avatar:', `/avatar/${name}.json`)
          response = await fetch(`/avatar/${name}.json`)
          if (!response.ok) throw new Error('Original not found')
          loadedVersion = 'original'
        } catch {
          console.log('Falling back to simplified avatar:', `/avatar/${name}-simplified.json`)
          response = await fetch(`/avatar/${name}-simplified.json`)
          loadedVersion = 'simplified'
        }
      }
      
      console.log('Loaded avatar version:', loadedVersion)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load avatar ${name}`)
      }
      
      const avatarData = await response.json()
      console.log('Avatar JSON loaded, parsing...', {
        hasMetadata: !!avatarData.metadata,
        hasObject: !!avatarData.object,
        dataKeys: Object.keys(avatarData),
        rawSize: JSON.stringify(avatarData).length + ' characters'
      })

      // ❌ TEMPORARILY SKIP OPTIMIZATION - IT'S CORRUPTING MATERIALS!
      console.log('🔧 SKIPPING ModelOptimizer to prevent material corruption!')
      const optimizedData = avatarData
      
      const model = this.loader.parse(optimizedData) as Group
      
      if (!model) {
        throw new Error('Failed to parse avatar model')
      }
      
      // Runtime optimizations (lighter approach since offline optimization is preferred)
      console.log('Applying runtime optimizations...')
      
      let textureCount = 0
      let geometryCount = 0
      let totalVertices = 0
      
      model.traverse((child: any) => {
        if (child.material) {
          // Memory optimization for textures (less aggressive)
          if (child.material.map) {
            textureCount++
            const texture = child.material.map
            
            // Reduce memory usage without creating canvas elements
            texture.generateMipmaps = false
            texture.minFilter = 1003 // LinearFilter (no mipmaps)
            texture.magFilter = 1003 // LinearFilter
            texture.flipY = false
            texture.wrapS = 1001 // RepeatWrapping
            texture.wrapT = 1001 // RepeatWrapping
            texture.needsUpdate = true
          }
          
          // Balanced material settings
          child.material.needsUpdate = true
        }
        
        if (child.geometry) {
          geometryCount++
          totalVertices += child.geometry.attributes.position.count
          
          // Memory-optimized geometry processing
          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals()
          }
          
          // Only compute bounding volumes when needed - they use memory
          child.geometry.computeBoundingBox()
          
          // Remove unnecessary attributes to save memory
          if (child.geometry.attributes.uv2) {
            child.geometry.deleteAttribute('uv2')
          }
          if (child.geometry.attributes.color && !child.material.vertexColors) {
            child.geometry.deleteAttribute('color')  
          }
        }
      })
      
      console.log('Runtime optimization stats:', {
        totalVertices,
        textureCount,
        geometryCount,
        loadedVersion
      })
      
      model.scale.set(1.0, 1.0, 1.0)  // No scaling needed - model is pre-optimized at correct size
      model.position.set(0, 0, 0)
      
      console.log('Avatar parsed and optimized:', {
        name,
        version: loadedVersion,
        children: model.children.length,
        type: model.type,
        textures: textureCount,
        geometries: geometryCount,
        totalVertices: totalVertices
      })
      
      // Force garbage collection of temporary data
      if (window.gc && typeof window.gc === 'function') {
        try {
          window.gc()
          console.log('Forced garbage collection after avatar load')
        } catch (e) {
          // GC not available in production
        }
      }
      
      this.cache.set(name, model)
      
      // Log memory usage estimate
      const estimatedMemory = (totalVertices * 32) + (textureCount * 1024 * 1024) // Rough estimate
      console.log('Estimated avatar memory usage:', Math.round(estimatedMemory / 1024 / 1024), 'MB')
      
      if (estimatedMemory > 10 * 1024 * 1024) { // >10MB
        console.warn('⚠️  Avatar memory usage is high, may cause context loss')
      }
      
      return {
        id: name,
        name: name,
        model: model.clone()
      }
    } catch (error) {
      console.error('Avatar loading error:', error)
      
      return {
        id: name,
        name: name + ' (failed)',
        model: null
      }
    }
  }

  clearCache() {
    this.cache.clear()
    this.loadingPromises.clear()
  }
}

// Singleton instance to share cache across all components
export const avatarLoader = new AvatarLoader()
