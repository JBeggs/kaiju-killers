import { create } from 'zustand'
import { GameState, Player, Room } from '@/types'

interface GameStore extends GameState {
  setPlayer: (player: Player) => void
  setRoom: (room: Room | null) => void
  setView: (view: 'first' | 'third' | 'non-webgl') => void
  setConnected: (connected: boolean) => void
  addToLobby: (player: Player) => void
  removeFromLobby: (playerId: string) => void
}

export const useGameStore = create<GameStore>((set) => ({
  currentPlayer: null,
  currentRoom: null,
  lobby: [],
  view: 'third',
  isConnected: false,
  
  setPlayer: (player) => set((state) => ({ 
    currentPlayer: player,
    lobby: [...state.lobby.filter(p => p.id !== player.id), player] // Add current player to lobby too
  })),
  setRoom: (room) => set({ currentRoom: room }),
  setView: (view) => set({ view }),
  setConnected: (connected) => set({ isConnected: connected }),
  
  addToLobby: (player) => 
    set((state) => ({ 
      lobby: [...state.lobby.filter(p => p.id !== player.id), player] 
    })),
    
  removeFromLobby: (playerId) => 
    set((state) => ({ 
      lobby: state.lobby.filter(p => p.id !== playerId) 
    }))
}))
