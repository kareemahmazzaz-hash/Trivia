// A generic spinning wheel. It always knows the target index in advance
// (the "randomness" already happened in gameClient) - this just makes a
// satisfying animation that lands on that known answer.
const WHEEL_COLORS = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#8338ec", "#fb5607", "#3a86ff", "#2ec4b6", "#ff9f1c", "#e63946", "#4361ee"];

function drawWheel(canvas, labels, rotation) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2, cy = size / 2, r = size / 2 - 6;
  const n = Math.max(labels.length, 1);
  const arc = (2 * Math.PI) / n;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  labels.forEach((label, i) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, i * arc, (i + 1) * arc);
    ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.stroke();

    ctx.save();
    ctx.rotate(i * arc + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";

    // Text is drawn along the radius, ending near the rim (outerRadius) and
    // reading inward. Leave a gap at the hub (innerRadius) so labels can
    // never bleed into the center or overlap a neighboring slice there.
    const outerRadius = r - 14;
    const innerRadius = r * 0.22;
    const maxTextWidth = outerRadius - innerRadius;

    let fontSize = Math.max(11, Math.min(22, 240 / n));
    ctx.font = `bold ${fontSize}px sans-serif`;
    while (ctx.measureText(label).width > maxTextWidth && fontSize > 9) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px sans-serif`;
    }

    ctx.fillText(label, outerRadius, 5);
    ctx.restore();
  });

  ctx.restore();
}

function spinWheelAsync(canvas, labels, targetIndex, duration = 3200) {
  return new Promise((resolve) => {
    const n = labels.length;
    const arc = (2 * Math.PI) / n;
    const targetAngle = -(targetIndex * arc + arc / 2) - Math.PI / 2;
    const fullSpins = 5;
    const finalRotation = fullSpins * 2 * Math.PI + targetAngle;
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      drawWheel(canvas, labels, finalRotation * eased);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}
