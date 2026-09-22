# bollard.py — a pavement bollard as a stylized glb (issue #5 step 3, instanced at kerbs and the
# pedestrian-zone entry).
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/bollard.py -- --out asset/models/bollard.glb [--preview x.png] [--stats]
#
# 0.9 m tall, 0.3 m across: a concrete ('haze') post with a domed top and a pale ring around it.
# Origin at the base centre. Lathes only, no bevel (they are round already). Shared mechanics
# in stylized.py.

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_lathe


def post():
    prof = [(0, 0), (0.15, 0), (0.15, 0.72), (0.12, 0.84), (0, 0.9)]
    S.solid('post', 'haze', lambda bm: bm_lathe(bm, prof, n=12), bevel=0)


def ring():
    """A pale band standing 1.5 cm proud of the post, two thirds up."""
    prof = [(0.15, 0.55), (0.165, 0.56), (0.165, 0.61), (0.15, 0.62)]
    S.solid('ring', 'bone', lambda bm: bm_lathe(bm, prof, n=12), bevel=0)


def build():
    post()
    ring()


if __name__ == '__main__':
    S.run(build, camera=None)
