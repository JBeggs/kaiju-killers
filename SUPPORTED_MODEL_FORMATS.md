# Three.js Model Format Support Guide

## Currently Implemented
- ✅ **JSON** (Three.js native format) - `ObjectLoader`
- ✅ **GLTF** (.gltf files) - `GLTFLoader`
- ✅ **Primitives** (procedural)

## Easy to Add

### GLB Support (Binary GLTF)
```typescript
// In gltfAvatarLoader.ts - just add GLB fallback back:
try {
  avatarPath = `/avatar/${name}.glb`
  console.log('Trying GLB format:', avatarPath)
  const response = await fetch(avatarPath, { method: 'HEAD' })
  if (!response.ok) throw new Error('GLB not found')
  loadedFormat = 'glb'
} catch {
  throw new Error(`No GLTF/GLB file found for avatar: ${name}`)
}
```

### OBJ Support
```bash
npm install three-obj-loader
```
```typescript
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'

const objLoader = new OBJLoader()
const mtlLoader = new MTLLoader()

// Load materials first, then OBJ
const materials = await mtlLoader.loadAsync('/models/model.mtl')
objLoader.setMaterials(materials)
const model = await objLoader.loadAsync('/models/model.obj')
```

### FBX Support
```bash
npm install three-fbx-loader
```
```typescript
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const fbxLoader = new FBXLoader()
const model = await fbxLoader.loadAsync('/models/character.fbx')

// FBX often includes animations
if (model.animations.length > 0) {
  const mixer = new THREE.AnimationMixer(model)
  const action = mixer.clipAction(model.animations[0])
  action.play()
}
```

### STL Support
```typescript
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const stlLoader = new STLLoader()
const geometry = await stlLoader.loadAsync('/models/part.stl')
const material = new THREE.MeshStandardMaterial({ color: 0x606060 })
const mesh = new THREE.Mesh(geometry, material)
```

### PLY Support
```typescript
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'

const plyLoader = new PLYLoader()
const geometry = await plyLoader.loadAsync('/models/scan.ply')
const material = new THREE.MeshStandardMaterial()
const mesh = new THREE.Mesh(geometry, material)
```

### DRACO Compressed Models
```typescript
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/') // Path to DRACO decoder files

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const model = await gltfLoader.loadAsync('/models/compressed.glb')
```

## Recommendations by Use Case

### 🎮 Games/Interactive
- **GLTF/GLB** (best overall)
- **FBX** (if you need complex animations)
- **DRACO-compressed GLTF** (for mobile/slow connections)

### 🎨 Static Displays
- **OBJ** (simple, reliable)
- **GLTF** (better materials)

### 🏗️ Architecture
- **IFC** (building models)
- **GLTF** (for web display)

### 📐 3D Printing
- **STL** (industry standard)
- **3MF** (modern alternative)

### 🔬 Scientific Data
- **PLY** (point clouds, vertex data)
- **OBJ** (simple geometry)

## Performance Tips
1. **Prefer GLTF/GLB** - Fastest loading, most efficient
2. **Use DRACO compression** for large models
3. **Optimize textures** - Use .webp or .ktx2 formats when possible
4. **LOD models** - Multiple detail levels for distance-based rendering
5. **Instanced rendering** - For many copies of same model

