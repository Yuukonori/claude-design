/* global React */
// ShaderFill — a self-contained WebGL layer that runs a user GLSL fragment shader as an animated
// texture. It fills its positioned parent (position:absolute; inset:0). Uniforms provided to the
// fragment shader: `u_time` (seconds, scaled by `speed`) and `u_resolution` (drawing-buffer px).
// A compile/link failure never throws — it stops the loop, renders nothing, and reports via onError.

// Starter shaders. They must NOT redeclare precision / u_time / u_resolution (the header adds those).
const SHADER_PRESETS = {
  gradient: `// Animated gradient
void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = u_time * 0.2;
  vec3 a = vec3(0.20, 0.12, 0.45);
  vec3 b = vec3(0.90, 0.35, 0.55);
  vec3 col = mix(a, b, 0.5 + 0.5 * sin(t + uv.x * 3.1416 + uv.y * 1.5));
  gl_FragColor = vec4(col, 1.0);
}`,
  plasma: `// Classic plasma
void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = u_time;
  float v = sin(uv.x * 10.0 + t)
          + sin(uv.y * 10.0 + t)
          + sin((uv.x + uv.y) * 10.0 + t)
          + sin(length(uv - 0.5) * 20.0 - t * 2.0);
  v *= 0.25;
  vec3 col = 0.5 + 0.5 * cos(6.2831 * (v + vec3(0.0, 0.33, 0.67)));
  gl_FragColor = vec4(col, 1.0);
}`,
  noise: `// Value-noise field
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float n = 0.5 * noise(uv * 6.0 + u_time * 0.5) + 0.5 * noise(uv * 12.0 - u_time * 0.3);
  vec3 col = mix(vec3(0.05, 0.07, 0.12), vec3(0.45, 0.65, 0.95), n);
  gl_FragColor = vec4(col, 1.0);
}`,
};
const DEFAULT_SHADER = SHADER_PRESETS.plasma;

const VERT_SRC = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
const FRAG_HEADER = 'precision mediump float;\nuniform float u_time;\nuniform vec2 u_resolution;\n';

function ShaderFill({ code, speed = 1, onError }) {
  const canvasRef = React.useRef(null);
  const speedRef = React.useRef(speed);
  // Keep the animation reading the latest speed without recompiling the program.
  React.useEffect(() => { speedRef.current = speed; }, [speed]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { if (onError) onError('WebGL is not available in this browser.'); return; }

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh);
        gl.deleteShader(sh);
        throw new Error(log || 'Shader compile error');
      }
      return sh;
    };

    let program;
    try {
      const v = compile(gl.VERTEX_SHADER, VERT_SRC);
      const f = compile(gl.FRAGMENT_SHADER, FRAG_HEADER + (code || DEFAULT_SHADER));
      program = gl.createProgram();
      gl.attachShader(program, v);
      gl.attachShader(program, f);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Program link error');
      }
      gl.deleteShader(v);
      gl.deleteShader(f);
      if (onError) onError(null);
    } catch (err) {
      if (onError) onError(String(err.message || err));
      console.warn('[ShaderFill]', err);
      return; // leave the canvas transparent; no loop started
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const loc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    let ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(canvas); }
    resize();

    const start = performance.now();
    let raf = 0;
    const render = () => {
      const t = ((performance.now() - start) / 1000) * (speedRef.current || 1);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    };
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}

window.ShaderFill = ShaderFill;
window.SHADER_PRESETS = SHADER_PRESETS;
window.DEFAULT_SHADER = DEFAULT_SHADER;
