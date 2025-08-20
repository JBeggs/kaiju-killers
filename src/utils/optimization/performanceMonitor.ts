export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 60
  private callbacks: Array<(fps: number) => void> = []

  constructor() {
    this.tick()
  }

  private tick = () => {
    const currentTime = performance.now()
    this.frameCount++
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
      this.frameCount = 0
      this.lastTime = currentTime
      
      this.callbacks.forEach(callback => callback(this.fps))
    }
    
    requestAnimationFrame(this.tick)
  }

  onFpsUpdate(callback: (fps: number) => void) {
    this.callbacks.push(callback)
  }

  getCurrentFps(): number {
    return this.fps
  }

  getOptimalSettings() {
    if (this.fps < 30) {
      return {
        shadows: false,
        antialias: false,
        postProcessing: false,
        lodDistance: 10
      }
    } else if (this.fps < 45) {
      return {
        shadows: true,
        antialias: false,
        postProcessing: false,
        lodDistance: 15
      }
    } else {
      return {
        shadows: true,
        antialias: true,
        postProcessing: true,
        lodDistance: 25
      }
    }
  }
}
