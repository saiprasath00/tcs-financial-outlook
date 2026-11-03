"""Contrast + hue workbench for design/colours.css (throwaway tooling, not shipped)."""
import colorsys, re, sys, json

def hex2rgb(h):
    h = h.strip().lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def lum(h):
    r, g, b = hex2rgb(h)
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def hsl(h):
    r, g, b = [x / 255 for x in hex2rgb(h)]
    hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    return hh * 360, ss * 100, ll * 100

def hue(h):
    return hsl(h)[0]

def is_blue(h):
    return 185 <= hue(h) <= 265

def mix(a, b, t):
    """like CSS color-mix: t of a, (1-t) of b, straight sRGB (approximation of oklab)"""
    A, B = hex2rgb(a), hex2rgb(b)
    out = tuple(round(A[i] * t + B[i] * (1 - t)) for i in range(3))
    return '#%02x%02x%02x' % out

def table(fields, inks, extra=()):
    rows = []
    for name, f in fields:
        pass

def rep(label, a, b, floor=None):
    x = ratio(a, b)
    flag = ''
    if floor and x < floor:
        flag = '  <-- FAIL'
    print(f'{label:<46} {a} on {b}  {x:6.2f}{flag}')
    return x

if __name__ == '__main__':
    print('self-test: #fff vs #000 =', round(ratio('#ffffff', '#000000'), 2))
    for h in ['#1f2bd0', '#080c26', '#0c6e74', '#b22a4e', '#ff7043', '#f3ebd8', '#fff0e7', '#12123a']:
        print(h, 'hue=%.0f' % hue(h), 'isblue=', is_blue(h), 'lum=%.4f' % lum(h))
