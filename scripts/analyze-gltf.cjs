#!/usr/bin/env node
/*
  Analyze a GLTF (.gltf JSON) file and write a detailed report.
  Usage:
    node scripts/analyze-gltf.cjs [path/to/model.gltf] [outDir]
  Defaults:
    model = ./public/avatar/crash_bandicoot.gltf
    outDir = ./reports
*/

const fs = require('fs')
const path = require('path')

function isDataUri(uri) {
  return typeof uri === 'string' && uri.startsWith('data:')
}

function safeReadJSON(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${err.message}`)
  }
}

function analyzeGltf(gltf, baseDir) {
  const scenes = gltf.scenes || []
  const nodes = gltf.nodes || []
  const meshes = gltf.meshes || []
  const materials = gltf.materials || []
  const textures = gltf.textures || []
  const images = gltf.images || []
  const skins = gltf.skins || []
  const animations = gltf.animations || []
  const accessors = gltf.accessors || []
  const buffers = gltf.buffers || []
  const bufferViews = gltf.bufferViews || []

  // Aggregate vertex/primitive data and bbox from POSITION accessors
  let totalPrimitives = 0
  let totalVertices = 0
  let totalTriangles = 0
  let bboxMin = [ Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY ]
  let bboxMax = [ Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY ]

  for (const mesh of meshes) {
    const primitives = mesh.primitives || []
    totalPrimitives += primitives.length
    for (const prim of primitives) {
      // POSITION accessor index
      const posAccessorIndex = prim.attributes && prim.attributes.POSITION
      if (posAccessorIndex != null && accessors[posAccessorIndex]) {
        const acc = accessors[posAccessorIndex]
        if (Array.isArray(acc.min) && acc.min.length === 3) {
          bboxMin = [
            Math.min(bboxMin[0], acc.min[0]),
            Math.min(bboxMin[1], acc.min[1]),
            Math.min(bboxMin[2], acc.min[2])
          ]
        }
        if (Array.isArray(acc.max) && acc.max.length === 3) {
          bboxMax = [
            Math.max(bboxMax[0], acc.max[0]),
            Math.max(bboxMax[1], acc.max[1]),
            Math.max(bboxMax[2], acc.max[2])
          ]
        }
        if (typeof acc.count === 'number') {
          totalVertices += acc.count
        }
      }

      // Triangle estimation from indices/position count
      if (prim.indices != null) {
        const indexAccessor = accessors[prim.indices]
        if (indexAccessor && typeof indexAccessor.count === 'number') {
          const mode = prim.mode == null ? 4 : prim.mode // 4 = TRIANGLES
          if (mode === 4) totalTriangles += indexAccessor.count / 3
        }
      } else if (prim.attributes && prim.attributes.POSITION != null) {
        const acc = accessors[prim.attributes.POSITION]
        const mode = prim.mode == null ? 4 : prim.mode
        if (acc && typeof acc.count === 'number' && mode === 4) {
          totalTriangles += acc.count / 3
        }
      }
    }
  }

  // Skinned mesh detection
  let skinnedNodeCount = 0
  for (const node of nodes) {
    if (node.skin != null) skinnedNodeCount++
  }

  // Image source summary
  const imageSummary = images.map((img, i) => ({
    index: i,
    uri: img.uri || null,
    embedded: isDataUri(img.uri || ''),
    mimeType: img.mimeType || null
  }))

  // Buffer source summary
  const bufferSummary = buffers.map((b, i) => ({
    index: i,
    byteLength: b.byteLength || null,
    uri: b.uri || null,
    embedded: isDataUri(b.uri || '')
  }))

  // Animation names
  const animationNames = animations.map((a, i) => a.name || `Animation_${i}`)

  // Animation channel targets summary (to detect root motion)
  const animationTargets = animations.map((anim, ai) => {
    const channels = (anim.channels || []).map((ch) => {
      const target = ch.target || {}
      const nodeIndex = target.node
      const path = target.path
      const nodeName = nodeIndex != null && nodes[nodeIndex] ? (nodes[nodeIndex].name || `Node_${nodeIndex}`) : null
      return { nodeIndex, nodeName, path }
    })
    return { name: anim.name || `Animation_${ai}`, channels }
  })

  // Reasons that might impact avatar usability
  const avatarHints = {
    hasSkins: skins.length > 0,
    hasAnimations: animations.length > 0,
    hasEmbeddedTextures: imageSummary.some(i => i.embedded),
    hasExternalTextures: imageSummary.some(i => !i.embedded),
    hasMaterials: materials.length > 0,
    hasMeshes: meshes.length > 0
  }

  return {
    counts: {
      scenes: scenes.length,
      nodes: nodes.length,
      meshes: meshes.length,
      primitives: totalPrimitives,
      materials: materials.length,
      textures: textures.length,
      images: images.length,
      skins: skins.length,
      animations: animations.length,
      buffers: buffers.length,
      bufferViews: bufferViews.length,
      accessors: accessors.length
    },
    geometry: {
      totalVertices,
      totalTriangles,
      bboxMin,
      bboxMax,
      bboxSize: [
        bboxMax[0] - bboxMin[0],
        bboxMax[1] - bboxMin[1],
        bboxMax[2] - bboxMin[2]
      ]
    },
    images: imageSummary,
    buffers: bufferSummary,
    animations: animationNames,
    animationTargets,
    avatarHints
  }
}

function writeReport(outDir, baseName, modelPath, gltf, analysis) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const mdPath = path.join(outDir, `${baseName}-analysis.md`)
  const jsonPath = path.join(outDir, `${baseName}-analysis.json`)

  const lines = []
  lines.push(`# GLTF Analysis: ${baseName}`)
  lines.push('')
  lines.push(`- File: ${modelPath}`)
  lines.push(`- Scenes: ${analysis.counts.scenes}`)
  lines.push(`- Nodes: ${analysis.counts.nodes}`)
  lines.push(`- Meshes: ${analysis.counts.meshes} (primitives: ${analysis.counts.primitives})`)
  lines.push(`- Materials: ${analysis.counts.materials}`)
  lines.push(`- Textures: ${analysis.counts.textures}`)
  lines.push(`- Images: ${analysis.counts.images}`)
  lines.push(`- Skins: ${analysis.counts.skins}`)
  lines.push(`- Animations: ${analysis.counts.animations}`)
  lines.push('')
  lines.push('## Geometry')
  lines.push(`- Vertices: ${analysis.geometry.totalVertices}`)
  lines.push(`- Triangles (approx): ${analysis.geometry.totalTriangles}`)
  lines.push(`- BBox Min: ${analysis.geometry.bboxMin.join(', ')}`)
  lines.push(`- BBox Max: ${analysis.geometry.bboxMax.join(', ')}`)
  lines.push(`- BBox Size: ${analysis.geometry.bboxSize.join(', ')}`)
  lines.push('')
  lines.push('## Textures & Images')
  for (const img of analysis.images) {
    lines.push(`- Image[${img.index}]: ${img.embedded ? 'embedded' : (img.uri || 'unknown')} (${img.mimeType || 'unknown mime'})`)
  }
  lines.push('')
  lines.push('## Buffers')
  for (const b of analysis.buffers) {
    lines.push(`- Buffer[${b.index}]: ${b.embedded ? 'embedded' : (b.uri || 'unknown')} (bytes: ${b.byteLength || 'unknown'})`)
  }
  lines.push('')
  lines.push('## Animations')
  if (analysis.animations.length === 0) {
    lines.push('- None')
  } else {
    for (const name of analysis.animations) lines.push(`- ${name}`)
  }
  lines.push('')
  lines.push('## Animation Channels (targets)')
  if (analysis.animationTargets && analysis.animationTargets.length > 0) {
    for (const anim of analysis.animationTargets) {
      lines.push(`- ${anim.name}`)
      for (const ch of anim.channels) {
        lines.push(`  - target: ${ch.nodeName || ch.nodeIndex}, path: ${ch.path}`)
      }
    }
  }
  lines.push('')
  lines.push('## Avatar Hints')
  lines.push(`- Has skins: ${analysis.avatarHints.hasSkins}`)
  lines.push(`- Has animations: ${analysis.avatarHints.hasAnimations}`)
  lines.push(`- Has embedded textures: ${analysis.avatarHints.hasEmbeddedTextures}`)
  lines.push(`- Has external textures: ${analysis.avatarHints.hasExternalTextures}`)
  lines.push(`- Has materials: ${analysis.avatarHints.hasMaterials}`)
  lines.push(`- Has meshes: ${analysis.avatarHints.hasMeshes}`)
  lines.push('')
  lines.push('> Note: If the avatar appears detached or not moving, ensure transforms are applied to a single container/root and that animation mixers target the container. Also verify movement writes do not conflict with R3F declarative transforms.')

  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8')
  fs.writeFileSync(jsonPath, JSON.stringify({ modelPath, analysis, gltfMeta: { asset: gltf.asset } }, null, 2), 'utf8')

  return { mdPath, jsonPath }
}

(function main() {
  const projectRoot = process.cwd()
  const modelArg = process.argv[2]
  const outArg = process.argv[3]
  const defaultModel = path.join(projectRoot, 'public', 'avatar', 'crash_bandicoot.gltf')
  const modelPath = path.resolve(modelArg || defaultModel)
  const outDir = path.resolve(outArg || path.join(projectRoot, 'reports'))

  if (!fs.existsSync(modelPath)) {
    console.error(`Model not found: ${modelPath}`)
    process.exit(1)
  }

  const gltf = safeReadJSON(modelPath)
  const analysis = analyzeGltf(gltf, path.dirname(modelPath))
  const baseName = path.basename(modelPath, path.extname(modelPath))
  const { mdPath, jsonPath } = writeReport(outDir, baseName, modelPath, gltf, analysis)
  console.log(`✅ Analysis complete:\n- ${mdPath}\n- ${jsonPath}`)
})()


