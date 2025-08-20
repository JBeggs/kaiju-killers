// Stub NetworkManager - networking disabled for avatar debugging
export class NetworkManager {
  async connect(): Promise<boolean> {
    console.log('🔍 NetworkManager: Disabled for avatar debugging')
    return false
  }

  disconnect() {
    // No-op
  }

  on(event: string, callback: Function) {
    // No-op
  }

  joinLobby(player: any) {
    // No-op
  }

  createRoom(roomName: string, isPrivate: boolean = false) {
    // No-op  
  }

  getConnectionStatus(): boolean {
    return false
  }
}
