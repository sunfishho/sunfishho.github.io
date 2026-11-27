// Original illustrations of shared-pole examples. All pole numbers are fictional.
const drawPolePlate = (() => {
  const sceneWidth = 760;
  const sceneHeight = 480;
  const center = 380;
  const plateFont = '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans CJK JP", sans-serif';

  const designs = {
    hokkaido: {
      width: 104, height: 224, radius: 4, top: 40, yellow: true,
      rows: [
        ["42　画", 43, 19], ["08　区", 74, 19], ["73　図", 105, 19],
        ["03　番", 136, 19], ["51　の", 167, 19], ["28　号", 198, 19],
      ],
      lines: [58, 89, 120, 151, 182],
    },
    tohoku: {
      width: 201, height: 89, radius: 4, top: 261, silver: true,
      rows: [["中央幹", 25, 18], ["38-B", 56, 29]],
    },
    kanto: {
      width: 87, height: 188, radius: 3, top: 65, silver: true, handwritten: true,
      rows: [["小坂", 42, 20], ["1", 77, 27], ["2", 109, 27], ["7", 141, 27]],
    },
    hokuriku: {
      width: 177, height: 86, radius: 3, top: 65, bend: 11, silver: true, ink: "#405e61",
      rows: [["2473", 28, 24, -37], ["○", 26, 21, 52], ["カ　51・86", 62, 25]],
    },
    chubu: {
      width: 81, height: 218, radius: 37, top: 41,
      rows: [["42 ナ", 48, 20], ["1", 89, 24], ["8", 126, 24], ["6", 163, 24]],
    },
    kansai: {
      width: 82, height: 226, radius: 4, top: 202,
      rows: [["ミ", 42, 18, 17], ["ナ", 69, 18, 17], ["ミ", 96, 18, 17], ["ノ", 123, 18, 17], ["56", 155, 21, 10], ["W3", 183, 21, 10]],
    },
    chugoku: {
      width: 138, height: 153, radius: 3, top: 266, silver: true,
      rows: [["Energia", 31, 22], ["中町幹", 63, 17], ["38", 96, 28], ["M2", 125, 17]],
      lines: [48],
    },
    shikoku: {
      width: 84, height: 221, radius: 3, top: 195,
      rows: [["ミツサワ", 76, 15], ["78S3", 107, 23]],
    },
    kyushu: {
      width: 110, height: 206, radius: 4, top: 206, silver: true,
      rows: [["284", 41, 28], ["カ", 78, 25, 25], ["8", 107, 23, 25], ["3", 133, 23, 25], ["6", 159, 23, 25]],
      lines: [59],
    },
    okinawa: {
      width: 90, height: 220, radius: 4, top: 45,
      rows: [["沖電", 35, 16], ["46", 65, 20], ["31", 93, 20], ["カ", 121, 20], ["78", 149, 20], ["12", 177, 20]],
      lines: [78, 106, 134, 162, 190],
    },
  };

  // Order is specific to each illustrated example. Sources show poles with different orders.
  const nttTags = {
    hokkaido: nttVertical(310, "松北幹", "34L2"),
    tohoku: nttVertical(86, "南町線", "25"),
    "tohoku-niigata": nttHorizontal(279, "西町幹", "7L12R2"),
    kanto: nttVertical(302, "花川支", "46L1"),
    hokuriku: {
      width: 195, height: 75, radius: 4, top: 324, bend: 12, silver: true,
      rows: [
        ["○", 23, 25, -65, "#477598"], ["NTT", 48, 16, -65, "#477598"],
        ["東原団地", 26, 17, -4], ["支線", 51, 16, -20], ["8", 34, 33, 61],
      ],
    },
    chubu: nttVertical(304, "西通支", "17"),
    kansai: nttVertical(42, "市道西", "56R2"),
    chugoku: nttVertical(107, "北町幹", "23"),
    shikoku: nttVertical(33, "浜町幹", "7L5"),
    kyushu: nttVertical(43, "南通幹", "12R7"),
    okinawa: nttVertical(282, "里中線", "L7"),
  };

  function nttVertical(top, name, number) {
    const nameRows = [...name].map((character, index) => [character, 44 + index * 16, 15]);
    return {
      width: 67, height: 122, top, radius: 4, silver: true,
      rows: [["NTT", 24, 17], ...nameRows, [number, 95, 17]],
    };
  }

  function nttHorizontal(top, name, number) {
    return {
      width: 180, height: 70, top, radius: 4, silver: true,
      rows: [["NTT", 32, 17, -56], [name, 23, 18, 21], [number, 48, 21, 21]],
    };
  }

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

  function platePath(context, x, y, width, height, radius, bend = 0) {
    if (!bend) {
      context.roundRect(x, y, width, height, radius);
      return;
    }
    const mid = x + width / 2;
    context.moveTo(x, y + bend);
    context.quadraticCurveTo(mid, y - bend, x + width, y + bend);
    context.lineTo(x + width, y + height + bend);
    context.quadraticCurveTo(mid, y + height - bend, x, y + height + bend);
    context.closePath();
  }

  function drawStrap(context, y, bend = 0) {
    context.fillStyle = gradient(context, 263, y, 497, y + 4, [
      [0, "#707772"], [.32, "#d1d2c6"], [.60, "#b5b6ac"], [1, "#616963"],
    ]);
    context.beginPath();
    platePath(context, 263, y, 234, 7, 0, bend);
    context.fill();
    context.fillStyle = "#53584e50";
    context.beginPath();
    platePath(context, 263, y + 6, 234, 2, 0, bend);
    context.fill();
  }

  function drawFootPegs(context) {
    for (const [x, y] of [[475, 37], [244, 177], [484, 340]]) {
      context.fillStyle = "#555e5a";
      context.beginPath();
      context.roundRect(x, y, 30, 6, 3);
      context.fill();
      context.fillStyle = "#c1c2b7";
      context.fillRect(x + 4, y + 1, 24, 1.3);
    }
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
    platePath(context, left, design.top, design.width, design.height, design.radius, design.bend);
    const colors = design.yellow
      ? [[0, "#fff0ad"], [.68, "#ecd27d"], [1, "#c5a356"]]
      : design.silver
        ? [[0, "#e5e8e2"], [.42, "#f0eee3"], [1, "#b4bbb5"]]
        : [[0, "#f8f5e8"], [.65, "#eeeee3"], [1, "#cccec4"]];
    context.fillStyle = gradient(context, left, design.top, left + design.width, bottom, colors);
    context.fill();
    context.restore();

    context.strokeStyle = "#6a716a";
    context.lineWidth = 1.3;
    context.stroke();
    context.beginPath();
    platePath(context, left + 4, design.top + 4, design.width - 8, design.height - 8, Math.max(0, design.radius - 4), design.bend);
    context.strokeStyle = "#fbfcf4ad";
    context.lineWidth = 1;
    context.stroke();

    for (const offset of design.lines ?? []) {
      context.fillStyle = "#4f5e5559";
      context.fillRect(left + 13, design.top + offset, design.width - 26, 1);
    }

    context.textAlign = "center";
    context.textBaseline = "middle";
    for (const [word, offset, size, inset = 0, ink = design.ink ?? "#252c29"] of design.rows) {
      context.font = design.handwritten && /^\d$/.test(word)
        ? `italic 500 ${size}px Georgia, serif`
        : `600 ${size}px ${plateFont}`;
      context.fillStyle = ink;
      context.fillText(word, mid + inset, design.top + offset, design.width - 11);
    }
    if (design.bend) {
      const slotY = design.top + design.height / 2 + design.bend - 6;
      context.fillStyle = "#646e69";
      context.fillRect(left + 6, slotY, 3, 12);
      context.fillRect(left + design.width - 9, slotY, 3, 12);
    } else {
      drawBolt(context, mid, design.top + 11);
      drawBolt(context, mid, bottom - 10);
    }
  }

  function drawUpArrow(context) {
    context.save();
    context.fillStyle = "#e3a02b";
    context.strokeStyle = "#836023";
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(center, 31);
    context.lineTo(center + 24, 56);
    context.lineTo(center + 9, 56);
    context.lineTo(center + 9, 81);
    context.lineTo(center - 9, 81);
    context.lineTo(center - 9, 56);
    context.lineTo(center - 24, 56);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  function drawOrangeBand(context) {
    context.fillStyle = "#2a2d28";
    context.fillRect(264, 438, 232, 23);
    context.fillStyle = gradient(context, 264, 0, 495, 0, [
      [0, "#a56b28"], [.32, "#dd9a3e"], [.7, "#c37f32"], [1, "#865d31"],
    ]);
    context.fillRect(264, 442, 232, 12);
  }

  function drawCallout(context, tag, label, color, side) {
    const tagLeft = center - tag.width / 2;
    const tagRight = center + tag.width / 2;
    const y = tag.top + tag.height / 2;
    const boxHeight = 38;

    context.save();
    context.font = "700 24px system-ui, sans-serif";
    const boxWidth = context.measureText(label).width + 24;
    const x = side === "left" ? tagLeft - 28 - boxWidth : tagRight + 28;

    context.strokeStyle = color;
    context.lineWidth = 3;
    context.beginPath();
    platePath(context, tagLeft - 3, tag.top - 3, tag.width + 6, tag.height + 6, tag.radius + 3, tag.bend);
    context.stroke();

    context.beginPath();
    context.moveTo(side === "left" ? x + boxWidth : x, y);
    context.lineTo(side === "left" ? tagLeft - 3 : tagRight + 3, y);
    context.stroke();

    context.fillStyle = color;
    context.beginPath();
    context.roundRect(x, y - boxHeight / 2, boxWidth, boxHeight, 7);
    context.fill();
    context.fillStyle = "#fffef8";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, x + boxWidth / 2, y);
    context.restore();
  }

  return (canvas, style, { reveal = false } = {}) => {
    const context = canvas.getContext("2d");
    const design = style === "tohoku-niigata" ? { ...designs.tohoku, top: 138 } : designs[style];
    const telecomTag = nttTags[style];
    if (!context || !design || !telecomTag) return;

    const scale = Math.max(canvas.width / sceneWidth, canvas.height / sceneHeight);
    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#baccc6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.translate((canvas.width - scale * sceneWidth) / 2, (canvas.height - scale * sceneHeight) / 2);
    context.scale(scale, scale);
    drawBackground(context);
    drawConcrete(context);
    drawFootPegs(context);
    drawStrap(context, design.top + design.height / 2, design.bend);
    drawStrap(context, telecomTag.top + telecomTag.height / 2, telecomTag.bend);
    if (style === "chugoku") drawUpArrow(context);
    if (style === "shikoku") drawOrangeBand(context);
    drawPlate(context, design);
    drawPlate(context, telecomTag);
    if (style === "okinawa") {
      drawPlate(context, {
        width: 78, height: 43, radius: 3, top: 424,
        rows: [["72-6", 21, 14]],
      });
    }
    if (reveal) {
      drawCallout(context, design, "Power plate", "#225149", "left");
      drawCallout(context, telecomTag, "NTT plate", "#294d68", "right");
    }
    context.restore();
  };
})();
