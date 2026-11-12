// The supplied drawings are not an evenly spaced grid. Clip each pose in source
// coordinates, then center it in an identical cell without altering the artwork.
const cuts = {
  caminar: [
    [0, 566], [566, 1100], [1100, 1640], [1640, 2172]
  ],
  correr: [
    [0, 553], [553, 1090], [1090, 1653], [1653, 2172]
  ],
  descansar: [
    [0, 556],
    [556, 1120, '556,0 1120,0 1120,470 1040,470 1040,724 556,724'],
    [1040, 1623, '1120,0 1623,0 1623,724 1040,724 1040,470 1120,470'],
    [1623, 2172]
  ]
};
const ns = 'http://www.w3.org/2000/svg';
export function prepareWalkerAtlas(image) {
  const pose = image.dataset.walkerSrc.split('/').pop().replace('.png', '');
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 2400 724');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('walker-atlas');
  const defs = document.createElementNS(ns, 'defs');
  svg.append(defs);
  cuts[pose].forEach(([left, right, polygon], index) => {
    const id = `walker-${pose}-${index}`;
    const clip = document.createElementNS(ns, 'clipPath');
    clip.id = id;
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const outline = document.createElementNS(ns, 'polygon');
    outline.setAttribute('points', polygon || `${left},0 ${right},0 ${right},724 ${left},724`);
    clip.append(outline);
    defs.append(clip);
    const placement = document.createElementNS(ns, 'g');
    placement.setAttribute('transform', `translate(${index * 600 + (600 - right + left) / 2 - left} 0)`);
    const cropped = document.createElementNS(ns, 'g');
    cropped.setAttribute('clip-path', `url(#${id})`);
    const source = document.createElementNS(ns, 'image');
    source.setAttribute('href', image.src);
    source.setAttribute('width', '2172');
    source.setAttribute('height', '724');
    cropped.append(source);
    placement.append(cropped);
    svg.append(placement);
  });
  image.hidden = true;
  image.after(svg);
}
