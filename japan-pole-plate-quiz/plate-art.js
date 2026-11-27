// Original illustrations of common utility company layouts. All pole numbers are fictional.
const drawPolePlate = (() => {
  const sceneWidth = 760;
  const sceneHeight = 480;
  const center = 380;
  const plateFont = '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans CJK JP", sans-serif';

  const designs = {
    hokkaido: {
      width: 104, height: 242, radius: 4, top: 113,
      rows: [
        ["42　画", 43, 19], ["08　区", 74, 19], ["73　図", 105, 19],
        ["03　番", 136, 19], ["51　の", 167, 19], ["28　号", 198, 19],
      ],
      lines: [58, 89, 120, 151, 182],
    },
    tohoku: {
      width: 201, height: 89, radius: 4, top: 211, silver: true,
      rows: [["中央幹", 25, 18], ["38-B", 56, 29]],
    },
    kanto: {
      width: 87, height: 188, radius: 3, top: 142, silver: true, handwritten: true,
      rows: [["小坂", 42, 20], ["1", 77, 27], ["2", 109, 27], ["7", 141, 27]],
    },
    hokuriku: {
      width: 190, height: 99, radius: 3, top: 154,
      rows: [["2473", 26, 24], ["カ　51・86", 69, 21]],
      lines: [46],
    },
    chubu: {
      width: 81, height: 218, radius: 31, top: 127,
      rows: [["42 ナ", 48, 20], ["1", 89, 24], ["8", 126, 24], ["6", 163, 24]],
    },
    kansai: {
      width: 82, height: 226, radius: 4, top: 124,
      rows: [["ミ", 42, 18, 17], ["ナ", 69, 18, 17], ["ミ", 96, 18, 17], ["ノ", 123, 18, 17], ["56", 155, 21, 10], ["W3", 183, 21, 10]],
    },
    chugoku: {
      width: 127, height: 150, radius: 3, top: 189, silver: true,
      rows: [["Energia", 29, 17], ["中町幹", 57, 16], ["38", 92, 31], ["M2", 123, 16]],
      lines: [43],
    },
    shikoku: {
      width: 84, height: 243, radius: 3, top: 104,
      rows: [["ミツサワ", 76, 15], ["78S3", 107, 23]],
    },
    kyushu: {
      width: 110, height: 206, radius: 4, top: 133, silver: true,
      rows: [["284", 41, 28], ["カ", 78, 25, 25], ["8", 107, 23, 25], ["3", 133, 23, 25], ["6", 159, 23, 25]],
      lines: [59],
    },
    okinawa: {
      width: 90, height: 220, radius: 4, top: 45,
      rows: [["沖電", 35, 16], ["46", 65, 20], ["31", 93, 20], ["カ", 121, 20], ["78", 149, 20], ["12", 177, 20]],
      lines: [78, 106, 134, 162, 190],
    },
  };

  const companionPlates = {
    tohoku: [{
      width: 56, height: 92, radius: 3, top: 93,
      rows: [["南通", 29, 13], ["7", 61, 18]],
    }],
    hokuriku: [{
      width: 147, height: 58, radius: 3, top: 277, silver: true,
      rows: [["南通　22", 29, 17]],
    }],
    okinawa: [{
      width: 68, height: 89, radius: 3, top: 279, silver: true,
      rows: [["中通", 30, 14], ["L7", 55, 20]],
    }, {
      width: 78, height: 60, radius: 3, top: 381,
      rows: [["72-6", 29, 17]],
    }],
  };

  function gradient(context, startX, startY, endX, endY, colors) {
    const paint = context.createLinearGradient(startX, startY, endX, endY);
    for (const [offset, color] of colors) paint.addColorStop(offset, color);
    return paint;
  }

  function oval(context, x, y, width, height, color) {
    context.beginPath();
    context.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  }

  function drawBackground(context) {
    context.fillStyle = gradient(context, 0, 0, sceneWidth, sceneHeight, [
      [0, "#96b4bb"], [.45, "#c1d1cb"], [1, "#e5dfc6"],
    ]);
    context.fillRect(0, 0, sceneWidth, sceneHeight);

    context.save();
    context.filter = "blur(20px)";
    oval(context, 105, 480, 480, 230, "#849589");
    oval(context, 660, 501, 357, 260, "#98a18a");
    oval(context, 650, 61, 400, 82, "#e3e4d5");
    context.restore();

    const light = context.createRadialGradient(530, 98, 20, 452, 200, 480);
    light.addColorStop(0, "#fff6d52e");
    light.addColorStop(1, "#29464c18");
    context.fillStyle = light;
    context.fillRect(0, 0, sceneWidth, sceneHeight);
  }

  function drawConcrete(context) {
    const left = 266;
    const right = 494;
    context.beginPath();
    context.moveTo(left + 8, 0);
    context.lineTo(right - 8, 0);
    context.lineTo(right + 3, sceneHeight);
    context.lineTo(left - 3, sceneHeight);
    context.closePath();
    context.save();
    context.clip();

    context.fillStyle = gradient(context, left, 0, right, 0, [
      [0, "#889091"], [.10, "#b5b7ad"], [.31, "#d6d2c0"],
      [.52, "#c9c6b7"], [.78, "#a5a69a"], [1, "#777e78"],
    ]);
    context.fillRect(left - 4, 0, right - left + 8, sceneHeight);

    // Fixed seed keeps the concrete texture identical across questions.
    let seed = 92975;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let index = 0; index < 5600; index += 1) {
      const x = left - 4 + random() * (right - left + 8);
      const y = random() * sceneHeight;
      const grain = random();
      context.fillStyle = grain > .58 ? "#716e5e36" : "#f3efe236";
      context.fillRect(x, y, 1 + grain * 1.7, 1 + random() * 2.3);
    }

    context.fillStyle = gradient(context, left, 0, right, sceneHeight, [
      [0, "#fff7df30"], [.42, "#ffffff02"], [1, "#51645a39"],
    ]);
    context.fillRect(left - 4, 0, right - left + 8, sceneHeight);
    context.restore();
  }

  function drawStrap(context, y) {
    context.fillStyle = gradient(context, 263, y, 497, y + 4, [
      [0, "#707772"], [.32, "#d1d2c6"], [.60, "#b5b6ac"], [1, "#616963"],
    ]);
    context.fillRect(263, y, 234, 7);
    context.fillStyle = "#53584e50";
    context.fillRect(263, y + 6, 234, 2);
  }

  function drawBolt(context, x, y) {
    oval(context, x, y, 8, 8, "#747b77");
    oval(context, x - .8, y - .8, 5.4, 5.4, "#c2c6bd");
    context.strokeStyle = "#505854";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x - 2, y + 1.3);
    context.lineTo(x + 1.6, y - 2);
    context.stroke();
  }

  function drawPlate(context, design) {
    const mid = center;
    const left = mid - design.width / 2;
    const bottom = design.top + design.height;
    context.save();
    context.shadowColor = "#292d2a78";
    context.shadowBlur = 11;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 7;
    context.beginPath();
    context.roundRect(left, design.top, design.width, design.height, design.radius);
    context.fillStyle = gradient(context, left, design.top, left + design.width, bottom, design.silver
      ? [[0, "#e5e8e2"], [.42, "#f0eee3"], [1, "#b4bbb5"]]
      : [[0, "#f8f5e8"], [.65, "#eeeee3"], [1, "#cccec4"]]);
    context.fill();
    context.restore();

    context.strokeStyle = "#6a716a";
    context.lineWidth = 1.3;
    context.stroke();
    context.beginPath();
    context.roundRect(left + 4, design.top + 4, design.width - 8, design.height - 8, Math.max(0, design.radius - 4));
    context.strokeStyle = "#fbfcf4ad";
    context.lineWidth = 1;
    context.stroke();

    for (const offset of design.lines ?? []) {
      context.fillStyle = "#4f5e5559";
      context.fillRect(left + 13, design.top + offset, design.width - 26, 1);
    }

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#252c29";
    for (const [word, offset, size, inset = 0] of design.rows) {
      context.font = design.handwritten && /^\d$/.test(word)
        ? `italic 500 ${size}px Georgia, serif`
        : `600 ${size}px ${plateFont}`;
      context.fillText(word, mid + inset, design.top + offset, design.width - 11);
    }
    drawBolt(context, mid, design.top + 11);
    drawBolt(context, mid, bottom - 10);
  }

  function drawUpArrow(context) {
    context.save();
    context.fillStyle = "#e3a02b";
    context.strokeStyle = "#836023";
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(center, 100);
    context.lineTo(center + 24, 126);
    context.lineTo(center + 9, 126);
    context.lineTo(center + 9, 153);
    context.lineTo(center - 9, 153);
    context.lineTo(center - 9, 126);
    context.lineTo(center - 24, 126);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  function drawOrangeBand(context) {
    context.fillStyle = "#2a2d28";
    context.fillRect(264, 387, 232, 23);
    context.fillStyle = gradient(context, 264, 0, 495, 0, [
      [0, "#a56b28"], [.32, "#dd9a3e"], [.7, "#c37f32"], [1, "#865d31"],
    ]);
    context.fillRect(264, 390, 232, 12);
  }

  return (canvas, style) => {
    const context = canvas.getContext("2d");
    const design = designs[style];
    if (!context || !design) return;

    const scale = Math.max(canvas.width / sceneWidth, canvas.height / sceneHeight);
    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#baccc6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.translate((canvas.width - scale * sceneWidth) / 2, (canvas.height - scale * sceneHeight) / 2);
    context.scale(scale, scale);
    drawBackground(context);
    drawConcrete(context);
    drawStrap(context, design.top + 15);
    drawStrap(context, design.top + design.height - 19);
    if (style === "chugoku") drawUpArrow(context);
    if (style === "shikoku") drawOrangeBand(context);
    drawPlate(context, design);
    for (const companion of companionPlates[style] ?? []) drawPlate(context, companion);
    context.restore();
  };
})();
