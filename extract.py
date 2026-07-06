#!/usr/bin/env python3
"""Region-growing background removal for OMIUS frames (smooth-gradient bg)."""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

FRAMES = "assets/frames"

def region_bg_mask(rgb, local_tol=26, white_protect=182, sat_lock=True):
    """BFS from border pixels; grow into smooth-gradient background.
    Returns boolean mask where True = background."""
    h, w, _ = rgb.shape
    arr = rgb.astype(np.int16)
    bg = np.zeros((h, w), dtype=bool)
    seen = np.zeros((h, w), dtype=bool)
    dq = deque()
    # min-channel: white bottle has high min; colored bg lower
    mn = arr.min(axis=2)
    for x in range(w):
        for y in (0, h - 1):
            if not seen[y, x]:
                seen[y, x] = True; bg[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if not seen[y, x]:
                seen[y, x] = True; bg[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        cy = arr[y, x]
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y+dy, x+dx
            if 0<=ny<h and 0<=nx<w and not seen[ny, nx]:
                seen[ny, nx] = True
                p = arr[ny, nx]
                if white_protect and mn[ny, nx] > white_protect:
                    continue  # protect bright bottle body
                if int(abs(int(p[0])-int(cy[0]))) <= local_tol and \
                   int(abs(int(p[1])-int(cy[1]))) <= local_tol and \
                   int(abs(int(p[2])-int(cy[2]))) <= local_tol:
                    bg[ny, nx] = True
                    dq.append((ny, nx))
    return bg

def largest_component(fg):
    """Keep only the largest 4-connected True component of fg."""
    h, w = fg.shape
    lbl = np.zeros((h, w), dtype=np.int32)
    cur = 0; best = 0; best_size = 0
    for sy in range(h):
        for sx in range(w):
            if fg[sy, sx] and lbl[sy, sx] == 0:
                cur += 1; size = 0
                dq = deque([(sy, sx)]); lbl[sy, sx] = cur
                while dq:
                    y, x = dq.popleft(); size += 1
                    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny, nx = y+dy, x+dx
                        if 0<=ny<h and 0<=nx<w and fg[ny,nx] and lbl[ny,nx]==0:
                            lbl[ny,nx]=cur; dq.append((ny,nx))
                if size > best_size:
                    best_size = size; best = cur
    return lbl == best

def fill_holes(fg):
    """Fill enclosed holes: flood 'outside' from border on ~fg, holes = ~fg & ~outside."""
    h, w = fg.shape
    outside = np.zeros((h, w), dtype=bool)
    dq = deque()
    for x in range(w):
        for y in (0, h-1):
            if not fg[y, x] and not outside[y, x]:
                outside[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w-1):
            if not fg[y, x] and not outside[y, x]:
                outside[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y+dy, x+dx
            if 0<=ny<h and 0<=nx<w and not fg[ny,nx] and not outside[ny,nx]:
                outside[ny,nx] = True; dq.append((ny,nx))
    return fg | (~outside)

def sat_fg_mask(rgb, sat_thr=0.22, dark_v=40):
    """Foreground = low-saturation (white bottle / silver cap) region."""
    arr = rgb.astype(np.float32)
    mx = arr.max(axis=2); mn = arr.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    lowsat = (sat < sat_thr) & (mx > dark_v)
    fg = largest_component(lowsat)
    fg = fill_holes(fg)
    return fg

def highsat_mask(rgb, sat_thr=0.35, min_v=45):
    """Foreground = high-saturation colored glyphs (for wordmark on pale bg)."""
    arr = rgb.astype(np.float32)
    mx = arr.max(axis=2); mn = arr.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    return (sat > sat_thr) & (mx > min_v)

def process(frame, box, out, mode="bottle", tol=26, wp=182, feather=1.2,
            sat_thr=0.22, method="sat"):
    im = Image.open(f"{FRAMES}/{frame}").convert("RGB")
    im = im.crop(box)
    rgb = np.asarray(im)
    if method == "sat":
        fg = sat_fg_mask(rgb, sat_thr=sat_thr)
    elif method == "word":
        fg = highsat_mask(rgb, sat_thr=sat_thr)
    elif method == "fruit":
        fg = highsat_mask(rgb, sat_thr=sat_thr)
        fg = largest_component(fg)
        fg = fill_holes(fg)
    else:
        bg = region_bg_mask(rgb, local_tol=tol, white_protect=wp)
        fg = ~bg
        if mode in ("bottle", "fruit"):
            fg = largest_component(fg)
    alpha = (fg * 255).astype(np.uint8)
    a_img = Image.fromarray(alpha, "L")
    if feather:
        a_img = a_img.filter(ImageFilter.GaussianBlur(feather))
    out_im = im.convert("RGBA")
    out_im.putalpha(a_img)
    # autotrim to content bbox
    bbox = out_im.getbbox()
    if bbox:
        out_im = out_im.crop(bbox)
    out_im.save(out)
    print(f"{out}  size={out_im.size}")

if __name__ == "__main__":
    # name -> (frame, box, out, sat_thr, method)
    jobs = {
        "redbottle":  ("frame_003.jpg", (338,272,636,1330), "assets/bottle-redberry.png", 0.24, "sat"),
        "bluebottle": ("frame_013.jpg", (338,272,636,1330), "assets/bottle-puregrain.png", 0.20, "sat"),
        "peachbottle":("frame_006.jpg", (338,272,636,1200), "assets/bottle-peche.png", 0.24, "sat"),
        "mangobottle":("frame_008.jpg", (338,272,636,1330), "assets/bottle-mangue.png", 0.24, "sat"),
        # fruits (high-saturation cutout)
        "mango":  ("frame_008.jpg", (404,806,884,1300), "assets/fruit-mango.png", 0.30, "fruit"),
        "peach":  ("frame_006.jpg", (300,1150,715,1575), "assets/fruit-peach.png", 0.30, "fruit"),
        # wordmark logo (solid crimson glyphs on white bottle) -> recolorable mask
        "wordmark": ("frame_002.jpg", (88,655,778,918), "assets/logo-omius.png", 0.34, "word"),
    }
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    for k,(f,b,o,s,m) in jobs.items():
        if which in ("all", k):
            process(f, b, o, sat_thr=s, method=m)
