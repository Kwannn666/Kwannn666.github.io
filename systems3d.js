// A small native WebGL scene. No renderer library, textures or network requests.
(() => {
  const canvas = document.getElementById('networkCanvas');
  const shell = document.querySelector('.scene-shell');
  if (!canvas || !shell) return;
  const fallback = document.getElementById('sceneFallback');
  const controls = document.getElementById('sceneControls');
  const motionButton = document.getElementById('sceneMotion');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 620px)');
  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aColor;
    attribute float aSize;
    uniform mat4 uProjection;
    uniform vec2 uRotation;
    uniform float uPixelRatio;
    uniform float uPointScale;
    varying vec3 vColor;
    varying float vDepth;
    void main() {
      vec3 p = aPosition;
      float cx = cos(uRotation.x), sx = sin(uRotation.x);
      float cy = cos(uRotation.y), sy = sin(uRotation.y);
      p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
      p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
      vDepth = clamp((p.z + 2.8) / 5.6, 0.2, 1.0);
      p.z -= 7.2;
      gl_Position = uProjection * vec4(p, 1.0);
      gl_PointSize = aSize * uPixelRatio * uPointScale * (7.2 / -p.z);
      vColor = aColor;
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform bool uPoints;
    uniform float uOpacity;
    uniform bool uLight;
    varying vec3 vColor;
    varying float vDepth;
    void main() {
      float alpha = uOpacity * (0.3 + vDepth * 0.7);
      if (uPoints) {
        float d = length(gl_PointCoord * 2.0 - 1.0);
        if (d > 1.0) discard;
        alpha *= 1.0 - smoothstep(0.25, 1.0, d);
      }
      vec3 color = uLight ? vColor * 0.40 : vColor;
      gl_FragColor = vec4(color, alpha);
    }
  `;
  let gl, program, lineBuffer, pointBuffer, attributes, uniforms;
  let lineCount = 0, pointCount = 0, dpr = 1;
  let yaw = .55, pitch = -.25, targetYaw = yaw, targetPitch = pitch;
  let inView = true, paused = false, lost = false, available = false;
  let frame = 0, previousTime = 0, pointer = null;
  const initialYaw = yaw, initialPitch = pitch;
  const lines = [], points = [];
  const mint = [.44, .88, .73], gold = [.75, .63, 1], pale = [.7, .89, .82];
  const vertex = (list, point, color, size = 5) => list.push(...point, ...color, size);
  const edge = (a, b, color = mint) => { vertex(lines, a, color); vertex(lines, b, color); };

  // A spherical network, three orbital paths and a wireframe computing core.
  const nodes = [];
  const count = 64;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = goldenAngle * i;
    const p = [Math.cos(angle) * radius * 1.8, y * 1.8, Math.sin(angle) * radius * 1.8];
    nodes.push(p);
    vertex(points, p, i % 9 === 0 ? gold : mint, i % 9 === 0 ? 7 : 4.5);
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.hypot(...nodes[i].map((v, k) => v - nodes[j][k])) < .88) edge(nodes[i], nodes[j]);
    }
  }
  for (let ring = 0; ring < 3; ring++) {
    const radius = 2.22 + ring * .08;
    const orbit = angle => {
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      if (ring === 0) return [x, y * .55, y * .84];
      if (ring === 1) return [x * .4, y, x * .916];
      return [x, y * .85, -y * .526];
    };
    for (let i = 0; i < 112; i++) edge(orbit(i / 112 * Math.PI * 2), orbit((i + 1) / 112 * Math.PI * 2), ring === 1 ? gold : mint);
    vertex(points, orbit(ring * 1.8 + .4), gold, 9);
  }
  const corners = [];
  for (const x of [-.6, .6]) for (const y of [-.6, .6]) for (const z of [-.6, .6]) corners.push([x, y, z]);
  corners.forEach((a, i) => {
    vertex(points, a, pale, 6);
    corners.slice(i + 1).forEach(b => {
      if (a.filter((value, index) => value !== b[index]).length === 1) edge(a, b, pale);
    });
  });

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error('3D shader unavailable');
    }
    return shader;
  }
  function showFallback() {
    available = false;
    stop();
    canvas.hidden = true;
    fallback.hidden = false;
    controls.hidden = true;
    shell.removeAttribute('tabindex');
    shell.classList.remove('scene-ready');
  }
  function initialize() {
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: !mobile.matches, powerPreference: 'low-power', depth: false, preserveDrawingBuffer: false });
      if (!gl) return showFallback();
      const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('3D program unavailable');
      gl.useProgram(program);
      attributes = ['aPosition', 'aColor', 'aSize'].map(name => gl.getAttribLocation(program, name));
      uniforms = Object.fromEntries(['uProjection', 'uRotation', 'uPixelRatio', 'uPointScale', 'uPoints', 'uOpacity', 'uLight'].map(name => [name, gl.getUniformLocation(program, name)]));
      const buffer = data => {
        const result = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, result);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        return result;
      };
      lineBuffer = buffer(lines);
      pointBuffer = buffer(points);
      lineCount = lines.length / 7;
      pointCount = points.length / 7;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      available = true; lost = false;
      canvas.hidden = false;
      fallback.hidden = true;
      controls.hidden = false;
      shell.setAttribute('tabindex', '0');
      shell.classList.add('scene-ready');
      resize();
      sync();
    } catch {
      showFallback();
    }
  }
  function bind(buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    attributes.forEach((location, index) => {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, index === 2 ? 1 : 3, gl.FLOAT, false, 28, index === 0 ? 0 : index === 1 ? 12 : 24);
    });
  }
  function resize() {
    if (!available || lost) return;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    dpr = Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.25 : 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const f = 1 / Math.tan(Math.PI / 7);
    const near = .1, far = 30, range = 1 / (near - far);
    gl.uniformMatrix4fv(uniforms.uProjection, false, new Float32Array([
      f / (width / height), 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * range, -1,
      0, 0, 2 * far * near * range, 0
    ]));
    render();
  }
  function render() {
    if (!available || lost) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uniforms.uRotation, pitch, yaw);
    gl.uniform1f(uniforms.uPixelRatio, dpr);
    gl.uniform1i(uniforms.uLight, document.documentElement.dataset.theme === 'light' ? 1 : 0);
    bind(lineBuffer);
    gl.uniform1i(uniforms.uPoints, 0);
    gl.uniform1f(uniforms.uOpacity, .55);
    gl.uniform1f(uniforms.uPointScale, 1);
    gl.drawArrays(gl.LINES, 0, lineCount);
    bind(pointBuffer);
    gl.uniform1i(uniforms.uPoints, 1);
    gl.uniform1f(uniforms.uPointScale, 3.4);
    gl.uniform1f(uniforms.uOpacity, .15);
    gl.drawArrays(gl.POINTS, 0, pointCount);
    gl.uniform1f(uniforms.uPointScale, 1);
    gl.uniform1f(uniforms.uOpacity, 1);
    gl.drawArrays(gl.POINTS, 0, pointCount);
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; previousTime = 0;
  }
  function canAnimate() { return available && !lost && inView && !document.hidden && !motion.matches; }
  function autoRotate() { return !paused && !mobile.matches && !pointer; }
  function updateButton() {
    const stopped = paused || motion.matches || mobile.matches;
    motionButton.textContent = stopped ? '▶' : 'Ⅱ';
    motionButton.setAttribute('aria-pressed', String(stopped));
    motionButton.setAttribute('aria-label', stopped ? 'Start automatic rotation' : 'Pause automatic rotation');
    motionButton.title = stopped ? 'Start rotation' : 'Pause rotation';
    motionButton.disabled = motion.matches || mobile.matches;
    if (motionButton.disabled) motionButton.title = motion.matches ? 'Automatic motion disabled by your system preference' : 'Drag or use arrow keys to rotate';
  }
  function tick(time) {
    frame = 0;
    if (!canAnimate()) return;
    if (time - previousTime < 1000 / 30) { frame = requestAnimationFrame(tick); return; }
    const elapsed = Math.min(time - (previousTime || time), 50);
    previousTime = time;
    if (autoRotate()) targetYaw += elapsed * .00015;
    yaw += (targetYaw - yaw) * .12;
    pitch += (targetPitch - pitch) * .12;
    render();
    if (autoRotate() || Math.abs(targetYaw - yaw) + Math.abs(targetPitch - pitch) > .001) frame = requestAnimationFrame(tick);
  }
  function sync() {
    stop();
    updateButton();
    if (motion.matches || mobile.matches) { yaw = targetYaw; pitch = targetPitch; }
    render();
    if (canAnimate() && (autoRotate() || Math.abs(targetYaw - yaw) + Math.abs(targetPitch - pitch) > .001)) frame = requestAnimationFrame(tick);
  }
  function move(dx, dy = 0) {
    targetYaw += dx;
    targetPitch = Math.max(-1.15, Math.min(1.15, targetPitch + dy));
    sync();
  }
  document.getElementById('sceneLeft').addEventListener('click', () => move(-.3));
  document.getElementById('sceneRight').addEventListener('click', () => move(.3));
  document.getElementById('sceneReset').addEventListener('click', () => {
    targetYaw = initialYaw; targetPitch = initialPitch; sync();
  });
  motionButton.addEventListener('click', () => { paused = !paused; sync(); });
  shell.addEventListener('keydown', event => {
    const directions = { ArrowLeft: [-.25, 0], ArrowRight: [.25, 0], ArrowUp: [0, -.2], ArrowDown: [0, .2] };
    if (directions[event.key]) { event.preventDefault(); move(...directions[event.key]); }
    if (event.key === 'Home') { event.preventDefault(); targetYaw = initialYaw; targetPitch = initialPitch; sync(); }
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !available || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    shell.classList.add('dragging');
    shell.focus({ preventScroll: true });
    sync();
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    move((event.clientX - pointer.x) * .008, (event.clientY - pointer.y) * .006);
    pointer.x = event.clientX; pointer.y = event.clientY;
  });
  const release = () => { pointer = null; shell.classList.remove('dragging'); sync(); };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; pointer = null; showFallback(); });
  canvas.addEventListener('webglcontextrestored', initialize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }).observe(shell);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  new MutationObserver(() => { render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  mobile.addEventListener('change', () => { resize(); sync(); });
  initialize();
})();

// Motion is layered on top of readable static content, never required to reveal it.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const pending = new Set();
  let revealObserver;
  if ('IntersectionObserver' in window && !reduced.matches) {
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('will-reveal');
      pending.delete(entry.target);
      revealObserver.unobserve(entry.target);
    }), { threshold: .08 });
    document.querySelectorAll('.reveal').forEach((element, index) => {
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.style.setProperty('--reveal-delay', `${(index % 3) * 60}ms`);
      element.classList.add('motion-reveal', 'will-reveal');
      pending.add(element);
      revealObserver.observe(element);
    });
  }
  const revealAll = () => {
    pending.forEach(element => element.classList.remove('will-reveal'));
    pending.clear();
    revealObserver?.disconnect();
  };
  // Anchor navigation and print should expose content immediately.
  window.addEventListener('hashchange', revealAll);
  window.addEventListener('beforeprint', revealAll);
  reduced.addEventListener('change', event => { if (event.matches) revealAll(); });

  document.querySelectorAll('.project-card, .domain-card, .award-item').forEach(card => {
    let request = 0;
    const reset = () => {
      if (request) cancelAnimationFrame(request);
      request = 0;
      card.classList.remove('tilting');
      ['--tilt-x', '--tilt-y', '--glow-x', '--glow-y'].forEach(name => card.style.removeProperty(name));
    };
    card.addEventListener('pointermove', event => {
      if (reduced.matches || !finePointer.matches) return;
      if (request) cancelAnimationFrame(request);
      request = requestAnimationFrame(() => {
        request = 0;
        const rect = card.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        card.style.setProperty('--tilt-x', `${(y - .5) * -7}deg`);
        card.style.setProperty('--tilt-y', `${(x - .5) * 7}deg`);
        card.style.setProperty('--glow-x', `${x * 100}%`);
        card.style.setProperty('--glow-y', `${y * 100}%`);
        card.classList.add('tilting');
      });
    });
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
    reduced.addEventListener('change', reset);
    finePointer.addEventListener('change', reset);
  });

  const progress = document.querySelector('.scroll-progress');
  let progressFrame = 0;
  const updateProgress = () => {
    if (progressFrame) return;
    progressFrame = requestAnimationFrame(() => {
      progressFrame = 0;
      const range = document.documentElement.scrollHeight - window.innerHeight;
      progress?.style.setProperty('--progress', range > 0 ? String(Math.min(1, Math.max(0, window.scrollY / range))) : '0');
    });
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();
})();
