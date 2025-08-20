// Node.js script to optimize GLTF files
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

async function optimizeGLTFFile() {
  // Get avatar name from command line argument
  const avatarName = process.argv[2]
  if (!avatarName) {
    console.error('Usage: node optimize-gltf.cjs <avatar-name>')
    console.error('Example: node optimize-gltf.cjs dr')
    process.exit(1)
  }
  
  const inputPath = path.join(__dirname, `../public/avatar/${avatarName}.gltf`)
  const outputPath = path.join(__dirname, `../public/avatar/${avatarName}-optimized.gltf`)
  const gzipPath = path.join(__dirname, `../public/avatar/${avatarName}-optimized.gltf.gz`)
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`)
    process.exit(1)
  }
  
  console.log(`Optimizing ${avatarName} GLTF avatar...`)
  console.log('Reading original GLTF file:', inputPath)
  
  const originalData = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  
  console.log('Original file size:', fs.statSync(inputPath).size, 'bytes')
  console.log('Original nodes:', originalData.nodes?.length || 0)
  console.log('Original meshes:', originalData.meshes?.length || 0)
  console.log('Original materials:', originalData.materials?.length || 0)
  console.log('Original textures:', originalData.textures?.length || 0)
  console.log('Original images:', originalData.images?.length || 0)
  console.log('Original buffers:', originalData.buffers?.length || 0)
  console.log('Original accessors:', originalData.accessors?.length || 0)
  
  // Create optimized version
  const optimized = JSON.parse(JSON.stringify(originalData)) // Deep copy
  
  // 1. Reduce numeric precision for positions, normals, etc.
  function reducePrecision(value, precision = 4) {
    if (typeof value === 'number') {
      return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision)
    }
    return value
  }
  
  // 2. Optimize buffer data (positions, normals, etc.)
  if (optimized.buffers) {
    optimized.buffers.forEach((buffer, bufferIndex) => {
      if (buffer.uri && buffer.uri.startsWith('data:')) {
        console.log(`Optimizing buffer ${bufferIndex} (${buffer.byteLength} bytes)...`)
        // Buffer is embedded as base64 - we could optimize this but it's complex
        // For now, just log it
      }
    })
  }
  
  // 3. Scale down the model by modifying node transforms
  const SCALE_FACTOR = 0.1 // 10% of original size for KAIJU KILLER
  
  if (optimized.nodes) {
    optimized.nodes.forEach((node, nodeIndex) => {
      if (node.scale) {
        // Scale existing scale
        node.scale = node.scale.map(s => s * SCALE_FACTOR)
        console.log(`Scaled node ${nodeIndex} by ${SCALE_FACTOR}`)
      } else if (node.matrix) {
        // Apply scale to transformation matrix (more complex)
        console.log(`Node ${nodeIndex} uses matrix transform - scaling matrix...`)
        // Scale the matrix (positions are in elements 12, 13, 14)
        node.matrix[12] *= SCALE_FACTOR // X translation
        node.matrix[13] *= SCALE_FACTOR // Y translation  
        node.matrix[14] *= SCALE_FACTOR // Z translation
        // Scale the scale part of the matrix (elements 0, 5, 10 for uniform scaling)
        node.matrix[0] *= SCALE_FACTOR  // X scale
        node.matrix[5] *= SCALE_FACTOR  // Y scale
        node.matrix[10] *= SCALE_FACTOR // Z scale
      } else {
        // Add scale to node
        node.scale = [SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR]
        console.log(`Added scale to node ${nodeIndex}`)
      }
    })
  }
  
  // 4. Remove or compress large embedded images if any
  if (optimized.images) {
    optimized.images.forEach((image, imageIndex) => {
      if (image.uri && image.uri.startsWith('data:')) {
        const originalSize = image.uri.length
        console.log(`Image ${imageIndex}: ${originalSize} characters (embedded)`)
        // Could compress images here, but that's complex
      }
    })
  }
  
  // 5. Add metadata
  if (!optimized.asset) optimized.asset = {}
  optimized.asset.extras = {
    ...optimized.asset.extras,
    optimizedFor: 'KAIJU KILLER',
    scaleFactor: SCALE_FACTOR,
    optimizedAt: new Date().toISOString()
  }
  
  // Write optimized version
  const optimizedJson = JSON.stringify(optimized, null, 0) // No pretty printing for smaller size
  fs.writeFileSync(outputPath, optimizedJson)
  
  // Create gzipped version
  const gzipped = zlib.gzipSync(optimizedJson)
  fs.writeFileSync(gzipPath, gzipped)
  
  console.log('\n🎉 GLTF Optimization complete!')
  console.log('Original size:', fs.statSync(inputPath).size, 'bytes')
  console.log('Optimized size:', fs.statSync(outputPath).size, 'bytes')
  console.log('Gzipped size:', fs.statSync(gzipPath).size, 'bytes')
  
  const reduction = Math.round((1 - fs.statSync(outputPath).size / fs.statSync(inputPath).size) * 100)
  console.log('Size reduction:', reduction + '%')
  
  console.log(`\n✅ Files created:`)
  console.log(`   ${outputPath}`)
  console.log(`   ${gzipPath}`)
}

optimizeGLTFFile().catch(console.error)
