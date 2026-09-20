/*
 * assets-ximen-2000s.js — 西門町 2000 年代懷舊街景素材（精選 6 件）
 * 載入順序：three.min.js → assets-core.js → 本檔
 * 涵蓋元素總覽：
 *   1. 西門紅樓八角樓（2002 整修重啟，簡化紅磚量體）
 *   2. 簽唱會舞台（周杰倫《Jay》/ S.H.E 背板，文字海報化）
 *   3. 網咖門面（藍光招牌 + 螢幕排，天堂 / RO）
 *   4. 張君雅零食貨架（維力手打麵紅黃配色紙箱堆）
 *   5. Nokia / Sony Ericsson 手機行櫥窗
 *   6. F4 海報牆（流星花園，海報化呈現）
 * 版權紅線：藝人 / 角色一律以海報、看板文字 + 抽象色塊呈現，不建模長相。
 * 決定性：只用 C.rand(固定 seed)，無 Math.random / Date。
 */
(function () {
  'use strict';

  window.NOSTALGIA_ASSETS = window.NOSTALGIA_ASSETS || {};

  var ERA = 'ximen-2000s';

  function tag(group, id, name) {
    group.userData = { id: id, name: name, era: ERA };
    return group;
  }

  window.NOSTALGIA_ASSETS[ERA] = [

    // ── 1. 西門紅樓：八角樓紅磚量體 + 灰瓦頂 + 入口 ──────────────
    {
      id: 'red-house',
      name: '西門紅樓',
      category: 'building',
      build: function (C) {
        var g = new THREE.Group();

        // 八角紅磚主體（8 邊圓柱近似八角樓）
        var body = C.cyl(4.2, 4.2, 7.5, '#8f3a2c', 8);
        body.position.y = 3.75;
        g.add(body);

        // 白色橫飾帶（紅磚間的洗石子線條）
        var band = C.cyl(4.28, 4.28, 0.35, C.PALETTE.cream, 8);
        band.position.y = 4.6;
        g.add(band);

        // 八角灰瓦屋頂
        var roof = new THREE.Mesh(
          new THREE.ConeGeometry(4.8, 2.6, 8),
          C.mat('#4a4f55', { roughness: 0.9 })
        );
        roof.position.y = 7.5 + 1.3;
        g.add(roof);

        // 頂端小尖飾
        var finial = C.cyl(0.06, 0.12, 0.9, C.PALETTE.steel, 8);
        finial.position.y = 7.5 + 2.6 + 0.45;
        g.add(finial);

        // 入口門廊（面向 +Z）
        var porch = C.box(2.6, 3.2, 0.6, '#7c3226', { roughness: 0.9 });
        porch.position.set(0, 1.6, 4.0);
        g.add(porch);
        var door = C.box(1.4, 2.4, 0.1, C.PALETTE.woodDark);
        door.position.set(0, 1.2, 4.32);
        g.add(door);

        // 拱窗（正面兩扇，奶油色框 + 深色玻璃）
        var winL = C.box(0.9, 1.6, 0.12, C.PALETTE.cream);
        winL.position.set(-2.4, 4.0, 3.35);
        winL.rotation.y = -0.39;
        g.add(winL);
        var winR = C.box(0.9, 1.6, 0.12, C.PALETTE.cream);
        winR.position.set(2.4, 4.0, 3.35);
        winR.rotation.y = 0.39;
        g.add(winR);

        // 名牌
        var plate = C.textPlane('西門紅樓', 2.2, { color: '#f4f4f0', fontSize: 96 });
        plate.position.set(0, 3.6, 4.05);
        g.add(plate);

        return tag(g, 'red-house', '西門紅樓');
      }
    },

    // ── 2. 簽唱會舞台：台座 + 大背板（周杰倫《Jay》/ S.H.E 文字）+ 音箱 ──
    {
      id: 'concert-stage',
      name: '簽唱會舞台',
      category: 'stage',
      build: function (C) {
        var g = new THREE.Group();

        // 舞台台座
        var deck = C.box(8, 0.8, 4, C.PALETTE.black, { roughness: 0.7 });
        deck.position.set(0, 0.4, 0);
        g.add(deck);

        // 大背板（深藍底，面向 +Z 觀眾）
        var back = C.box(8, 4.2, 0.2, '#101a3a', { roughness: 0.6 });
        back.position.set(0, 0.8 + 2.1, -1.7);
        g.add(back);

        // 背板主視覺：專輯名 + 藝人名（純文字，版權安全）
        var title = C.textPlane('JAY 周杰倫', 4.6, { color: C.PALETTE.neonBlue, fontSize: 128 });
        title.position.set(0, 3.6, -1.58);
        g.add(title);
        var sub = C.textPlane('新專輯簽唱會', 3.2, { color: C.PALETTE.white, fontSize: 72 });
        sub.position.set(0, 2.6, -1.58);
        g.add(sub);
        var sub2 = C.textPlane('S.H.E 壓軸登場', 2.6, { color: C.PALETTE.neonPink, fontSize: 64 });
        sub2.position.set(0, 1.8, -1.58);
        g.add(sub2);

        // 左右音箱堆
        var spkL = C.box(0.9, 1.8, 0.9, '#222222', { roughness: 0.85 });
        spkL.position.set(-3.9, 0.8 + 0.9, 1.2);
        g.add(spkL);
        var spkR = C.box(0.9, 1.8, 0.9, '#222222', { roughness: 0.85 });
        spkR.position.set(3.9, 0.8 + 0.9, 1.2);
        g.add(spkR);

        // 立麥（桿 + 頭）
        var micStand = C.cyl(0.02, 0.02, 1.5, C.PALETTE.steel, 8);
        micStand.position.set(0, 0.8 + 0.75, 1.4);
        g.add(micStand);
        var micHead = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 8, 8),
          C.mat(C.PALETTE.black, { roughness: 0.5 })
        );
        micHead.position.set(0, 0.8 + 1.55, 1.4);
        g.add(micHead);

        return tag(g, 'concert-stage', '簽唱會舞台');
      }
    },

    // ── 3. 網咖門面：深色店面 + 藍光霓虹招牌 + 玻璃內螢幕排 ──────
    {
      id: 'internet-cafe',
      name: '網咖門面',
      category: 'storefront',
      build: function (C) {
        var g = new THREE.Group();
        var rnd = C.rand(2003);

        // 店面主體
        var shell = C.box(6, 3.6, 3, '#20242c', { roughness: 0.8 });
        shell.position.set(0, 1.8, -1.5);
        g.add(shell);

        // 玻璃櫥窗（深藍微光，透出網咖藍光感）
        var glass = C.box(5.2, 2.2, 0.08, '#0a1e33', {
          roughness: 0.2, metalness: 0.3, emissive: '#0d3a5c', emissiveIntensity: 0.35
        });
        glass.position.set(0, 1.4, 0.02);
        g.add(glass);

        // 藍光霓虹招牌
        var sign = C.neonText('24H 網咖', { w: 3.6, color: C.PALETTE.neonBlue });
        sign.position.set(0, 2.9, 0.15);
        g.add(sign);

        // 側掛直式招牌（天堂 / RO 年代感）
        var side = C.verticalSign('線上遊戲', {
          h: 2.0, w: 0.5, bg: '#0d2b4e', fg: '#3ec6ff', lit: true
        });
        side.position.set(3.2, 1.2, 0.3);
        g.add(side);

        // 櫥窗內螢幕排（一排 4 台 CRT，螢幕亮藍綠色，位置微隨機）
        for (var i = 0; i < 4; i++) {
          var mon = C.box(0.5, 0.45, 0.45, '#d8d4c8', { roughness: 0.9 });
          mon.position.set(-1.9 + i * 1.25, 1.0 + rnd() * 0.03, -0.5);
          g.add(mon);
          var scr = C.box(0.36, 0.3, 0.02, '#0f3f2e', {
            emissive: '#2fe08a', emissiveIntensity: 0.7, roughness: 0.3
          });
          scr.position.set(-1.9 + i * 1.25, 1.02, -0.26);
          g.add(scr);
        }

        return tag(g, 'internet-cafe', '網咖門面');
      }
    },

    // ── 4. 張君雅零食貨架：金屬貨架 + 維力紅黃配色紙箱堆 + 看板文字 ──
    {
      id: 'zhangjunya-snack-shelf',
      name: '張君雅零食貨架',
      category: 'prop',
      build: function (C) {
        var g = new THREE.Group();
        var rnd = C.rand(2005);

        // 貨架框（背板 + 三層板）
        var backboard = C.box(2.0, 2.0, 0.05, C.PALETTE.steel, { roughness: 0.6, metalness: 0.4 });
        backboard.position.set(0, 1.0, -0.25);
        g.add(backboard);
        for (var s = 0; s < 3; s++) {
          var shelf = C.box(2.0, 0.04, 0.5, C.PALETTE.steel, { roughness: 0.6, metalness: 0.4 });
          shelf.position.set(0, 0.45 + s * 0.6, 0);
          g.add(shelf);
        }

        // 紙箱堆（維力手打麵紅黃配色，位置角度微隨機）
        var colors = [C.PALETTE.signRed, C.PALETTE.neonYellow, C.PALETTE.signRed,
                      C.PALETTE.neonYellow, C.PALETTE.signRed, C.PALETTE.kraft];
        for (var i = 0; i < 6; i++) {
          var boxMesh = C.box(0.42, 0.28, 0.32, colors[i], { roughness: 0.95 });
          var layer = Math.floor(i / 3);
          boxMesh.position.set(
            -0.65 + (i % 3) * 0.65 + (rnd() - 0.5) * 0.06,
            0.47 + 0.14 + layer * 0.6,
            (rnd() - 0.5) * 0.08
          );
          boxMesh.rotation.y = (rnd() - 0.5) * 0.25;
          g.add(boxMesh);
        }

        // 頂部商品看板（文字呈現角色名，不建模長相）
        var board = C.box(1.8, 0.45, 0.05, C.PALETTE.neonYellow, { roughness: 0.9 });
        board.position.set(0, 2.25, 0);
        g.add(board);
        var label = C.textPlane('張君雅小妹妹 手打麵', 1.6, { color: C.PALETTE.signRed, fontSize: 72 });
        label.position.set(0, 2.25, 0.04);
        g.add(label);

        return tag(g, 'zhangjunya-snack-shelf', '張君雅零食貨架');
      }
    },

    // ── 5. 手機行櫥窗：櫥窗量體 + Nokia / Sony Ericsson 招牌 + 展示台小手機 ──
    {
      id: 'phone-shop-window',
      name: '手機行櫥窗',
      category: 'storefront',
      build: function (C) {
        var g = new THREE.Group();
        var rnd = C.rand(2004);

        // 店面量體
        var shell = C.box(4.5, 3.2, 2, C.PALETTE.white, { roughness: 0.8 });
        shell.position.set(0, 1.6, -1);
        g.add(shell);

        // 櫥窗玻璃
        var glass = C.box(3.8, 1.8, 0.06, '#bfd8e6', {
          roughness: 0.15, metalness: 0.3
        });
        glass.position.set(0, 1.3, 0.02);
        g.add(glass);

        // 招牌橫幅（藍底白字，Nokia 藍配色暗示）
        var fascia = C.box(4.5, 0.7, 0.15, '#0b3f8a', { roughness: 0.6 });
        fascia.position.set(0, 2.85, 0.1);
        g.add(fascia);
        var brand = C.textPlane('NOKIA · Sony Ericsson', 3.6, { color: C.PALETTE.white, fontSize: 72 });
        brand.position.set(0, 2.85, 0.19);
        g.add(brand);

        // 展示台 + 一排直立小手機（糖果機時代的小長方體）
        var podium = C.box(3.4, 0.5, 0.6, '#dfe4e8', { roughness: 0.9 });
        podium.position.set(0, 0.55, -0.4);
        g.add(podium);
        var phoneColors = ['#2b2f36', '#7a1020', '#c8cdd4', '#123a6e', '#2b2f36'];
        for (var i = 0; i < 5; i++) {
          var phone = C.box(0.1, 0.24, 0.04, phoneColors[i], { roughness: 0.4, metalness: 0.2 });
          phone.position.set(-1.3 + i * 0.65, 0.8 + 0.12, -0.4 + (rnd() - 0.5) * 0.05);
          phone.rotation.y = (rnd() - 0.5) * 0.3;
          g.add(phone);
        }

        // 促銷立牌
        var promo = C.textPlane('照相手機 上市', 1.2, { color: '#0b3f8a', fontSize: 64, bg: '#f4f4f0' });
        promo.position.set(1.4, 1.0, 0.1);
        g.add(promo);

        return tag(g, 'phone-shop-window', '手機行櫥窗');
      }
    },

    // ── 6. F4 海報牆：磚牆面貼滿唱片行海報（流星花園年代，海報化呈現） ──
    {
      id: 'f4-poster-wall',
      name: 'F4 海報牆',
      category: 'poster',
      build: function (C) {
        var g = new THREE.Group();
        var rnd = C.rand(2001);

        // 磚牆底
        var wall = C.box(5, 3.4, 0.25, '#8a6f5f', { roughness: 0.95 });
        wall.position.set(0, 1.7, -0.13);
        g.add(wall);

        // 主海報：F4 流星花園（文字 + 色塊，不建模長相）
        var main = C.poster('F4', {
          w: 1.1, h: 1.6, bg: '#1c2b4a', fg: '#f4f4f0', frame: '#0e1626',
          subtitle: '流星花園'
        });
        main.position.set(-1.4, 0.9, 0.06);
        main.rotation.z = (rnd() - 0.5) * 0.04;
        g.add(main);

        // 副海報群：同年代偶像（純文字海報，微傾斜營造貼滿感）
        var names = [
          { t: '蔡依林', bg: '#5a1030', x: 0.1, y: 1.5 },
          { t: '孫燕姿', bg: '#0d4a3e', x: 1.5, y: 1.6 },
          { t: '5566', bg: '#7a4a10', x: 0.2, y: 0.15 },
          { t: '王心凌', bg: '#8a2a5a', x: 1.6, y: 0.1 }
        ];
        for (var i = 0; i < names.length; i++) {
          var p = C.poster(names[i].t, {
            w: 0.7, h: 1.0, bg: names[i].bg, fg: '#f4f4f0', frame: '#101010'
          });
          p.position.set(names[i].x, names[i].y, 0.06);
          p.rotation.z = (rnd() - 0.5) * 0.12;
          g.add(p);
        }

        // 唱片行小字條
        var strip = C.textPlane('唱片行 新片到貨', 1.6, { color: '#1a1a1a', fontSize: 56, bg: '#ffd23e' });
        strip.position.set(-1.4, 2.9, 0.05);
        strip.rotation.z = 0.03;
        g.add(strip);

        return tag(g, 'f4-poster-wall', 'F4 海報牆');
      }
    }
  ];
})();
