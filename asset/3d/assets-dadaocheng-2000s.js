/*
 * assets-dadaocheng-2000s.js — 大稻埕 2000 年代懷舊街景素材（精選 6 件）
 * 載入順序：three.min.js → assets-core.js → 本檔
 * 涵蓋元素總覽：
 *   1. 霞海城隍廟月老參拜區（紅供桌、籤筒、紅線束、排隊圍欄、喜餅謝神紅紙牆）
 *   2. 年貨大街全盛攤位（零食禮盒堆、電子磅秤、紅白塑膠袋、擴音喇叭）
 *   3. 柑仔店冰櫃門面（黑松沙士 / 麥香紅茶冰櫃、鐵牌、乖乖 / 可樂果零食架）
 *   4. 大稻埕碼頭一角（堤岸、自行車道標線、腳踏車、路燈、碼頭立牌）
 *   5. 文創咖啡店門面（老街屋修復：紅磚 + 木框玻璃門、手寫黑板、暖黃吊燈）
 *   6. 巴洛克山牆街屋立面（紅磚 + 洗石子、曲線山牆、拱窗、老字號店名匾）
 * 設計原則：懷舊感來自「生活」，不放動漫明星；張君雅只以商品包裝文字呈現，不建模角色。
 * 決定性：只用 C.rand(固定 seed)，無 Math.random / Date。
 */
