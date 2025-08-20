import { useState, useEffect } from 'react'
import { HomePage } from '@/components/HomePage/HomePage'
import { AvatarSelection } from '@/components/AvatarSelection/AvatarSelection'
import { Lobby } from '@/components/Lobby/Lobby'
import { GameRoom } from '@/components/GameRoom/GameRoom'
import { useGameStore } from '@/stores/gameStore'
import { useNetworking } from '@/hooks/useNetworking'
import { Avatar, Player } from '@/types'

type AppState = 'home' | 'avatar-selection' | 'lobby' | 'game'

export function App() {
  const [currentState, setCurrentState] = useState<AppState>('home')
  const { currentPlayer, setPlayer } = useGameStore()
  const { isInitialized, joinLobby } = useNetworking()

  useEffect(() => {
    if (isInitialized && currentPlayer && currentState === 'lobby') {
      joinLobby(currentPlayer)
    }
  }, [isInitialized, currentPlayer, currentState])

  const handleStartGame = () => {
    setCurrentState('avatar-selection')
  }

  const handleAvatarSelected = (avatar: Avatar) => {
    const player: Player = {
      id: Math.random().toString(36).substring(2, 15),
      name: `Player_${Math.random().toString(36).substring(2, 7)}`,
      avatar,
      position: [0, 0, 0],
      rotation: [0, 0, 0]
    }
    
    setPlayer(player)
    setCurrentState('lobby')
  }

  const handleEnterGame = () => {
    setCurrentState('game')
  }

  const handleLeaveGame = () => {
    setCurrentState('lobby')
  }

  const handleBackToHome = () => {
    setCurrentState('home')
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Initializing platform...</div>
      </div>
    )
  }

  switch (currentState) {
    case 'home':
      return <HomePage onStartGame={handleStartGame} />
    
    case 'avatar-selection':
      return (
        <AvatarSelection 
          onAvatarSelected={handleAvatarSelected}
          onBack={handleBackToHome}
        />
      )
    
    case 'lobby':
      return <Lobby onEnterGame={handleEnterGame} />
    
    case 'game':
      return <GameRoom onLeaveGame={handleLeaveGame} />
    
    default:
      return <HomePage onStartGame={handleStartGame} />
  }
}
