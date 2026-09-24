# chunghwa_paint.py — the painted textures for 中華商場 (zone 2 realism pass, 2026-09-24).
#
# CJ, 2026-09-24: 「這個youtbue講怎麼shade像是arcade 試試看」 (the Arcane method: detail lives in a
# painted texture on a simple mesh, light baked into the paint, a normal map for the relief).
# The silhouette stays geometry (asset/blender/chunghwa.py): arcade recess, corridor gap,
# shopfront setback, bridges, roof tanks. Everything else is painted here: each shop unit's
# frontage and what it sells, shutter slats, sign frames, mullions, the lattice panel,
# concrete staining and formwork lines.
#
#   python3 asset/paint/chunghwa_paint.py            # writes asset/textures/chunghwa-*.webp
#
# Every colour is a data.js palette hex, varied only in value by the brush. Textures load
# linear (the page applies gamma in its post pass), so a painted hex shows as that hex.
# Deterministic: a fixed seed, so a re-run paints the same street.

import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', 'textures'))
FONT = '/System/Library/Fonts/Hiragino Sans GB.ttc'

PAL = {
    'ink': '#2b2f3a', 'haze': '#9fb6c9', 'lamp': '#ffb347', 'bone': '#f7f2e8', 'verm': '#d9483b',
    'sky': '#8ecbff', 'brick': '#b8664c', 'leaf': '#6fae6a', 'road': '#6d6f75', 'walk': '#e2dccb',
}


def rgb(k, v=1.0):
    h = PAL[k] if k in PAL else k
    c = tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    return tuple(max(0, min(255, int(x * v))) for x in c)


def font(px):
    return ImageFont.truetype(FONT, px)


# ── the canvas: colour and height painted together ──────────────────────────
class Canvas:
    def __init__(self, w, h, bg='walk', hbg=128):
        self.c = Image.new('RGB', (w, h), rgb(bg))
        self.h = Image.new('L', (w, h), hbg)
        self.dc = ImageDraw.Draw(self.c)
        self.dh = ImageDraw.Draw(self.h)
        self.w, self.h_ = w, h

    def rect(self, box, col, height=None, v=1.0, outline=None, ow=1):
        x0, y0, x1, y1 = [int(round(t)) for t in box]
        if x1 <= x0 or y1 <= y0:
            return
        self.dc.rectangle((x0, y0, x1 - 1, y1 - 1), fill=rgb(col, v), outline=rgb(outline) if outline else None, width=ow)
        if height is not None:
            self.dh.rectangle((x0, y0, x1 - 1, y1 - 1), fill=height)

    def ellipse(self, box, col, height=None, v=1.0, outline=None):
        self.dc.ellipse(box, fill=rgb(col, v) if col else None, outline=rgb(outline) if outline else None, width=2 if outline else 0)
        if height is not None:
            self.dh.ellipse(box, fill=height)

    def poly(self, pts, col, height=None, v=1.0):
        self.dc.polygon(pts, fill=rgb(col, v))
        if height is not None:
            self.dh.polygon(pts, fill=height)

    def line(self, pts, col, w=1, height=None, v=1.0):
        self.dc.line(pts, fill=rgb(col, v), width=w)
        if height is not None:
            self.dh.line(pts, fill=height, width=w)

    def text(self, xy, s, px, col, anchor='mm', vertical=False, height=None):
        f = font(px)
        if vertical:
            x, y = xy
            y0 = y - (len(s) - 1) * px * 1.05 / 2
            for i, ch in enumerate(s):
                self.dc.text((x, y0 + i * px * 1.05), ch, font=f, fill=rgb(col), anchor='mm')
                if height is not None:
                    self.dh.text((x, y0 + i * px * 1.05), ch, font=f, fill=height, anchor='mm')
        else:
            self.dc.text(xy, s, font=f, fill=rgb(col), anchor=anchor)
            if height is not None:
                self.dh.text(xy, s, font=f, fill=height, anchor=anchor)


# ── the brush: turns flat fills into strokes, keeping the shapes ─────────────
def brush(img, rnd, box=None, density=0.012, size=(3, 9), along='v', jitter=0.07):
    x0, y0, x1, y1 = box or (0, 0, img.width, img.height)
    src = img.copy()
    px = src.load()
    d = ImageDraw.Draw(img)
    n = int((x1 - x0) * (y1 - y0) * density)
    for _ in range(n):
        x = rnd.randrange(x0, x1)
        y = rnd.randrange(y0, y1)
        r, g, b = px[x, y]
        v = 1.0 + rnd.uniform(-jitter, jitter)
        col = (min(255, int(r * v)), min(255, int(g * v)), min(255, int(b * v)))
        ln = rnd.randint(*size)
        a = (math.pi / 2 if along == 'v' else 0) + rnd.uniform(-0.35, 0.35)
        dx, dy = math.cos(a) * ln / 2, math.sin(a) * ln / 2
        d.line((x - dx, y - dy, x + dx, y + dy), fill=col, width=rnd.randint(1, 3))


def multiply(img, box, fn):
    """Bake light: multiply the box by fn(u, v) -> (r, g, b) factors, u, v in 0..1."""
    x0, y0, x1, y1 = [int(t) for t in box]
    a = np.asarray(img, dtype=np.float32).copy()
    h, w = y1 - y0, x1 - x0
    v = np.linspace(0, 1, h)[:, None]
    u = np.linspace(0, 1, w)[None, :]
    f = fn(u, v)
    for k in range(3):
        a[y0:y1, x0:x1, k] *= np.broadcast_to(f[k], (h, w))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def normal_map(himg, strength=2.5, scale=0.5):
    h = himg.resize((int(himg.width * scale), int(himg.height * scale)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    a = np.asarray(h, dtype=np.float32) / 255.0
    gx = np.zeros_like(a); gy = np.zeros_like(a)
    gx[:, 1:-1] = a[:, 2:] - a[:, :-2]
    gy[1:-1, :] = a[:-2, :] - a[2:, :]              # up is +y in tangent space
    n = np.stack([-gx * strength * 8, -gy * strength * 8, np.ones_like(a)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8), 'RGB')


def save(img, name, q=78):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    img.save(p, 'WEBP', quality=q, method=6)
    print(f'[paint] {name}: {img.width}x{img.height}, {os.path.getsize(p) / 1024:.0f} KB')


# ─────────────────────────────────────────────────────────────────────────────
# the goods: what each shop sells, painted inside its opening (ox, oy, ow, oh)
# ─────────────────────────────────────────────────────────────────────────────
def shelves(cv, o, n, col='walk'):
    ox, oy, ow, oh = o
    ys = [oy + oh * (k + 1) / (n + 1) for k in range(n)]
    for y in ys:
        cv.rect((ox + 3, y, ox + ow - 3, y + 3), col, 170, 0.8)
    return ys


def goods_clocks(cv, o, r):
    ox, oy, ow, oh = o
    for j in range(3):
        for i in range(3):
            cx, cy, rr = ox + ow * (i + 0.5) / 3, oy + oh * (j + 0.35) / 3.4, min(ow, oh) * 0.11
            cv.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), 'bone', 190, outline=r.choice(['lamp', 'verm', 'ink']))
            cv.line((cx, cy, cx, cy - rr * 0.7), 'ink', 2)
            cv.line((cx, cy, cx + rr * 0.5 * r.choice([-1, 1]), cy), 'ink', 2)
    glass_case(cv, o, r, lambda cv, b: [cv.ellipse((b[0] + 6 + k * 18, b[1] + 6, b[0] + 18 + k * 18, b[1] + 12), None, outline='haze') for k in range(int((b[2] - b[0] - 12) / 18))])


