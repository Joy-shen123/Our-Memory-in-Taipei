/*
 * assets-dadaocheng-1980s.js — 大稻埕 1980 年代懷舊街景素材
 * 載入順序：three.min.js → assets-core.js → 本檔
 * 涵蓋元素（精選 6 件，懷舊感來自「生活」，不放動漫明星）：
 *   1. 南北貨行門面（騎樓、麻布袋乾貨堆、玻璃罐、手寫價目牌）storefront
 *   2. 永樂市場布行攤位（木攤台、直立布匹、剪刀、算盤）      storefront
 *   3. 霞海城隍廟門面（紅柱、燕尾翹脊、香爐、燈籠）          building
 *   4. 中藥行櫃檯（百子櫃、戥秤、藥材罐）                    storefront
 *   5. 波麗路西餐廳門面（洗石子立面、圓弧雨遮、霓虹字）      storefront
 *   6. 三輪車（載貨斗、把手、座墊）                          vehicle
 * 年代查核：1980 年代尚無「年貨大街」（1996 開辦），全檔不出現。
 * 決定性：所有隨機使用 C.rand(固定 seed)，無 Math.random / Date。
 */
(function () {
  'use strict';

  function makeGroup(id, name) {
    var g = new THREE.Group();
    g.userData = { id: id, name: name, era: 'dadaocheng-1980s' };
    return g;
  }

  window.NOSTALGIA_ASSETS = window.NOSTALGIA_ASSETS || {};
  window.NOSTALGIA_ASSETS['dadaocheng-1980s'] = [

    // 南北貨行門面：紅磚騎樓柱 + 敞開麻布袋（香菇／金針／烏魚子）+ 玻璃罐排 + 手寫價目牌
    {
      id: 'dried-goods-shop',
      name: '南北貨行門面',
      category: 'storefront',
      build: function (C) {
        var g = makeGroup('dried-goods-shop', '南北貨行門面');
        var P = C.PALETTE;
        var rnd = C.rand(1981);

        // 店面主體（木質老店身）
        var body = C.box(5, 3.4, 2.2, P.woodLight, { roughness: 0.95 });
        body.position.set(0, 1.7, -1.1);
        g.add(body);

        // 紅磚騎樓柱一對
        var colL = C.box(0.45, 3.2, 0.45, P.rust, { roughness: 0.95 });
        colL.position.set(-2.2, 1.6, 1.3);
        g.add(colL);
        var colR = C.box(0.45, 3.2, 0.45, P.rust, { roughness: 0.95 });
        colR.position.set(2.2, 1.6, 1.3);
        g.add(colR);

        // 騎樓橫楣（連接兩柱）
        var lintel = C.box(4.9, 0.4, 0.5, P.rust, { roughness: 0.95 });
        lintel.position.set(0, 3.0, 1.3);
        g.add(lintel);

        // 敞開麻布袋 x3（袋身 + 貨色頂面：香菇深褐／金針橙黃／烏魚子磚紅）
        var goodsColors = ['#4a3320', '#c98a2e', '#b1552e'];
        for (var i = 0; i < 3; i++) {
          var sack = C.cyl(0.36, 0.3, 0.5, P.kraft, 10);
          sack.position.set(-1.3 + i * 1.3, 0.25, 0.7 + rnd() * 0.15);
          g.add(sack);
          var goods = C.cyl(0.3, 0.3, 0.1, goodsColors[i], 10);
          goods.position.set(sack.position.x, 0.53, sack.position.z);
          g.add(goods);
        }

        // 木架 + 玻璃罐排（瓜子、花生、蜜餞）
        var shelf = C.box(2.2, 0.08, 0.4, P.woodDark, { roughness: 0.9 });
        shelf.position.set(0.9, 1.1, 0.1);
        g.add(shelf);
        for (var j = 0; j < 4; j++) {
          var jar = C.cyl(0.12, 0.12, 0.3, '#d8c9a3', 10);
          jar.position.set(0.15 + j * 0.5, 1.29, 0.1);
          g.add(jar);
        }

        // 手寫價目牌 x2（插在貨堆上）
        var tag1 = C.textPlane('香菇 一斤180', 0.55, { color: '#222', bg: P.cream, fontSize: 56 });
        tag1.position.set(-1.3, 0.75, 0.95);
        tag1.rotation.x = -0.2;
        g.add(tag1);
        var tag2 = C.textPlane('烏魚子 時價', 0.5, { color: P.signRed, bg: P.cream, fontSize: 56 });
        tag2.position.set(1.3, 0.75, 0.95);
        tag2.rotation.x = -0.2;
        g.add(tag2);

        // 直式招牌「南北貨」
        var sign = C.verticalSign('南北貨', { h: 2.4, bg: P.signRed, fg: '#fff' });
        sign.position.set(2.7, 1.1, 1.4);
        g.add(sign);

        return g;
      }
    },

    // 永樂市場布行攤位：木攤台 + 直立布匹卷成排 + 剪刀與算盤檯面 + 布莊招牌
    {
      id: 'yongle-fabric-stall',
      name: '永樂市場布行攤位',
      category: 'storefront',
      build: function (C) {
        var g = makeGroup('yongle-fabric-stall', '永樂市場布行攤位');
        var P = C.PALETTE;
        var rnd = C.rand(1985);

        // 木攤台（櫃身 + 檯面）
        var counter = C.box(3, 0.9, 1.1, P.woodDark, { roughness: 0.95 });
        counter.position.set(0, 0.45, 0.4);
        g.add(counter);
        var top = C.box(3.15, 0.08, 1.25, P.woodLight, { roughness: 0.85 });
        top.position.set(0, 0.94, 0.4);
        g.add(top);

        // 後方布架
        var rack = C.box(3, 0.12, 0.55, P.woodDark, { roughness: 0.95 });
        rack.position.set(0, 1.0, -0.45);
        g.add(rack);

        // 直立布匹卷成排（多彩圓柱，高低略有變化）
        var boltColors = [P.signRed, '#3a6ea5', P.signGreen, P.neonYellow, P.cream, '#8a4a7d', P.rust, '#4a7a6a'];
        for (var i = 0; i < 8; i++) {
          var h = 1.05 + rnd() * 0.2;
          var bolt = C.cyl(0.1, 0.1, h, boltColors[i], 10);
          bolt.position.set(-1.3 + i * 0.37, 1.06 + h / 2, -0.45);
          g.add(bolt);
        }

        // 檯面上的剪刀（兩片交叉的鋼薄片）
        var blade1 = C.box(0.32, 0.02, 0.05, P.steel, { metalness: 0.7, roughness: 0.3 });
        blade1.position.set(-0.8, 1.0, 0.55);
        blade1.rotation.y = 0.4;
        g.add(blade1);
        var blade2 = C.box(0.32, 0.02, 0.05, P.steel, { metalness: 0.7, roughness: 0.3 });
        blade2.position.set(-0.8, 1.02, 0.55);
        blade2.rotation.y = -0.4;
        g.add(blade2);

        // 檯面上的算盤（木框 + 一排算珠）
        var abacus = C.box(0.45, 0.05, 0.28, P.woodDark, { roughness: 0.8 });
        abacus.position.set(0.8, 1.0, 0.55);
        g.add(abacus);
        for (var b = 0; b < 4; b++) {
          var bead = C.box(0.06, 0.05, 0.05, P.black, { roughness: 0.6 });
          bead.position.set(0.66 + b * 0.09, 1.05, 0.55);
          g.add(bead);
        }

        // 攤位上方「永樂布莊」招牌（紅底木框橫板）
        var board = C.box(2.4, 0.55, 0.08, P.signRed, { roughness: 0.8 });
        board.position.set(0, 2.3, -0.4);
        g.add(board);
        var boardText = C.textPlane('永樂布莊', 1.8, { color: P.cream, fontSize: 96 });
        boardText.position.set(0, 2.3, -0.35);
        g.add(boardText);

        // 招牌吊桿一對
        var poleL = C.cyl(0.03, 0.03, 1.0, P.woodDark, 8);
        poleL.position.set(-1.0, 1.55, -0.45);
        g.add(poleL);
        var poleR = C.cyl(0.03, 0.03, 1.0, P.woodDark, 8);
        poleR.position.set(1.0, 1.55, -0.45);
        g.add(poleR);

        return g;
      }
    },

    // 霞海城隍廟門面：紅柱 + 燕尾翹脊屋頂（斜箱＋翹角近似）+ 香爐 + 燈籠一對 + 匾額
    {
      id: 'xiahai-temple',
      name: '霞海城隍廟門面',
      category: 'building',
      build: function (C) {
        var g = makeGroup('xiahai-temple', '霞海城隍廟門面');
        var P = C.PALETTE;

        // 石階底座
        var base = C.box(6, 0.3, 3.4, P.concrete, { roughness: 1 });
        base.position.set(0, 0.15, 0);
        g.add(base);

        // 廟身（暖磚色牆體，中央留深色門洞）
        var body = C.box(5, 3, 2.2, P.rust, { roughness: 0.95 });
        body.position.set(0, 1.8, -0.4);
        g.add(body);
        var door = C.box(1.4, 2.2, 0.08, P.black, { roughness: 0.9 });
        door.position.set(0, 1.4, 0.72);
        g.add(door);

        // 紅柱一對
        var colL = C.cyl(0.18, 0.2, 3.1, P.lantern, 12);
        colL.position.set(-1.9, 1.85, 1.1);
        g.add(colL);
        var colR = C.cyl(0.18, 0.2, 3.1, P.lantern, 12);
        colR.position.set(1.9, 1.85, 1.1);
        g.add(colR);

        // 屋頂：前坡斜箱 + 屋脊 + 左右燕尾翹角
        var slope = C.box(5.8, 0.18, 2.6, '#6e3b28', { roughness: 0.9 });
        slope.rotation.x = -0.32;
        slope.position.set(0, 3.75, 0.45);
        g.add(slope);
        var ridge = C.box(5.4, 0.3, 0.5, '#5a2f20', { roughness: 0.9 });
        ridge.position.set(0, 4.2, -0.7);
        g.add(ridge);
        var tailL = C.box(0.9, 0.14, 0.4, '#5a2f20', { roughness: 0.9 });
        tailL.rotation.z = 0.55;
        tailL.position.set(-2.9, 4.45, -0.7);
        g.add(tailL);
        var tailR = C.box(0.9, 0.14, 0.4, '#5a2f20', { roughness: 0.9 });
        tailR.rotation.z = -0.55;
        tailR.position.set(2.9, 4.45, -0.7);
        g.add(tailR);

        // 匾額「霞海城隍廟」（深底金字，掛門楣上方）
        var plaque = C.box(2.3, 0.6, 0.1, '#2a1a10', { roughness: 0.7 });
        plaque.position.set(0, 2.95, 0.78);
        g.add(plaque);
        var plaqueText = C.textPlane('霞海城隍廟', 2.0, { color: '#e8c46a', fontSize: 96 });
        plaqueText.position.set(0, 2.95, 0.85);
        g.add(plaqueText);

        // 香爐（銅色圓柱爐身 + 爐口沿 + 三炷香）
        var censer = C.cyl(0.42, 0.34, 0.55, '#7a5a2e', 12);
        censer.position.set(0, 0.58, 1.9);
        g.add(censer);
        var rim = C.cyl(0.46, 0.46, 0.08, '#8a682f', 12);
        rim.position.set(0, 0.88, 1.9);
        g.add(rim);
        for (var i = 0; i < 3; i++) {
          var stick = C.cyl(0.012, 0.012, 0.5, '#b1552e', 6);
          stick.position.set(-0.1 + i * 0.1, 1.15, 1.9);
          stick.rotation.z = (i - 1) * 0.12;
          g.add(stick);
        }

        // 燈籠一對（紅色球體 + 黃色流蘇短柱），掛在紅柱前
        var lanternGeo = new THREE.SphereGeometry(0.24, 12, 8);
        var lanL = new THREE.Mesh(lanternGeo, C.mat(P.lantern, { emissive: P.lantern, emissiveIntensity: 0.3, roughness: 0.6 }));
        lanL.scale.set(1, 0.85, 1);
        lanL.position.set(-1.9, 2.9, 1.35);
        g.add(lanL);
        var lanR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), C.mat(P.lantern, { emissive: P.lantern, emissiveIntensity: 0.3, roughness: 0.6 }));
        lanR.scale.set(1, 0.85, 1);
        lanR.position.set(1.9, 2.9, 1.35);
        g.add(lanR);
        var tasselL = C.cyl(0.02, 0.02, 0.14, P.neonYellow, 6);
        tasselL.position.set(-1.9, 2.62, 1.35);
        g.add(tasselL);
        var tasselR = C.cyl(0.02, 0.02, 0.14, P.neonYellow, 6);
        tasselR.position.set(1.9, 2.62, 1.35);
        g.add(tasselR);

        return g;
      }
    },

    // 中藥行櫃檯：百子櫃（格狀小抽屜陣列）+ 木櫃檯 + 戥秤 + 藥材罐 + 直式招牌
    {
      id: 'herbal-medicine-counter',
      name: '中藥行櫃檯',
      category: 'storefront',
      build: function (C) {
        var g = makeGroup('herbal-medicine-counter', '中藥行櫃檯');
        var P = C.PALETTE;

        // 百子櫃櫃身（深色木櫃）
        var cabinet = C.box(3, 2.4, 0.5, P.woodDark, { roughness: 0.95 });
        cabinet.position.set(0, 1.2, -0.7);
        g.add(cabinet);

        // 格狀小抽屜陣列（3 排 x 4 列，淺木色抽屜面）
        for (var r = 0; r < 3; r++) {
          for (var c = 0; c < 4; c++) {
            var drawer = C.box(0.6, 0.55, 0.05, P.woodLight, { roughness: 0.85 });
            drawer.position.set(-1.05 + c * 0.7, 0.65 + r * 0.65, -0.42);
            g.add(drawer);
          }
        }

        // 木櫃檯（櫃身 + 檯面）
        var counter = C.box(2.6, 0.95, 0.7, P.woodLight, { roughness: 0.9 });
        counter.position.set(0, 0.48, 0.5);
        g.add(counter);
        var top = C.box(2.75, 0.07, 0.82, P.woodDark, { roughness: 0.8 });
        top.position.set(0, 0.99, 0.5);
        g.add(top);

        // 戥秤（橫桿 + 吊線 + 秤盤）
        var beam = C.cyl(0.012, 0.012, 0.5, '#8a682f', 8);
        beam.rotation.z = Math.PI / 2;
        beam.position.set(-0.7, 1.35, 0.6);
        g.add(beam);
        var string = C.cyl(0.005, 0.005, 0.22, P.black, 6);
        string.position.set(-0.9, 1.24, 0.6);
        g.add(string);
        var pan = C.cyl(0.09, 0.07, 0.03, '#8a682f', 10);
        pan.position.set(-0.9, 1.12, 0.6);
        g.add(pan);

        // 藥材罐 x3（檯面上的陶罐）
        for (var j = 0; j < 3; j++) {
          var jar = C.cyl(0.1, 0.12, 0.26, P.cream, 10);
          jar.position.set(0.2 + j * 0.4, 1.16, 0.5);
          g.add(jar);
        }

        // 櫃頂橫匾「回春堂」
        var boardText = C.textPlane('回春堂', 1.2, { color: '#e8c46a', bg: '#2a1a10', fontSize: 96 });
        boardText.position.set(0, 2.55, -0.42);
        g.add(boardText);

        // 直式招牌「中藥」（深底金字老鋪感）
        var sign = C.verticalSign('中藥', { h: 1.9, w: 0.5, bg: '#2a1a10', fg: '#e8c46a' });
        sign.position.set(1.85, 0.9, 0.2);
        g.add(sign);

        return g;
      }
    },

    // 波麗路西餐廳門面：洗石子立面 + 圓弧雨遮 + 「波麗路」霓虹字 + 玻璃門
    {
      id: 'bolero-restaurant',
      name: '波麗路西餐廳門面',
      category: 'storefront',
      build: function (C) {
        var g = makeGroup('bolero-restaurant', '波麗路西餐廳門面');
        var P = C.PALETTE;

        // 洗石子立面（灰米色，1934 老洋樓味）
        var facade = C.box(6, 4.2, 1, P.concrete, { roughness: 1 });
        facade.position.set(0, 2.1, -0.5);
        g.add(facade);

        // 立面腰帶裝飾（深色橫帶）
        var band = C.box(6.05, 0.2, 1.02, '#6e6e66', { roughness: 0.95 });
        band.position.set(0, 3.3, -0.5);
        g.add(band);

        // 圓弧雨遮（半圓柱橫放，曲面朝上）
        var canopy = new THREE.Mesh(
          new THREE.CylinderGeometry(0.75, 0.75, 3.4, 16, 1, false, 0, Math.PI),
          C.mat('#3a4a3f', { roughness: 0.7, side: THREE.DoubleSide })
        );
        canopy.rotation.z = Math.PI / 2;
        canopy.position.set(0, 2.55, 0.15);
        g.add(canopy);

        // 「波麗路」霓虹字（雨遮上方）
        var neon = C.neonText('波麗路', { w: 2.6, color: P.neonBlue, backing: '#141414' });
        neon.position.set(0, 3.35, 0.05);
        g.add(neon);

        // 雨遮前緣「BOLERO」小字
        var latin = C.textPlane('BOLERO 西餐廳', 1.6, { color: P.cream, fontSize: 56 });
        latin.position.set(0, 2.1, 0.92);
        g.add(latin);

        // 玻璃雙開門（深色玻璃 + 鋼框 + 中梃）
        var doorGlassL = C.box(0.85, 2.2, 0.06, '#1e2a30', { roughness: 0.15, metalness: 0.5 });
        doorGlassL.position.set(-0.47, 1.1, 0.02);
        g.add(doorGlassL);
        var doorGlassR = C.box(0.85, 2.2, 0.06, '#1e2a30', { roughness: 0.15, metalness: 0.5 });
        doorGlassR.position.set(0.47, 1.1, 0.02);
        g.add(doorGlassR);
        var mullion = C.box(0.06, 2.2, 0.1, P.steel, { metalness: 0.6, roughness: 0.35 });
        mullion.position.set(0, 1.1, 0.03);
        g.add(mullion);
        var doorHead = C.box(2.0, 0.12, 0.1, P.steel, { metalness: 0.6, roughness: 0.35 });
        doorHead.position.set(0, 2.26, 0.03);
        g.add(doorHead);

        // 兩側洗石子立面上的長窗（深色玻璃）
        var winL = C.box(1.1, 1.6, 0.06, '#26333a', { roughness: 0.2, metalness: 0.4 });
        winL.position.set(-2.1, 1.5, 0.02);
        g.add(winL);
        var winR = C.box(1.1, 1.6, 0.06, '#26333a', { roughness: 0.2, metalness: 0.4 });
        winR.position.set(2.1, 1.5, 0.02);
        g.add(winR);

        return g;
      }
    },

    // 三輪車：前一後二三輪 + 木製載貨斗 + 車架 + 把手 + 座墊，車頭朝 +Z
    {
      id: 'sanlunche',
      name: '三輪車',
      category: 'vehicle',
      build: function (C) {
        var g = makeGroup('sanlunche', '三輪車');
        var P = C.PALETTE;

        // 前輪（單輪）+ 後輪一對（薄圓柱側立，沿 z 向滾動）
        var wheelF = C.cyl(0.32, 0.32, 0.07, P.black, 16);
        wheelF.rotation.z = Math.PI / 2;
        wheelF.position.set(0, 0.32, 0.8);
        g.add(wheelF);
        var wheelL = C.cyl(0.32, 0.32, 0.07, P.black, 16);
        wheelL.rotation.z = Math.PI / 2;
        wheelL.position.set(-0.52, 0.32, -0.45);
        g.add(wheelL);
        var wheelR = C.cyl(0.32, 0.32, 0.07, P.black, 16);
        wheelR.rotation.z = Math.PI / 2;
        wheelR.position.set(0.52, 0.32, -0.45);
        g.add(wheelR);

        // 後軸
        var axle = C.cyl(0.025, 0.025, 1.04, P.steel, 8);
        axle.rotation.z = Math.PI / 2;
        axle.position.set(0, 0.32, -0.45);
        g.add(axle);

        // 車架主樑（前輪連到後斗）
        var frame = C.box(0.08, 0.08, 1.2, P.rust, { metalness: 0.3, roughness: 0.6 });
        frame.position.set(0, 0.45, 0.15);
        g.add(frame);

        // 木製載貨斗（底板 + 左右側板 + 前擋板）
        var bed = C.box(1.0, 0.1, 1.0, P.woodLight, { roughness: 0.95 });
        bed.position.set(0, 0.62, -0.45);
        g.add(bed);
        var sideL = C.box(0.06, 0.3, 1.0, P.woodDark, { roughness: 0.95 });
        sideL.position.set(-0.47, 0.82, -0.45);
        g.add(sideL);
        var sideR = C.box(0.06, 0.3, 1.0, P.woodDark, { roughness: 0.95 });
        sideR.position.set(0.47, 0.82, -0.45);
        g.add(sideR);
        var front = C.box(1.0, 0.3, 0.06, P.woodDark, { roughness: 0.95 });
        front.position.set(0, 0.82, 0.02);
        g.add(front);

        // 貨斗裡的麻布袋貨物
        var cargo = C.cyl(0.26, 0.3, 0.35, P.kraft, 10);
        cargo.position.set(0, 0.85, -0.55);
        g.add(cargo);

        // 前叉 + 把手
        var fork = C.cyl(0.03, 0.03, 0.6, P.steel, 8);
        fork.rotation.x = 0.3;
        fork.position.set(0, 0.62, 0.75);
        g.add(fork);
        var handlebar = C.cyl(0.02, 0.02, 0.62, P.steel, 8);
        handlebar.rotation.z = Math.PI / 2;
        handlebar.position.set(0, 0.98, 0.66);
        g.add(handlebar);

        // 座墊（皮革色）+ 座管
        var seatPost = C.cyl(0.025, 0.025, 0.35, P.steel, 8);
        seatPost.position.set(0, 0.65, 0.25);
        g.add(seatPost);
        var seat = C.box(0.26, 0.08, 0.3, '#3a2a1a', { roughness: 0.9 });
        seat.position.set(0, 0.86, 0.25);
        g.add(seat);

        // 踏板曲柄
        var crank = C.cyl(0.02, 0.02, 0.3, P.steel, 8);
        crank.rotation.z = Math.PI / 2;
        crank.position.set(0, 0.45, 0.5);
        g.add(crank);

        return g;
      }
    }
  ];
})();
