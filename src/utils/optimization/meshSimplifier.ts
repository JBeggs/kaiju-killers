import * as THREE from 'three'
// @ts-ignore - three-stdlib types might not be perfect
import { SimplifyModifier } from 'three-stdlib'

export interface SimplificationConfig {
  targetVertexRatio?: number // 0.1 = reduce to 10% of original vertices
  targetTriangleCount?: number // Absolute number of triangles to target
  preserveBoundary?: boolean
  preserveTexCoords?: boolean
  preserveNormals?: boolean
}

export class MeshSimplifier {
  private static simplifyModifier = new SimplifyModifier()

  static simplifyGeometry(
    geometry: THREE.BufferGeometry, 
    config: SimplificationConfig = {}
  ): THREE.BufferGeometry {
    const {
      targetVertexRatio = 0.3, // Keep 30% of vertices by default
      preserveBoundary = true,
      preserveTexCoords = true,
      preserveNormals = true
    } = config

    console.log('Starting mesh simplification...', {
      originalVertices: geometry.attributes.position.count,
      targetRatio: targetVertexRatio
    })

    try {
      // Convert BufferGeometry to Geometry for SimplifyModifier (if needed)
      let workingGeometry = geometry

      // Calculate target vertex count
      const originalVertexCount = geometry.attributes.position.count
      const targetVertexCount = Math.floor(originalVertexCount * targetVertexRatio)
      
      console.log('Target vertex count:', targetVertexCount)

      // Apply simplification
      const simplified = this.simplifyModifier.modify(workingGeometry, targetVertexCount)
      
      // Ensure we have normals and other attributes
      if (preserveNormals && !simplified.attributes.normal) {
        simplified.computeVertexNormals()
      }

      console.log('Simplification complete:', {
        originalVertices: originalVertexCount,
        simplifiedVertices: simplified.attributes.position.count,
        reductionPercentage: Math.round((1 - simplified.attributes.position.count / originalVertexCount) * 100) + '%'
      })

      return simplified
    } catch (error) {
      console.warn('Mesh simplification failed, returning original geometry:', error)
      return geometry
    }
  }

  static simplifyMesh(mesh: THREE.Mesh, config: SimplificationConfig = {}): THREE.Mesh {
    if (mesh.geometry instanceof THREE.BufferGeometry) {
      const simplifiedGeometry = this.simplifyGeometry(mesh.geometry, config)
      
      // Create new mesh with simplified geometry
      const simplifiedMesh = mesh.clone()
      simplifiedMesh.geometry = simplifiedGeometry
      
      return simplifiedMesh
    }
    
    console.warn('Mesh does not have BufferGeometry, cannot simplify')
    return mesh
  }

  static simplifyGroup(group: THREE.Group, config: SimplificationConfig = {}): THREE.Group {
    const simplifiedGroup = group.clone()
    
    simplifiedGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const simplified = this.simplifyMesh(child, config)
        // Replace the mesh in the group
        if (child.parent) {
          child.parent.remove(child)
          child.parent.add(simplified)
        }
      }
    })
    
    return simplifiedGroup
  }
}
