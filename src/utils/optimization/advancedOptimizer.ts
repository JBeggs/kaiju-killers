import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { PerformanceMonitor } from './performanceMonitor'

export interface OptimizationLevel {
  geometry: 'ultra' | 'high' | 'medium' | 'low'
  textures: 'ultra' | 'high' | 'medium' | 'low'
  materials: 'ultra' | 'high' | 'medium' | 'low'
  shadows: boolean
  lod: boolean
}

export class AdvancedOptimizer {
  private static perfMonitor = new PerformanceMonitor()
  private static cache = new Map<string, THREE.Group>()

  static getOptimizationLevel(): OptimizationLevel {
    const fps = this.perfMonitor.getCurrentFps()
    const memory = (performance as any).memory
    const totalMem = memory?.totalJSHeapSize || 100000000

    // Ultra performance mode (low-end devices)
    if (fps < 20 || totalMem > 200000000) {
      return {
        geometry: 'ultra',
        textures: 'ultra', 
        materials: 'ultra',
        shadows: false,
        lod: true
      }
    }
    // High performance mode 
    else if (fps < 35) {
      return {
        geometry: 'high',
        textures: 'high',
        materials: 'medium', 
        shadows: false,
        lod: true
      }
    }
    // Medium performance
    else if (fps < 50) {
      return {
        geometry: 'medium',
        textures: 'medium',
        materials: 'low',
        shadows: true,
        lod: true
      }
    }
    // High quality mode
    else {
      return {
        geometry: 'low',
        textures: 'low', 
        materials: 'low',
        shadows: true,
        lod: false
      }
    }
  }