def goods_glasses(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 4):
        for k in range(int((ow - 10) / 26)):
            x = ox + 8 + k * 26
            cv.ellipse((x, y - 11, x + 10, y - 3), None, outline='ink')
            cv.ellipse((x + 12, y - 11, x + 22, y - 3), None, outline='ink')
    cv.ellipse((ox + ow * 0.5 - 22, oy + oh * 0.05, ox + ow * 0.5 + 22, oy + oh * 0.05 + 30), 'bone', 200, outline='verm')     # the eye chart / sign disc
    cv.text((ox + ow * 0.5, oy + oh * 0.05 + 15), '眼', 18, 'verm')


def goods_shoes(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 4):
        for k in range(int((ow - 8) / 22)):
            x = x0 = ox + 6 + k * 22
            col = r.choice(['ink', 'verm', 'brick', 'bone', 'ink'])
            cv.poly([(x, y), (x + 18, y), (x + 18, y - 6), (x + 8, y - 8), (x + 4, y - 14), (x, y - 14)], col, 175)


def goods_records(cv, o, r):
    ox, oy, ow, oh = o
    s = ow / 5.2
    for j in range(4):
        for i in range(5):
            x, y = ox + 3 + i * s, oy + 6 + j * (s + 4)
            if y + s > oy + oh * 0.75:
                break
            cv.rect((x, y, x + s - 3, y + s - 3), r.choice(['verm', 'lamp', 'sky', 'leaf', 'bone', 'ink', 'haze']), 165)
            if r.random() < 0.5:
                cv.ellipse((x + s * 0.25, y + s * 0.25, x + s * 0.7, y + s * 0.7), r.choice(['ink', 'bone']))
    glass_case(cv, o, r, lambda cv, b: [cv.rect((b[0] + 5 + k * 9, b[1] + 4, b[0] + 11 + k * 9, b[3] - 4), r.choice(['verm', 'lamp', 'sky', 'bone'])) for k in range(int((b[2] - b[0] - 10) / 9))])


def goods_electronics(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 3, 'haze'):
        x = ox + 5
        while x < ox + ow - 24:
            w = r.randint(20, 34)
            cv.rect((x, y - 22, x + w, y), r.choice(['haze', 'bone', 'ink', 'walk']), 180)
            for k in range(2):
                cv.ellipse((x + 4 + k * 9, y - 16, x + 10 + k * 9, y - 10), 'ink', 200)
            x += w + 4
    for k in range(int(ow / 12)):                                     # drawers of parts
        cv.rect((ox + 4 + k * 12, oy + oh * 0.8, ox + 14 + k * 12, oy + oh * 0.86), r.choice(['lamp', 'sky', 'bone', 'verm']), 160)


def goods_radio(cv, o, r):
    ox, oy, ow, oh = o
    for j, y in enumerate(shelves(cv, o, 3, 'brick')):
        x = ox + 6
        while x < ox + ow - 30:
            w = r.randint(28, 40)
            cv.rect((x, y - 26, x + w, y), r.choice(['brick', 'ink', 'bone', 'haze']), 185)
            cv.rect((x + 3, y - 22, x + w * 0.5, y - 5), 'ink', 150)                     # speaker grille
            for k in range(4):
                cv.line((x + 4, y - 20 + k * 4, x + w * 0.5 - 2, y - 20 + k * 4), 'haze', 1, 170)
            cv.ellipse((x + w * 0.62, y - 20, x + w * 0.62 + 9, y - 11), 'lamp')         # the dial
            x += w + 5
    cv.rect((ox + 4, oy + oh * 0.78, ox + ow - 4, oy + oh * 0.92), 'ink', 170)            # a big speaker pair on the floor
    for x in (ox + ow * 0.25, ox + ow * 0.75):
        cv.ellipse((x - 13, oy + oh * 0.79, x + 13, oy + oh * 0.91), 'haze', 150)


def goods_suits(cv, o, r):
    ox, oy, ow, oh = o
    cv.line((ox + 4, oy + oh * 0.18, ox + ow - 4, oy + oh * 0.18), 'haze', 3, 200)
    x = ox + 10
    while x < ox + ow - 26:
        col = r.choice(['ink', 'haze', 'brick', 'road', 'ink', 'bone'])
        t, w, h = oy + oh * 0.18, 26, oh * 0.45
        cv.poly([(x + 13, t), (x + w, t + 8), (x + w + 2, t + h), (x - 2, t + h), (x, t + 8)], col, 180)
        cv.poly([(x + 9, t + 4), (x + 13, t + 22), (x + 17, t + 4)], 'bone', 190)                 # shirt V
        x += 30
    # a mannequin at the front
    mx = ox + ow * 0.78
    cv.ellipse((mx - 7, oy + oh * 0.55, mx + 7, oy + oh * 0.62), 'walk', 200)
    cv.poly([(mx - 14, oy + oh * 0.63), (mx + 14, oy + oh * 0.63), (mx + 10, oy + oh * 0.92), (mx - 10, oy + oh * 0.92)], 'ink', 200)
    cv.rect((ox + 6, oy + oh * 0.7, ox + ow * 0.55, oy + oh * 0.76), 'lamp', 170)                  # bolts on the cutting table
    cv.rect((ox + 6, oy + oh * 0.76, ox + ow * 0.55, oy + oh * 0.95), 'walk', 160, 0.8)


