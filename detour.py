#!/usr/bin/env python3
"""Detoure les photos produit OMIUS (fond blanc) -> PNG transparent.
Flood-fill depuis les bords: retire uniquement le blanc connecte au bord,
preserve le blanc givre interieur de la bouteille."""
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

SRC = {
    'puregrain': 'medias-cover-1762277896977.jpg',
    'mangue':    'medias-cover-1762277651504.jpg',
    'redberry':  'medias-cover-1762277781144 (1).jpg',
    'peche':     'medias-cover-1762277480489.jpg',
}
DL = '/Users/pratenzo/Downloads/'
OUT = 'assets/'

def detour(path):
    im = Image.open(path).convert('RGB')
    a = np.array(im).astype(np.int16)
    h, w, _ = a.shape
    mn = a.min(axis=2); mx = a.max(axis=2)
    # fond = blanc quasi neutre
    bg = (mn > 234) & ((mx - mn) < 18)

    # BFS depuis tous les pixels de bord marques bg
    visited = np.zeros((h, w), bool)
    dq = deque()
    for x in range(w):
        for y in (0, h-1):
            if bg[y, x] and not visited[y, x]:
                visited[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w-1):
            if bg[y, x] and not visited[y, x]:
                visited[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y+dy, x+dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and bg[ny, nx]:
                visited[ny, nx] = True; dq.append((ny, nx))

    alpha = np.where(visited, 0, 255).astype(np.uint8)
    aimg = Image.fromarray(alpha)
    # erosion 1px (retire le liseré blanc du bord) puis leger flou
    aimg = aimg.filter(ImageFilter.MinFilter(3))
    aimg = aimg.filter(ImageFilter.GaussianBlur(0.8))
    alpha = np.array(aimg)

    rgba = np.dstack([np.array(im), alpha])
    out = Image.fromarray(rgba, 'RGBA')
    # crop bbox
    ys, xs = np.where(alpha > 12)
    pad = 6
    y0, y1 = max(0, ys.min()-pad), min(h, ys.max()+pad)
    x0, x1 = max(0, xs.min()-pad), min(w, xs.max()+pad)
    out = out.crop((x0, y0, x1, y1))
    return out

for key, fn in SRC.items():
    im = detour(DL + fn)
    dst = OUT + f'bottle-{key}.png'
    im.save(dst)
    print(f'{key:10s} -> {dst}  {im.size}  ratio {im.size[0]/im.size[1]:.3f}')