(function () {
  'use strict';

  window.NOSTALGIA_ASSETS = window.NOSTALGIA_ASSETS || {};

  var ERA = 'dadaocheng-2000s';

  function tag(group, id, name) {
    group.userData = { id: id, name: name, era: ERA };
    return group;
  }

  window.NOSTALGIA_ASSETS[ERA] = [

    // ── 1. 霞海城隍廟月老參拜區：紅供桌 + 籤筒 + 紅線束 + 圍欄 + 謝神紅紙牆 ──
    {
      id: 'yuelao-worship-area',
      name: '霞海城隍廟月老參拜區',
      category: 'prop',
      build: function (C) {
        var g = new THREE.Group();
        var rnd = C.rand(1859); // 霞海城隍廟落成年

        // 喜餅謝神紅紙牆（舊牆面 + 紅紙片陣，微亂貼營造香火感）
        var wall = C.box(3.4, 2.4, 0.15, '#6e5544', { roughness: 0.95 });
        wall.position.set(0, 1.2, -1.2);
        g.add(wall);
        for (var i = 0; i < 8; i++) {
          var paper = C.box(0.3, 0.42, 0.02, C.PALETTE.lantern, { roughness: 0.9 });
          paper.position.set(
            -1.3 + (i % 4) * 0.86 + (rnd() - 0.5) * 0.08,
            1.65 - Math.floor(i / 4) * 0.62 + (rnd() - 0.5) * 0.06,
            -1.11
          );
          paper.rotation.z = (rnd() - 0.5) * 0.12;
          g.add(paper);
        }
        var thanks = C.textPlane('喜餅謝神', 1.1, { color: '#ffd23e', fontSize: 72 });
        thanks.position.set(0, 2.15, -1.1);
        g.add(thanks);

        // 紅供桌（金邊收口）
        var table = C.box(2.2, 0.85, 0.9, '#a01818', { roughness: 0.8 });
        table.position.set(0, 0.425, -0.3);
        g.add(table);
        var trim = C.box(2.3, 0.06, 0.98, '#d4a017', { roughness: 0.5, metalness: 0.3 });
        trim.position.set(0, 0.88, -0.3);
        g.add(trim);

        // 籤筒（木筒 + 抽出的籤枝）
        var tube = C.cyl(0.09, 0.08, 0.3, C.PALETTE.woodLight, 10);
        tube.position.set(-0.6, 1.06, -0.3);
        g.add(tube);
        for (var s = 0; s < 3; s++) {
          var stick = C.cyl(0.008, 0.008, 0.3, C.PALETTE.kraft, 6);
          stick.position.set(-0.6 + (rnd() - 0.5) * 0.08, 1.16, -0.3 + (rnd() - 0.5) * 0.08);
          stick.rotation.z = (rnd() - 0.5) * 0.15;
          g.add(stick);
        }

        // 求來的紅線束（細圓柱束，散置桌上）
        for (var r = 0; r < 4; r++) {
          var thread = C.cyl(0.006, 0.006, 0.22, '#e03c31', 6);
          thread.position.set(0.45 + (rnd() - 0.5) * 0.12, 1.0, -0.3 + (rnd() - 0.5) * 0.12);
          thread.rotation.x = (rnd() - 0.5) * 0.4;
          thread.rotation.z = (rnd() - 0.5) * 0.4;
          g.add(thread);
        }

        // 排隊圍欄柱（日韓觀光客排隊動線：兩柱 + 紅絨繩）
        var postL = C.cyl(0.03, 0.05, 0.95, C.PALETTE.steel, 10);
        postL.position.set(-1.3, 0.475, 0.9);
        g.add(postL);
        var postR = C.cyl(0.03, 0.05, 0.95, C.PALETTE.steel, 10);
        postR.position.set(1.3, 0.475, 0.9);
        g.add(postR);
        var rope = C.cyl(0.02, 0.02, 2.6, '#8f1d1d', 8);
        rope.rotation.z = Math.PI / 2;
        rope.position.set(0, 0.82, 0.9);
        g.add(rope);

        // 「月老」直式立牌
        var sign = C.verticalSign('月老', { h: 1.6, w: 0.42, bg: C.PALETTE.signRed, fg: '#ffd23e' });
        sign.position.set(-1.7, 0, -0.3);
        g.add(sign);

        return tag(g, 'yuelao-worship-area', '霞海城隍廟月老參拜區');
      }
    },

    // ── 2. 年貨大街全盛攤位：攤台 + 紅白雨棚 + 張君雅禮盒堆 + 電子磅秤 + 塑膠袋掛串 + 擴音喇叭 ──
    {
      id: 'new-year-market-stall',
      name: '年貨大街攤位',
      category: 'storefront',
      build: function (C) {
        var g = new THREE.Group();
        var rnd = C.rand(2006);

        // 木攤台
        var table = C.box(3.0, 0.8, 1.2, C.PALETTE.woodLight, { roughness: 0.9 });
        table.position.set(0, 0.4, 0);
        g.add(table);

        // 兩側支架 + 紅白條紋雨棚
        var poleL = C.cyl(0.03, 0.03, 2.3, C.PALETTE.steel, 8);
        poleL.position.set(-1.45, 1.15, -0.55);
        g.add(poleL);
        var poleR = C.cyl(0.03, 0.03, 2.3, C.PALETTE.steel, 8);
        poleR.position.set(1.45, 1.15, -0.55);
        g.add(poleR);
        var canopy = C.awning(3.2, 1.5, C.PALETTE.signRed, C.PALETTE.white);
        canopy.position.set(0, 2.3, -0.6);
        g.add(canopy);

        // 零食禮盒堆（紅黃紙盒兩層，張君雅只以包裝文字呈現）
        var boxColors = [C.PALETTE.signRed, C.PALETTE.neonYellow, C.PALETTE.signRed,
                         C.PALETTE.neonYellow, C.PALETTE.signRed, C.PALETTE.neonYellow];
        for (var i = 0; i < 6; i++) {
          var giftBox = C.box(0.4, 0.26, 0.3, boxColors[i], { roughness: 0.95 });
          var layer = Math.floor(i / 3);
          giftBox.position.set(
            -0.9 + (i % 3) * 0.5 + (rnd() - 0.5) * 0.05,
            0.8 + 0.13 + layer * 0.27,
            -0.15 + (rnd() - 0.5) * 0.06
          );
          giftBox.rotation.y = (rnd() - 0.5) * 0.2;
          g.add(giftBox);
        }
        var giftLabel = C.textPlane('張君雅小妹妹 零食禮盒', 1.3, { color: C.PALETTE.white, fontSize: 64, bg: C.PALETTE.signRed });
        giftLabel.position.set(-0.65, 1.0, 0.12);
        g.add(giftLabel);

        // 電子磅秤（取代老磅秤：白殼 + 綠色數字顯示）
        var scale = C.box(0.34, 0.12, 0.3, '#dfe4e8', { roughness: 0.6 });
        scale.position.set(1.1, 0.86, 0.25);
        g.add(scale);
        var disp = C.box(0.16, 0.05, 0.02, '#0a1a0a', { emissive: '#2fe08a', emissiveIntensity: 0.8, roughness: 0.3 });
        disp.position.set(1.1, 0.9, 0.41);
        g.add(disp);

        // 紅白塑膠袋掛串（前緣橫桿 + 一排薄袋）
        var bagBar = C.cyl(0.015, 0.015, 2.8, C.PALETTE.steel, 8);
        bagBar.rotation.z = Math.PI / 2;
        bagBar.position.set(0, 1.86, 0.85);
        g.add(bagBar);
        for (var b = 0; b < 5; b++) {
          var bag = C.box(0.16, 0.24, 0.02, b % 2 === 0 ? '#e03c31' : C.PALETTE.white, { roughness: 0.95 });
          bag.position.set(-1.0 + b * 0.5, 1.7, 0.85);
          bag.rotation.y = (rnd() - 0.5) * 0.3;
          g.add(bag);
        }

        // 擴音喇叭（循環播放賀歲歌，開口朝街）
        var horn = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.3, 10),
          C.mat(C.PALETTE.steel, { metalness: 0.6, roughness: 0.35 })
        );
        horn.rotation.x = -Math.PI / 2;
        horn.position.set(-1.45, 2.45, -0.5);
        g.add(horn);

        // 攤位招牌
        var fascia = C.box(3.2, 0.5, 0.08, '#7a1010', { roughness: 0.85 });
        fascia.position.set(0, 2.75, -0.55);
        g.add(fascia);
        var fasciaText = C.textPlane('迪化街 年貨大街', 2.4, { color: '#ffd23e', fontSize: 80 });
        fasciaText.position.set(0, 2.75, -0.5);
        g.add(fasciaText);

        return tag(g, 'new-year-market-stall', '年貨大街攤位');
      }
    },

    // ── 3. 柑仔店冰櫃門面：老店面 + 立式玻璃冰櫃（沙士 / 麥香）+ 黑松鐵牌 + 零食架 ──
    {
      id: 'kamatiam-cooler-storefront',
      name: '柑仔店冰櫃門面',
      category: 'storefront',
      build: function (C) {
        var g = new THREE.Group();
        var rnd = C.rand(1999);

        // 店面主體（舊奶油色牆面）
        var shell = C.box(4.6, 3.2, 2.4, '#d8cbb0', { roughness: 0.95 });
        shell.position.set(0, 1.6, -1.2);
        g.add(shell);

        // 手寫感招牌（綠底奶油字）
        var fascia = C.box(4.6, 0.6, 0.12, C.PALETTE.signGreen, { roughness: 0.85 });
        fascia.position.set(0, 2.8, 0.06);
        g.add(fascia);
        var name = C.textPlane('金泉柑仔店', 2.4, { color: C.PALETTE.cream, fontSize: 88 });
        name.position.set(0, 2.8, 0.14);
        g.add(name);

        // 立式玻璃冰櫃（半透明門片，透出瓶罐）
        var cooler = C.box(0.95, 1.9, 0.7, '#e8e8e4', { roughness: 0.6 });
        cooler.position.set(-1.3, 0.95, 0.4);
        g.add(cooler);
        var coolGlass = C.box(0.75, 1.5, 0.04, '#9fc4d8', { roughness: 0.2, metalness: 0.3 });
        coolGlass.material.transparent = true;
        coolGlass.material.opacity = 0.35;
        coolGlass.position.set(-1.3, 1.05, 0.78);
        g.add(coolGlass);
        // 上層：黑松沙士深褐玻璃瓶
        for (var i = 0; i < 3; i++) {
          var bottle = C.cyl(0.045, 0.045, 0.24, '#2e1a0e', 8);
          bottle.position.set(-1.5 + i * 0.2, 1.45, 0.62);
          g.add(bottle);
        }
        // 下層：麥香紅茶鋁箔包
        for (var p = 0; p < 3; p++) {
          var pack = C.box(0.09, 0.13, 0.06, '#c9a24a', { roughness: 0.8 });
          pack.position.set(-1.5 + p * 0.2, 0.95, 0.62);
          pack.rotation.y = (rnd() - 0.5) * 0.2;
          g.add(pack);
        }

        // 「黑松沙士」鐵牌（牆上釘的琺瑯感鐵牌）
        var tin = C.box(0.5, 0.75, 0.04, '#0d3d2e', { roughness: 0.5, metalness: 0.3 });
        tin.position.set(1.9, 1.9, 0.05);
        g.add(tin);
        var tinText = C.textPlane('黑松沙士', 0.2, { vertical: true, color: C.PALETTE.white, fontSize: 72 });
        tinText.position.set(1.9, 1.9, 0.08);
        g.add(tinText);

        // 乖乖 / 可樂果零食架（木架 + 一排零食袋）
        var rack = C.box(1.2, 1.5, 0.4, C.PALETTE.woodLight, { roughness: 0.9 });
        rack.position.set(1.0, 0.75, 0.4);
        g.add(rack);
        for (var s = 0; s < 4; s++) {
          var snack = C.box(0.18, 0.24, 0.08, s % 2 === 0 ? '#1f7a33' : '#c8351f', { roughness: 0.9 });
          snack.position.set(0.62 + s * 0.26, 1.28, 0.62);
          snack.rotation.y = (rnd() - 0.5) * 0.25;
          g.add(snack);
        }
        var snackLabel = C.textPlane('乖乖 · 可樂果', 0.9, { color: '#1a1a1a', fontSize: 56, bg: '#ffd23e' });
        snackLabel.position.set(1.0, 1.62, 0.62);
        g.add(snackLabel);

        return tag(g, 'kamatiam-cooler-storefront', '柑仔店冰櫃門面');
      }
    },

    // ── 4. 大稻埕碼頭一角：堤岸 + 自行車道標線 + 腳踏車 + 路燈 + 碼頭立牌 ──
    {
      id: 'dadaocheng-wharf-corner',
      name: '大稻埕碼頭一角',
      category: 'prop',
      build: function (C) {
        var g = new THREE.Group();
        var rnd = C.rand(2005); // 煙火節起始年

        // 水泥鋪面
        var ground = C.box(6, 0.08, 3, C.PALETTE.concrete, { roughness: 0.95 });
        ground.position.set(0, 0.04, 0);
        g.add(ground);

        // 自行車道（暗紅鋪面 + 白色虛線標線）
        var lane = C.box(6, 0.02, 1.4, '#7a3b30', { roughness: 0.95 });
        lane.position.set(0, 0.09, 0.5);
        g.add(lane);
        for (var d = 0; d < 4; d++) {
          var dash = C.box(0.6, 0.012, 0.08, C.PALETTE.white, { roughness: 0.9 });
          dash.position.set(-2.2 + d * 1.5, 0.105, 0.5);
          g.add(dash);
        }

        // 堤岸段（淡水河側矮牆）
        var levee = C.box(6, 0.9, 0.45, '#b0aca0', { roughness: 0.9 });
        levee.position.set(0, 0.53, -1.25);
        g.add(levee);

        // 一台腳踏車（沿 x 向停放）
        var wheelF = C.cyl(0.3, 0.3, 0.035, '#222222', 14);
        wheelF.rotation.x = Math.PI / 2;
        wheelF.position.set(-1.05, 0.38, 0.5);
        g.add(wheelF);
        var wheelR = C.cyl(0.3, 0.3, 0.035, '#222222', 14);
        wheelR.rotation.x = Math.PI / 2;
        wheelR.position.set(-0.05, 0.38, 0.5);
        g.add(wheelR);
        var frame = C.box(0.95, 0.05, 0.05, '#2b5f8a', { roughness: 0.5, metalness: 0.3 });
        frame.rotation.z = 0.22;
        frame.position.set(-0.55, 0.55, 0.5);
        g.add(frame);
        var seatPost = C.cyl(0.02, 0.02, 0.35, C.PALETTE.steel, 8);
        seatPost.position.set(-0.15, 0.75, 0.5);
        g.add(seatPost);
        var seat = C.box(0.22, 0.05, 0.1, '#1a1a1a', { roughness: 0.8 });
        seat.position.set(-0.15, 0.94, 0.5);
        g.add(seat);
        var handlePost = C.cyl(0.02, 0.02, 0.4, C.PALETTE.steel, 8);
        handlePost.position.set(-0.95, 0.8, 0.5);
        g.add(handlePost);
        var handleBar = C.cyl(0.015, 0.015, 0.36, C.PALETTE.steel, 8);
        handleBar.rotation.x = Math.PI / 2;
        handleBar.position.set(-0.95, 1.0, 0.5);
        g.add(handleBar);

        // 路燈（傍晚看夕陽的暖光）
        var pole = C.cyl(0.05, 0.07, 3.6, C.PALETTE.steel, 10);
        pole.position.set(-2.3, 1.8, -0.9);
        g.add(pole);
        var arm = C.cyl(0.03, 0.03, 0.7, C.PALETTE.steel, 8);
        arm.rotation.x = Math.PI / 2;
        arm.position.set(-2.3, 3.55, -0.55);
        g.add(arm);
        var lampHead = C.box(0.3, 0.12, 0.45, '#ffd9a0', { emissive: '#ffbf66', emissiveIntensity: 0.7, roughness: 0.4 });
        lampHead.position.set(-2.3, 3.5, -0.2);
        g.add(lampHead);

        // 「大稻埕碼頭」立牌
        var signPostL = C.cyl(0.04, 0.04, 1.5, C.PALETTE.woodDark, 8);
        signPostL.position.set(1.7, 0.75, -0.6);
        g.add(signPostL);
        var signPostR = C.cyl(0.04, 0.04, 1.5, C.PALETTE.woodDark, 8);
        signPostR.position.set(2.8, 0.75, -0.6);
        g.add(signPostR);
        var signBoard = C.box(1.5, 0.7, 0.08, C.PALETTE.woodLight, { roughness: 0.9 });
        signBoard.position.set(2.25, 1.35, -0.6);
        signBoard.rotation.z = (rnd() - 0.5) * 0.04; // 木牌微傾，避免過度工整
        g.add(signBoard);
        var signText = C.textPlane('大稻埕碼頭', 1.25, { color: '#2e2416', fontSize: 80 });
        signText.position.set(2.25, 1.35, -0.55);
        g.add(signText);

        return tag(g, 'dadaocheng-wharf-corner', '大稻埕碼頭一角');
      }
    },

    // ── 5. 文創咖啡店門面：修復老街屋一樓（紅磚 + 木框玻璃門）+ 黑板立牌 + 暖黃吊燈 ──
    {
      id: 'creative-cafe-storefront',
      name: '文創咖啡店門面',
      category: 'storefront',
      build: function (C) {
        var g = new THREE.Group();

        // 紅磚立面（修復後的老街屋一樓）
        var wall = C.box(4.2, 3.4, 0.5, '#8f3a2c', { roughness: 0.95 });
        wall.position.set(0, 1.7, -0.25);
        g.add(wall);
        // 洗石子牆基
        var base = C.box(4.2, 0.5, 0.55, C.PALETTE.concrete, { roughness: 0.9 });
        base.position.set(0, 0.25, -0.25);
        g.add(base);

        // 木框玻璃門
        var doorFrame = C.box(1.2, 2.3, 0.12, C.PALETTE.woodDark, { roughness: 0.8 });
        doorFrame.position.set(-0.8, 1.15, 0.04);
        g.add(doorFrame);
        var doorGlass = C.box(0.9, 1.9, 0.06, '#b8d4d0', { roughness: 0.2, metalness: 0.2 });
        doorGlass.position.set(-0.8, 1.2, 0.09);
        g.add(doorGlass);

        // 木框窗
        var winFrame = C.box(1.4, 1.3, 0.12, C.PALETTE.woodDark, { roughness: 0.8 });
        winFrame.position.set(1.0, 1.6, 0.04);
        g.add(winFrame);
        var winGlass = C.box(1.15, 1.05, 0.06, '#b8d4d0', { roughness: 0.2, metalness: 0.2 });
        winGlass.position.set(1.0, 1.6, 0.09);
        g.add(winGlass);

        // 手寫黑板 A 字立牌「咖啡」
        var boardF = C.box(0.5, 0.75, 0.03, '#1f2420', { roughness: 0.95 });
        boardF.rotation.x = -0.18;
        boardF.position.set(0.35, 0.38, 0.9);
        g.add(boardF);
        var boardB = C.box(0.5, 0.75, 0.03, '#1f2420', { roughness: 0.95 });
        boardB.rotation.x = 0.18;
        boardB.position.set(0.35, 0.38, 1.03);
        g.add(boardB);
        var chalk = C.textPlane('咖啡', 0.26, { vertical: true, color: '#f4f4f0', fontSize: 80 });
        chalk.rotation.x = -0.18;
        chalk.position.set(0.35, 0.42, 0.925);
        g.add(chalk);

        // 暖黃吊燈 x2（新舊並存的暖光）
        var lampX = [-0.8, 1.0];
        for (var i = 0; i < 2; i++) {
          var wire = C.cyl(0.008, 0.008, 0.5, '#1a1a1a', 6);
          wire.position.set(lampX[i], 2.85, 0.42);
          g.add(wire);
          var shade = C.cyl(0.03, 0.13, 0.15, '#c9862b', 10);
          shade.position.set(lampX[i], 2.55, 0.42);
          g.add(shade);
          var bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            C.mat('#ffcf7a', { emissive: '#ffbf66', emissiveIntensity: 0.9, roughness: 0.3 })
          );
          bulb.position.set(lampX[i], 2.46, 0.42);
          g.add(bulb);
        }

        // 小木匾店招
        var plank = C.box(1.7, 0.42, 0.08, C.PALETTE.woodLight, { roughness: 0.9 });
        plank.position.set(0, 3.05, 0.06);
        g.add(plank);
        var plankText = C.textPlane('好日子 咖啡', 1.3, { color: C.PALETTE.cream, fontSize: 72 });
        plankText.position.set(0, 3.05, 0.11);
        g.add(plankText);

        return tag(g, 'creative-cafe-storefront', '文創咖啡店門面');
      }
    },

    // ── 6. 巴洛克山牆街屋立面：紅磚一樓 + 洗石子二樓 + 拱窗 + 曲線山牆（堆疊箱體）+ 店名匾 ──
    {
      id: 'baroque-gable-townhouse',
      name: '巴洛克山牆街屋立面',
      category: 'building',
      build: function (C) {
        var g = new THREE.Group();

        // 一樓紅磚立面
        var lower = C.box(5, 3.2, 0.7, '#8f3a2c', { roughness: 0.95 });
        lower.position.set(0, 1.6, -0.35);
        g.add(lower);
        // 一樓木店門
        var door = C.box(1.8, 2.4, 0.1, C.PALETTE.woodDark, { roughness: 0.85 });
        door.position.set(0, 1.2, 0.02);
        g.add(door);

        // 樓層間洗石子飾帶 + 老字號店名匾
        var band = C.box(5.2, 0.35, 0.8, C.PALETTE.cream, { roughness: 0.9 });
        band.position.set(0, 3.375, -0.35);
        g.add(band);
        var plaque = C.box(2.2, 0.6, 0.1, '#153a2e', { roughness: 0.7 });
        plaque.position.set(0, 3.375, 0.1);
        g.add(plaque);
        var plaqueText = C.textPlane('錦泰行 南北貨', 1.8, { color: '#ffd23e', fontSize: 80 });
        plaqueText.position.set(0, 3.375, 0.16);
        g.add(plaqueText);

        // 二樓洗石子立面
        var upper = C.box(5, 2.8, 0.7, '#b9b2a2', { roughness: 0.9 });
        upper.position.set(0, 4.95, -0.35);
        g.add(upper);

        // 拱窗 x2（方框 + 半圓拱頂：橫放圓柱近似）
        var winX = [-1.2, 1.2];
        for (var i = 0; i < 2; i++) {
          var wFrame = C.box(0.9, 1.3, 0.15, C.PALETTE.cream, { roughness: 0.85 });
          wFrame.position.set(winX[i], 4.8, 0.02);
          g.add(wFrame);
          var wGlass = C.box(0.7, 1.1, 0.1, '#31424e', { roughness: 0.3, metalness: 0.2 });
          wGlass.position.set(winX[i], 4.8, 0.06);
          g.add(wGlass);
          var arch = C.cyl(0.45, 0.45, 0.15, C.PALETTE.cream, 12);
          arch.rotation.x = Math.PI / 2;
          arch.position.set(winX[i], 5.45, 0.02);
          g.add(arch);
        }

        // 頂部簷口飾帶
        var cornice = C.box(5.4, 0.3, 0.85, C.PALETTE.cream, { roughness: 0.9 });
        cornice.position.set(0, 6.5, -0.35);
        g.add(cornice);

        // 曲線山牆（堆疊箱體逐層內縮近似）+ 中央圓形浮雕
        var p1 = C.box(4.2, 0.7, 0.6, '#b9b2a2', { roughness: 0.9 });
        p1.position.set(0, 7.0, -0.35);
        g.add(p1);
        var p2 = C.box(3.0, 0.6, 0.55, '#b9b2a2', { roughness: 0.9 });
        p2.position.set(0, 7.65, -0.35);
        g.add(p2);
        var p3 = C.box(1.8, 0.55, 0.5, C.PALETTE.cream, { roughness: 0.9 });
        p3.position.set(0, 8.2, -0.35);
        g.add(p3);
        var medallion = C.cyl(0.32, 0.32, 0.12, C.PALETTE.cream, 16);
        medallion.rotation.x = Math.PI / 2;
        medallion.position.set(0, 7.15, -0.02);
        g.add(medallion);

        return tag(g, 'baroque-gable-townhouse', '巴洛克山牆街屋立面');
      }
    }
  ];
})();
