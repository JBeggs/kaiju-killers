export interface WebGLCapabilities {
  hasWebGL: boolean
  hasWebGL2: boolean
  contextLost: boolean
  maxTextureSize: number
  maxTextures: number
  renderer: string
  isLowPowerGPU: boolean
  recommendedMode: 'webgl' | 'canvas2d' | 'css3d' | 'sprite2d'
}

export class WebGLFallbackDetection {
  private static instance: WebGLFallbackDetection
  private capabilities: WebGLCapabilities | null = null
  private contextLossCount = 0

  static getInstance(): WebGLFallbackDetection {
    if (!WebGLFallbackDetection.instance) {
      WebGLFallbackDetection.instance = new WebGLFallbackDetection()
    }
    return WebGLFallbackDetection.instance
  }

  async detectCapabilities(): Promise<WebGLCapabilities> {
    if (this.capabilities) {
      return this.capabilities
    }

    console.log('🔍 Detecting WebGL capabilities...')

    // Test WebGL 1.0
    const canvas = document.createElement('canvas')
    let gl: WebGLRenderingContext | null = null
    let gl2: WebGL2RenderingContext | null = null

    try {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    } catch (e) {
      console.warn('WebGL 1.0 not available:', e)
    }

    // Test WebGL 2.0
    try {
      gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext
    } catch (e) {
      console.warn('WebGL 2.0 not available:', e)
    }

    if (!gl) {
      console.warn('❌ WebGL completely unavailable')
      this.capabilities = {
        hasWebGL: false,
        hasWebGL2: false,
        contextLost: false,
        maxTextureSize: 0,
        maxTextures: 0,
        renderer: 'No WebGL',
        isLowPowerGPU: true,
        recommendedMode: 'sprite2d'
      }
      return this.capabilities
    }

    // Get WebGL info
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0
    const maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || 0
    const renderer = gl.getParameter(gl.RENDERER) || 'Unknown'
    const vendor = gl.getParameter(gl.VENDOR) || 'Unknown'

    // Detect low-power GPU
    const isLowPowerGPU = this.isLowPowerGPU(renderer, vendor, maxTextureSize, maxTextures)

    // Test for context stability
    const contextLost = await this.testContextStability(canvas, gl)

    let recommendedMode: WebGLCapabilities['recommendedMode'] = 'webgl'

    if (contextLost || this.contextLossCount > 2) {
      console.warn('⚠️ WebGL context unstable, recommending fallback')
      recommendedMode = 'sprite2d'
    } else if (isLowPowerGPU) {
      console.warn('⚠️ Low-power GPU detected, recommending lightweight fallback')
      recommendedMode = 'css3d'
    } else if (maxTextureSize < 1024 || maxTextures < 8) {
      console.warn('⚠️ Limited GPU capabilities, recommending canvas fallback')
      recommendedMode = 'canvas2d'
    }

    this.capabilities = {
      hasWebGL: true,
      hasWebGL2: !!gl2,
      contextLost,
      maxTextureSize,
      maxTextures,
      renderer,
      isLowPowerGPU,
      recommendedMode
    }

    console.log('✅ WebGL capabilities detected:', this.capabilities)
    return this.capabilities
  }

  private isLowPowerGPU(renderer: string, vendor: string, maxTextureSize: number, maxTextures: number): boolean {
    const rendererLower = renderer.toLowerCase()
    const vendorLower = vendor.toLowerCase()
    
    // Known low-power indicators
    const lowPowerIndicators = [
      'intel', 'integrated', 'hd graphics', 'uhd graphics',
      'mali', 'adreno', 'powervr', 'videocore',
      'software', 'llvmpipe', 'swiftshader'
    ]

    const hasLowPowerIndicator = lowPowerIndicators.some(indicator => 
      rendererLower.includes(indicator) || vendorLower.includes(indicator)
    )

    const hasLimitedCapabilities = maxTextureSize < 2048 || maxTextures < 16

    return hasLowPowerIndicator || hasLimitedCapabilities
  }

  private async testContextStability(canvas: HTMLCanvasElement, gl: WebGLRenderingContext): Promise<boolean> {
    return new Promise((resolve) => {
      let contextLost = false
      
      const handleContextLoss = () => {
        contextLost = true
        this.contextLossCount++
        console.warn('🚨 WebGL context lost during stability test')
      }

      canvas.addEventListener('webglcontextlost', handleContextLoss)

      // Try to stress the context a bit
      try {
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        
        const framebuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
        
        // Clean up
        gl.deleteTexture(texture)
        gl.deleteFramebuffer(framebuffer)
      } catch (e) {
        console.warn('WebGL stress test failed:', e)
        contextLost = true
      }

      // Wait a bit to see if context is lost
      setTimeout(() => {
        canvas.removeEventListener('webglcontextlost', handleContextLoss)
        resolve(contextLost)
      }, 100)
    })
  }

  getRecommendedRenderMode(): WebGLCapabilities['recommendedMode'] {
    if (!this.capabilities) {
      return 'sprite2d' // Safe default
    }
    return this.capabilities.recommendedMode
  }

  forceRenderMode(mode: WebGLCapabilities['recommendedMode']) {
    localStorage.setItem('forcedRenderMode', mode)
    console.log(`🔧 Render mode forced to: ${mode}`)
  }

  getForcedRenderMode(): WebGLCapabilities['recommendedMode'] | null {
    return localStorage.getItem('forcedRenderMode') as WebGLCapabilities['recommendedMode'] | null
  }

  clearForcedRenderMode() {
    localStorage.removeItem('forcedRenderMode')
  }

  onContextLoss() {
    this.contextLossCount++
    if (this.capabilities) {
      this.capabilities.contextLost = true
      this.capabilities.recommendedMode = 'sprite2d'
    }
  }
}
