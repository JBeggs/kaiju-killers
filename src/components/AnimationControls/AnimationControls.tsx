import { useState } from 'react'
import { Avatar } from '@/types'
import { useAnimationControls } from '@/hooks/useAnimationControls'

interface AnimationControlsProps {
  avatar: Avatar
}

export function AnimationControls({ avatar }: AnimationControlsProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<string>('')
  const { playAnimation } = useAnimationControls(avatar)

  const handlePlayAnimation = (animationName: string) => {
    playAnimation(animationName)
    setSelectedAnimation(animationName)
  }

  if (!avatar.animations || avatar.animations.length === 0) {
    return (
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-2">No Animations Available</h3>
        <p className="text-gray-300">This model doesn't have any animations.</p>
      </div>
    )
  }

  return (
    <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg min-w-[250px] border-2 border-blue-500">
      <h3 className="text-xl font-bold mb-2">🎬 ANIMATIONS ACTIVE!</h3>
      <p className="text-yellow-300 text-sm mb-3">👆 Click any animation below ({avatar.animations.length} available):</p>
      
      <div className="space-y-2">
        {avatar.animations.map((animation, index) => (
          <button
            key={index}
            onClick={() => handlePlayAnimation(animation.name)}
            className={`w-full px-3 py-2 rounded text-left transition-colors ${
              selectedAnimation === animation.name 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            🎭 {animation.name}
          </button>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-600">
        <p className="text-xs text-gray-400">
          Current: {selectedAnimation || 'Auto-selected'}
        </p>
      </div>
    </div>
  )
}
