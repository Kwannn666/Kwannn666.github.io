// Native WebGL thesis schematic. Geometry is defined in thesis-scene.js.
(() => {
  const canvas = document.getElementById('networkCanvas');
  const shell = document.querySelector('.scene-shell');
  const model = window.ThesisScene;
  if (!canvas || !shell || !model) return;
  const fallback = document.getElementById('sceneFallback');
  const controls = document.getElementById('sceneControls');
  const labels = document.getElementById('sceneLabels');
  const motionButton = document.getElementById('sceneMotion');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 620px)');
  const entityButtons = model.entities.map(entity => ({ entity, button: labels.querySelector(`[data-entity="${entity.id}"]`) }));
  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aColor;
    attribute float aSize;
    uniform mat4 uProjection;
    uniform vec2 uRotation;
    uniform float uCameraDistance;
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
      vDepth = clamp((p.z + 3.5) / 7.0, 0.2, 1.0);
      p.z -= uCameraDistance;
      gl_Position = uProjection * vec4(p, 1.0);
      gl_PointSize = aSize * uPixelRatio * uPointScale * (8.3 / -p.z);
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
      float alpha = uOpacity * (0.60 + vDepth * 0.40);
      if (uPoints) {
        float d = length(gl_PointCoord * 2.0 - 1.0);
        if (d > 1.0) discard;
        alpha *= 1.0 - smoothstep(0.25, 1.0, d);
      }
      vec3 color = uLight ? vColor * 0.50 : vColor;
      gl_FragColor = vec4(color, alpha);
    }
  `;
  let gl, program, attributes, uniforms, buffers;
  let width = 0, height = 0, dpr = 1;
  const initialYaw = -.28, initialPitch = .43;
  let yaw = initialYaw, pitch = initialPitch, targetYaw = yaw, targetPitch = pitch, zoom = 1;
  let inView = true, paused = false, lost = false, available = false;
  let frame = 0, previousTime = 0, animationTime = 0, pointer = null, selected = null;
  const movingPoints = new Float32Array(model.links.length * 3 * 7);
  const focusPoint = new Float32Array(7);
  const f = 1 / Math.tan(Math.PI / 7);

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('3D shader unavailable'); }
    return shader;
  }
  function showFallback() {
    available = false; stop();
    canvas.hidden = true; fallback.hidden = false; controls.hidden = true; labels.hidden = true;
    shell.removeAttribute('tabindex'); shell.classList.remove('scene-ready', 'dragging');
  }
  function initialize() {
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: !mobile.matches, powerPreference: 'low-power', depth: true, preserveDrawingBuffer: false });
      if (!gl) return showFallback();
      const vs = compile(gl.VERTEX_SHADER, vertexSource), fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('3D program unavailable');
      gl.useProgram(program);
      attributes = ['aPosition', 'aColor', 'aSize'].map(name => gl.getAttribLocation(program, name));
      uniforms = Object.fromEntries(['uProjection', 'uRotation', 'uCameraDistance', 'uPixelRatio', 'uPointScale', 'uPoints', 'uOpacity', 'uLight'].map(name => [name, gl.getUniformLocation(program, name)]));
      const createBuffer = (data, dynamic = false) => {
        const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
        return { buffer, count: data.length / 7 };
      };
      buffers = {
        ground: createBuffer(model.ground, true), solids: createBuffer(model.solids, true),
        lines: createBuffer(model.lines, true), points: createBuffer(model.points),
        signals: createBuffer(movingPoints, true), focus: createBuffer(focusPoint, true)
      };
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0);
      available = true; lost = false;
      canvas.hidden = false; fallback.hidden = true; controls.hidden = false; labels.hidden = false;
      shell.setAttribute('tabindex', '0'); shell.classList.add('scene-ready');
      resize(); sync();
    } catch { showFallback(); }
  }
  function bind(item) {
    gl.bindBuffer(gl.ARRAY_BUFFER, item.buffer);
    attributes.forEach((location, index) => {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, index === 2 ? 1 : 3, gl.FLOAT, false, 28, index === 0 ? 0 : index === 1 ? 12 : 24);
    });
  }
  function draw(item, type, opacity, pointScale = 1) {
    bind(item);
    gl.uniform1i(uniforms.uPoints, type === gl.POINTS ? 1 : 0);
    gl.uniform1f(uniforms.uOpacity, opacity); gl.uniform1f(uniforms.uPointScale, pointScale);
    gl.drawArrays(type, 0, item.count);
  }
  function project(position) {
    const cx = Math.cos(pitch), sx = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
    const py = position[1] * cx - position[2] * sx, pz = position[1] * sx + position[2] * cx;
    const px = position[0] * cy + pz * sy, depth = 8.3 / zoom - (-position[0] * sy + pz * cy);
    return { x: width / 2 + px * f / depth * height / 2, y: height / 2 - py * f / depth * height / 2 };
  }
  function updateLabels() {
    entityButtons.forEach(({ entity, button }) => {
      const point = project(entity.position);
      button.style.left = `${Math.max(42, Math.min(width - 42, point.x + entity.offset[0]))}px`;
      button.style.top = `${Math.max(23, Math.min(height - 23, point.y + entity.offset[1]))}px`;
    });
  }
  function resize() {
    if (!available || lost) return;
    width = canvas.clientWidth; height = canvas.clientHeight;
    if (!width || !height) return;
    dpr = Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.25 : 1.75);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const near = .1, far = 30, range = 1 / (near - far);
    gl.uniformMatrix4fv(uniforms.uProjection, false, new Float32Array([
      f / (width / height), 0, 0, 0, 0, f, 0, 0,
      0, 0, (far + near) * range, -1, 0, 0, 2 * far * near * range, 0
    ]));
    render();
  }
  function updateSignals() {
    let offset = 0;
    model.links.forEach(link => {
      for (let i = 0; i < 3; i++) {
        const progress = (animationTime * .00024 + link.phase + i / 3) % 1;
        movingPoints.set([...model.mix(link.from, link.to, progress), ...link.color, 5.5], offset);
        offset += 7;
      }
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.signals.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, movingPoints);
  }
  function render() {
    if (!available || lost || !width || !height) return;
    if (model.updateMotion(animationTime)) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.ground.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, model.ground);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.solids.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, model.solids);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.lines.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, model.lines);
    }
    gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(uniforms.uRotation, pitch, yaw); gl.uniform1f(uniforms.uCameraDistance, 8.3 / zoom);
    gl.uniform1f(uniforms.uPixelRatio, dpr);
    gl.uniform1i(uniforms.uLight, document.documentElement.dataset.theme === 'light' ? 1 : 0);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(false);
    draw(buffers.ground, gl.TRIANGLES, .14);
    gl.depthMask(true); draw(buffers.solids, gl.TRIANGLES, 1);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    draw(buffers.lines, gl.LINES, .65); draw(buffers.points, gl.POINTS, 1);
    updateSignals();
    draw(buffers.signals, gl.POINTS, .13, 3); draw(buffers.signals, gl.POINTS, 1);
    if (selected) {
      focusPoint.set([...selected.position, .75, .63, 1, 16]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.focus.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, focusPoint);
      draw(buffers.focus, gl.POINTS, .25, 2);
    }
    updateLabels();
  }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
  function canAnimate() { return available && !lost && inView && !document.hidden && !motion.matches; }
  function flowEnabled() { return !paused && !mobile.matches && !pointer; }
  function unsettled() { return Math.abs(targetYaw - yaw) + Math.abs(targetPitch - pitch) > .001; }
  function updateButton() {
    const stopped = paused || motion.matches || mobile.matches;
    motionButton.textContent = stopped ? '▶' : 'Ⅱ';
    motionButton.setAttribute('aria-pressed', String(stopped));
    motionButton.setAttribute('aria-label', stopped ? 'Start UAVs, regions and signals' : 'Pause UAVs, regions and signals');
    motionButton.title = stopped ? 'Start UAVs, regions and signals' : 'Pause UAVs, regions and signals';
    motionButton.disabled = motion.matches || mobile.matches;
    if (motionButton.disabled) motionButton.title = motion.matches ? 'Animation disabled by your system preference' : 'Static view on mobile; drag to explore';
  }
  function tick(time) {
    frame = 0;
    if (!canAnimate()) return;
    if (time - previousTime < 1000 / 30) { frame = requestAnimationFrame(tick); return; }
    const elapsed = Math.min(time - (previousTime || time), 50); previousTime = time;
    if (flowEnabled()) animationTime += elapsed;
    yaw += (targetYaw - yaw) * .16; pitch += (targetPitch - pitch) * .16;
    render();
    if (flowEnabled() || unsettled()) frame = requestAnimationFrame(tick);
  }
  function sync() {
    stop(); updateButton();
    if (motion.matches || mobile.matches) { yaw = targetYaw; pitch = targetPitch; }
    render();
    if (canAnimate() && (flowEnabled() || unsettled())) frame = requestAnimationFrame(tick);
  }
  function move(dx, dy = 0) { targetYaw += dx; targetPitch = Math.max(.08, Math.min(.95, targetPitch + dy)); sync(); }
  function setZoom(value) {
    zoom = Math.max(.80, Math.min(1.35, value));
    document.getElementById('sceneZoomIn').disabled = zoom >= 1.35;
    document.getElementById('sceneZoomOut').disabled = zoom <= .80;
    render();
  }
  function select(entity) {
    selected = entity;
    entityButtons.forEach(({ entity: candidate, button }) => button.setAttribute('aria-pressed', String(candidate === entity)));
    document.getElementById('sceneDetailTitle').textContent = entity ? entity.title : 'Two UAVs. One coordinated system.';
    document.getElementById('sceneDetailText').textContent = entity ? entity.description : 'Buildings block the direct AP–user path. Two UAVs patrol their own service regions, linking the AP to users through RIS panels. Select a label to explore.';
    render();
  }
  function reset() { animationTime = 0; targetYaw = initialYaw; targetPitch = initialPitch; setZoom(1); select(null); sync(); }
  entityButtons.forEach(({ entity, button }) => {
    button.setAttribute('aria-controls', 'sceneDetail');
    button.addEventListener('click', () => select(entity));
  });
  document.getElementById('sceneLeft').addEventListener('click', () => move(-.25));
  document.getElementById('sceneRight').addEventListener('click', () => move(.25));
  document.getElementById('sceneZoomIn').addEventListener('click', () => setZoom(zoom + .1));
  document.getElementById('sceneZoomOut').addEventListener('click', () => setZoom(zoom - .1));
  document.getElementById('sceneReset').addEventListener('click', reset);
  motionButton.addEventListener('click', () => { paused = !paused; sync(); });
  shell.addEventListener('keydown', event => {
    const directions = { ArrowLeft: [-.25, 0], ArrowRight: [.25, 0], ArrowUp: [0, -.15], ArrowDown: [0, .15] };
    if (directions[event.key]) { event.preventDefault(); move(...directions[event.key]); }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(zoom + .1); }
    if (event.key === '-' || event.key === '_') { event.preventDefault(); setZoom(zoom - .1); }
    if (event.key === 'Home') { event.preventDefault(); reset(); }
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !available || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId); shell.classList.add('dragging'); shell.focus({ preventScroll: true }); sync();
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    move((event.clientX - pointer.x) * .008, (event.clientY - pointer.y) * .006);
    pointer.x = event.clientX; pointer.y = event.clientY;
  });
  const release = () => { pointer = null; shell.classList.remove('dragging'); sync(); };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release); canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; pointer = null; showFallback(); });
  canvas.addEventListener('webglcontextrestored', initialize);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }).observe(shell);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', sync); motion.addEventListener('change', sync);
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
