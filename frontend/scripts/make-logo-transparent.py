#!/usr/bin/env python3
"""Remove solid edge-connected backgrounds from PNGs (logo, favicon, login hero)."""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image


def remove_edge_background(src_path: str, dst_path: str, tol: int = 38) -> None:
    img = Image.open(src_path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    bg = pixels[0, 0][:3]

    def match(c: tuple[int, int, int]) -> bool:
        return all(abs(c[i] - bg[i]) <= tol for i in range(3))

    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if match(pixels[x, y][:3]):
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if match(pixels[x, y][:3]):
                q.append((x, y))

    while q:
        x, y = q.popleft()
        if visited[y][x]:
            continue
        if not match(pixels[x, y][:3]):
            continue
        visited[y][x] = True
        r, g, b, _a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                q.append((nx, ny))

    img.save(dst_path, optimize=True)


if __name__ == "__main__":
    root = str(Path(__file__).resolve().parent.parent)
    if len(sys.argv) >= 2:
        inp, out = sys.argv[1], sys.argv[2] if len(sys.argv) >= 3 else sys.argv[1]
        remove_edge_background(inp, out)
    else:
        remove_edge_background(f"{root}/src/assets/command-center-logo.png", f"{root}/src/assets/command-center-logo.png")
        remove_edge_background(f"{root}/public/favicon.png", f"{root}/public/favicon.png")
        hero = f"{root}/src/assets/login-hero.png"
        remove_edge_background(hero, hero)
        print("Updated command-center-logo.png, favicon.png, and login-hero.png")
