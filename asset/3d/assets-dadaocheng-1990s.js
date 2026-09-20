/*
 * assets-dadaocheng-1990s.js — 台北大稻埕 1990 年代懷舊街景素材（年貨大街誕生）
 * 載入順序：three.min.js → assets-core.js → 本檔
 * 涵蓋元素（精選 6 件，懷舊感來自「生活」，不放動漫明星）：
 *   1. 年貨大街入口牌樓（1996 第一屆，紅牌樓 + 成串塑膠紅燈籠 + 恭喜發財）
 *   2. 年貨攤位（帆布棚、糖果/瓜子/開心果貨斗、大特價紅紙牌、試吃籤筒）
 *   3. 旗袍布莊門面（布匹卷、抽象旗袍人台、老鐵皮與新壓克力招牌並存）
 *   4. 廟埕茶桌（圓木桌、木凳、茶壺茶杯、象棋盤——老人泡茶下棋）
 *   5. 藍色小貨車（發財車，貨斗載紙箱）
 *   6. 紅磚拱廊騎樓段（迪化街保存定案：紅磚柱、圓拱、巴洛克山牆）
 * 決定性：一律使用 C.rand(固定 seed)，不用 Math.random / Date。
 */
(function () {
  'use strict';

  var ERA = 'dadaocheng-1990s';

  window.NOSTALGIA_ASSETS = window.NOSTALGIA_ASSETS || {};

  window.NOSTALGIA_ASSETS[ERA] = [

    // ── 年貨大街入口牌樓：跨街紅牌樓 + 金字 + 成串塑膠紅燈籠（1996 第一屆） ──
    {
      id: 'nianhuo-archway',
      name: '年貨大街入口牌樓',
      category: 'building',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;
        var rnd = C.rand(1996);

        // 兩側紅柱（跨街）
        var colL = C.box(0.4, 4.6, 0.4, P.signRed, { roughness: 0.7 });
        colL.position.set(-3.4, 2.3, 0);
        g.add(colL);
        var colR = C.box(0.4, 4.6, 0.4, P.signRed, { roughness: 0.7 });
        colR.position.set(3.4, 2.3, 0);
        g.add(colR);

        // 橫楣主樑
        var beam = C.box(7.6, 0.8, 0.5, P.signRed, { roughness: 0.7 });
        beam.position.set(0, 4.9, 0);
        g.add(beam);

        // 頂簷（深綠瓦簷收頭）
        var roof = C.box(8.0, 0.25, 0.8, P.signGreen, { roughness: 0.8 });
        roof.position.set(0, 5.42, 0);
        g.add(roof);

        // 主標大字：年貨大街（金黃字）
        var title = C.textPlane('年貨大街', 3.4, { color: P.neonYellow, fontSize: 128 });
        title.position.set(0, 4.9, 0.26);
        g.add(title);

        // 兩側柱上直式賀歲聯：恭喜發財 / 大家恭喜
        var coupletL = C.textPlane('恭喜發財', 0.3, { vertical: true, color: P.neonYellow, bg: '#8f1d16', fontSize: 96 });
        coupletL.position.set(-3.4, 2.6, 0.21);
        g.add(coupletL);
        var coupletR = C.textPlane('大家恭喜', 0.3, { vertical: true, color: P.neonYellow, bg: '#8f1d16', fontSize: 96 });
        coupletR.position.set(3.4, 2.6, 0.21);
        g.add(coupletR);

        // 燈籠吊繩（橫拉一條）
        var rope = C.cyl(0.015, 0.015, 6.6, P.black, 6);
        rope.rotation.z = Math.PI / 2;
        rope.position.set(0, 4.35, 0.15);
        g.add(rope);

        // 成串塑膠紅燈籠（決定性微抖動）
        for (var i = 0; i < 6; i++) {
          var lantern = new THREE.Mesh(
            new THREE.SphereGeometry(0.17, 12, 10),
            C.mat(P.lantern, { emissive: P.lantern, emissiveIntensity: 0.35, roughness: 0.6 })
          );
          lantern.scale.y = 0.82;
          lantern.position.set(-2.5 + i * 1.0, 4.12, 0.15 + (rnd() - 0.5) * 0.08);
          g.add(lantern);
        }

        g.userData = { id: 'nianhuo-archway', name: '年貨大街入口牌樓', era: ERA };
        return g;
      }
    },

    // ── 年貨攤位：帆布棚 + 糖果/瓜子/開心果貨斗 + 大特價紅紙牌 + 試吃籤筒 ──
    {
      id: 'nianhuo-stall',
      name: '年貨攤位',
      category: 'storefront',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;

        // 攤位長櫃（木色貨檯）
        var counter = C.box(2.8, 0.85, 1.1, P.woodLight, { roughness: 0.9 });
        counter.position.set(0, 0.425, 0.45);
        g.add(counter);

        // 帆布雨棚（紅黃節慶條紋）
        var canopy = C.awning(3.0, 1.6, P.signRed, P.neonYellow);
        canopy.position.set(0, 2.05, -0.2);
        g.add(canopy);

        // 後方兩根撐棚立柱
        var postL = C.cyl(0.03, 0.03, 2.05, P.steel, 8);
        postL.position.set(-1.4, 1.025, -0.2);
        g.add(postL);
        var postR = C.cyl(0.03, 0.03, 2.05, P.steel, 8);
        postR.position.set(1.4, 1.025, -0.2);
        g.add(postR);

        // 三個貨斗（牛皮紙箱斗，微向前傾方便抓貨）
        var binX = [-0.9, 0, 0.9];
        var goodsColors = ['#e05c8a', '#4a3524', '#7a9c4f']; // 糖果 / 瓜子 / 開心果
        for (var i = 0; i < 3; i++) {
          var bin = C.box(0.7, 0.28, 0.55, P.kraft, { roughness: 0.95 });
          bin.position.set(binX[i], 1.0, 0.45);
          bin.rotation.x = -0.15;
          g.add(bin);
          var goods = C.box(0.6, 0.08, 0.45, goodsColors[i], { roughness: 1.0 });
          goods.position.set(binX[i], 1.1, 0.42);
          goods.rotation.x = -0.15;
          g.add(goods);
        }

        // 手寫紅紙牌：大特價（貼在中間貨斗前）
        var saleSign = C.textPlane('大特價', 0.45, { color: '#ffe14d', bg: P.signRed, fontSize: 96 });
        saleSign.position.set(0, 0.95, 0.78);
        saleSign.rotation.x = -0.15;
        g.add(saleSign);

        // 手寫紅紙牌：一斤五十元（貼在櫃檯正面）
        var priceSign = C.textPlane('一斤五十元', 0.7, { color: '#ffe14d', bg: P.signRed, fontSize: 72 });
        priceSign.position.set(-0.9, 0.45, 1.01);
        g.add(priceSign);

        // 試吃籤筒（竹筒 + 一束竹籤）
        var cup = C.cyl(0.05, 0.045, 0.14, P.kraft, 10);
        cup.position.set(1.15, 0.92, 0.85);
        g.add(cup);
        var sticks = C.cyl(0.028, 0.028, 0.12, P.cream, 8);
        sticks.position.set(1.15, 1.0, 0.85);
        g.add(sticks);

        g.userData = { id: 'nianhuo-stall', name: '年貨攤位', era: ERA };
        return g;
      }
    },

    // ── 旗袍布莊門面：櫥窗布匹卷 + 抽象人台 + 老鐵皮與新壓克力招牌並存 ──
    {
      id: 'qipao-fabric-shop',
      name: '旗袍布莊門面',
      category: 'storefront',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;

        // 店面立面（米白老屋）
        var body = C.box(4.2, 4.0, 0.5, P.cream, { roughness: 0.9 });
        body.position.set(0, 2.0, -0.25);
        g.add(body);

        // 一樓玻璃櫥窗
        var glass = C.box(3.0, 1.9, 0.05, '#2c3640', { roughness: 0.15, metalness: 0.4 });
        glass.position.set(0, 1.35, 0.02);
        g.add(glass);

        // 櫥窗展示層板
        var shelf = C.box(3.0, 0.06, 0.35, P.woodDark, { roughness: 0.85 });
        shelf.position.set(0, 0.75, 0.15);
        g.add(shelf);

        // 布匹卷（橫放圓筒，兩下一上）
        var rollColors = [P.signRed, '#c2185b', P.signGreen];
        var rollPos = [[-1.0, 0.87], [-0.55, 0.87], [-0.78, 1.03]];
        for (var i = 0; i < 3; i++) {
          var roll = C.cyl(0.09, 0.09, 0.8, rollColors[i], 12);
          roll.rotation.z = Math.PI / 2;
          roll.position.set(rollPos[i][0], rollPos[i][1], 0.15);
          g.add(roll);
        }

        // 旗袍人台（抽象簡化：木底座 + 立桿 + 錐形旗袍身，非人物）
        var standBase = C.cyl(0.18, 0.2, 0.04, P.woodDark, 12);
        standBase.position.set(0.9, 0.8, 0.15);
        g.add(standBase);
        var standPole = C.cyl(0.02, 0.02, 0.25, P.woodDark, 8);
        standPole.position.set(0.9, 0.94, 0.15);
        g.add(standPole);
        var torso = C.cyl(0.12, 0.17, 0.75, '#b02a4c', 12);
        torso.position.set(0.9, 1.44, 0.15);
        g.add(torso);
        var collar = C.cyl(0.05, 0.06, 0.07, '#b02a4c', 10);
        collar.position.set(0.9, 1.85, 0.15);
        g.add(collar);

        // 直式招牌：旗袍（紅底金字）
        var vSign = C.verticalSign('旗袍', { h: 1.8, w: 0.5, bg: P.signRed, fg: '#ffe14d' });
        vSign.position.set(-2.3, 1.4, 0.35);
        g.add(vSign);

        // 老鐵皮招牌（鏽色，字跡斑駁感）
        var tinSign = C.box(1.8, 0.6, 0.08, P.rust, { roughness: 0.95, metalness: 0.25 });
        tinSign.position.set(-1.1, 3.1, 0.05);
        g.add(tinSign);
        var tinText = C.textPlane('永樂布莊', 1.3, { color: '#e8ddc4', fontSize: 96 });
        tinText.position.set(-1.1, 3.1, 0.1);
        g.add(tinText);

        // 新式壓克力招牌（白底微發光，時代交替感）
        var acrylic = C.box(1.8, 0.6, 0.08, P.white, {
          emissive: P.white, emissiveIntensity: 0.25, roughness: 0.4
        });
        acrylic.position.set(1.1, 3.1, 0.05);
        g.add(acrylic);
        var acrylicText = C.textPlane('旗袍訂製', 1.3, { color: P.signRed, fontSize: 96 });
        acrylicText.position.set(1.1, 3.1, 0.1);
        g.add(acrylicText);

        g.userData = { id: 'qipao-fabric-shop', name: '旗袍布莊門面', era: ERA };
        return g;
      }
    },

    // ── 廟埕茶桌：圓木桌 + 木凳 + 茶壺茶杯 + 象棋盤（老人泡茶下棋） ──
    {
      id: 'temple-tea-table',
      name: '廟埕茶桌',
      category: 'prop',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;
        var rnd = C.rand(87);

        // 圓木桌：桌面 + 中柱 + 底座
        var top = C.cyl(0.62, 0.62, 0.06, P.woodLight, 20);
        top.position.set(0, 0.72, 0);
        g.add(top);
        var leg = C.cyl(0.07, 0.09, 0.68, P.woodDark, 10);
        leg.position.set(0, 0.35, 0);
        g.add(leg);
        var base = C.cyl(0.3, 0.34, 0.04, P.woodDark, 14);
        base.position.set(0, 0.02, 0);
        g.add(base);

        // 三張圓木凳（環桌擺放，角度決定性微偏）
        for (var i = 0; i < 3; i++) {
          var a = (Math.PI * 2 / 3) * i + 0.5 + (rnd() - 0.5) * 0.2;
          var stool = C.cyl(0.16, 0.14, 0.42, P.woodLight, 12);
          stool.position.set(Math.cos(a) * 0.95, 0.21, Math.sin(a) * 0.95);
          g.add(stool);
        }

        // 陶茶壺（壺身 + 壺嘴）
        var pot = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 12, 10),
          C.mat('#8a5a3b', { roughness: 0.7 })
        );
        pot.position.set(-0.2, 0.83, -0.12);
        g.add(pot);
        var spout = C.cyl(0.015, 0.03, 0.12, '#8a5a3b', 8);
        spout.rotation.z = 1.1;
        spout.position.set(-0.33, 0.86, -0.12);
        g.add(spout);

        // 兩只小茶杯
        var cup1 = C.cyl(0.04, 0.03, 0.05, P.cream, 10);
        cup1.position.set(-0.05, 0.775, 0.1);
        g.add(cup1);
        var cup2 = C.cyl(0.04, 0.03, 0.05, P.cream, 10);
        cup2.position.set(-0.35, 0.775, 0.12);
        g.add(cup2);

        // 象棋盤（薄板 + 楚河漢界貼字，平放桌面）
        var board = C.box(0.5, 0.02, 0.45, '#e8dcc0', { roughness: 0.9 });
        board.position.set(0.22, 0.76, 0.02);
        g.add(board);
        var river = C.textPlane('楚河漢界', 0.34, { color: P.black, fontSize: 64 });
        river.rotation.x = -Math.PI / 2;
        river.position.set(0.22, 0.772, 0.02);
        g.add(river);

        // 幾枚棋子（紅黑圓片）
        var pieceColors = [P.signRed, P.black, P.signRed];
        for (var j = 0; j < 3; j++) {
          var piece = C.cyl(0.035, 0.035, 0.02, pieceColors[j], 12);
          piece.position.set(0.1 + j * 0.13, 0.782, -0.12 + rnd() * 0.24);
          g.add(piece);
        }

        g.userData = { id: 'temple-tea-table', name: '廟埕茶桌', era: ERA };
        return g;
      }
    },

    // ── 藍色小貨車：發財車（平頭車頭 + 開放貨斗 + 載紙箱） ──
    {
      id: 'blue-mini-truck',
      name: '藍色小貨車',
      category: 'vehicle',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;
        var blue = '#2456a8';

        // 平頭車頭（駕駛艙）
        var cab = C.box(1.5, 1.3, 1.1, blue, { roughness: 0.5, metalness: 0.2 });
        cab.position.set(0, 1.0, 1.15);
        g.add(cab);

        // 前擋風玻璃
        var windshield = C.box(1.3, 0.5, 0.05, '#20303e', { roughness: 0.15, metalness: 0.4 });
        windshield.position.set(0, 1.3, 1.72);
        windshield.rotation.x = -0.08;
        g.add(windshield);

        // 貨斗底板
        var bed = C.box(1.5, 0.15, 2.0, blue, { roughness: 0.6, metalness: 0.2 });
        bed.position.set(0, 0.5, -0.55);
        g.add(bed);

        // 貨斗側欄（左右 + 後擋板）
        var railL = C.box(0.06, 0.35, 2.0, blue, { roughness: 0.6, metalness: 0.2 });
        railL.position.set(-0.72, 0.75, -0.55);
        g.add(railL);
        var railR = C.box(0.06, 0.35, 2.0, blue, { roughness: 0.6, metalness: 0.2 });
        railR.position.set(0.72, 0.75, -0.55);
        g.add(railR);
        var tailgate = C.box(1.5, 0.35, 0.06, blue, { roughness: 0.6, metalness: 0.2 });
        tailgate.position.set(0, 0.75, -1.52);
        g.add(tailgate);

        // 四顆輪子
        var wheelPos = [[-0.7, 1.15], [0.7, 1.15], [-0.7, -1.0], [0.7, -1.0]];
        for (var i = 0; i < 4; i++) {
          var wheel = C.cyl(0.3, 0.3, 0.2, P.black, 14);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wheelPos[i][0], 0.3, wheelPos[i][1]);
          g.add(wheel);
        }

        // 貨斗上的紙箱（年貨補貨）
        var boxA = C.box(0.55, 0.45, 0.55, P.kraft, { roughness: 0.95 });
        boxA.position.set(-0.3, 0.8, -0.9);
        g.add(boxA);
        var boxB = C.box(0.55, 0.45, 0.55, P.kraft, { roughness: 0.95 });
        boxB.position.set(0.32, 0.8, -0.3);
        boxB.rotation.y = 0.2;
        g.add(boxB);

        // 車頭大燈（左右兩顆）
        var lightL = C.box(0.18, 0.12, 0.04, P.neonYellow, { emissive: P.neonYellow, emissiveIntensity: 0.4, roughness: 0.3 });
        lightL.position.set(-0.5, 0.72, 1.71);
        g.add(lightL);
        var lightR = C.box(0.18, 0.12, 0.04, P.neonYellow, { emissive: P.neonYellow, emissiveIntensity: 0.4, roughness: 0.3 });
        lightR.position.set(0.5, 0.72, 1.71);
        g.add(lightR);

        g.userData = { id: 'blue-mini-truck', name: '藍色小貨車', era: ERA };
        return g;
      }
    },

    // ── 紅磚拱廊騎樓段：紅磚柱 x3 + 圓拱 + 巴洛克山牆 + 老宅窗（保存定案） ──
    {
      id: 'red-brick-arcade',
      name: '紅磚拱廊騎樓段',
      category: 'building',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;
        var brick = '#9c4a35';

        // 三根紅磚方柱
        var colX = [-2.4, 0, 2.4];
        for (var i = 0; i < 3; i++) {
          var col = C.box(0.5, 2.8, 0.5, brick, { roughness: 0.95 });
          col.position.set(colX[i], 1.4, 0.8);
          g.add(col);
        }

        // 柱頂橫楣（磚拱牆帶）
        var beam = C.box(5.6, 1.0, 0.5, brick, { roughness: 0.95 });
        beam.position.set(0, 3.3, 0.8);
        g.add(beam);

        // 兩個圓拱開口（半圓深色內凹，貼在橫楣正面）
        for (var j = 0; j < 2; j++) {
          var arch = new THREE.Mesh(
            new THREE.CircleGeometry(0.85, 20, 0, Math.PI),
            C.mat('#241d18', { roughness: 1.0 })
          );
          arch.position.set(-1.2 + j * 2.4, 2.8, 1.06);
          g.add(arch);
        }

        // 二樓紅磚立面
        var upper = C.box(5.6, 2.2, 0.6, '#a9573f', { roughness: 0.95 });
        upper.position.set(0, 4.9, 0.7);
        g.add(upper);

        // 兩扇老宅木框窗（米白窗框 + 深色玻璃）
        var winX = [-1.2, 1.2];
        for (var k = 0; k < 2; k++) {
          var frame = C.box(0.7, 1.1, 0.08, P.cream, { roughness: 0.85 });
          frame.position.set(winX[k], 4.8, 1.02);
          g.add(frame);
          var pane = C.box(0.55, 0.95, 0.04, '#2c3640', { roughness: 0.2, metalness: 0.3 });
          pane.position.set(winX[k], 4.8, 1.07);
          g.add(pane);
        }

        // 巴洛克山牆：簷口線腳 + 弧形山頭 + 圓形勳章飾
        var cornice = C.box(6.0, 0.3, 0.8, P.cream, { roughness: 0.85 });
        cornice.position.set(0, 6.1, 0.7);
        g.add(cornice);
        var gable = C.box(3.0, 1.0, 0.5, P.cream, { roughness: 0.85 });
        gable.position.set(0, 6.75, 0.7);
        g.add(gable);
        var medallion = C.cyl(0.28, 0.28, 0.1, '#c9b68a', 18);
        medallion.rotation.x = Math.PI / 2;
        medallion.position.set(0, 6.78, 1.0);
        g.add(medallion);

        // 山牆商號字（老商行名）
        var houseName = C.textPlane('協泰行', 1.1, { color: '#5b4226', fontSize: 96 });
        houseName.position.set(0, 6.35, 1.12);
        g.add(houseName);

        g.userData = { id: 'red-brick-arcade', name: '紅磚拱廊騎樓段', era: ERA };
        return g;
      }
    }

  ];
})();
