// Original schematics of the details discussed in the guide.
(() => {
  const width = 430;
  const height = 160;
  const steel = "#394754";
  const highlight = "#a45529";

  function trace(context, points, color, weight) {
    context.beginPath();
    context.moveTo(...points[0]);
    for (const point of points.slice(1)) context.lineTo(...point);
    context.strokeStyle = color;
    context.lineWidth = weight;
    context.stroke();
  }

  function label(context, x, name, detail) {
    context.textAlign = "center";
    context.fillStyle = "#1b2a32";
    context.font = "700 15px system-ui, sans-serif";
    context.fillText(name, x, 134);
    if (detail) {
      context.fillStyle = "#41515a";
      context.font = "12px system-ui, sans-serif";
      context.fillText(detail, x, 151);
    }
  }

  function panels(context, count) {
    context.fillStyle = "#f8f6f0";
    context.fillRect(0, 0, width, height);
    for (let column = 1; column < count; column += 1) {
      const x = column * width / count;
      trace(context, [[x, 15], [x, 145]], "#dedad0", 1);
    }
  }

  function pole(context, x, y, bottom, radius = 11, color = "#96988f") {
    context.beginPath();
    context.moveTo(x - radius * 0.72, y);
    context.lineTo(x + radius * 0.72, y);
    context.lineTo(x + radius, bottom);
    context.lineTo(x - radius, bottom);
    context.closePath();
    context.fillStyle = color;
    context.fill();
  }

  function poleMaterials(context) {
    panels(context, 3);

    pole(context, 72, 24, 112, 19, "#a1a19a");
    for (const [x, y] of [[72, 35], [64, 48], [77, 54], [68, 63], [80, 69], [59, 81], [70, 91], [82, 100]]) {
      context.fillStyle = "#797b74";
      context.fillRect(x, y, 1.6, 1.7);
    }
    trace(context, [[72, 42], [89, 42]], steel, 3);
    trace(context, [[56, 71], [71, 71]], steel, 3);
    label(context, 72, "Concrete", "Round and tapered");

    pole(context, 215, 24, 112, 14, "#a07855");
    trace(context, [[212, 31], [211, 52], [213, 65], [210, 97]], "#795338", 2);
    trace(context, [[220, 40], [219, 76], [221, 103]], "#be956b", 2);
    label(context, 215, "Wood", "Visible grain");

    pole(context, 359, 24, 112, 12, "#697887");
    trace(context, [[355, 32], [354, 106]], "#aababf", 2);
    trace(context, [[350, 64], [368, 64]], "#445562", 4);
    context.fillStyle = "#445562";
    context.fillRect(345, 108, 28, 5);
    label(context, 359, "Steel", "Tubular example");
  }

  function drawFork(context, x, cap) {
    pole(context, x, 97, 111);
    trace(context, [[x - 22, 93], [x - 19, 40]], steel, 5);
    trace(context, [[x + 22, 93], [x + 19, 40]], steel, 5);
    trace(context, [[x - 29, 85], [x + 29, 85]], steel, 5);
    const capWidth = cap === "long" ? 43 : 19;
    trace(context, [[x - capWidth, 40], [x + capWidth, 40]], highlight, cap === "wire" ? 1.5 : 5);
  }

  function forkTops(context) {
    panels(context, 3);
    drawFork(context, 72, "long");
    label(context, 72, "Kantō", "Long upper bar");
    drawFork(context, 215, "short");
    label(context, 215, "Chūbu", "Short upper bar");
    drawFork(context, 359, "wire");
    label(context, 359, "Kansai", "Thin upper wire");
  }

  function transformer(context, x, y) {
    context.fillStyle = "#687b82";
    context.fillRect(x - 10, y, 20, 34);
    context.beginPath();
    context.ellipse(x, y + 34, 10, 4, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#98a8ab";
    context.beginPath();
    context.ellipse(x, y, 10, 4, 0, 0, Math.PI * 2);
    context.fill();
  }

  function drawSquareMount(context, x, barY) {
    pole(context, x, 21, 115, 12);
    context.strokeStyle = steel;
    context.lineWidth = 4;
    context.strokeRect(x - 28, 50, 56, 50);
    transformer(context, x - 43, 57);
    transformer(context, x + 43, 57);
    trace(context, [[x - 70, barY], [x + 70, barY]], highlight, 5);
  }

  function squareMounts(context) {
    panels(context, 2);
    drawSquareMount(context, 107, 48);
    label(context, 107, "Tōhoku", "Bar at top of frame");
    drawSquareMount(context, 323, 103);
    label(context, 323, "Kansai", "Bar at bottom of frame");
  }

  function arrowAndBand(context) {
    panels(context, 2);
    pole(context, 107, 16, 112, 32);
    pole(context, 323, 16, 112, 32);
    context.fillStyle = "#f0eee3";
    context.fillRect(97, 59, 20, 32);
    context.fillRect(313, 33, 20, 32);
    context.fillStyle = highlight;
    context.beginPath();
    context.moveTo(107, 25);
    context.lineTo(121, 40);
    context.lineTo(112, 40);
    context.lineTo(112, 50);
    context.lineTo(102, 50);
    context.lineTo(102, 40);
    context.lineTo(93, 40);
    context.closePath();
    context.fill();
    context.fillStyle = "#252a2a";
    context.fillRect(293, 72, 60, 21);
    context.fillStyle = "#dc882c";
    context.fillRect(293, 77, 60, 11);
    label(context, 107, "Chūgoku", "Arrow above plates");
    label(context, 323, "Shikoku", "Orange and black band");
  }

  function angledBrackets(context) {
    panels(context, 2);
    pole(context, 63, 24, 112, 15);
    pole(context, 289, 24, 112, 15);
    trace(context, [[71, 49], [124, 49], [150, 94]], highlight, 6);
    trace(context, [[296, 49], [349, 49], [349, 101]], highlight, 6);
    label(context, 107, "Kansai", "Approximately 120°");
    label(context, 323, "Shikoku", "Approximately 90°");
  }

  const diagrams = {
    "pole-materials": poleMaterials,
    "fork-tops": forkTops,
    "square-mounts": squareMounts,
    "shikoku-chugoku": arrowAndBand,
    "angled-brackets": angledBrackets,
  };

  for (const canvas of document.querySelectorAll("canvas[data-fitting]")) {
    const diagram = diagrams[canvas.dataset.fitting];
    const context = canvas.getContext("2d");
    if (!diagram || !context) continue;
    context.save();
    context.scale(canvas.width / width, canvas.height / height);
    context.lineCap = "round";
    context.lineJoin = "round";
    diagram(context);
    context.restore();
  }
})();
