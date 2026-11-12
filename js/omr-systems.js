// Detectar los pentagramas por sus cinco líneas. Nunca cortar por un pentagrama.
export function systemBands(rows, threshold = .44) {
  const peaks = [];
  for (let y = 0; y < rows.length; y++) {
    if (rows[y] < threshold) continue;
    let sum = 0, weighted = 0;
    for (; y < rows.length && rows[y] >= threshold; y++) {
      sum += rows[y];
      weighted += rows[y] * y;
    }
    peaks.push(Math.round(weighted / sum));
  }
  const staves = [];
  for (let i = 0; i + 4 < peaks.length; i++) {
    const lines = peaks.slice(i, i + 5);
    const gap = (lines[4] - lines[0]) / 4;
    if (gap < 3 || gap > rows.length * .023) continue;
    if (!lines.every((line, j) => Math.abs(line - lines[0] - j * gap) <= Math.max(1.25, gap * .22))) continue;
    staves.push({ top: lines[0], bottom: lines[4], gap });
    i += 4;
  }
  if (staves.length < 4 || staves.length % 2) return [];

  const bands = [];
  for (let i = 0; i < staves.length; i += 2) {
    const upper = staves[i], lower = staves[i + 1];
    if (Math.abs(upper.gap - lower.gap) > upper.gap * .35 ||
        lower.top - upper.bottom < upper.gap * 1.5 ||
        lower.top - upper.bottom > upper.gap * 14) return [];
    if (i) {
      const prev = staves[i - 1];
      // Pedir un espacio claro entre sistemas para conservar números, plicas y líneas adicionales.
      if (upper.top - prev.bottom < Math.max(upper.gap, prev.gap) * 3.8) return [];
      bands.push(Math.round((prev.bottom + upper.top) / 2));
    }
  }
  return [0, ...bands, rows.length];
}

function canvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  return c;
}

function encode(c) {
  if (c.convertToBlob) return c.convertToBlob({ type: 'image/jpeg', quality: .94 });
  return new Promise((resolve, reject) => c.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('No se pudo preparar el fragmento.'));
  }, 'image/jpeg', .94));
}

/** Recorta sólo entre sistemas completos y conserva la resolución original de las notas. */
export async function splitScoreImage(blob) {
  if (typeof createImageBitmap !== 'function' ||
      (typeof OffscreenCanvas === 'undefined' && typeof document === 'undefined')) return [];
  const bitmap = await createImageBitmap(blob);
  try {
    const { width, height } = bitmap;
    const probeWidth = Math.min(width, 850);
    const probeHeight = Math.round(height * probeWidth / width);
    const probe = canvas(probeWidth, probeHeight);
    const ctx = probe.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, probeWidth, probeHeight);
    const { data } = ctx.getImageData(0, 0, probeWidth, probeHeight);
    // En un escaneo levemente inclinado, una línea puede no coincidir en toda la página.
    const supportedBands = [[.07, .93], [.12, .54], [.46, .9], [.32, .68]].flatMap(([from, to]) => {
      const start = Math.floor(probeWidth * from), end = Math.ceil(probeWidth * to);
      const rows = new Float64Array(probeHeight);
      for (let y = 0; y < probeHeight; y++) {
        let dark = 0;
        for (let x = start; x < end; x++) {
          const p = (y * probeWidth + x) * 4;
          if (data[p] + data[p + 1] + data[p + 2] < 540) dark++;
        }
        rows[y] = dark / (end - start);
      }
      return [.44, .36, .29, .22, .17].map((t) => systemBands(rows, t)).filter((b) => b.length);
    });
    const bands = (supportedBands.sort((a, b) => b.length - a.length)[0] || []).map((y) => Math.round(y * height / probeHeight));
    return await Promise.all(bands.slice(1).map((bottom, i) => {
      const top = bands[i], h = bottom - top;
      const c = canvas(width, h);
      c.getContext('2d').drawImage(bitmap, 0, top, width, h, 0, 0, width, h);
      return encode(c);
    }));
  } finally {
    bitmap.close();
  }
}
