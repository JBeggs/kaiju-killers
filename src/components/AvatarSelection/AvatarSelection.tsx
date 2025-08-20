import { useState, useEffect, memo } from 'react'
import { Avatar } from '@/types'
import { avatarLoader } from '@/utils/loaders/avatarLoader'
import { gltfAvatarLoader } from '@/utils/loaders/gltfAvatarLoader'
import { SimpleAvatarTest } from '@/components/SimpleAvatarTest/SimpleAvatarTest'
import { Group } from 'three'

interface AvatarSelectionProps {
  onAvatarSelected: (avatar: Avatar) => void
  onBack: () => void
}

interface AvatarOption {
  id: string
  name: string
  description: string
  path: string
  type: 'json' | 'gltf' | 'glb' | 'primitive'
}

const AVAILABLE_AVATARS: AvatarOption[] = [
  {
    id: 'dr',
    name: 'Dr',
    description: 'Animated GLTF avatar with working textures',
    path: 'dr',
    type: 'gltf'
  },
  {
    id: 'crash_bandicoot',
    name: 'Crash Bandicoot',
    description: 'Animated GLTF avatar with working textures',
    path: 'crash_bandicoot',
    type: 'gltf'
  }
]

export const AvatarSelection = memo(function AvatarSelection({ onAvatarSelected, onBack }: AvatarSelectionProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [loadedAvatars, setLoadedAvatars] = useState<Record<string, Avatar>>({})

  const loadAvatar = async (option: AvatarOption) => {
    if (loadedAvatars[option.id]) {
      setSelectedAvatar(loadedAvatars[option.id])
      setSelectedOption(option.id)
      return
    }

    // REMOVED try-catch - let errors crash!
    setLoading(option.id)
    console.log(`Loading ${option.name}...`)
      
      // Use the appropriate loader based on format
      let avatar: Avatar
      
      if (option.type === 'primitive') {
        // Create a simple primitive avatar - no loading needed
        const primitiveGroup = new Group()
        primitiveGroup.name = 'PrimitiveAvatar'
        
        avatar = {
          id: option.id,
          name: option.name,
          model: primitiveGroup
        }
        console.log('Created primitive avatar:', avatar)
      } else if (option.type === 'gltf') {
        avatar = await gltfAvatarLoader.loadAvatar(option.path)
      } else {
        avatar = await avatarLoader.loadAvatar(option.path)
      }

      setLoadedAvatars(prev => ({ ...prev, [option.id]: avatar }))
      setSelectedAvatar(avatar)
      setSelectedOption(option.id)
      console.log(`${option.name} loaded successfully:`, avatar)
    // REMOVED catch and finally - let errors crash!
    setLoading(null)
  }

  const handleConfirm = () => {
    if (selectedAvatar) {
      console.log('Confirming avatar selection:', selectedAvatar)
      onAvatarSelected(selectedAvatar)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <div className="w-1/2 p-8">
        <h2 className="text-3xl font-bold text-white mb-6">Select Avatar</h2>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          {AVAILABLE_AVATARS.map((option) => (
            <div 
              key={option.id}
              className={`bg-slate-800 p-4 rounded-lg cursor-pointer transition-colors border-2 ${
                selectedOption === option.id 
                  ? 'border-blue-500 bg-slate-700' 
                  : 'border-transparent hover:bg-slate-700'
              }`}
              onClick={() => loadAvatar(option)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{option.name}</h3>
                  <p className="text-slate-300 text-sm mb-2">{option.description}</p>
                  <div className="text-xs text-slate-400">
                    {option.type.toUpperCase()} • Avatar ID: {option.path}
                  </div>
                </div>
                <div className="ml-4">
                  {loading === option.id && (
                    <div className="text-yellow-400">⏳ Loading...</div>
                  )}
                  {loadedAvatars[option.id] && (
                    <div className="text-green-400">✓ Ready</div>
                  )}
                  {selectedOption === option.id && !loading && (
                    <div className="text-blue-400">● Selected</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAvatar}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors font-semibold"
          >
            Enter Game →
          </button>
        </div>
      </div>
      
      <div className="w-1/2 bg-slate-800 flex items-center justify-center">
        <div className="text-center text-slate-400">
          {selectedAvatar ? (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{selectedAvatar.name}</h3>
              <p>Avatar preview would go here</p>
              <div className="text-sm mt-4">
                Model: {selectedAvatar.model ? '✓ Loaded' : '✗ Failed'}
              </div>
            </div>
          ) : (
            <p>Select an avatar to preview</p>
          )}
        </div>
      </div>
    </div>
  )
})