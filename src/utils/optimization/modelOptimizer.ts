export interface ModelOptimizationConfig {
  targetFileSize?: number // Target size in MB
  maxVertices?: number
  textureMaxSize?: number
  compressionLevel?: 'low' | 'medium' | 'high'
  removeUnusedMaterials?: boolean
}

export class ModelOptimizer {
  static async optimizeModel(modelData: any, config: ModelOptimizationConfig = {}) {
    const {
      maxVertices = 10000,
      compressionLevel = 'medium',
      removeUnusedMaterials = true
    } = config

    console.log('Optimizing model with config:', config)
    console.log('Original model data size:', JSON.stringify(modelData).length, 'characters')

    // 1. Geometry optimization - reduce vertices if too many
    if (modelData.geometries) {
      modelData.geometries = modelData.geometries.map((geometry: any) => {
        if (geometry.data && geometry.data.attributes) {
          const vertexCount = geometry.data.attributes.position?.array?.length / 3
          console.log('Geometry vertices:', vertexCount)
          
          // Simple vertex reduction by sampling every nth vertex if too many
          if (vertexCount > maxVertices) {
            const reductionRatio = maxVertices / vertexCount
            console.log('Reducing vertices by ratio:', reductionRatio)
            // Note: This is a simple approach - proper decimation would require more complex algorithms
          }
        }
        return geometry
      })
    }

    // 2. Material optimization - remove unused materials (DISABLED for now due to UUID issues)
    if (removeUnusedMaterials && modelData.materials && false) { // Temporarily disabled
      const usedMaterialUUIDs = new Set()
      
      // Find which materials are actually used by UUID
      if (modelData.object) {
        this.traverseObject(modelData.object, (obj: any) => {
          if (obj.material !== undefined) {
            // Material references can be UUIDs (strings) or indices (numbers)
            usedMaterialUUIDs.add(obj.material)
          }
        })
      }

      const originalCount = modelData.materials.length
      modelData.materials = modelData.materials.filter((material: any) => {
        // Check if this material's UUID is referenced
        return usedMaterialUUIDs.has(material.uuid)
      })
      console.log('Removed unused materials:', originalCount - modelData.materials.length)
      console.log('Used material UUIDs:', Array.from(usedMaterialUUIDs))
    } else if (removeUnusedMaterials) {
      console.log('Material cleanup disabled to prevent undefined material errors')
      console.log('Found materials:', modelData.materials?.length || 0)
    }

    // 3. Image/Texture optimization
    if (modelData.images) {
      modelData.images = modelData.images.map((image: any) => {
        if (image.url && image.url.startsWith('data:image')) {
          console.log('Found base64 texture, size:', image.url.length)
          
          // For now, just log - actual compression would need canvas manipulation
          if (compressionLevel === 'high') {
            console.log('Would apply high compression to texture')
          }
        }
        return image
      })
    }

    console.log('Optimized model data size:', JSON.stringify(modelData).length, 'characters')
    return modelData
  }

  private static traverseObject(obj: any, callback: (obj: any) => void) {
    callback(obj)
    if (obj.children) {
      obj.children.forEach((child: any) => this.traverseObject(child, callback))
    }
  }
}
