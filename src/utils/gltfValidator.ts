/**
 * GLTF Texture Validation Utility
 * Helps diagnose texture loading issues in GLTF models
 */

export interface TextureInfo {
  name: string
  width: number
  height: number
  format: string
  valid: boolean
  embedded: boolean
  uri?: string
}

export interface GLTFValidationResult {
  modelName: string
  totalTextures: number
  validTextures: number
  missingTextures: string[]
  textureDetails: TextureInfo[]
  recommendations: string[]
}

export class GLTFValidator {
  static validateTextures(gltf: any, modelName: string): GLTFValidationResult {
    const result: GLTFValidationResult = {
      modelName,
      totalTextures: 0,
      validTextures: 0,
      missingTextures: [],
      textureDetails: [],
      recommendations: []
    }

    // Check for textures in the GLTF structure
    if (gltf.textures) {
      result.totalTextures = gltf.textures.length
      
      gltf.textures.forEach((texture: any, index: number) => {
        const image = gltf.images?.[texture.source]
        const isEmbedded = image?.uri?.startsWith('data:')
        const isExternal = image?.uri && !isEmbedded
        
        const textureInfo: TextureInfo = {
          name: image?.name || `Texture_${index}`,
          width: 0,
          height: 0,
          format: 'unknown',
          valid: false,
          embedded: isEmbedded || false,
          uri: image?.uri
        }

        if (image) {
          if (isEmbedded) {
            // For embedded textures, we can't easily get dimensions without decoding
            textureInfo.valid = true
            textureInfo.format = 'embedded-base64'
            result.validTextures++
          } else if (isExternal) {
            // External texture - likely missing
            textureInfo.valid = false
            result.missingTextures.push(textureInfo.uri || 'unknown')
          }
        } else {
          result.missingTextures.push(`Missing image for texture ${index}`)
        }

        result.textureDetails.push(textureInfo)
      })
    }

    // Generate recommendations
    if (result.missingTextures.length > 0) {
      result.recommendations.push(
        `❌ Missing ${result.missingTextures.length} texture files. This will cause white/blank materials.`
      )
      result.recommendations.push(
        `💡 Solution: Use the original GLTF file with embedded textures, or ensure external texture files are present.`
      )
    }

    if (result.validTextures === 0 && result.totalTextures > 0) {
      result.recommendations.push(
        `⚠️  No valid textures found. Model will appear white or use material colors only.`
      )
    }

    if (result.validTextures > 0) {
      result.recommendations.push(
        `✅ Found ${result.validTextures} valid textures. Model should display correctly.`
      )
    }

    return result
  }

  static logValidationResult(result: GLTFValidationResult) {
    console.group(`🔍 GLTF Texture Validation: ${result.modelName}`)
    
    console.log(`📊 Summary:`, {
      totalTextures: result.totalTextures,
      validTextures: result.validTextures,
      missingTextures: result.missingTextures.length
    })

    if (result.textureDetails.length > 0) {
      console.log(`📋 Texture Details:`, result.textureDetails)
    }

    if (result.missingTextures.length > 0) {
      console.warn(`❌ Missing Textures:`, result.missingTextures)
    }

    result.recommendations.forEach(rec => {
      if (rec.includes('❌')) {
        console.warn(rec)
      } else if (rec.includes('⚠️')) {
        console.warn(rec)
      } else if (rec.includes('✅')) {
        console.log(rec)
      } else {
        console.info(rec)
      }
    })

    console.groupEnd()
  }
}
