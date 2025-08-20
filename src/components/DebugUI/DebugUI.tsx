import { useGameStore } from '@/stores/gameStore'

export function DebugUI() {
  const { currentPlayer, lobby, view } = useGameStore()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded text-sm max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      
      <div className="mb-2">
        <strong>Current Player:</strong><br/>
        {currentPlayer ? (
          <>
            ID: {currentPlayer.id}<br/>
            Name: {currentPlayer.name}<br/>
            Position: [{currentPlayer.position.join(', ')}]<br/>
            Avatar: {currentPlayer.avatar.name}
          </>
        ) : 'None'}
      </div>

      <div className="mb-2">
        <strong>Lobby Players ({lobby.length}):</strong><br/>
        {lobby.map(player => (
          <div key={player.id} className="text-xs">
            {player.name} {player.id === currentPlayer?.id ? '(YOU)' : ''}
          </div>
        ))}
      </div>

      <div>
        <strong>View:</strong> {view}
      </div>
    </div>
  )
}
