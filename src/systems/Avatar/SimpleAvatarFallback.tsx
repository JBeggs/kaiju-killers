import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Group } from 'three'

interface SimpleAvatarFallbackProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  color?: string
}

export function SimpleAvatarFallback({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  color = "#4a90e2" 
}: SimpleAvatarFallbackProps) {
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position)
      groupRef.current.rotation.set(...rotation)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.4, 1.2, 0.25]} />
        <meshLambertMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.25]} />
        <meshLambertMaterial color="#ffdbac" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.35, 0.8, 0]}>
        <boxGeometry args={[0.15, 0.8, 0.15]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0.35, 0.8, 0]}>
        <boxGeometry args={[0.15, 0.8, 0.15]} />
        <meshLambertMaterial color={color} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.12, -0.4, 0]}>
        <boxGeometry args={[0.18, 0.8, 0.18]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0.12, -0.4, 0]}>
        <boxGeometry args={[0.18, 0.8, 0.18]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
    </group>
  )
}
