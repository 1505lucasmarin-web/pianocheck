import { buildSteps } from "./model.js";

export function isGoatTake(take, score) {
  if (take.status !== "finished" || take.loop || take.range || !take.total) return false;
  if (take.clean !== take.total || take.dirty || take.wrong || take.holdDurSteps) return false;
  // Una partitura escrita para una sola mano también se puede tocar completa.
  if (take.hands === "both") return true;
  const otherHand = take.hands === "rh" ? "lh" : "rh";
  return buildSteps(score, otherHand).length === 0;
}

export function drawGoat(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const ink = "#250d34";
  function shape(fill, points) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.7;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  function block(fill, x, y, w, h) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  // Cuernos, orejas y cabeza dibujados como recortes de Paint.
  shape("#fd9d4b", [[73, 41], [61, 13], [66, 16], [84, 38]]);
  shape("#ffc865", [[95, 34], [105, 13], [112, 10], [106, 39]]);
  shape("#ff9cc8", [[74, 42], [50, 38], [56, 50], [74, 53]]);
  shape("#ff9cc8", [[103, 38], [125, 31], [120, 44], [107, 51]]);
  shape("#ffae70", [[78, 62], [99, 59], [111, 80], [63, 82]]);
  shape("#fff1ad", [[74, 37], [99, 33], [109, 45], [106, 65], [97, 73], [94, 81], [85, 75], [79, 65], [69, 56]]);
  shape("#ffea00", [[70, 33], [63, 18], [78, 22], [84, 9], [94, 19], [106, 12], [100, 32]]);
  shape("#ff329d", [[81, 25], [86, 19], [92, 25], [86, 29]]);

  // Ojos desparejos y cara de «acabo de tocar todo bien».
  block("#fff", 77, 44, 10, 12);
  block("#fff", 95, 41, 9, 11);
  block(ink, 81, 46, 5, 8);
  block(ink, 98, 43, 4, 7);
  block("#ff73a1", 74, 57, 7, 4);
  block("#ff73a1", 100, 54, 6, 4);
  shape(ink, [[86, 59], [98, 56], [95, 65], [90, 67]]);
  block("#fff", 89, 59, 6, 2);

  // Teclas dibujadas a mano y dos pezuñas al teclado.
  shape("#7b1cec", [[24, 81], [146, 73], [156, 92], [23, 101]]);
  shape("#fffbed", [[24, 78], [146, 70], [153, 86], [21, 94]]);
  for (let i = 0; i < 11; i++) {
    const x = 33 + i * 10;
    const y = 78 - i * .64;
    block(ink, x, y, 2, 15);
    if (i % 3 !== 2) block(ink, x - 2, y, 6, 9);
  }
  shape("#ffa46e", [[74, 66], [82, 70], [73, 84], [64, 84], [64, 79]]);
  shape("#ffa46e", [[102, 65], [108, 65], [117, 75], [112, 80], [104, 76]]);
  block(ink, 64, 80, 8, 4);
  block(ink, 110, 76, 6, 4);
}