def goods_stamps(cv, o, r):
    ox, oy, ow, oh = o
    for j in range(5):                                                                           # albums on the back wall
        for i in range(4):
            x, y = ox + 6 + i * (ow - 12) / 4, oy + 8 + j * oh * 0.11
            cv.rect((x, y, x + (ow - 12) / 4 - 4, y + oh * 0.09), r.choice(['bone', 'walk', 'lamp']), 170)
            for k in range(3):
                cv.rect((x + 3 + k * 9, y + 4, x + 9 + k * 9, y + 11), r.choice(['verm', 'sky', 'leaf', 'lamp', 'brick']))
    glass_case(cv, o, r, lambda cv, b: [cv.ellipse((b[0] + 5 + k * 13, b[1] + 5, b[0] + 15 + k * 13, b[1] + 15), 'lamp', outline='brick') for k in range(int((b[2] - b[0] - 10) / 13))], top=0.62)
    cv.text((ox + ow * 0.5, oy + oh * 0.58), '郵票 錢幣', 15, 'verm')


def goods_noodles(cv, o, r, name='點心'):
    ox, oy, ow, oh = o
    cv.rect((ox + 4, oy + 8, ox + ow - 4, oy + oh * 0.3), 'bone', 190)                          # the menu board
    items = ['酸辣湯 20', '鍋貼 3', '牛肉麵 45', '小籠包 30', '餡餅 5', '炸醬麵 25']
    for k in range(4):
        cv.text((ox + 8 + (k % 2) * (ow - 16) / 2, oy + 14 + (k // 2) * 18), r.choice(items), 12, 'verm' if k % 2 else 'ink', anchor='lt')
    cv.rect((ox + 2, oy + oh * 0.58, ox + ow - 2, oy + oh * 0.7), 'haze', 200)                   # the steel counter
    for k in range(3):                                                                           # pots and the steam
        x = ox + 14 + k * (ow - 28) / 3
        cv.rect((x, oy + oh * 0.46, x + 30, oy + oh * 0.58), 'haze', 190, 0.8)
        for s in range(3):
            cv.ellipse((x + 4 + s * 8, oy + oh * (0.36 - s * 0.04), x + 16 + s * 8, oy + oh * (0.42 - s * 0.04)), 'bone', None, 1.0)
    for k in range(4):                                                                           # stools
        x = ox + 12 + k * (ow - 24) / 4
        cv.rect((x, oy + oh * 0.8, x + 16, oy + oh * 0.83), 'verm', 180)
        cv.line((x + 8, oy + oh * 0.83, x + 8, oy + oh * 0.97), 'ink', 2)


def goods_toys(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 4):
        x = ox + 5
        while x < ox + ow - 14:
            k, col = r.random(), r.choice(['verm', 'lamp', 'sky', 'leaf', 'bone', 'sky'])
            if k < 0.35:
                cv.rect((x, y - 18, x + 12, y), col, 180); cv.rect((x + 2, y - 26, x + 10, y - 18), 'haze', 180)   # a robot
            elif k < 0.7:
                cv.ellipse((x, y - 14, x + 14, y), col, 180)                                     # balls
            else:
                cv.poly([(x, y), (x + 14, y), (x + 7, y - 18)], col, 180)                          # spinning tops
            x += 17
    for k in range(6):                                                                             # 尪仔標 strips hanging
        cv.rect((ox + 6 + k * 14, oy + 2, ox + 16 + k * 14, oy + 16), r.choice(['lamp', 'verm', 'sky']), 150)


def goods_seals(cv, o, r):
    ox, oy, ow, oh = o
    cv.text((ox + ow * 0.5, oy + oh * 0.3), '刻印', 34, 'verm', vertical=True, height=200)
    glass_case(cv, o, r, lambda cv, b: [cv.rect((b[0] + 6 + k * 8, b[1] + 6, b[0] + 11 + k * 8, b[3] - 4), r.choice(['lamp', 'brick', 'bone', 'leaf'])) for k in range(int((b[2] - b[0] - 12) / 8))], top=0.55)
    cv.ellipse((ox + ow * 0.12, oy + oh * 0.08, ox + ow * 0.12 + 22, oy + oh * 0.08 + 22), 'verm')  # the red seal print
    cv.text((ox + ow * 0.12 + 11, oy + oh * 0.08 + 11), '印', 13, 'bone')


def goods_cloth(cv, o, r):
    ox, oy, ow, oh = o
    x = ox + 4
    while x < ox + ow - 10:                                                                       # bolts standing on end
        w = r.randint(9, 14)
        col = r.choice(['verm', 'sky', 'lamp', 'leaf', 'bone', 'haze', 'brick', 'ink'])
        cv.rect((x, oy + oh * 0.12, x + w, oy + oh * 0.72), col, 180)
        cv.line((x + w - 2, oy + oh * 0.12, x + w - 2, oy + oh * 0.72), col, 2, v=0.8)
        x += w + 1
    cv.rect((ox + 2, oy + oh * 0.74, ox + ow - 2, oy + oh * 0.95), 'walk', 170, 0.85)               # the measuring table
    cv.rect((ox + 10, oy + oh * 0.72, ox + ow * 0.6, oy + oh * 0.75), 'verm', 190)                 # a bolt unrolled on it


def goods_military(cv, o, r):
    ox, oy, ow, oh = o
    cv.line((ox + 4, oy + oh * 0.15, ox + ow - 4, oy + oh * 0.15), 'haze', 3, 200)
    for k in range(int((ow - 10) / 24)):
        x = ox + 6 + k * 24
        cv.poly([(x + 11, oy + oh * 0.15), (x + 22, oy + oh * 0.2), (x + 22, oy + oh * 0.55), (x, oy + oh * 0.55), (x, oy + oh * 0.2)], '#6b6a3a', 180)
    for k in range(int((ow - 10) / 30)):                                                          # helmets and water bottles
        x = ox + 10 + k * 30
        cv.ellipse((x, oy + oh * 0.62, x + 22, oy + oh * 0.74), '#5d6a3a', 190)
        cv.rect((x + 6, oy + oh * 0.78, x + 16, oy + oh * 0.9), '#6b6a3a', 185)


def goods_camera(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 3):
        for k in range(int((ow - 10) / 28)):
            x = ox + 6 + k * 28
            cv.rect((x, y - 14, x + 22, y), r.choice(['ink', 'ink', 'bone']), 185)
            cv.ellipse((x + 6, y - 12, x + 16, y - 2), 'haze', 205, outline='ink')
    cv.text((ox + ow * 0.5, oy + oh * 0.85), '沖洗 照相', 15, 'lamp')


def goods_books(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 5):
        x = ox + 4
        while x < ox + ow - 6:
            w = r.randint(4, 7)
            cv.rect((x, y - r.randint(14, 20), x + w, y), r.choice(['verm', 'sky', 'lamp', 'bone', 'leaf', 'ink', 'brick']), 170)
            x += w + 1


def goods_tv(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 2, 'brick'):
        for k in range(int((ow - 10) / 40)):
            x = ox + 6 + k * 40
            cv.rect((x, y - 34, x + 36, y), 'brick', 185)
            cv.rect((x + 3, y - 30, x + 26, y - 5), 'sky', 150, 0.8)                       # the screen, lit
            cv.ellipse((x + 28, y - 28, x + 34, y - 22), 'bone')
    cv.text((ox + ow * 0.5, oy + oh * 0.9), '電視 修理', 15, 'verm')


def goods_home(cv, o, r):
    """A home upstairs: a door with a curtain, a window with an iron grille, laundry, plants."""
    ox, oy, ow, oh = o
    cv.rect((ox, oy, ox + ow * 0.42, oy + oh), 'ink', 70)                                          # the door
    cv.rect((ox + 3, oy + 3, ox + ow * 0.42 - 3, oy + oh * 0.55), r.choice(['sky', 'lamp', 'leaf', 'verm']), 100, 0.85)   # curtain
    for k in range(4):
        cv.line((ox + 6 + k * (ow * 0.42 - 12) / 3, oy + 3, ox + 6 + k * (ow * 0.42 - 12) / 3, oy + oh * 0.55), 'ink', 1, v=1.6)
    wx0, wy0, wx1, wy1 = ox + ow * 0.52, oy + oh * 0.12, ox + ow - 4, oy + oh * 0.6
    cv.rect((wx0, wy0, wx1, wy1), 'ink', 80)
    cv.rect((wx0 + 3, wy0 + 3, wx1 - 3, wy1 - 3), 'sky', 90, 0.55)                                  # glass
    for k in range(6):                                                                             # the iron grille (鐵窗)
        x = wx0 + k * (wx1 - wx0) / 5
        cv.line((x, wy0 - 3, x, wy1 + 3), 'ink', 2, 215)
    for y in (wy0 + (wy1 - wy0) * 0.33, wy0 + (wy1 - wy0) * 0.66):
        cv.line((wx0 - 3, y, wx1 + 3, y), 'ink', 2, 215)
    # a pole with laundry across the bay
    py = oy + oh * 0.08
    cv.line((ox - 2, py, ox + ow + 2, py), 'haze', 2, 220)
    x = ox + 6
    while x < ox + ow - 12:
        w = r.randint(10, 18)
        cv.rect((x, py + 1, x + w, py + r.randint(18, 34)), r.choice(['bone', 'sky', 'verm', 'lamp', 'bone', 'haze']), 200)
        x += w + r.randint(3, 8)
    for k in range(2):                                                                              # potted plants on the floor
        x = ox + ow * (0.55 + k * 0.22)
        cv.rect((x, oy + oh * 0.86, x + 14, oy + oh), 'brick', 170)
        cv.ellipse((x - 5, oy + oh * 0.72, x + 19, oy + oh * 0.9), 'leaf', 190)


def goods_sewing(cv, o, r):
    ox, oy, ow, oh = o
    for k in range(int((ow - 10) / 36)):
        x = ox + 8 + k * 36
        cv.rect((x, oy + oh * 0.62, x + 30, oy + oh * 0.66), 'walk', 180)                        # table
        cv.poly([(x + 4, oy + oh * 0.62), (x + 4, oy + oh * 0.5), (x + 26, oy + oh * 0.5), (x + 26, oy + oh * 0.54), (x + 10, oy + oh * 0.54), (x + 10, oy + oh * 0.62)], 'ink', 200)   # the machine
        cv.line((x + 4, oy + oh * 0.66, x + 4, oy + oh * 0.95), 'ink', 2)
        cv.line((x + 26, oy + oh * 0.66, x + 26, oy + oh * 0.95), 'ink', 2)
    for k in range(int((ow - 8) / 16)):
        cv.rect((ox + 4 + k * 16, oy + oh * 0.12, ox + 16 + k * 16, oy + oh * 0.4), r.choice(['bone', 'sky', 'haze', 'ink']), 170)   # shirts hung up


def goods_antique(cv, o, r):
    ox, oy, ow, oh = o
    for k in range(3):                                                                              # scrolls
        x = ox + 8 + k * (ow - 16) / 3
        cv.rect((x, oy + 6, x + (ow - 16) / 3 - 8, oy + oh * 0.5), 'bone', 175)
        cv.line((x + 6, oy + 14, x + 6, oy + oh * 0.45), 'ink', 2)
        cv.rect((x - 2, oy + 4, x + (ow - 16) / 3 - 6, oy + 8), 'brick', 185)
    for y in shelves(cv, (ox, oy + oh * 0.45, ow, oh * 0.55), 2, 'brick'):                          # vases
        for k in range(int((ow - 10) / 22)):
            x = ox + 8 + k * 22
            cv.ellipse((x, y - 18, x + 14, y), r.choice(['sky', 'bone', 'leaf', 'brick']), 190)
            cv.rect((x + 4, y - 22, x + 10, y - 16), 'bone', 190)


def goods_keys(cv, o, r):
    ox, oy, ow, oh = o
    cv.rect((ox + 6, oy + 8, ox + ow - 6, oy + oh * 0.6), 'haze', 150, 0.9)                         # key board
    for j in range(6):
        for i in range(int((ow - 20) / 11)):
            x, y = ox + 12 + i * 11, oy + 14 + j * oh * 0.08
            cv.ellipse((x, y, x + 6, y + 6), 'lamp', 190)
            cv.line((x + 3, y + 6, x + 3, y + 14), 'lamp', 2, 190)
    cv.text((ox + ow * 0.5, oy + oh * 0.75), '打鑰匙', 16, 'ink')


def glass_case(cv, o, r, fill, top=0.66):
    """A glass counter across the front: frame, two shelves of small goods, a glare streak."""
    ox, oy, ow, oh = o
    b = (ox + 3, oy + oh * top, ox + ow - 3, oy + oh * 0.97)
    cv.rect(b, 'haze', 175, 0.75)
    mid = (b[1] + b[3]) / 2
    fill(cv, (b[0], b[1], b[2], mid))
    fill(cv, (b[0], mid, b[2], b[3]))
    cv.rect((b[0], b[1], b[2], b[1] + 3), 'bone', 210)
    cv.line((b[0] + 8, b[3] - 4, b[0] + 30, b[1] + 4), 'bone', 2)                                   # glare


GOODS = {
    'clocks': goods_clocks, 'glasses': goods_glasses, 'shoes': goods_shoes, 'records': goods_records,
    'electronics': goods_electronics, 'radio': goods_radio, 'suits': goods_suits, 'stamps': goods_stamps,
    'noodles': goods_noodles, 'toys': goods_toys, 'seals': goods_seals, 'cloth': goods_cloth,
    'military': goods_military, 'camera': goods_camera, 'books': goods_books, 'tv': goods_tv,
    'home': goods_home, 'sewing': goods_sewing, 'antique': goods_antique, 'keys': goods_keys,
}

# The shops, from the trades the market was known for (research/realism-ximen/zone2-chunghwa):
# ground floor = retail, upstairs = tailors, repairers, dealers and homes. [sign, goods, sign colour]
GROUND = [
    ['鐘錶眼鏡', 'clocks'], ['皮鞋', 'shoes'], ['唱片 錄音帶', 'records'], ['電子零件', 'electronics'], ['音響 收音機', 'radio'],
    ['西裝 訂做', 'suits'], ['郵票 錢幣', 'stamps'], ['點心世界', 'noodles'], ['玩具', 'toys'], ['刻印', 'seals'],
    ['布莊', 'cloth'], ['軍用品', 'military'], ['相機 沖洗', 'camera'], ['書報 雜誌', 'books'], ['眼鏡行', 'glasses'],
    ['牛肉麵', 'noodles'], ['電器行', 'electronics'], ['鐘錶行', 'clocks'], ['皮鞋 皮件', 'shoes'], ['唱片行', 'records'],
    ['制服 學生服', 'suits'], ['古董 字畫', 'antique'], ['打鑰匙', 'keys'], ['音響', 'radio'], ['文具 玩具', 'toys'],
]
UPPER = [
    ['電視修理', 'tv'], ['裁縫', 'sewing'], ['住家', 'home'], ['集郵社', 'stamps'], ['古董', 'antique'],
    ['住家', 'home'], ['制服訂做', 'suits'], ['音響修理', 'radio'], ['住家', 'home'], ['舊書', 'books'],
    ['電子材料', 'electronics'], ['住家', 'home'], ['刻印', 'seals'], ['錢幣', 'stamps'], ['住家', 'home'],
]
SIGN_BG = ['lamp', 'bone', 'verm', 'sky', 'leaf', 'bone', 'lamp']


def paint_unit(cv, x0, y0, w, h, sign, kind, r, upper=False):
    """One shop unit's frontage, 1.88 m wide, one storey of clear height. Frame and sign board
    on the concrete wall, the opening (shop or door), the goods, a rolling shutter's box."""
    cv.rect((x0, y0, x0 + w, y0 + h), 'walk', 128, 0.95)
    # the party pier between units
    cv.rect((x0, y0, x0 + 5, y0 + h), 'walk', 150, 0.82)
    home = kind == 'home'
    sh = 0 if home else int(h * 0.15)                                                            # the sign board
    top = y0 + (int(h * 0.19) if not home else int(h * 0.1))
    o = (x0 + 9, top + 4, w - 16, y0 + h - top - 8)
    if not home:
        bg = r.choice(SIGN_BG)
        cv.rect((x0 + 7, y0 + 4, x0 + w - 5, y0 + 4 + sh), bg, 205, outline='ink', ow=2)
        cv.rect((x0 + 9, y0 + 6, x0 + w - 7, y0 + 7), 'bone', 225)                              # the frame's lit top edge
        fg = 'bone' if bg in ('verm', 'leaf') else ('ink' if bg == 'lamp' else 'verm')
        size = int(min(sh * 0.66, (w - 24) / max(2, len(sign.replace(' ', ''))) * 1.05))
        cv.text((x0 + w / 2, y0 + 4 + sh / 2), sign, size, fg, height=230)
        # the shutter box and the rolled-up shutter, slats showing
        cv.rect((x0 + 7, top - 6, x0 + w - 5, top + 2), 'haze', 190, 0.9)
        cv.rect((o[0], o[1], o[0] + o[2], o[1] + o[3]), 'ink', 60, 1.35)                            # the interior, in shade
        down = int(o[3] * (r.choice([0.0, 0.0, 0.12, 0.2]) if not upper else r.choice([0.0, 0.15, 0.3])))
        GOODS[kind](cv, o, r)
        if down:
            cv.rect((o[0], o[1], o[0] + o[2], o[1] + down), 'haze', 150, 0.95)
            for k in range(0, down, 4):
                cv.line((o[0], o[1] + k, o[0] + o[2], o[1] + k), 'haze', 1, 110, 0.7)
    else:
        cv.rect((o[0], o[1], o[0] + o[2], o[1] + o[3]), 'walk', 128, 0.9)
        goods_home(cv, o, r)
    # the fluorescent tube glow inside the opening's top
    return o


def paint_block_strip(cv, x0, y0, units, cell, r, upper):
    cw, ch = cell
    for k, (sign, kind) in enumerate(units):
        paint_unit(cv, x0 + k * cw, y0, cw, ch, sign, kind, r, upper)


def shops_atlas(r):
    """5 painted blocks (the ones the camera passes in zone 2; the first three reuse them).
    Per block, a ground strip (5 units) and two upper strips (5 units each), stacked."""
    CW, CH = 192, 302                     # 1.88 m x 2.96 m at ~102 px/m
    BW, BH = CW * 5, CH * 3
    W, H = BW * 2, BH * 3
    cv = Canvas(W, H)
    g = GROUND[:]; u = UPPER[:]
    r.shuffle(g)
    layout = []
    for b in range(5):
        bx, by = (b % 2) * BW, (b // 2) * BH
        ground = [g[(b * 5 + k) % len(g)] for k in range(5)]
        if b == 4:
            ground[2] = ['點心世界', 'noodles']      # 點心世界, the market's best-known sign, on 信棟 (block 5)
        paint_block_strip(cv, bx, by, ground, (CW, CH), r, False)
        for f in (1, 2):
            ups = [u[(b * 7 + f * 5 + k) % len(u)] for k in range(5)]
            paint_block_strip(cv, bx, by + f * CH, ups, (CW, CH), r, True)
        layout.append((bx, by))
    # the unused sixth slot: concrete, so a stray UV shows wall, not a hole
    cv.rect((BW, 2 * BH, 2 * BW, 3 * BH), 'walk', 128, 0.95)
    img = cv.c
    brush(img, r, density=0.006, size=(3, 7), jitter=0.04)
    img = img.filter(ImageFilter.SMOOTH)
    # baked light, per storey strip: the slab's shadow at the top (cool), a warm fluorescent
    # wash inside, grime at the foot, occlusion at the unit edges
    def storey_light(u_, v):
        shade = 0.72 + 0.28 * np.clip(v / 0.28, 0, 1) ** 0.8
        foot = 1 - 0.12 * np.clip((v - 0.88) / 0.12, 0, 1)
        edge = 1 - 0.1 * np.exp(-((u_ * 5) % 1) * 30) - 0.1 * np.exp(-(1 - (u_ * 5) % 1) * 30)
        k = shade * foot * edge
        return (k * 0.97, k * 0.99, k * (1.02 + 0.05 * (1 - np.clip(v / 0.28, 0, 1))))
    for b in range(5):
        bx, by = layout[b]
        for f in range(3):
            img = multiply(img, (bx, by + f * CH, bx + BW, by + (f + 1) * CH), storey_light)
    grime(img, r, (0, 0, W, H), n=260)
    return img, cv.h


def grime(img, r, box, n=200):
    """Rain streaks under sills and signs: thin darker vertical runs."""
    d = ImageDraw.Draw(img, 'RGBA')
    x0, y0, x1, y1 = box
    for _ in range(n):
        x = r.randrange(x0, x1)
        y = r.randrange(y0, y1)
        ln = r.randint(12, 60)
        d.line((x, y, x + r.uniform(-2, 2), y + ln), fill=(43, 47, 58, r.randint(8, 18)), width=r.randint(2, 4))


# ─────────────────────────────────────────────────────────────────────────────
# end walls: 中華商場 painted vertically, the block number, the concrete lattice panel
# ─────────────────────────────────────────────────────────────────────────────
def ends_atlas(r):
    """8 end walls, each 10 m (depth, u: back → road) x 9.9 m (height), ~38 px/m."""
    CW, CH = 384, 380
    cv = Canvas(CW * 2, CH * 4)
    for b in range(8):
        x0, y0 = (b % 2) * CW, (b // 2) * CH
        cv.rect((x0, y0, x0 + CW, y0 + CH), 'walk', 128, 0.93)
        px = CW / 10.0
        # formwork lines: a board every 0.9 m
        for k in range(1, 11):
            cv.line((x0, y0 + k * CH / 11, x0 + CW, y0 + k * CH / 11), 'walk', 1, 118, 0.86)
        # the lattice panel (breeze block), back half, from 1 m to the parapet
        lx0, lx1 = x0 + 3.9 * px, x0 + 6.5 * px
        ly0, ly1 = y0 + 0.7 * px, y0 + CH - 1.0 * px
        cv.rect((lx0 - 4, ly0 - 4, lx1 + 4, ly1 + 4), 'bone', 175, 0.96)
        s = 0.5 * px
        yy = ly0
        while yy + s <= ly1:
            xx = lx0
            while xx + s <= lx1 + 1:
                cv.rect((xx + 3, yy + 3, xx + s - 3, yy + s - 3), 'ink', 70, 1.2)
                cv.line((xx + 3, yy + 3, xx + s - 3, yy + 3), 'haze', 1, 90)
                xx += s
            yy += s
        # 中華商場, painted vertically near the road corner, and the block number
        cv.rect((x0 + 8.35 * px, y0 + 0.6 * px, x0 + 9.75 * px, y0 + 6.2 * px), 'bone', 150)
        cv.text((x0 + 9.05 * px, y0 + 3.4 * px), '中華商場', int(1.12 * px), 'verm', vertical=True, height=165)
        cv.text((x0 + 7.4 * px, y0 + 4.2 * px), str(b + 1), int(3.4 * px), 'verm', height=150)
    img = cv.c
    brush(img, r, density=0.012, size=(4, 10), jitter=0.07)
    # light: the top catches the sun, the foot is stained
    for b in range(8):
        x0, y0 = (b % 2) * CW, (b // 2) * CH
        img = multiply(img, (x0, y0, x0 + CW, y0 + CH), lambda u_, v: ((1.03 - 0.16 * v), (1.02 - 0.15 * v), (1.0 - 0.1 * v)))
    grime(img, r, (0, 0, cv.w, cv.h_), n=420)
    return img, cv.h


# ─────────────────────────────────────────────────────────────────────────────
# concrete: a tileable luminance painting (white = the palette colour), 4 m per repeat
# ─────────────────────────────────────────────────────────────────────────────
def concrete(r, S=512):
    cv = Canvas(S, S, '#ffffff', 128)
    # formwork boards: a faint seam every 0.3 m, a stronger lift line every 1.2 m
    for k in range(0, S, S // 13):
        cv.line((0, k, S, k), '#ededed', 1, 120)
    for k in range(0, S, S // 3):
        cv.line((0, k, S, k), '#d9d9d9', 2, 110)
    img = cv.c
    # soft stains, wrapped so the tile repeats cleanly
    a = np.asarray(img, dtype=np.float32)
    yy, xx = np.mgrid[0:S, 0:S]
    for _ in range(26):
        cx, cy, rad, amt = r.uniform(0, S), r.uniform(0, S), r.uniform(20, 110), r.uniform(0.03, 0.09)
        dx = np.minimum(np.abs(xx - cx), S - np.abs(xx - cx))
        dy = np.minimum(np.abs(yy - cy), S - np.abs(yy - cy))
        m = np.exp(-(dx ** 2 + dy ** 2) / (2 * rad ** 2))
        a *= (1 - amt * m)[..., None]
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    brush(img, r, density=0.03, size=(3, 10), jitter=0.05)
    d = ImageDraw.Draw(img, 'RGBA')
    for _ in range(140):                                                                               # streaks, wrapped
        x, y, ln = r.randrange(S), r.randrange(S), r.randint(20, 120)
        for off in (0, -S):
            d.line((x, y + off, x, y + ln + off), fill=(60, 60, 60, r.randint(10, 26)), width=r.randint(1, 3))
    for _ in range(90):                                                                                # pits
        x, y = r.randrange(S), r.randrange(S)
        d.ellipse((x, y, x + 2, y + 2), fill=(90, 90, 90, 70))
        cv.dh.ellipse((x, y, x + 2, y + 2), fill=100)
    return img, cv.h


def awning(r, S=128):
    """Canvas stripes in palette colour, verm and bone, 16 per 4 m (the material goes white)."""
    cv = Canvas(S, S, 'verm', 128)
    for k in range(1, 16, 2):
        cv.rect((k * S / 16, 0, (k + 1) * S / 16, S), 'bone', 120)
    img = cv.c
    brush(img, r, density=0.05, size=(2, 6), jitter=0.05)
    return img, cv.h



# ─────────────────────────────────────────────────────────────────────────────
# the east side of zone 2: the Ximending shophouses facing the market (1960s–70s 街屋)
# ─────────────────────────────────────────────────────────────────────────────
def goods_pharmacy(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 4, 'bone'):
        x = ox + 4
        while x < ox + ow - 10:
            w = r.randint(8, 14)
            cv.rect((x, y - r.randint(10, 16), x + w, y), r.choice(['bone', 'sky', 'lamp', 'leaf', 'bone']), 175)
            x += w + 2
    cx, cy = ox + ow - 22, oy + 18                                                                    # the red cross
    cv.rect((cx - 12, cy - 4, cx + 12, cy + 4), 'verm', 210); cv.rect((cx - 4, cy - 12, cx + 4, cy + 12), 'verm', 210)


def goods_bakery(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 3, 'walk'):
        for k in range(int((ow - 8) / 20)):
            x = ox + 5 + k * 20
            cv.ellipse((x, y - 12, x + 17, y), r.choice(['lamp', 'brick', 'lamp']), 180, 0.95)
    glass_case(cv, o, r, lambda cv, b: [cv.ellipse((b[0] + 4 + k * 14, b[1] + 3, b[0] + 16 + k * 14, b[3] - 3), 'lamp', v=1.0) for k in range(int((b[2] - b[0] - 8) / 14))])


def goods_ice(cv, o, r):
    ox, oy, ow, oh = o
    cv.rect((ox + 4, oy + 6, ox + ow - 4, oy + oh * 0.28), 'bone', 190)
    for k, t in enumerate(['紅豆牛奶冰 15', '八寶冰 20', '木瓜牛奶 25', '芒果冰 20']):
        cv.text((ox + 8 + (k % 2) * (ow - 16) / 2, oy + 12 + (k // 2) * 16), t, 12, 'verm' if k % 2 else 'ink', anchor='lt')
    cv.rect((ox + 2, oy + oh * 0.55, ox + ow - 2, oy + oh * 0.68), 'bone', 200)                          # the counter
    for k in range(int((ow - 10) / 22)):                                                                   # fruit and bowls
        x = ox + 6 + k * 22
        cv.ellipse((x, oy + oh * 0.46, x + 16, oy + oh * 0.55), r.choice(['lamp', 'verm', 'leaf']), 190)
    for k in range(3):
        x = ox + 14 + k * (ow - 28) / 3
        cv.rect((x, oy + oh * 0.8, x + 18, oy + oh * 0.84), 'leaf', 180)
        cv.line((x + 9, oy + oh * 0.84, x + 9, oy + oh * 0.97), 'ink', 2)


def goods_barber(cv, o, r):
    ox, oy, ow, oh = o
    for k in range(2):
        x = ox + 14 + k * ow * 0.45
        cv.rect((x, oy + oh * 0.1, x + ow * 0.3, oy + oh * 0.45), 'sky', 150, 0.8)                        # mirrors
        cv.rect((x + 4, oy + oh * 0.55, x + ow * 0.26, oy + oh * 0.72), 'verm', 190)                       # chairs
        cv.rect((x + 10, oy + oh * 0.72, x + ow * 0.2, oy + oh * 0.95), 'haze', 180)
    x = ox + ow - 12                                                                                        # the barber pole
    cv.rect((x, oy + 4, x + 9, oy + oh * 0.6), 'bone', 220)
    for k in range(8):
        cv.line((x, oy + 8 + k * oh * 0.07, x + 9, oy + 2 + k * oh * 0.07), 'verm' if k % 2 else 'sky', 3, 220)


def goods_gold(cv, o, r):
    ox, oy, ow, oh = o
    cv.rect((ox + 4, oy + 6, ox + ow - 4, oy + oh * 0.5), 'verm', 150, 0.8)                               # red velvet back wall
    for j in range(3):
        for i in range(int((ow - 16) / 18)):
            cv.ellipse((ox + 10 + i * 18, oy + 12 + j * oh * 0.13, ox + 20 + i * 18, oy + 22 + j * oh * 0.13), 'lamp', 200)
    glass_case(cv, o, r, lambda cv, b: [cv.rect((b[0] + 5 + k * 10, b[1] + 5, b[0] + 11 + k * 10, b[1] + 11), 'lamp') for k in range(int((b[2] - b[0] - 10) / 10))], top=0.55)


def goods_video(cv, o, r):
    ox, oy, ow, oh = o
    for y in shelves(cv, o, 5, 'haze'):
        x = ox + 4
        while x < ox + ow - 6:
            cv.rect((x, y - 15, x + 5, y), r.choice(['ink', 'ink', 'verm', 'sky', 'lamp', 'bone']), 175, 1.3)
            x += 6
    cv.rect((ox + ow * 0.3, oy + oh * 0.02, ox + ow * 0.7, oy + oh * 0.12), 'lamp', 190)
    cv.text((ox + ow * 0.5, oy + oh * 0.07), '一夜30元', 12, 'ink')


GOODS.update({'pharmacy': goods_pharmacy, 'bakery': goods_bakery, 'ice': goods_ice, 'barber': goods_barber, 'gold': goods_gold, 'video': goods_video})

EAST_GROUND = [
    [['西藥房', 'pharmacy'], ['麵包店', 'bakery']], [['冰果室', 'ice'], ['錄影帶', 'video']], [['理髮廳', 'barber'], ['銀樓', 'gold']],
    [['書局', 'books'], ['鐘錶眼鏡', 'clocks']], [['照相館', 'camera'], ['委託行', 'suits']], [['玩具 模型', 'toys'], ['皮鞋', 'shoes']],
    [['唱片行', 'records'], ['小吃 點心', 'noodles']], [['電器行', 'tv'], ['布行', 'cloth']],
]


def paint_storey(cv, x0, y0, w, h, r, kind):
    """One upper storey of a 1960s–70s Taipei shophouse, 6 m x 3.3 m: tile or wash facade, two
    windows with the iron grille cages (鐵窗), an air conditioner, a vertical sign, stains."""
    wall = r.choice(['bone', 'walk', 'haze', 'sky', 'bone', 'walk'])
    cv.rect((x0, y0, x0 + w, y0 + h), wall, 128, 0.97)
    if kind % 2 == 0:                                                                                  # mosaic tile (馬賽克磚)
        for yy in range(int(y0), int(y0 + h), 5):
            cv.line((x0, yy, x0 + w, yy), wall, 1, 118, 0.9)
        for xx in range(int(x0), int(x0 + w), 5):
            cv.line((xx, y0, xx, y0 + h), wall, 1, 118, 0.93)
    cv.rect((x0, y0 + h - 8, x0 + w, y0 + h), 'walk', 160, 0.85)                                      # the floor band
    for k in range(2):                                                                                 # windows + cages
        wx0 = x0 + w * (0.1 + k * 0.48); wx1 = wx0 + w * 0.34
        wy0, wy1 = y0 + h * 0.22, y0 + h * 0.72
        cv.rect((wx0 - 4, wy0 - 4, wx1 + 4, wy1 + 4), 'bone', 170)
        cv.rect((wx0, wy0, wx1, wy1), 'ink', 60, 1.3)
        cv.rect((wx0 + 3, wy0 + 3, (wx0 + wx1) / 2 - 1, wy1 - 3), 'sky', 70, 0.7)
        cv.rect(((wx0 + wx1) / 2 + 1, wy0 + 3, wx1 - 3, wy1 - 3), r.choice(['sky', 'lamp', 'bone']), 70, 0.75)   # a curtain in one leaf
        for i in range(8):                                                                             # the grille, standing proud
            x = wx0 - 6 + i * (wx1 - wx0 + 12) / 7
            cv.line((x, wy0 - 8, x, wy1 + 6), 'ink', 2, 230, 1.1)
        for y in (wy0 - 8, (wy0 + wy1) / 2, wy1 + 6):
            cv.line((wx0 - 6, y, wx1 + 6, y), 'ink', 2, 230, 1.1)
        if r.random() < 0.6:                                                                           # plants on the cage floor
            for i in range(3):
                cv.ellipse((wx0 + i * (wx1 - wx0) / 3, wy1 - 8, wx0 + i * (wx1 - wx0) / 3 + 14, wy1 + 6), 'leaf', 235)
    if r.random() < 0.8:                                                                               # the window air conditioner
        ax = x0 + w * r.choice([0.14, 0.62])
        cv.rect((ax, y0 + h * 0.74, ax + 34, y0 + h * 0.9), 'bone', 220)
        for i in range(4):
            cv.line((ax + 3, y0 + h * 0.76 + i * 5, ax + 31, y0 + h * 0.76 + i * 5), 'haze', 1, 200)
        cv.dc.line((ax + 17, y0 + h * 0.9, ax + 18, y0 + h), fill=(90, 90, 96), width=2)            # the drip stain
    if r.random() < 0.7:                                                                               # a vertical sign on its bracket
        sx = x0 + w * 0.5
        bg = r.choice(['verm', 'lamp', 'bone', 'sky', 'leaf'])
        name = r.choice(['旅社', '補習班', '牙科', '當舖', '裁縫', '美容院', '算命', '國術館', '會計', '中醫'])
        cv.rect((sx - 13, y0 + 6, sx + 13, y0 + 12 + len(name) * 26), bg, 225, outline='ink', ow=2)
        cv.text((sx, y0 + 10 + len(name) * 13), name, 21, 'bone' if bg in ('verm', 'leaf') else 'ink', vertical=True, height=240)


def fronts_atlas(r):
    """The east side: 8 ground floors (two 3 m shops each) and 8 upper storeys, each 6 x 3.3 m
    at 64 px/m (384 x 211), in a 4 x 4 grid: ground floors in rows 0-1, storeys in rows 2-3."""
    CW, CH = 384, 211
    cv = Canvas(CW * 4, CH * 4)
    for k in range(8):
        x0, y0 = (k % 4) * CW, (k // 4) * CH
        cv.rect((x0, y0, x0 + CW, y0 + CH), 'walk', 128)
        for j, (sign, kind) in enumerate(EAST_GROUND[k]):
            paint_unit(cv, x0 + j * CW / 2, y0, CW / 2, CH, sign, kind, r)
    for k in range(8):
        x0, y0 = (k % 4) * CW, (2 + k // 4) * CH
        paint_storey(cv, x0, y0, CW, CH, r, k)
    img = cv.c
    brush(img, r, density=0.006, size=(3, 7), jitter=0.04)
    img = img.filter(ImageFilter.SMOOTH)
    for k in range(16):
        x0, y0 = (k % 4) * CW, (k // 4) * CH
        img = multiply(img, (x0, y0, x0 + CW, y0 + CH), lambda u_, v: (0.8 + 0.2 * np.clip(v / 0.2, 0, 1) - 0.1 * np.clip((v - 0.9) / 0.1, 0, 1),) * 3)
    grime(img, r, (0, 0, cv.w, cv.h_), n=160)
    return img, cv.h


def main():
    r = random.Random(1990)
    img, h = shops_atlas(r)
    save(img, 'chunghwa-shops.webp', 72)
    # no normal map: the shop fronts render unlit, their light is painted
    img, h = ends_atlas(r)
    save(img, 'chunghwa-ends.webp', 80)
    save(normal_map(h, 2.0, 0.5), 'chunghwa-ends-n.webp', 80)
    img, h = concrete(r)
    save(img, 'chunghwa-concrete.webp', 82)
    save(normal_map(h, 1.6, 0.5), 'chunghwa-concrete-n.webp', 82)
    img, h = fronts_atlas(r)
    save(img, 'ximen-fronts.webp', 76)
    save(normal_map(h, 2.0, 0.5), 'ximen-fronts-n.webp', 80)
    img, h = awning(r)
    save(img, 'chunghwa-awning.webp', 85)


if __name__ == '__main__':
    main()
