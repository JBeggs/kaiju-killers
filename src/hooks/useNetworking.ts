import { useEffect, useState } from 'react'
import { NetworkManager } from '@/systems/Networking/NetworkManager'
import { useGameStore } from '@/stores/gameStore'
import { Player } from '@/types'

let networkManager: NetworkManager | null = null

export function useNetworking() {
  const [isInitialized, setIsInitialized] = useState(false)
  const { 
    setConnected, 
    addToLobby, 
    removeFromLobby,
    currentPlayer 
  } = useGameStore()

  useEffect(() => {
    initializeNetwork()
    return () => {
      if (networkManager) {
        networkManager.disconnect()
      }
    }
  }, [])

  const initializeNetwork = async () => {
    if (!networkManager) {
      networkManager = new NetworkManager()
      
      networkManager.on('connected', (connected: boolean) => {
        setConnected(connected)
        if (connected && currentPlayer) {
          networkManager?.joinLobby(currentPlayer)
        }
      })

      networkManager.on('player_joined', (player: Player) => {
        addToLobby(player)
      })

      networkManager.on('player_left', (playerId: string) => {
        removeFromLobby(playerId)
      })

      networkManager.on('lobby_update', (players: Player[]) => {
        players.forEach(player => addToLobby(player))
      })

      const connected = await networkManager.connect()
      setIsInitialized(true)
      
      if (!connected) {
        console.warn('Failed to connect to server, running in offline mode')
      }
    }
  }

  const joinLobby = (player: Player) => {
    networkManager?.joinLobby(player)
  }

  const createRoom = (roomName: string, isPrivate: boolean = false) => {
    networkManager?.createRoom(roomName, isPrivate)
  }

  return {
    isInitialized,
    joinLobby,
    createRoom,
    networkManager
  }
}
