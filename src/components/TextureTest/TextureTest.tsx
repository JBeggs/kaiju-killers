import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { AvatarSystem } from '@/systems/Avatar/AvatarSystem'
import { useGameStore } from '@/stores/gameStore'

const RotatingModel = ({ avatar }: { avatar: string }) => {
  const groupRef = useRef<any>()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5
    }
  })
  
  return (
    <group ref={groupRef}>
      <AvatarSystem 
        avatar={avatar}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  )
}

const TextureTest: React.FC = () => {
  const { currentPlayer } = useGameStore()
  const [selectedAvatar, setSelectedAvatar] = useState('dr')
  const [showStats, setShowStats] = useState(true)

  return (
    <div className="w-full h-screen bg-gray-900">
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-75 text-white p-4 rounded">
        <h2 className="text-xl font-bold mb-2">🖼️ GLTF Texture Test</h2>
        <div className="space-y-2">
          <button 
            onClick={() => setSelectedAvatar('dr')}
            className={`block w-full px-3 py-1 rounded ${selectedAvatar === 'dr' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            Dr (13 textures) 
          </button>
          <button 
            onClick={() => setSelectedAvatar('crash_bandicoot')}
            className={`block w-full px-3 py-1 rounded ${selectedAvatar === 'crash_bandicoot' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            Crash (1 texture)
          </button>
        </div>
        <div className="mt-3 text-sm">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={showStats} 
              onChange={(e) => setShowStats(e.target.checked)}
              className="mr-2"
            />
            Show Stats
          </label>
        </div>
        <div className="mt-3 text-xs text-gray-300">
          Check browser console for detailed texture information
        </div>
      </div>

      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        {showStats && <Stats showPanel={0} className="stats" />}
        
        {/* Enhanced lighting for texture visibility */}
        <ambientLight intensity={0.5} color="#ffffff" />
        <directionalLight position={[5, 10, 5]} intensity={1.0} color="#ffffff" />
        <directionalLight position={[-5, 10, -5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
        />
        
        <RotatingModel avatar={selectedAvatar} />
        
        {/* Ground plane for reference */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </Canvas>
    </div>
  )
}

export default TextureTest
