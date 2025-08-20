import * as THREE from 'three'

export interface Avatar {
  id: string
  name: string
  model: any | null
  animations?: THREE.AnimationClip[]
  mixer?: THREE.AnimationMixer
}

export interface Player {
  id: string
  name: string
  avatar: Avatar
  position: [number, number, number]
  rotation: [number, number, number]
  room?: string
}

export interface Room {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  isPrivate: boolean
}

export interface GameState {
  currentPlayer: Player | null
  currentRoom: Room | null
  lobby: Player[]
  view: 'first' | 'third' | 'non-webgl'
  isConnected: boolean
}

export type ViewType = 'first' | 'third' | 'non-webgl'

export interface NetworkMessage {
  type: string
  data: any
  timestamp: number
}
