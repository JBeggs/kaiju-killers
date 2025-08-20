// WebGL debugging and monitoring utilities
export class WebGLDebugger {
  private static contextLossCount = 0
  private static lastContextLoss = 0
  
  static setupWebGLDebugging(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return
    
    // Monitor context loss
    canvas.addEventListener('webglcontextlost', (event) => {
      console.error('🚨 WebGL Context Lost:', {
        timestamp: Date.now(),
        count: ++this.contextLossCount,
        timeSinceLastLoss: Date.now() - this.lastContextLoss,
        event
      })
      this.lastContextLoss = Date.now()
      
      // Prevent default to allow recovery
      event.preventDefault()
      
      // Diagnostic info
      this.logWebGLDiagnostics(gl)
    })
    
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('✅ WebGL Context Restored:', {
        timestamp: Date.now(),
        totalLosses: this.contextLossCount
      })
    })
    
    // Monitor memory pressure
    this.startMemoryMonitoring(gl)
  }
  
  static logWebGLDiagnostics(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    try {
      const info = {
        isContextLost: gl.isContextLost(),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
        aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
      }
      
      console.log('WebGL Diagnostics:', info)
    } catch (error) {
      console.error('Failed to get WebGL diagnostics:', error)
    }
  }
  
  static startMemoryMonitoring(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    // Check for memory info extension
    const memoryInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (memoryInfo) {
      console.log('WebGL Memory Info:', {
        renderer: gl.getParameter(memoryInfo.UNMASKED_RENDERER_WEBGL),
        vendor: gl.getParameter(memoryInfo.UNMASKED_VENDOR_WEBGL)
      })
    }
    
    // Single lightweight memory check - no interval
    const checkOnce = () => {
      if (gl.isContextLost()) {
        console.warn('Context is lost during initial check')
        return
      }
      
      try {
        const error = gl.getError()
        if (error !== gl.NO_ERROR) {
          console.warn('WebGL Error detected during startup:', {
            error,
            errorCode: this.getErrorName(gl, error),
            timestamp: Date.now()
          })
        }
      } catch (e) {
        console.warn('Error during WebGL initial check:', e)
      }
    }
    
    checkOnce()
  }
  
  static getErrorName(gl: WebGLRenderingContext | WebGL2RenderingContext, error: number): string {
    const errors: Record<number, string> = {
      [gl.NO_ERROR]: 'NO_ERROR',
      [gl.INVALID_ENUM]: 'INVALID_ENUM',
      [gl.INVALID_VALUE]: 'INVALID_VALUE',
      [gl.INVALID_OPERATION]: 'INVALID_OPERATION',
      [gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
      [gl.CONTEXT_LOST_WEBGL]: 'CONTEXT_LOST_WEBGL'
    }
    
    return errors[error] || `UNKNOWN_ERROR_${error}`
  }
  
  static forceContextLoss(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return
    
    const ext = gl.getExtension('WEBGL_lose_context')
    if (ext) {
      console.log('🔥 Forcing WebGL context loss for testing')
      ext.loseContext()
    }
  }
  
  static restoreContext(canvas?: HTMLCanvasElement) {
    if (!canvas) {
      // Try to find a canvas if none provided
      canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) {
        console.warn('No canvas found for context restoration')
        return
      }
    }
    
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) {
      console.warn('No WebGL context found for restoration')
      return
    }
    
    const ext = gl.getExtension('WEBGL_lose_context')
    if (ext) {
      console.log('🔄 Forcing WebGL context restoration')
      ext.restoreContext()
    } else {
      console.warn('WEBGL_lose_context extension not available')
    }
  }
}

// Export convenience functions
export const restoreContext = WebGLDebugger.restoreContext
export const logWebGLDiagnostics = WebGLDebugger.logWebGLDiagnostics
export const getWebGLInfo = (gl: WebGLRenderingContext | WebGL2RenderingContext) => {
  try {
    return {
      renderer: gl.getParameter(gl.RENDERER),
      vendor: gl.getParameter(gl.VENDOR),
      version: gl.getParameter(gl.VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      contextLostCount: WebGLDebugger['contextLossCount'] || 0
    }
  } catch (e) {
    return { error: 'Failed to get WebGL info' }
  }
}
