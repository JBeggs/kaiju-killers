import { ObjectLoader, Group } from 'three'
import { Avatar } from '@/types'

export class SimpleAvatarLoader {
  private loader = new ObjectLoader()

  async loadAvatar(name: string): Promise<Avatar> {
    try {
      console.log(`Loading avatar: ${name}`)
      
      // Try simplified first, then original
      let response
      let loadedVersion = 'original'
      
      try {
        console.log(`Trying simplified: /avatar/${name}-simplified.json`)
        response = await fetch(`/avatar/${name}-simplified.json`)
        if (response.ok) {
          loadedVersion = 'simplified'
        } else {
          throw new Error('Simplified not found')
        }
      } catch {
        console.log(`Trying original: /avatar/${name}.json`)
        response = await fetch(`/avatar/${name}.json`)
        loadedVersion = 'original'
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load avatar ${name}`)
      }
      
      const avatarData = await response.json()
      console.log(`Avatar JSON loaded (${loadedVersion}):`, {
        hasMetadata: !!avatarData.metadata,
        hasObject: !!avatarData.object,
        hasGeometries: !!avatarData.geometries,
        hasMaterials: !!avatarData.materials,
        dataKeys: Object.keys(avatarData),
        version: avatarData.metadata?.version
      })

      // Parse the model using ObjectLoader (which handles the Three.js JSON format)
      const model = this.loader.parse(avatarData) as Group
      
      if (!model) {
        throw new Error('Failed to parse avatar model - ObjectLoader returned null')
      }
      
      console.log(`Avatar parsed successfully:`, {
        name,
        version: loadedVersion,
        type: model.type,
        children: model.children.length,
        position: model.position.toArray(),
        scale: model.scale.toArray()
      })
      
      // Just set basic properties - no complex optimization
      model.position.set(0, 0, 0)
      model.scale.set(1, 1, 1)
      
      // Log the model structure
      model.traverse((child: any, index: number) => {
        if (index < 5) { // Only log first few children to avoid spam
          console.log(`Child ${index}:`, {
            type: child.type,
            name: child.name,
            hasGeometry: !!child.geometry,
            hasMaterial: !!child.material,
            visible: child.visible
          })
        }
      })
      
      return {
        id: name,
        name: name,
        model: model
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
}

// Export singleton instance
export const simpleAvatarLoader = new SimpleAvatarLoader()
