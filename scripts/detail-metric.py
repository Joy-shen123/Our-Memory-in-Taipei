#!/usr/bin/env python3
"""Edge density and micro-contrast, the two numbers CJ's detail bar is set in.
Targets, measured from CJ's own photographs of Dihua Street: edge 29.4%, micro 0.118."""
import sys, numpy as np
from PIL import Image
for p in sys.argv[1:]:
    g = np.asarray(Image.open(p).convert("L").resize((1400, 900))).astype(float)/255
    gx = np.abs(np.diff(g, axis=1))[:-1, :]; gy = np.abs(np.diff(g, axis=0))[:, :-1]
    edge = (np.hypot(gx, gy) > 0.055).mean()
    h, w = g.shape; b = 16
    micro = g[:h//b*b, :w//b*b].reshape(h//b, b, w//b, b).std(axis=(1, 3)).mean()
    print(f"{p}\n  edge density {edge*100:5.1f}%   (target 29.4%)\n  micro-contrast {micro:.3f}   (target 0.118)")
