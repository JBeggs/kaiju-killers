// Node.js script to pre-process and optimize the avatar file
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

async function optimizeAvatarFile() {
  const inputPath = path.join(__dirname, '../public/avatar/hector.json')
  const outputPath = path.join(__dirname, '../public/avatar/hector-optimized.json')
  const gzipPath = path.join(__dirname, '../public/avatar/hector-optimized.json.gz')
  
  console.log('Reading original avatar file...')
  const originalData = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  
  console.log('Original file size:', fs.statSync(inputPath).size, 'bytes')
  console.log('Original geometries:', originalData.geometries?.length || 0)
  console.log('Original materials:', originalData.materials?.length || 0)
  console.log('Original textures:', originalData.textures?.length || 0)
  console.log('Original images:', originalData.images?.length || 0)
  
  // Create optimized version
  const optimized = JSON.parse(JSON.stringify(originalData)) // Deep copy
  
  // 1. Remove unused materials
  const usedMaterials = new Set()
  function traverseObject(obj) {
    if (obj.material !== undefined) {
      usedMaterials.add(obj.material)
    }
    if (obj.children) {
      obj.children.forEach(traverseObject)
    }
  }
  
  if (optimized.object) {
    traverseObject(optimized.object)
  }
  
  if (optimized.materials) {
    const originalMaterialCount = optimized.materials.length
    optimized.materials = optimized.materials.filter((_, index) => usedMaterials.has(index))
    console.log('Removed unused materials:', originalMaterialCount - optimized.materials.length)
  }
  
  // 2. Reduce precision of numeric data
  function reducePrecision(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === 'number' ? Math.round(item * 10000) / 10000 : reducePrecision(item)
      )
    } else if (obj && typeof obj === 'object') {
      const result = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = reducePrecision(value)
      }
      return result
    }
    return obj
  }
  
  // Apply precision reduction to geometries
  if (optimized.geometries) {
    console.log('Reducing numeric precision...')
    optimized.geometries = reducePrecision(optimized.geometries)
  }
  
  // 3. Scale down the model data itself (not at runtime)
  const SCALE_FACTOR = 0.01 // 1% of original size
  
  if (optimized.geometries) {
    optimized.geometries.forEach(geometry => {
      if (geometry.data?.attributes?.position?.array) {
        const positions = geometry.data.attributes.position.array
        for (let i = 0; i < positions.length; i++) {
          positions[i] *= SCALE_FACTOR
        }
        console.log('Pre-scaled geometry positions by', SCALE_FACTOR)
      }
    })
  }
  
  // Write optimized version
  const optimizedJson = JSON.stringify(optimized)
  fs.writeFileSync(outputPath, optimizedJson)
  
  // Create gzipped version
  const gzipped = zlib.gzipSync(optimizedJson)
  fs.writeFileSync(gzipPath, gzipped)
  
  console.log('\nOptimization complete!')
  console.log('Original size:', fs.statSync(inputPath).size, 'bytes')
  console.log('Optimized size:', fs.statSync(outputPath).size, 'bytes')
  console.log('Gzipped size:', fs.statSync(gzipPath).size, 'bytes')
  console.log('Size reduction:', 
    Math.round((1 - fs.statSync(outputPath).size / fs.statSync(inputPath).size) * 100) + '%')
}

optimizeAvatarFile().catch(console.error)
