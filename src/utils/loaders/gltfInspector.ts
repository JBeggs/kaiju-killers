import * as THREE from 'three'

export interface ModelAnalysis {
  meshCount: number
  materialCount: number
  skinnedMeshCount: number
  totalTriangleCount: number
  boundingBox: THREE.Box3
  size: THREE.Vector3
  center: THREE.Vector3
  names: string[]
}

/**
 * Analyze a loaded GLTF/Three.js model hierarchy for debugging and sizing.
 */
export function analyzeModel(root: THREE.Object3D): ModelAnalysis {
  const names: string[] = []
  let meshCount = 0
  let materialCount = 0
  let skinnedMeshCount = 0
  let totalTriangleCount = 0

  root.traverse((obj) => {
    names.push(obj.name || obj.type)
    if ((obj as THREE.Mesh).isMesh) {
      meshCount += 1
      const mesh = obj as THREE.Mesh
      if (Array.isArray(mesh.material)) materialCount += mesh.material.length
      else if (mesh.material) materialCount += 1

      const geom = mesh.geometry as THREE.BufferGeometry | undefined
      if (geom && geom.index) {
        totalTriangleCount += geom.index.count / 3
      } else if (geom && geom.attributes && 'position' in geom.attributes) {
        totalTriangleCount += (geom.attributes.position.count || 0) / 3
      }
    }
    if ((obj as any).isSkinnedMesh) skinnedMeshCount += 1
  })

  const boundingBox = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  boundingBox.getSize(size)
  boundingBox.getCenter(center)

  return {
    meshCount,
    materialCount,
    skinnedMeshCount,
    totalTriangleCount,
    boundingBox,
    size,
    center,
    names
  }
}

export interface NormalizeOptions {
  /**
   * Target world-space height for the model. If provided, a uniform scale will be applied
   * so that the model's bounding-box height equals this value.
   */
  targetHeight?: number
  /**
   * If true, places the model so its feet rest on Y=0 (using bbox.min.y) and centers on XZ.
   * Defaults to true.
   */
  centerToGround?: boolean
}

/**
 * Wrap the given model in a container Group with a normalized pivot.
 * - Recenters model on XZ and places feet on ground (optional)
 * - Applies uniform scale to reach a target height (optional)
 * Returns the new container Group; original model is re-parented under it.
 */
export function createNormalizedContainer(model: THREE.Object3D, options: NormalizeOptions = {}): THREE.Group {
  const { targetHeight, centerToGround = true } = options

  const container = new THREE.Group()
  container.name = 'AvatarContainer'
  const pivot = new THREE.Group()
  pivot.name = 'AvatarPivot'

  // Compute bounding box on the unparented model
  const bbox = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  bbox.getSize(size)
  bbox.getCenter(center)

  // Move the model so that the container's origin is at desired pivot
  if (centerToGround) {
    // Use a pivot to avoid mutating internal skinned mesh/bone local transforms
    pivot.position.set(-center.x, -bbox.min.y, -center.z)
  }

  // Scale to target height if provided
  if (targetHeight && size.y > 0) {
    const scaleFactor = targetHeight / size.y
    container.scale.setScalar(scaleFactor)
  }

  pivot.add(model)
  container.add(pivot)
  return container
}

/**
 * Log a human-friendly summary of the model analysis to the console.
 */
export function logModelAnalysis(tag: string, analysis: ModelAnalysis) {
  const { meshCount, materialCount, skinnedMeshCount, totalTriangleCount, size, center, boundingBox } = analysis
  // eslint-disable-next-line no-console
  console.log(`🧩 GLTF Inspector [${tag}]`, {
    meshCount,
    materialCount,
    skinnedMeshCount,
    totalTriangleCount,
    bbox: {
      min: boundingBox.min.toArray(),
      max: boundingBox.max.toArray()
    },
    size: size.toArray(),
    center: center.toArray()
  })
}