  static optimizeGLTFModel(gltf: GLTF, level: OptimizationLevel = this.getOptimizationLevel()): THREE.Group {
    console.log('🚀 ADVANCED OPTIMIZATION - Level:', level)
    
    const model = gltf.scene.clone()
    const cacheKey = `${model.uuid}_${JSON.stringify(level)}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('📦 Using cached optimized model')
      return this.cache.get(cacheKey)!.clone()
    }

    let originalVertices = 0
    let optimizedVertices = 0
    let materialsProcessed = 0
    let texturesProcessed = 0

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        originalVertices += child.geometry.attributes.position?.count || 0

        // GEOMETRY OPTIMIZATION
        child.geometry = this.optimizeGeometry(child.geometry, level.geometry)
        optimizedVertices += child.geometry.attributes.position?.count || 0

        // MATERIAL OPTIMIZATION  
        if (child.material) {
          child.material = this.optimizeMaterial(child.material as THREE.Material, level.materials)
          materialsProcessed++
        }
      }
    })

    // TEXTURE OPTIMIZATION
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as any
        if (material.map) {
          material.map = this.optimizeTexture(material.map, level.textures)
          texturesProcessed++
        }
      }
    })

    console.log('🎯 OPTIMIZATION RESULTS:', {
      vertexReduction: `${originalVertices} → ${optimizedVertices} (${Math.round((1 - optimizedVertices/originalVertices) * 100)}% reduction)`,
      materialsProcessed,
      texturesProcessed,
      cacheKey
    })

    // Cache the result
    this.cache.set(cacheKey, model)
    
    return model.clone()
  }

  private static optimizeGeometry(geometry: THREE.BufferGeometry, level: 'ultra' | 'high' | 'medium' | 'low'): THREE.BufferGeometry {
    const vertexCount = geometry.attributes.position?.count || 0
    
    // Aggressive optimization levels
    const reductionRatios = {
      ultra: 0.05,  // Keep only 5% of vertices!
      high: 0.15,   // Keep 15%
      medium: 0.3,  // Keep 30%
      low: 0.7      // Keep 70%
    }

    const targetRatio = reductionRatios[level]
    const targetVertices = Math.floor(vertexCount * targetRatio)

    if (vertexCount > 1000 && targetVertices < vertexCount) {
      console.log(`📐 Geometry optimization (${level}):`, vertexCount, '→', targetVertices)
      
      // Simple vertex decimation - take every Nth vertex
      const step = Math.ceil(1 / targetRatio)
      const positions = geometry.attributes.position.array
      const normals = geometry.attributes.normal?.array
      const uvs = geometry.attributes.uv?.array
      
      const newPositions = []
      const newNormals = []
      const newUvs = []
      
      for (let i = 0; i < positions.length; i += step * 3) {
        newPositions.push(positions[i], positions[i + 1], positions[i + 2])
        if (normals) newNormals.push(normals[i], normals[i + 1], normals[i + 2])
        if (uvs) {
          const uvIndex = (i / 3) * 2
          newUvs.push(uvs[uvIndex], uvs[uvIndex + 1])
        }
      }
      
      const optimizedGeometry = new THREE.BufferGeometry()
      optimizedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3))
      if (newNormals.length > 0) optimizedGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNormals), 3))
      if (newUvs.length > 0) optimizedGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(newUvs), 2))
      
      return optimizedGeometry
    }

    return geometry
  }

  private static optimizeMaterial(material: THREE.Material, level: 'ultra' | 'high' | 'medium' | 'low'): THREE.Material {
    // Ultra optimization - convert everything to basic materials
    if (level === 'ultra') {
      return new THREE.MeshBasicMaterial({ color: 0xaaaaaa })
    }
    
    // High optimization - simple lambert
    if (level === 'high') {
      const color = (material as any).color || new THREE.Color(0xffffff)
      return new THREE.MeshLambertMaterial({ color })
    }
    
    // Medium - phong without expensive features
    if (level === 'medium' && material instanceof THREE.MeshStandardMaterial) {
      return new THREE.MeshPhongMaterial({
        color: material.color,
        transparent: material.transparent,
        opacity: material.opacity
      })
    }
    
    // Low optimization - keep original but disable expensive features
    if (material instanceof THREE.MeshStandardMaterial) {
      material.roughness = Math.min(material.roughness, 0.8)
      material.metalness = Math.min(material.metalness, 0.5)
    }
    
    return material
  }

  private static optimizeTexture(texture: THREE.Texture, level: 'ultra' | 'high' | 'medium' | 'low'): THREE.Texture {
    // Aggressive texture size reduction
    const maxSizes = {
      ultra: 64,    // 64x64 max
      high: 128,    // 128x128 max  
      medium: 256,  // 256x256 max
      low: 512      // 512x512 max
    }

    const maxSize = maxSizes[level]
    
    if (texture.image && (texture.image.width > maxSize || texture.image.height > maxSize)) {
      console.log(`🖼️ Texture optimization (${level}):`, `${texture.image.width}x${texture.image.height}`, '→', `${maxSize}x${maxSize}`)
      
      // Create canvas to resize texture
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      canvas.width = maxSize
      canvas.height = maxSize
      
      ctx.drawImage(texture.image, 0, 0, maxSize, maxSize)
      
      const optimizedTexture = new THREE.CanvasTexture(canvas)
      optimizedTexture.wrapS = texture.wrapS
      optimizedTexture.wrapT = texture.wrapT
      optimizedTexture.minFilter = THREE.LinearFilter // Disable mipmaps for performance
      optimizedTexture.magFilter = THREE.LinearFilter
      
      return optimizedTexture
    }

    return texture
  }

  // Progressive loading - load base model first, then enhance
  static createLODModel(baseModel: THREE.Group, distances: number[] = [10, 25, 50]): THREE.LOD {
    const lod = new THREE.LOD()
    
    // Ultra-low detail (furthest)
    const ultraLow = this.optimizeGLTFModel({ scene: baseModel } as GLTF, {
      geometry: 'ultra',
      textures: 'ultra', 
      materials: 'ultra',
      shadows: false,
      lod: false
    })
    lod.addLevel(ultraLow, distances[2])
    
    // Medium detail
    const medium = this.optimizeGLTFModel({ scene: baseModel } as GLTF, {
      geometry: 'medium',
      textures: 'medium',
      materials: 'medium', 
      shadows: false,
      lod: false
    })
    lod.addLevel(medium, distances[1])
    
    // High detail (closest)
    const high = this.optimizeGLTFModel({ scene: baseModel } as GLTF, {
      geometry: 'low',
      textures: 'low',
      materials: 'low',
      shadows: true,
      lod: false
    })
    lod.addLevel(high, distances[0])
    
    console.log('🎚️ LOD model created with', lod.levels.length, 'levels')
    return lod
  }

  // Clear cache to free memory
  static clearCache() {
    this.cache.clear()
    console.log('🗑️ Optimization cache cleared')
  }
}

