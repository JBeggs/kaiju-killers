import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

interface LobbyProps {
  onEnterGame: () => void
}

export function Lobby({ onEnterGame }: LobbyProps) {
  const { lobby, currentPlayer, view, setView } = useGameStore()
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [roomName, setRoomName] = useState('')

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      console.log('Creating room:', roomName)
      setShowCreateRoom(false)
      setRoomName('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
            <p className="text-slate-300">Welcome, {currentPlayer?.name || 'Player'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setView('third')}
                className={`px-4 py-2 rounded transition-colors ${
                  view === 'third' ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
              >
                3rd Person
              </button>
              <button
                onClick={() => setView('first')}
                className={`px-4 py-2 rounded transition-colors ${
                  view === 'first' ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
              >
                1st Person
              </button>
            </div>
            
            <button
              onClick={onEnterGame}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Enter Game
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Players in Lobby ({lobby.length})
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {lobby.map(player => (
                  <div key={player.id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{player.name}</div>
                        <div className="text-sm text-slate-400">{player.avatar.name}</div>
                      </div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                ))}
                
                {lobby.length === 0 && (
                  <div className="col-span-2 text-center text-slate-400 py-8">
                    No other players in lobby
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Create Room</h3>
              
              {!showCreateRoom ? (
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors"
                >
                  Create Private Room
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Room name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded border-none outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateRoom}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setShowCreateRoom(false)}
                      className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Current View:</span>
                  <span className="capitalize">{view} Person</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Connection:</span>
                  <span className="text-green-400">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
