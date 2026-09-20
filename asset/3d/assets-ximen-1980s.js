/*
 * assets-ximen-1980s.js — 西門町 1980 年代懷舊街景素材
 * 載入順序：three.min.js → assets-core.js → 本檔
 * 涵蓋元素（精選 6 件，一眼辨識年代）：
 *   1. 中華商場門面（含屋頂霓虹招牌）      building
 *   2. 電影街手繪看板牆（林青霞／港片海報）  sign
 *   3. 唱片行門面（卡帶＋黑膠櫥窗＋歌手海報）storefront
 *   4. 租書店立面（小叮噹書背書架）          storefront
 *   5. 紅色公共電話亭                        prop
 *   6. 野狼 125 機車                         vehicle
 * 版權紅線：角色與藝人一律海報／文字化，不建模長相。
 * 決定性：所有隨機使用 C.rand(固定 seed)，無 Math.random / Date。
 */
(function () {
  'use strict';

  function makeGroup(id, name) {
    var g = new THREE.Group();
    g.userData = { id: id, name: name, era: 'ximen-1980s' };
    return g;
  }

  window.NOSTALGIA_ASSETS = window.NOSTALGIA_ASSETS || {};
  window.NOSTALGIA_ASSETS['ximen-1980s'] = [

    // 中華商場門面：三層水泥長樓 + 騎樓柱廊 + 屋頂大型霓虹招牌
    {
      id: 'chunghwa-market',
      name: '中華商場',
      category: 'building',
      build: function (C) {
        var g = makeGroup('chunghwa-market', '中華商場');
        var P = C.PALETTE;

        // 主樓體（三層，長條形）
        var body = C.box(12, 9, 6, P.concrete, { roughness: 0.95 });
        body.position.set(0, 4.5 + 0.6, -1);
        g.add(body);

        // 樓層分隔橫帶 x2
        for (var i = 1; i <= 2; i++) {
          var band = C.box(12.1, 0.25, 6.1, P.white, { roughness: 0.9 });
          band.position.set(0, 0.6 + i * 3, -1);
          g.add(band);
        }

        // 一樓騎樓柱廊（5 根方柱）
        for (var c = 0; c < 5; c++) {
          var col = C.box(0.5, 3.6, 0.5, P.concrete, { roughness: 0.95 });
          col.position.set(-5 + c * 2.5, 1.8, 2.2);
          g.add(col);
        }

        // 二三樓成排小窗（貼一面深色窗帶簡化）
        var winA = C.box(11, 1.4, 0.05, P.black, { roughness: 0.4, metalness: 0.3 });
        winA.position.set(0, 5.2, 2.03);
        g.add(winA);
        var winB = C.box(11, 1.4, 0.05, P.black, { roughness: 0.4, metalness: 0.3 });
        winB.position.set(0, 8.2, 2.03);
        g.add(winB);

        // 屋頂大型霓虹招牌「中華商場」
        var roofSign = C.neonText('中華商場', { w: 7, color: P.neonYellow, backing: '#101018' });
        roofSign.position.set(0, 9.7, 0.5);
        g.add(roofSign);

        // 側掛直式霓虹招牌（電子零件行的味道）
        var side = C.verticalSign('電子行', { h: 2.6, bg: P.signGreen, fg: '#fff', lit: true });
        side.position.set(-5.6, 3.6, 2.3);
        g.add(side);

        // 一樓店面暖光燈帶
        var glow = C.box(11, 0.15, 0.1, P.neonYellow, { emissive: P.neonYellow, emissiveIntensity: 0.8 });
        glow.position.set(0, 3.5, 2.1);
        g.add(glow);

        return g;
      }
    },

    // 電影街手繪看板牆：戲院外牆 + 兩幅巨型手繪風文字海報（林青霞文藝片／港片）
    {
      id: 'movie-billboard-wall',
      name: '電影街手繪看板牆',
      category: 'sign',
      build: function (C) {
        var g = makeGroup('movie-billboard-wall', '電影街手繪看板牆');
        var P = C.PALETTE;

        // 戲院外牆
        var wall = C.box(9, 7, 0.6, P.concrete, { roughness: 0.95 });
        wall.position.set(0, 3.5, 0);
        g.add(wall);

        // 左看板：文藝片（奶油底、紅字，手繪看板感）
        var boardL = C.box(3.6, 4.6, 0.15, P.cream, { roughness: 0.9 });
        boardL.position.set(-2.3, 4.2, 0.4);
        g.add(boardL);
        var titleL = C.textPlane('林青霞', 1.1, { vertical: true, color: P.signRed, fontSize: 110 });
        titleL.position.set(-2.9, 4.2, 0.49);
        g.add(titleL);
        var subL = C.textPlane('文藝鉅片 感人上映', 2.6, { color: '#333', fontSize: 44 });
        subL.position.set(-2.3, 2.3, 0.49);
        g.add(subL);

        // 右看板：港片動作片（深底、黃字）
        var boardR = C.box(3.6, 4.6, 0.15, P.black, { roughness: 0.85 });
        boardR.position.set(2.3, 4.2, 0.4);
        g.add(boardR);
        var titleR = C.textPlane('英雄本色', 2.8, { color: P.neonYellow, fontSize: 120 });
        titleR.position.set(2.3, 4.9, 0.49);
        g.add(titleR);
        var subR = C.textPlane('港片鉅獻 全院滿座', 2.4, { color: P.white, fontSize: 44 });
        subR.position.set(2.3, 3.2, 0.49);
        g.add(subR);

        // 戲院霓虹招牌
        var marquee = C.neonText('樂聲戲院', { w: 4.5, color: P.neonPink, backing: '#141414' });
        marquee.position.set(0, 7.1, 0.2);
        g.add(marquee);

        // 售票口小雨棚
        var awn = C.awning(3, 0.9, P.signRed, P.white);
        awn.position.set(0, 2.4, 0.3);
        g.add(awn);

        return g;
      }
    },

    // 唱片行門面：卡帶與黑膠櫥窗、鳳飛飛／羅大佑海報、直式招牌
    {
      id: 'record-shop',
      name: '唱片行門面',
      category: 'storefront',
      build: function (C) {
        var g = makeGroup('record-shop', '唱片行門面');
        var P = C.PALETTE;
        var rnd = C.rand(1988);

        // 店面主體
        var body = C.box(5, 3.6, 2.5, P.woodDark, { roughness: 0.9 });
        body.position.set(0, 1.8, -1.25);
        g.add(body);

        // 大玻璃櫥窗（深色反光面）
        var glass = C.box(4.2, 2.2, 0.06, '#1e2a30', { roughness: 0.2, metalness: 0.5 });
        glass.position.set(0, 1.5, 0.02);
        g.add(glass);

        // 櫥窗內：一排卡式錄音帶（小彩色薄盒）
        for (var i = 0; i < 6; i++) {
          var tapeColors = [P.neonPink, P.neonBlue, P.neonYellow, P.white, P.signRed, P.signGreen];
          var tape = C.box(0.22, 0.14, 0.03, tapeColors[i], { roughness: 0.6 });
          tape.position.set(-1.5 + i * 0.6, 0.9 + rnd() * 0.08, 0.08);
          g.add(tape);
        }

        // 櫥窗內：兩張黑膠唱片（薄圓柱直立）
        var lp1 = C.cyl(0.35, 0.35, 0.02, P.black, 24);
        lp1.rotation.x = Math.PI / 2;
        lp1.position.set(-0.8, 1.8, 0.08);
        g.add(lp1);
        var lp2 = C.cyl(0.35, 0.35, 0.02, P.black, 24);
        lp2.rotation.x = Math.PI / 2;
        lp2.position.set(0.9, 1.8, 0.08);
        g.add(lp2);

        // 歌手海報（文字化，不建模長相）
        var posterA = C.poster('鳳飛飛', { w: 0.7, h: 1.0, bg: P.cream, fg: '#a02040', subtitle: '新歌上市' });
        posterA.position.set(-2.15, 0.9, 0.15);
        g.add(posterA);
        var posterB = C.poster('羅大佑', { w: 0.7, h: 1.0, bg: '#222', fg: P.white, frame: '#111', subtitle: '鹿港小鎮' });
        posterB.position.set(2.15, 0.9, 0.15);
        g.add(posterB);

        // 直式招牌
        var sign = C.verticalSign('唱片行', { h: 2.4, bg: P.signRed, fg: '#fff', lit: true });
        sign.position.set(2.7, 1.2, 0.4);
        g.add(sign);

        // 門口雨棚
        var awn = C.awning(5, 1, P.signRed, P.cream);
        awn.position.set(0, 2.8, 0.05);
        g.add(awn);

        return g;
      }
    },

    // 租書店立面：門口漫畫書架（小叮噹等書背文字化）+ 木質店面
    {
      id: 'comic-rental-shop',
      name: '租書店立面',
      category: 'storefront',
      build: function (C) {
        var g = makeGroup('comic-rental-shop', '租書店立面');
        var P = C.PALETTE;
        var rnd = C.rand(1980);

        // 木質店面主體
        var body = C.box(4, 3.2, 2, P.woodLight, { roughness: 0.95 });
        body.position.set(0, 1.6, -1);
        g.add(body);

        // 門洞（深色開口）
        var door = C.box(1.1, 2.2, 0.06, P.black, { roughness: 0.9 });
        door.position.set(1.1, 1.1, 0.01);
        g.add(door);

        // 門口漫畫書架（三層，塞滿彩色書背）
        var shelf = C.box(1.8, 1.8, 0.35, P.woodDark, { roughness: 0.9 });
        shelf.position.set(-0.9, 0.9, 0.2);
        g.add(shelf);
        var spineColors = [P.signRed, P.neonBlue, P.neonYellow, P.signGreen, P.cream, P.neonPink];
        for (var r = 0; r < 3; r++) {
          for (var b = 0; b < 10; b++) {
            var spine = C.box(0.14, 0.42, 0.05, spineColors[(r * 10 + b) % 6], { roughness: 0.8 });
            spine.position.set(-1.68 + b * 0.17, 0.45 + r * 0.58 + rnd() * 0.02, 0.4);
            g.add(spine);
          }
        }

        // 書架上方標示牌：小叮噹（1997 年前名稱，勿用哆啦A夢）
        var label = C.textPlane('小叮噹‧怪博士‧小甜甜', 1.7, { color: P.white, bg: P.signGreen, fontSize: 56 });
        label.position.set(-0.9, 1.95, 0.42);
        g.add(label);

        // 直式招牌
        var sign = C.verticalSign('租書店', { h: 2.2, bg: P.signGreen, fg: '#fff' });
        sign.position.set(2.2, 1.0, 0.3);
        g.add(sign);

        // 門口小雨棚
        var awn = C.awning(4, 0.9, P.signGreen, P.cream);
        awn.position.set(0, 2.5, 0.02);
        g.add(awn);

        return g;
      }
    },

    // 紅色公共電話亭：紅框玻璃亭 + 話機 + 頂牌「公用電話」
    {
      id: 'public-phone-booth',
      name: '紅色公共電話亭',
      category: 'prop',
      build: function (C) {
        var g = makeGroup('public-phone-booth', '紅色公共電話亭');
        var P = C.PALETTE;

        // 底座
        var base = C.box(1.1, 0.1, 1.1, P.asphalt, { roughness: 1 });
        base.position.set(0, 0.05, 0);
        g.add(base);

        // 四根紅色角柱
        for (var i = 0; i < 4; i++) {
          var px = (i % 2 === 0 ? -1 : 1) * 0.48;
          var pz = (i < 2 ? -1 : 1) * 0.48;
          var post = C.box(0.08, 2.2, 0.08, P.signRed, { roughness: 0.6 });
          post.position.set(px, 1.2, pz);
          g.add(post);
        }

        // 三面玻璃（前面留門口）
        var glassMat = { roughness: 0.15, metalness: 0.4 };
        var gBack = C.box(0.96, 1.9, 0.04, '#26333a', glassMat);
        gBack.position.set(0, 1.2, -0.48);
        g.add(gBack);
        var gL = C.box(0.04, 1.9, 0.96, '#26333a', glassMat);
        gL.position.set(-0.48, 1.2, 0);
        g.add(gL);
        var gR = C.box(0.04, 1.9, 0.96, '#26333a', glassMat);
        gR.position.set(0.48, 1.2, 0);
        g.add(gR);

        // 紅色頂蓋
        var roof = C.box(1.15, 0.18, 1.15, P.signRed, { roughness: 0.6 });
        roof.position.set(0, 2.39, 0);
        g.add(roof);

        // 頂牌「公用電話」
        var label = C.textPlane('公用電話', 0.9, { color: P.white, bg: P.signRed, fontSize: 72 });
        label.position.set(0, 2.4, 0.59);
        g.add(label);

        // 亭內話機（紅色小箱 + 話筒）
        var phone = C.box(0.28, 0.42, 0.14, P.signRed, { roughness: 0.5 });
        phone.position.set(0, 1.35, -0.38);
        g.add(phone);
        var handset = C.cyl(0.035, 0.035, 0.24, P.black, 8);
        handset.position.set(-0.18, 1.4, -0.36);
        g.add(handset);

        return g;
      }
    },

    // 野狼 125：經典檔車輪廓（兩輪 + 油箱 + 座墊 + 把手 + 排氣管）
    {
      id: 'yeh-lang-125',
      name: '野狼 125',
      category: 'vehicle',
      build: function (C) {
        var g = makeGroup('yeh-lang-125', '野狼 125');
        var P = C.PALETTE;

        // 前後輪（薄圓柱，軸向轉成側立），面向 +Z：車頭朝 +Z
        var wheelF = C.cyl(0.3, 0.3, 0.08, P.black, 16);
        wheelF.rotation.z = Math.PI / 2;
        wheelF.position.set(0, 0.3, 0.65);
        g.add(wheelF);
        var wheelR = C.cyl(0.3, 0.3, 0.08, P.black, 16);
        wheelR.rotation.z = Math.PI / 2;
        wheelR.position.set(0, 0.3, -0.65);
        g.add(wheelR);

        // 車架主樑（斜向）
        var frame = C.box(0.08, 0.1, 1.3, P.steel, { metalness: 0.6, roughness: 0.4 });
        frame.position.set(0, 0.55, 0);
        g.add(frame);

        // 油箱（黑色亮面，野狼經典水滴形以方箱近似）
        var tank = C.box(0.26, 0.24, 0.45, P.black, { roughness: 0.25, metalness: 0.4 });
        tank.position.set(0, 0.78, 0.2);
        g.add(tank);
        var tankLogo = C.textPlane('野狼125', 0.32, { color: P.neonYellow, fontSize: 48 });
        tankLogo.position.set(0.14, 0.78, 0.2);
        tankLogo.rotation.y = Math.PI / 2;
        g.add(tankLogo);

        // 座墊（黑色長墊）
        var seat = C.box(0.24, 0.1, 0.55, '#222222', { roughness: 0.9 });
        seat.position.set(0, 0.77, -0.28);
        g.add(seat);

        // 引擎塊
        var engine = C.box(0.24, 0.28, 0.35, P.steel, { metalness: 0.7, roughness: 0.35 });
        engine.position.set(0, 0.42, 0.05);
        g.add(engine);

        // 前叉 + 把手
        var fork = C.cyl(0.03, 0.03, 0.55, P.steel, 8);
        fork.rotation.x = 0.35;
        fork.position.set(0, 0.62, 0.62);
        g.add(fork);
        var bar = C.cyl(0.02, 0.02, 0.6, P.steel, 8);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, 0.95, 0.52);
        g.add(bar);

        // 圓頭燈
        var lamp = C.cyl(0.09, 0.09, 0.08, P.cream, 12);
        lamp.rotation.x = Math.PI / 2;
        lamp.material = C.mat(P.cream, { emissive: P.neonYellow, emissiveIntensity: 0.4, roughness: 0.3 });
        lamp.position.set(0, 0.85, 0.68);
        g.add(lamp);

        // 排氣管（沿車身右側向後）
        var exhaust = C.cyl(0.045, 0.045, 0.8, P.steel, 8);
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(0.14, 0.3, -0.35);
        g.add(exhaust);

        return g;
      }
    }
  ];
})();
