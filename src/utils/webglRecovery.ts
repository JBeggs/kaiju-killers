export function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    return !!gl
  } catch (e) {
    return false
  }
}

export function forceWebGLContextRecovery(): void {
  console.log('Attempting WebGL context recovery...')
  
  const canvases = document.querySelectorAll('canvas')
  canvases.forEach(canvas => {
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (gl) {
      const loseContext = gl.getExtension('WEBGL_lose_context')
      if (loseContext) {
        console.log('Forcing context restoration...')
        loseContext.restoreContext()
      }
    }
  })
  
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

export function getWebGLInfo(): any {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
  
  if (!gl) return null
  
  return {
    renderer: gl.getParameter(gl.RENDERER),
    vendor: gl.getParameter(gl.VENDOR),
    version: gl.getParameter(gl.VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
  }
}
