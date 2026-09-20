/*
 * assets-core.js — 台北懷舊街景共用核心庫
 * 載入順序：three.min.js → assets-core.js → 各年代素材檔
 * 暴露全域：window.NOSTALGIA_ASSETS（素材 registry）、window.NostalgiaCore（工具庫 C）
 * 只使用 three.js 長期穩定 API（r100+），無 module、無外部資源。
 */
(function () {
  'use strict';

  // 全域素材 registry：年代檔把素材陣列註冊進來，例如 NOSTALGIA_ASSETS['ximen-1980s'] = [...]
  window.NOSTALGIA_ASSETS = window.NOSTALGIA_ASSETS || {};

  var C = {};

  // ---------------------------------------------------------------
  // C.PALETTE：共用色票（懷舊街景配色）
  // ---------------------------------------------------------------
  C.PALETTE = {
    neonPink: '#ff4fd8',
    neonBlue: '#3ec6ff',
    neonYellow: '#ffd23e',
    signRed: '#b3261e',
    signGreen: '#0d6e4f',
    cream: '#f5ead6',
    kraft: '#c9a86a',
    woodDark: '#5b4226',
    woodLight: '#a8865a',
    rust: '#7a4a2b',
    concrete: '#9a9a92',
    asphalt: '#3c3c3c',
    lantern: '#e03c31',
    white: '#f4f4f0',
    black: '#1a1a1a',
    steel: '#7d8489'
  };

  // ---------------------------------------------------------------
  // C.rand(seed)：mulberry32 決定性偽隨機
  // 傳入固定整數 seed，回傳一個 function，每次呼叫回傳 0~1 的數。
  // 素材建構一律用這個，不可用 Math.random()，確保每次載入結果相同。
  // ---------------------------------------------------------------
  C.rand = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---------------------------------------------------------------
  // C.mat(color, opts?)：建立 MeshStandardMaterial
  // opts: { roughness=0.85, metalness=0.05, emissive, emissiveIntensity, side }
  // ---------------------------------------------------------------
  C.mat = function (color, opts) {
    opts = opts || {};
    var params = {
      color: new THREE.Color(color),
      roughness: opts.roughness !== undefined ? opts.roughness : 0.85,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.05
    };
    if (opts.emissive !== undefined) {
      params.emissive = new THREE.Color(opts.emissive);
      params.emissiveIntensity =
        opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1;
    }
    if (opts.side !== undefined) params.side = opts.side;
    return new THREE.MeshStandardMaterial(params);
  };

  // ---------------------------------------------------------------
  // C.box(w, h, d, color, opts?)：長方體 Mesh（幾何中心為原點）
  // ---------------------------------------------------------------
  C.box = function (w, h, d, color, opts) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), C.mat(color, opts));
  };

  // ---------------------------------------------------------------
  // C.cyl(rTop, rBottom, h, color, seg=12)：圓柱 Mesh（幾何中心為原點）
  // ---------------------------------------------------------------
  C.cyl = function (rTop, rBottom, h, color, seg) {
    return new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBottom, h, seg || 12),
      C.mat(color)
    );
  };

  // ---------------------------------------------------------------
  // C.group(...objects)：建立 THREE.Group 並把傳入物件全部加入
  // ---------------------------------------------------------------
  C.group = function () {
    var g = new THREE.Group();
    for (var i = 0; i < arguments.length; i++) g.add(arguments[i]);
    return g;
  };

  // 內部工具：取 >= n 的最小 2 次方（貼圖尺寸對齊用）
  function pow2(n) {
    var p = 1;
    while (p < n) p *= 2;
    return p;
  }

  // ---------------------------------------------------------------
  // C.textTexture(text, opts?)：文字轉 CanvasTexture（支援中文直式）
  // opts: {
  //   fontSize=64, color='#ffffff', bg=null(透明) 或色碼,
  //   vertical=false（true 時逐字直排）, fontWeight='bold', padding=24,
  //   fontFamily="'Noto Sans TC','Microsoft JhengHei',sans-serif"
  // }
  // 回傳的 texture.userData.aspect = 內容寬/高，供 textPlane 保持比例。
  // ---------------------------------------------------------------
  C.textTexture = function (text, opts) {
    opts = opts || {};
    var fontSize = opts.fontSize !== undefined ? opts.fontSize : 64;
    var color = opts.color || '#ffffff';
    var bg = opts.bg !== undefined ? opts.bg : null;
    var vertical = !!opts.vertical;
    var fontWeight = opts.fontWeight || 'bold';
    var padding = opts.padding !== undefined ? opts.padding : 24;
    var fontFamily =
      opts.fontFamily || "'Noto Sans TC','Microsoft JhengHei',sans-serif";
    var font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = font;

    var chars = String(text).split('');
    var contentW, contentH;
    var lineGap = Math.round(fontSize * 0.15); // 直式每字間距

    if (vertical) {
      // 直式：寬 = 最寬字元，高 = 字數 * (字高 + 間距)
      var maxW = fontSize;
      for (var i = 0; i < chars.length; i++) {
        var w = ctx.measureText(chars[i]).width;
        if (w > maxW) maxW = w;
      }
      contentW = maxW + padding * 2;
      contentH = chars.length * (fontSize + lineGap) - lineGap + padding * 2;
    } else {
      contentW = ctx.measureText(String(text)).width + padding * 2;
      contentH = fontSize * 1.3 + padding * 2;
    }

    // 貼圖尺寸取 2 的次方；繪製時把內容拉伸填滿整張 canvas，
    // 比例交由 textPlane 依 userData.aspect 還原。
    canvas.width = pow2(Math.ceil(contentW));
    canvas.height = pow2(Math.ceil(contentH));
    ctx = canvas.getContext('2d');

    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.scale(canvas.width / contentW, canvas.height / contentH);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (vertical) {
      // 逐字直排，水平置中
      var startY = padding + fontSize / 2;
      for (var j = 0; j < chars.length; j++) {
        ctx.fillText(chars[j], contentW / 2, startY + j * (fontSize + lineGap));
      }
    } else {
      ctx.fillText(String(text), contentW / 2, contentH / 2);
    }
    ctx.restore();

    var texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.userData = { contentW: contentW, contentH: contentH, aspect: contentW / contentH };
    return texture;
  };

  // ---------------------------------------------------------------
  // C.textPlane(text, widthMeters, opts?)：透明文字平面 Mesh
  // 平面長寬比與文字內容比例一致；MeshBasicMaterial + transparent。
  // ---------------------------------------------------------------
  C.textPlane = function (text, widthMeters, opts) {
    var tex = C.textTexture(text, opts);
    var aspect = tex.userData.aspect || 1;
    var h = widthMeters / aspect;
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(widthMeters, h),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    return mesh;
  };

  // ---------------------------------------------------------------
  // C.poster(text, opts?)：有邊框的直式海報（底部原點，面向 +Z）
  // opts: { w=0.8, h=1.1, bg='#f5ead6', fg='#222', frame='#8a6b3f', subtitle }
  // 版權紅線：角色/藝人只用文字 + 抽象色塊呈現，不建模長相。
  // ---------------------------------------------------------------
  C.poster = function (text, opts) {
    opts = opts || {};
    var w = opts.w !== undefined ? opts.w : 0.8;
    var h = opts.h !== undefined ? opts.h : 1.1;
    var bg = opts.bg || '#f5ead6';
    var fg = opts.fg || '#222';
    var frame = opts.frame || '#8a6b3f';
    var t = 0.03; // 海報厚度

    var g = new THREE.Group();

    // 外框（略大的薄箱體）
    var frameBox = C.box(w + 0.06, h + 0.06, t, frame, { roughness: 0.7 });
    frameBox.position.set(0, (h + 0.06) / 2, 0);
    g.add(frameBox);

    // 海報底板
    var board = C.box(w, h, t, bg, { roughness: 0.9 });
    board.position.set(0, (h + 0.06) / 2, t * 0.35);
    g.add(board);

    // 主標題：直排置中
    var title = C.textPlane(text, w * 0.32, {
      vertical: true,
      color: fg,
      fontSize: 96
    });
    title.position.set(0, (h + 0.06) / 2, t * 0.75 + 0.002);
    g.add(title);

    // 副標題（可選）：橫排放底部
    if (opts.subtitle) {
      var sub = C.textPlane(opts.subtitle, w * 0.7, {
        color: fg,
        fontSize: 48
      });
      sub.position.set(0, 0.12 + 0.03, t * 0.75 + 0.002);
      g.add(sub);
    }
    return g;
  };

  // ---------------------------------------------------------------
  // C.verticalSign(text, opts?)：直式招牌（薄箱體 + 雙面直式文字 + 上方掛架）
  // opts: { h=2.4, w=0.55, bg='#b3261e', fg='#fff', lit=false }
  // lit=true 時文字帶 emissive 亮感（夜景霓虹味）。底部原點。
  // ---------------------------------------------------------------
  C.verticalSign = function (text, opts) {
    opts = opts || {};
    var h = opts.h !== undefined ? opts.h : 2.4;
    var w = opts.w !== undefined ? opts.w : 0.55;
    var bg = opts.bg || '#b3261e';
    var fg = opts.fg || '#fff';
    var lit = !!opts.lit;
    var t = 0.12; // 招牌厚度

    var g = new THREE.Group();

    // 招牌箱體
    var body = C.box(w, h, t, bg, lit
      ? { emissive: bg, emissiveIntensity: 0.35, roughness: 0.5 }
      : { roughness: 0.75 });
    body.position.set(0, h / 2, 0);
    g.add(body);

    // 邊框收邊（上下兩條）
    var trimTop = C.box(w + 0.04, 0.05, t + 0.02, C.PALETTE.steel, { metalness: 0.5, roughness: 0.4 });
    trimTop.position.set(0, h - 0.025, 0);
    g.add(trimTop);
    var trimBottom = C.box(w + 0.04, 0.05, t + 0.02, C.PALETTE.steel, { metalness: 0.5, roughness: 0.4 });
    trimBottom.position.set(0, 0.025, 0);
    g.add(trimBottom);

    // 雙面直式文字
    var texOpts = { vertical: true, color: fg, fontSize: 96 };
    var front = C.textPlane(text, w * 0.7, texOpts);
    front.position.set(0, h / 2, t / 2 + 0.005);
    g.add(front);
    var back = C.textPlane(text, w * 0.7, texOpts);
    back.position.set(0, h / 2, -t / 2 - 0.005);
    back.rotation.y = Math.PI;
    g.add(back);

    // 上方掛架（兩根斜撐 + 橫桿）
    var bar = C.cyl(0.025, 0.025, w + 0.3, C.PALETTE.steel, 8);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, h + 0.15, 0);
    g.add(bar);
    var hangL = C.cyl(0.02, 0.02, 0.18, C.PALETTE.steel, 8);
    hangL.position.set(-w * 0.35, h + 0.07, 0);
    g.add(hangL);
    var hangR = C.cyl(0.02, 0.02, 0.18, C.PALETTE.steel, 8);
    hangR.position.set(w * 0.35, h + 0.07, 0);
    g.add(hangR);

    return g;
  };

  // ---------------------------------------------------------------
  // C.neonText(text, opts?)：霓虹感文字板（亮色文字 + 深色背板 + 微光暈）
  // opts: { w=2, color='#ff4fd8', backing='#141414' }。底部原點，面向 +Z。
  // ---------------------------------------------------------------
  C.neonText = function (text, opts) {
    opts = opts || {};
    var w = opts.w !== undefined ? opts.w : 2;
    var color = opts.color || '#ff4fd8';
    var backing = opts.backing || '#141414';

    var g = new THREE.Group();

    // 主文字貼圖（估比例決定背板高度）
    var textMesh = C.textPlane(text, w * 0.9, { color: color, fontSize: 128 });
    var aspect = textMesh.geometry.parameters.width / textMesh.geometry.parameters.height;
    var h = (w * 0.9) / aspect + 0.2;

    // 深色背板（薄箱體）
    var board = C.box(w, h, 0.08, backing, { roughness: 0.6, metalness: 0.2 });
    board.position.set(0, h / 2, 0);
    g.add(board);

    // 光暈平面（同字樣、放大、半透明，做出 glow 感）
    var glow = C.textPlane(text, w * 1.0, { color: color, fontSize: 128 });
    glow.material.opacity = 0.35;
    glow.material.transparent = true;
    glow.position.set(0, h / 2, 0.045);
    g.add(glow);

    // 主文字（略亮於背板）
    textMesh.position.set(0, h / 2, 0.055);
    g.add(textMesh);

    // 邊框細管（上下）
    var tubeTop = C.cyl(0.015, 0.015, w, color, 8);
    tubeTop.rotation.z = Math.PI / 2;
    tubeTop.position.set(0, h - 0.03, 0.05);
    tubeTop.material = C.mat(color, { emissive: color, emissiveIntensity: 0.8, roughness: 0.3 });
    g.add(tubeTop);
    var tubeBottom = C.cyl(0.015, 0.015, w, color, 8);
    tubeBottom.rotation.z = Math.PI / 2;
    tubeBottom.position.set(0, 0.03, 0.05);
    tubeBottom.material = C.mat(color, { emissive: color, emissiveIntensity: 0.8, roughness: 0.3 });
    g.add(tubeBottom);

    return g;
  };

  // ---------------------------------------------------------------
  // C.awning(width, depth, colorA, colorB)：條紋帆布雨棚
  // 交錯條紋薄箱 + 前緣波浪垂布 + 兩側斜撐桿。底部原點在牆面接點。
  // ---------------------------------------------------------------
  C.awning = function (width, depth, colorA, colorB) {
    var g = new THREE.Group();
    var stripes = Math.max(4, Math.round(width / 0.3));
    var stripeW = width / stripes;
    var tilt = -0.28; // 前低後高的傾斜角

    var canopy = new THREE.Group();
    for (var i = 0; i < stripes; i++) {
      var s = C.box(stripeW, 0.03, depth, i % 2 === 0 ? colorA : colorB, {
        roughness: 0.95,
        side: THREE.DoubleSide
      });
      s.position.set(-width / 2 + stripeW * (i + 0.5), 0, depth / 2);
      canopy.add(s);

      // 前緣垂布（每條一小片）
      var flap = C.box(stripeW * 0.96, 0.12, 0.02, i % 2 === 0 ? colorA : colorB, {
        roughness: 0.95
      });
      flap.position.set(-width / 2 + stripeW * (i + 0.5), -0.07, depth);
      canopy.add(flap);
    }
    canopy.rotation.x = tilt;
    g.add(canopy);

    // 兩側斜撐桿
    var strutLen = Math.sqrt(depth * depth + 0.5 * 0.5);
    var strutL = C.cyl(0.02, 0.02, strutLen, C.PALETTE.steel, 8);
    strutL.rotation.x = Math.PI / 2 + tilt;
    strutL.position.set(-width / 2 + 0.05, Math.sin(-tilt) * depth * 0.5, Math.cos(tilt) * depth * 0.5);
    g.add(strutL);
    var strutR = C.cyl(0.02, 0.02, strutLen, C.PALETTE.steel, 8);
    strutR.rotation.x = Math.PI / 2 + tilt;
    strutR.position.set(width / 2 - 0.05, Math.sin(-tilt) * depth * 0.5, Math.cos(tilt) * depth * 0.5);
    g.add(strutR);

    return g;
  };

  // 暴露核心庫
  window.NostalgiaCore = C;
})();
