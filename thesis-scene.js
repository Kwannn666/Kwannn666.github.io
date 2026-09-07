// Illustrative geometry based on the supplied thesis figure, not simulation output.
(() => {
  const colors = {
    frame: [.60, .76, .73], mint: [.44, .88, .73], blue: [.32, .62, 1],
    yellow: [1, .80, .22], purple: [.75, .63, 1], white: [.82, .90, .88], blocked: [1, .52, .42]
  };
  const ground = [], solids = [], lines = [], points = [];
  const put = (array, point, color, size = 5) => array.push(...point, ...color, size);
  const edge = (a, b, color = colors.frame) => { put(lines, a, color); put(lines, b, color); };
  const triangle = (array, a, b, c, color) => [a, b, c].forEach(p => put(array, p, color));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function quad(array, a, b, c, d, color) {
    triangle(array, a, b, c, color); triangle(array, a, c, d, color);
  }
  function box(center, size, color) {
    const vertices = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      vertices.push(center.map((v, i) => v + [x, y, z][i] * size[i] / 2));
    }
    [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]].forEach((face, i) => {
      quad(solids, ...face.map(index => vertices[index]), color.map(v => v * [.65, .85, .60, 1, .72, .92][i]));
    });
  }
  function circle(center, radius, color, plane = 'xz', start = 0, end = Math.PI * 2) {
    const at = angle => plane === 'xz'
      ? [center[0] + Math.cos(angle) * radius, center[1], center[2] + Math.sin(angle) * radius]
      : [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, center[2]];
    for (let i = 0; i < 28; i++) edge(at(start + (end - start) * i / 28), at(start + (end - start) * (i + 1) / 28), color);
  }
  function head(center, radius) {
    const top = [center[0], center[1] + radius, center[2]], bottom = [center[0], center[1] - radius, center[2]];
    for (let i = 0; i < 8; i++) {
      const ring = index => [center[0] + Math.cos(index * Math.PI / 4) * radius, center[1], center[2] + Math.sin(index * Math.PI / 4) * radius];
      triangle(solids, top, ring(i), ring(i + 1), colors.white);
      triangle(solids, bottom, ring(i + 1), ring(i), colors.frame);
    }
  }
  const floor = -1.05;
  // A shared animated seam keeps the two service-region fills joined without gaps.
  // Its full range [.095, .545] leaves room for both complete UAV footprints.
  const regionSegments = 24;
  const boundary = (t, timeMs = 0) => {
    const phase = timeMs * Math.PI * 2 / 24000;
    return .32 + .015 * Math.sin(phase) + (.19 + .02 * Math.cos(phase)) * Math.sin(t * Math.PI * 2 + phase);
  };
  for (let i = 0; i < regionSegments; i++) {
    const t = i / regionSegments, next = (i + 1) / regionSegments, z = -1.15 + t * 2.9, zn = -1.15 + next * 2.9;
    const a = [boundary(t), floor, z], b = [boundary(next), floor, zn];
    quad(ground, [-1.5, floor, z], a, b, [-1.5, floor, zn], colors.mint);
    quad(ground, a, [2.10, floor, z], [2.10, floor, zn], b, colors.purple);
    edge([a[0], floor + .015, z], [b[0], floor + .015, zn], colors.white);
  }
  const perimeter = [[-1.5, floor, -1.15], [2.1, floor, -1.15], [2.1, floor, 1.75], [-1.5, floor, 1.75]];
  perimeter.forEach((a, i) => edge(a, perimeter[(i + 1) % perimeter.length]));
  for (let i = 0; i < 7; i++) {
    const z = -1.15 + i * 2.9 / 6;
    edge([-1.5, floor - .01, z], [2.1, floor - .01, z], [.20, .34, .31]);
  }
  const ap = [-2.35, .20, .55];
  box([ap[0], floor + .06, ap[2]], [.50, .12, .50], colors.frame);
  const feet = [[-.22, -.20], [.22, -.20], [0, .24]];
  feet.forEach(([x, z], i) => {
    edge([ap[0] + x, floor + .12, ap[2] + z], ap, colors.white);
    edge([ap[0] + x, floor + .12, ap[2] + z], [ap[0] + feet[(i + 1) % 3][0], floor + .5, ap[2]], colors.frame);
  });
  box([ap[0], -.12, ap[2]], [.06, .70, .06], colors.white);
  circle(ap, .19, colors.blue, 'xy', -.8, .8);
  circle(ap, .31, colors.blue, 'xy', -.8, .8);
  circle(ap, .19, colors.blue, 'xy', Math.PI - .8, Math.PI + .8);
  circle(ap, .31, colors.blue, 'xy', Math.PI - .8, Math.PI + .8);
  put(points, ap, colors.blue, 7);

  // Buildings block ground-level AP–user rays while leaving the elevated RIS links clear.
  const buildings = [
    { center: [-1.84, (floor + .13) / 2, .075], size: [.40, .13 - floor, .45] },
    { center: [-1.84, (floor + .18) / 2, .525], size: [.40, .18 - floor, .45] },
    { center: [-1.84, (floor + .11) / 2, .975], size: [.40, .11 - floor, .45] }
  ];
  box([-1.84, floor + .025, .525], [.46, .05, 1.41], [.35, .39, .43]);
  buildings.forEach(({ center, size }, index) => {
    box(center, size, index === 1 ? [.52, .56, .64] : [.40, .45, .53]);
    const [x, , z] = center, roof = center[1] + size[1] / 2;
    for (let row = 0; row < 4; row++) {
      const y = floor + .21 + row * .24;
      for (const column of [-.10, .10]) {
        const front = z + size[2] / 2 + .002, side = x - size[0] / 2 - .002;
        quad(solids, [x + column - .033, y, front], [x + column + .033, y, front], [x + column + .033, y + .095, front], [x + column - .033, y + .095, front], colors.white);
        quad(solids, [side, y, z + column - .04], [side, y, z + column + .04], [side, y + .095, z + column + .04], [side, y + .095, z + column - .04], colors.white);
      }
    }
    edge([x - .20, roof + .003, z - .225], [x - .20, roof + .003, z + .225], colors.frame);
    edge([x - .20, roof + .003, z + .225], [x + .20, roof + .003, z + .225], colors.frame);
  });

  const uavs = [[-.72, 1.20, -.58], [1.30, 1.20, -.58]];
  const risCenters = uavs.map(([x, y, z]) => [x, y - .44, z + .04]);
  const uavRanges = [];
  uavs.forEach(([x, y, z], index) => {
    const range = { solids: { start: solids.length }, lines: { start: lines.length } };
    box([x, y, z], [.30, .14, .24], colors.white);
    for (const dx of [-.36, .36]) for (const dz of [-.29, .29]) {
      edge([x, y, z], [x + dx, y, z + dz], colors.white);
      circle([x + dx, y + .02, z + dz], .20, colors.mint);
      edge([x + dx - .16, y + .025, z + dz], [x + dx + .16, y + .025, z + dz], colors.frame);
    }
    const panel = risCenters[index];
    box(panel, [.62, .40, .07], [.12, .22, .29]);
    for (const dx of [-.22, .22]) edge([x + dx, y, z], [panel[0] + dx, panel[1] + .20, panel[2]], colors.frame);
    for (let column = 0; column < 5; column++) for (let row = 0; row < 3; row++) {
      box([panel[0] - .24 + column * .12, panel[1] - .13 + row * .13, panel[2] + .045], [.085, .085, .025], colors.blue);
    }
    range.solids.end = solids.length; range.lines.end = lines.length;
    uavRanges.push(range);
  });
  const users = [
    [-1.03, floor, -.31], [-1.05, floor, 1.27], [-.19, floor, .82],
    [.89, floor, -.30], [1.26, floor, .46], [1.80, floor, 1.28]
  ];
  users.forEach(([x, y, z]) => {
    head([x, y + .34, z], .082);
    box([x, y + .15, z], [.17, .20, .12], colors.white);
    circle([x, y + .015, z], .18, colors.mint);
  });
  // One static blocked-path cue ends at the facade, never connecting to a user.
  const blockedTarget = [users[4][0], floor + .40, users[4][2]];
  const blockedHit = mix(ap, blockedTarget, (-2.047 - ap[0]) / (blockedTarget[0] - ap[0]));
  for (let i = 0; i < 4; i++) edge(mix(ap, blockedHit, i / 4), mix(ap, blockedHit, (i + .5) / 4), colors.blocked);
  for (const direction of [-1, 1]) edge(
    [blockedHit[0], blockedHit[1] - .045, blockedHit[2] - direction * .045],
    [blockedHit[0], blockedHit[1] + .045, blockedHit[2] + direction * .045], colors.blocked);
  const links = [
    ...risCenters.map((to, index) => ({ from: ap, to, color: colors.blue, phase: index * .25, type: 'ap-uav' })),
    ...users.map((user, index) => ({ from: risCenters[index < 3 ? 0 : 1], to: [user[0], user[1] + .40, user[2]], color: colors.yellow, phase: index * .17, type: 'ris-ut' }))
  ];
  const linkStart = lines.length;
  links.forEach(link => {
    for (let i = 0; i < 20; i++) edge(mix(link.from, link.to, i / 20), mix(link.from, link.to, (i + .55) / 20), link.color);
  });
  const entities = [
    { id: 'ap', label: 'AP', position: ap, offset: [-12, -40], title: 'Access point (AP)', description: 'Buildings block the direct AP–user path in this illustrative scenario. The access point instead connects to both elevated UAV-mounted RIS panels through the blue links.' },
    { id: 'uav1', label: 'UAV 1 + RIS', position: uavs[0], offset: [0, -42], title: 'UAV 1 with a RIS panel', description: 'The first UAV patrols above region A while carrying its RIS panel. The illustrated loop remains inside its service region; RIS phase-shift control is part of the thesis decision space.' },
    { id: 'uav2', label: 'UAV 2 + RIS', position: uavs[1], offset: [0, -42], title: 'UAV 2 with a RIS panel', description: 'The second UAV patrols above region B on its own loop. Its RIS panel and wireless links follow the aircraft while it continues serving the same user group.' },
    { id: 'usersA', label: 'Users · A', position: [-.84, floor, 1.35], offset: [-6, 27], title: 'User terminals in region A', description: 'Three illustrative user terminals occupy the first service region. Yellow links show RIS–user connections for simultaneous wireless information and power transfer (SWIPT).' },
    { id: 'usersB', label: 'Users · B', position: [1.43, floor, 1.40], offset: [0, 27], title: 'User terminals in region B', description: 'The second region contains three illustrative terminals. The moving shared boundary illustrates the energy-aware user-partitioning concept. Its motion is illustrative, not a computed simulation result.' }
  ];
  // Conservative footprints include the rotors: +/-0.56 in x and +/-0.49 in z.
  // Both loops stay away from the complete curved boundary, not just its midpoint.
  function patrolPosition(index, timeMs) {
    const angle = 2 * Math.PI * timeMs / (index === 0 ? 16000 : 20000);
    return index === 0
      ? [-.72 + .14 * Math.sin(angle), 1.20, .27 - .85 * Math.cos(angle)]
      : [1.30 - .17 * Math.sin(angle), 1.20, .24 - .82 * Math.cos(angle)];
  }
  const restUavs = uavs.map(position => [...position]);
  const dynamicGround = new Float32Array(ground), dynamicSolids = new Float32Array(solids), dynamicLines = new Float32Array(lines);
  const boundaryPoints = new Float32Array(regionSegments + 1);
  let lastMotionTime = 0;
  function updateMotion(timeMs) {
    if (!Number.isFinite(timeMs) || timeMs === lastMotionTime) return false;
    lastMotionTime = timeMs;
    for (let i = 0; i <= regionSegments; i++) boundaryPoints[i] = boundary(i / regionSegments, timeMs);
    for (let i = 0; i < regionSegments; i++) {
      // Each strip contains two quads (12 vertices, seven floats per vertex).
      // Both colored fills and the visible seam use exactly the same endpoints.
      const offset = i * 12 * 7, a = boundaryPoints[i], b = boundaryPoints[i + 1];
      for (const vertex of [1, 6, 9]) dynamicGround[offset + vertex * 7] = a;
      for (const vertex of [2, 4, 11]) dynamicGround[offset + vertex * 7] = b;
      dynamicLines[i * 14] = a;
      dynamicLines[i * 14 + 7] = b;
    }
    uavs.forEach((position, index) => {
      const next = patrolPosition(index, timeMs);
      const delta = next.map((value, axis) => value - restUavs[index][axis]);
      // Update existing endpoint/label arrays so every dependent object stays attached.
      position.splice(0, 3, ...next);
      risCenters[index].splice(0, 3, next[0], next[1] - .44, next[2] + .04);
      for (const [key, base, data] of [['solids', solids, dynamicSolids], ['lines', lines, dynamicLines]]) {
        const range = uavRanges[index][key];
        for (let vertex = range.start; vertex < range.end; vertex += 7) {
          for (let axis = 0; axis < 3; axis++) data[vertex + axis] = base[vertex + axis] + delta[axis];
        }
      }
    });
    // Reposition the dashed links from the same live RIS endpoints as the particles.
    links.forEach((link, index) => {
      for (let segment = 0; segment < 20; segment++) {
        const offset = linkStart + (index * 20 + segment) * 14;
        for (let axis = 0; axis < 3; axis++) {
          const distance = link.to[axis] - link.from[axis];
          dynamicLines[offset + axis] = link.from[axis] + distance * segment / 20;
          dynamicLines[offset + 7 + axis] = link.from[axis] + distance * (segment + .55) / 20;
        }
      }
    });
    return true;
  }
  window.ThesisScene = { ground: dynamicGround, solids: dynamicSolids, lines: dynamicLines, points, entities, links, uavs, users, buildings, ap, mix, updateMotion, patrolPosition, uavRanges, risCenters, linkStart, regionSegments };
})();
