import { CSSProperties } from 'react'

interface Sprite2DAvatarFallbackProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  name?: string
}

export function Sprite2DAvatarFallback({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  color = "#4a90e2",
  name = "Player"
}: Sprite2DAvatarFallbackProps) {
  // Generate a simple SVG avatar as data URL
  const avatarSVG = `
    <svg width="40" height="60" xmlns="http://www.w3.org/2000/svg">
      <!-- Head -->
      <circle cx="20" cy="15" r="12" fill="#ffdbac" stroke="#333" stroke-width="1"/>
      <!-- Eyes -->
      <circle cx="16" cy="12" r="1.5" fill="#333"/>
      <circle cx="24" cy="12" r="1.5" fill="#333"/>
      <!-- Body -->
      <rect x="8" y="25" width="24" height="20" fill="${color}" stroke="#333" stroke-width="1"/>
      <!-- Arms -->
      <rect x="2" y="28" width="8" height="15" fill="${color}" stroke="#333" stroke-width="1"/>
      <rect x="30" y="28" width="8" height="15" fill="${color}" stroke="#333" stroke-width="1"/>
      <!-- Legs -->
      <rect x="12" y="44" width="6" height="15" fill="#2c3e50" stroke="#333" stroke-width="1"/>
      <rect x="22" y="44" width="6" height="15" fill="#2c3e50" stroke="#333" stroke-width="1"/>
    </svg>
  `.trim()

  const avatarDataURL = `data:image/svg+xml;base64,${btoa(avatarSVG)}`

  const containerStyle: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `
      translate(-50%, -50%)
      translateX(${position[0] * 50}px)
      translateY(${-position[1] * 50}px)
      translateZ(${position[2] * 50}px)
      rotateZ(${rotation[1]}rad)
    `,
    zIndex: Math.round(1000 - position[2] * 10), // Simple depth sorting
  }

  const avatarStyle: CSSProperties = {
    width: '40px',
    height: '60px',
    imageRendering: 'pixelated',
    filter: `hue-rotate(${(rotation[1] * 180 / Math.PI) % 360}deg)`,
  }

  const nameStyle: CSSProperties = {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '1px 4px',
    borderRadius: '2px',
    fontSize: '10px',
    whiteSpace: 'nowrap',
    left: '50%',
    transform: 'translateX(-50%) translateY(-15px)',
    pointerEvents: 'none',
    textAlign: 'center'
  }

  return (
    <div style={containerStyle}>
      <div style={nameStyle}>{name}</div>
      <img 
        src={avatarDataURL} 
        alt={`${name} avatar`}
        style={avatarStyle}
      />
    </div>
  )
}
