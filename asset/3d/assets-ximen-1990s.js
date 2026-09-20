/*
 * assets-ximen-1990s.js — 台北西門町 1990 年代懷舊街景素材
 * 載入順序：three.min.js → assets-core.js → 本檔
 * 涵蓋元素（精選 6 件，一眼辨識年代）：
 *   1. 淘兒音樂城黃色門面（張惠妹/伍佰海報）
 *   2. 投幣式電玩機台（快打旋風配色）
 *   3. 漫畫出租店立面（灌籃高手直式書背）
 *   4. 皮卡丘配色扭蛋機（1998 後）
 *   5. BB Call + 大哥大廣告立牌
 *   6. 拍貼機（大頭貼）
 * 版權紅線：角色與藝人一律海報化（文字 + 抽象色塊），不建模長相。
 * 決定性：一律使用 C.rand(固定 seed)，不用 Math.random / Date。
 */
(function () {
  'use strict';

  var ERA = 'ximen-1990s';

  window.NOSTALGIA_ASSETS = window.NOSTALGIA_ASSETS || {};

  window.NOSTALGIA_ASSETS[ERA] = [

    // ── 淘兒音樂城：黃底紅字門面，玻璃櫥窗貼張惠妹/伍佰專輯海報 ──
    {
      id: 'tower-records',
      name: '淘兒音樂城',
      category: 'storefront',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;

        // 主體立面（兩層樓）
        var body = C.box(6, 6, 0.6, P.concrete);
        body.position.set(0, 3, -0.3);
        g.add(body);

        // 招牌帶：淘兒標誌性黃底
        var band = C.box(6.2, 1.4, 0.25, P.neonYellow, {
          emissive: P.neonYellow, emissiveIntensity: 0.25, roughness: 0.5
        });
        band.position.set(0, 4.6, 0.1);
        g.add(band);

        // 招牌紅字（黃底紅字是淘兒經典配色）
        var title = C.textPlane('淘兒音樂城 TOWER', 5.2, { color: P.signRed, fontSize: 128 });
        title.position.set(0, 4.6, 0.24);
        g.add(title);

        // 一樓玻璃櫥窗
        var glass = C.box(5.2, 2.4, 0.05, '#28323c', { roughness: 0.15, metalness: 0.4 });
        glass.position.set(0, 1.3, 0.02);
        g.add(glass);

        // 櫥窗海報：張惠妹《姊妹》、伍佰（文字海報化，不建模長相）
        var pAmei = C.poster('張惠妹', { w: 0.9, h: 1.3, bg: P.black, fg: P.neonPink, frame: P.steel, subtitle: '姊妹' });
        pAmei.position.set(-1.6, 0.35, 0.15);
        g.add(pAmei);
        var pWubai = C.poster('伍佰', { w: 0.9, h: 1.3, bg: '#20242c', fg: P.neonBlue, frame: P.steel, subtitle: '浪人情歌' });
        pWubai.position.set(1.6, 0.35, 0.15);
        g.add(pWubai);

        // 門口新品立牌
        var stand = C.textPlane('CD 新片上架', 1.2, { color: P.white, bg: P.signRed, fontSize: 64 });
        stand.position.set(0, 0.5, 0.4);
        g.add(stand);

        g.userData = { id: 'tower-records', name: '淘兒音樂城', era: ERA };
        return g;
      }
    },

    // ── 投幣式電玩機台：快打旋風藍黃配色的直立框體 ──
    {
      id: 'arcade-cabinet',
      name: '投幣式電玩機台',
      category: 'arcade',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;

        // 機身（藍色框體）
        var body = C.box(0.8, 1.7, 0.7, '#1a4fa0', { roughness: 0.6 });
        body.position.set(0, 0.85, 0);
        g.add(body);

        // 螢幕（微亮）
        var screen = C.box(0.6, 0.45, 0.03, P.black, {
          emissive: P.neonBlue, emissiveIntensity: 0.5, roughness: 0.3
        });
        screen.position.set(0, 1.25, 0.36);
        screen.rotation.x = -0.12;
        g.add(screen);

        // 控制台（黃色斜面 + 兩顆搖桿）
        var panel = C.box(0.78, 0.08, 0.32, P.neonYellow, { roughness: 0.5 });
        panel.position.set(0, 0.92, 0.42);
        panel.rotation.x = -0.25;
        g.add(panel);
        var stickL = C.cyl(0.015, 0.015, 0.12, P.black, 8);
        stickL.position.set(-0.2, 1.02, 0.44);
        g.add(stickL);
        var stickR = C.cyl(0.015, 0.015, 0.12, P.black, 8);
        stickR.position.set(0.2, 1.02, 0.44);
        g.add(stickR);

        // 頂部招牌：快打旋風字樣
        var marquee = C.textPlane('快打旋風 II', 0.72, { color: P.neonYellow, bg: P.signRed, fontSize: 72 });
        marquee.position.set(0, 1.78, 0.3);
        g.add(marquee);

        // 投幣口
        var coin = C.box(0.12, 0.18, 0.02, P.steel, { metalness: 0.6, roughness: 0.3 });
        coin.position.set(0, 0.5, 0.36);
        g.add(coin);

        g.userData = { id: 'arcade-cabinet', name: '投幣式電玩機台', era: ERA };
        return g;
      }
    },

    // ── 漫畫出租店立面：直式招牌 + 櫥窗排滿灌籃高手等直式書背 ──
    {
      id: 'manga-rental',
      name: '漫畫出租店',
      category: 'storefront',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;
        var rnd = C.rand(1990);

        // 店面立面
        var body = C.box(4, 3.6, 0.5, P.cream);
        body.position.set(0, 1.8, -0.25);
        g.add(body);

        // 直式招牌：漫畫出租
        var sign = C.verticalSign('漫畫出租', { h: 2.2, w: 0.5, bg: P.signGreen, fg: '#fff', lit: true });
        sign.position.set(-2.2, 1.2, 0.35);
        g.add(sign);

        // 橫幅店名
        var banner = C.textPlane('每本 10 元・灌籃高手到貨', 3.2, { color: P.white, bg: P.signRed, fontSize: 64 });
        banner.position.set(0, 3.1, 0.05);
        g.add(banner);

        // 櫥窗書架：一排直式書背（顏色決定性隨機，紅底書背暗示灌籃高手）
        var shelf = C.box(3.2, 0.06, 0.35, P.woodDark);
        shelf.position.set(0, 1.0, 0.18);
        g.add(shelf);
        var spineColors = [P.signRed, '#d0342c', P.neonBlue, P.neonYellow, '#e8e2d0', P.signGreen];
        for (var i = 0; i < 14; i++) {
          var spine = C.box(0.18, 0.26 + rnd() * 0.04, 0.05, spineColors[Math.floor(rnd() * spineColors.length)], { roughness: 0.9 });
          spine.position.set(-1.45 + i * 0.22, 1.18, 0.18);
          g.add(spine);
        }

        // 書背名稱（直式文字，暗示灌籃高手全套）
        var spineText = C.textPlane('灌籃高手', 0.16, { vertical: true, color: P.white, fontSize: 64 });
        spineText.position.set(-1.45, 1.18, 0.21);
        g.add(spineText);

        g.userData = { id: 'manga-rental', name: '漫畫出租店', era: ERA };
        return g;
      }
    },

    // ── 皮卡丘配色扭蛋機：黃身紅頂、透明蛋倉（抽象配色暗示，不建模角色） ──
    {
      id: 'gashapon-machine',
      name: '扭蛋機（皮卡丘配色）',
      category: 'prop',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;
        var rnd = C.rand(1998);

        // 機身底座（黃色）
        var base = C.box(0.45, 0.7, 0.4, P.neonYellow, { roughness: 0.5 });
        base.position.set(0, 0.35, 0);
        g.add(base);

        // 透明蛋倉（球形）
        var dome = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 16, 12),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color('#cfe8f5'),
            roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.4
          })
        );
        dome.position.set(0, 0.95, 0);
        g.add(dome);

        // 倉內扭蛋（黃紅白配色暗示，決定性排列）
        var eggColors = [P.neonYellow, P.signRed, P.white, P.neonYellow];
        for (var i = 0; i < 4; i++) {
          var egg = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 10, 8),
            C.mat(eggColors[i], { roughness: 0.4 })
          );
          egg.position.set((rnd() - 0.5) * 0.24, 0.82 + rnd() * 0.1, (rnd() - 0.5) * 0.24);
          g.add(egg);
        }

        // 紅色頂蓋（紅頂黃身 = 年代配色暗示）
        var cap = C.cyl(0.1, 0.28, 0.12, P.signRed, 16);
        cap.position.set(0, 1.22, 0);
        g.add(cap);

        // 轉盤
        var knob = C.cyl(0.07, 0.07, 0.05, P.steel, 12);
        knob.rotation.x = Math.PI / 2;
        knob.position.set(0, 0.42, 0.21);
        g.add(knob);

        // 機身文字：神奇寶貝扭蛋
        var label = C.textPlane('神奇寶貝扭蛋 20 元', 0.4, { color: P.black, fontSize: 56 });
        label.position.set(0, 0.58, 0.205);
        g.add(label);

        g.userData = { id: 'gashapon-machine', name: '扭蛋機（皮卡丘配色）', era: ERA };
        return g;
      }
    },

    // ── BB Call + 大哥大廣告立牌：通訊行門口的年代感標配 ──
    {
      id: 'bbcall-ad-standee',
      name: 'BB Call 大哥大廣告立牌',
      category: 'sign',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;

        // A 字立牌板面
        var board = C.box(0.9, 1.4, 0.04, P.white, { roughness: 0.8 });
        board.position.set(0, 0.85, 0);
        board.rotation.x = -0.1;
        g.add(board);

        // 支撐腳架
        var legBack = C.box(0.9, 1.4, 0.03, P.steel, { metalness: 0.4, roughness: 0.5 });
        legBack.position.set(0, 0.85, -0.24);
        legBack.rotation.x = 0.25;
        g.add(legBack);

        // 主標語
        var headline = C.textPlane('BB Call 申辦', 0.8, { color: P.signRed, fontSize: 96 });
        headline.position.set(0, 1.32, 0.05);
        headline.rotation.x = -0.1;
        g.add(headline);
        var sub = C.textPlane('大哥大 090 門號', 0.72, { color: '#1a4fa0', fontSize: 72 });
        sub.position.set(0, 1.05, 0.06);
        sub.rotation.x = -0.1;
        g.add(sub);

        // 磚頭大哥大（黑色長方體 + 天線）
        var phone = C.box(0.14, 0.34, 0.08, P.black, { roughness: 0.6 });
        phone.position.set(-0.22, 0.62, 0.08);
        phone.rotation.x = -0.1;
        g.add(phone);
        var antenna = C.cyl(0.01, 0.01, 0.16, P.black, 6);
        antenna.position.set(-0.27, 0.85, 0.06);
        g.add(antenna);

        // BB Call 呼叫器（小方盒）
        var pager = C.box(0.16, 0.1, 0.05, '#2c3e50', { roughness: 0.5 });
        pager.position.set(0.24, 0.6, 0.09);
        pager.rotation.x = -0.1;
        g.add(pager);

        // 價格文字
        var price = C.textPlane('月租 $99 起', 0.5, { color: P.black, fontSize: 56 });
        price.position.set(0, 0.35, 0.09);
        price.rotation.x = -0.1;
        g.add(price);

        g.userData = { id: 'bbcall-ad-standee', name: 'BB Call 大哥大廣告立牌', era: ERA };
        return g;
      }
    },

    // ── 拍貼機（大頭貼）：粉色箱體 + 簾幕，1999 徒步區少女排隊標配 ──
    {
      id: 'photo-sticker-booth',
      name: '拍貼機',
      category: 'prop',
      build: function (C) {
        var g = new THREE.Group();
        var P = C.PALETTE;

        // 主箱體（粉色）
        var body = C.box(1.6, 2.1, 1.4, '#f7a8d8', { roughness: 0.55 });
        body.position.set(0, 1.05, 0);
        g.add(body);

        // 頂部招牌
        var top = C.textPlane('大頭貼', 1.3, { color: P.white, bg: P.neonPink, fontSize: 96 });
        top.position.set(0, 2.32, 0.55);
        g.add(top);

        // 入口簾幕（深色垂布）
        var curtain = C.box(0.7, 1.5, 0.03, '#7c3aed', { roughness: 0.95 });
        curtain.position.set(0.35, 0.85, 0.71);
        g.add(curtain);

        // 操作面板 + 螢幕
        var panel = C.box(0.6, 0.5, 0.05, P.black, { roughness: 0.4 });
        panel.position.set(-0.4, 1.3, 0.71);
        g.add(panel);
        var screen = C.box(0.4, 0.3, 0.02, P.black, {
          emissive: P.neonBlue, emissiveIntensity: 0.6, roughness: 0.3
        });
        screen.position.set(-0.4, 1.33, 0.745);
        g.add(screen);

        // 相片出口
        var slot = C.box(0.3, 0.04, 0.02, P.steel, { metalness: 0.5, roughness: 0.3 });
        slot.position.set(-0.4, 0.9, 0.72);
        g.add(slot);

        // 側面宣傳文字
        var side = C.textPlane('拍貼 50 元', 0.9, { color: P.neonPink, fontSize: 72 });
        side.position.set(-0.81, 1.4, 0);
        side.rotation.y = -Math.PI / 2;
        g.add(side);

        g.userData = { id: 'photo-sticker-booth', name: '拍貼機', era: ERA };
        return g;
      }
    }

  ];
})();
