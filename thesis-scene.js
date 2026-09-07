// Illustrative geometry based on the supplied thesis figure, not simulation output.
(() => {
  const colors = {
    frame: [.60, .76, .73], mint: [.44, .88, .73], blue: [.32, .62, 1],
    yellow: [1, .80, .22], purple: [.75, .63, 1], white: [.82, .90, .88]
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
  // Two fixed service regions share a curved boundary, following the reference figure.
  const boundary = t => .32 + .21 * Math.sin(t * Math.PI * 2);
  for (let i = 0; i < 24; i++) {
    const t = i / 24, next = (i + 1) / 24, z = -1.15 + t * 2.9, zn = -1.15 + next * 2.9;
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

  const uavs = [[-.72, 1.20, -.58], [1.30, 1.20, -.58]];
  const risCenters = uavs.map(([x, y, z]) => [x, y - .44, z + .04]);
  uavs.forEach(([x, y, z], index) => {
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
  const links = [
    ...risCenters.map((to, index) => ({ from: ap, to, color: colors.blue, phase: index * .25, type: 'ap-uav' })),
    ...users.map((user, index) => ({ from: risCenters[index < 3 ? 0 : 1], to: [user[0], user[1] + .40, user[2]], color: colors.yellow, phase: index * .17, type: 'ris-ut' }))
  ];
  links.forEach(link => {
    for (let i = 0; i < 20; i++) edge(mix(link.from, link.to, i / 20), mix(link.from, link.to, (i + .55) / 20), link.color);
  });
  const entities = [
    { id: 'ap', label: 'AP', position: ap, offset: [-12, -40], title: 'Access point (AP)', description: 'The access point connects to both UAV-mounted RIS panels through the blue AP–UAV/RIS links.' },
    { id: 'uav1', label: 'UAV 1 + RIS', position: uavs[0], offset: [0, -42], title: 'UAV 1 with a RIS panel', description: 'The first UAV carries a reconfigurable intelligent surface. RIS phase-shift control is part of the resource-allocation decision space.' },
    { id: 'uav2', label: 'UAV 2 + RIS', position: uavs[1], offset: [0, -42], title: 'UAV 2 with a RIS panel', description: 'The second UAV-mounted RIS serves the other user region. The thesis studies user partitioning together with resource allocation across the two UAVs.' },
    { id: 'usersA', label: 'Users · A', position: [-.84, floor, 1.35], offset: [-6, 27], title: 'User terminals in region A', description: 'Three illustrative user terminals occupy the first service region. Yellow links show RIS–user connections for simultaneous wireless information and power transfer (SWIPT).' },
    { id: 'usersB', label: 'Users · B', position: [1.43, floor, 1.40], offset: [0, 27], title: 'User terminals in region B', description: 'The second region contains three illustrative terminals. The shared boundary represents the energy-aware user-partitioning concept; it is not a computed simulation result.' }
  ];
  window.ThesisScene = { ground, solids, lines, points, entities, links, uavs, users, mix };
})();
