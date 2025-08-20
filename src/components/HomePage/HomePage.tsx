interface HomePageProps {
  onStartGame: () => void
}

export function HomePage({ onStartGame }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-white mb-6">
          Base Game Platform
        </h1>
        
        <p className="text-xl text-slate-300 mb-8 leading-relaxed">
          A stable foundation for developing multiplayer games including racing, 
          fighting, and role-playing experiences. Built with React Three.js 
          for immersive 3D gameplay.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Multi-View</h3>
            <p className="text-slate-400">Switch between 1st and 3rd person views</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Networking</h3>
            <p className="text-slate-400">VoIP communication and chat system</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Multiplayer</h3>
            <p className="text-slate-400">Auto-lobby and custom room creation</p>
          </div>
        </div>
        
        <button
          onClick={onStartGame}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xl px-12 py-4 rounded-lg 
                     transition-colors duration-200 font-semibold shadow-lg"
        >
          Select Avatar & Enter
        </button>
      </div>
    </div>
  )
}
