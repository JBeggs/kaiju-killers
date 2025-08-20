import { memo } from 'react'

interface SimpleAvatarTestProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export const SimpleAvatarTest = memo(function SimpleAvatarTest({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0] 
}: SimpleAvatarTestProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Bright self-illuminated avatar - no lighting needed */}
      
      {/* Head */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.3]} />
        <meshBasicMaterial color="#ffaa88" />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.6, 1.2, 0.3]} />
        <meshBasicMaterial color="#4a90e2" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.5, 1.2, 0]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshBasicMaterial color="#4a90e2" />
      </mesh>
      <mesh position={[0.5, 1.2, 0]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshBasicMaterial color="#4a90e2" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.25, 1, 0.25]} />
        <meshBasicMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0.2, 0, 0]}>
        <boxGeometry args={[0.25, 1, 0.25]} />
        <meshBasicMaterial color="#2c3e50" />
      </mesh>
      
      {/* Bright marker to confirm it's working */}
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#00ff00" emissive="#00ff00" />
      </mesh>
    </group>
  )
})
