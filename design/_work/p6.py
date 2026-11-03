"""Seven-field system. Find three case hexes (green / red / gold) that each clear 3:1
against ALL seven fields. Feasibility window per field-pair is strict, so search the
luminance window F in [0.12, 0.27] and all hues, and report the best per family."""
from audit import ratio, hue, lum, hex2rgb
import colorsys

def rgbhex(t):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(c)))) for c in t)

def hsl2hex(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360, l, s)
    return rgbhex((r * 255, g * 255, b * 255))

FIELDS = [
    ('overview', '#8c1b2e'),
    ('workbook', '#efe6d4'),
    ('trend',    '#0e3a2c'),
    ('futures',  '#161311'),
    ('margins',  '#2a6a3e'),
    ('ledger',   '#f6f0e3'),
    ('method',   '#d9532b'),
    ('marquee',  '#d9532b'),
    ('footer',   '#161311'),
]
UNIQ = []
for n, f in FIELDS:
    if f not in [u[1] for u in UNIQ]:
        UNIQ.append((n, f))
print('unique fields:', [u[1] for u in UNIQ])
for n, f in UNIQ:
    print(f'  {n:<9} {f} L={lum(f):.4f} h={hue(f):.0f}')

def worst(c):
    return min(ratio(c, f) for _, f in UNIQ)

best = {}
for h in range(0, 360, 2):
    for s in (0.55, 0.65, 0.75, 0.85, 0.95, 1.0):
        for l in [x / 200 for x in range(20, 62)]:
            c = hsl2hex(h, s, l)
            if any(hue(c) >= 185 - 0 and hue(c) <= 265 for _ in [0]) and 185 <= hue(c) <= 265:
                continue
            w = worst(c)
            if w >= 3.0:
                fam = 'green' if 70 <= hue(c) < 170 else 'teal' if 170 <= hue(c) < 185 else \
                      'red' if (hue(c) < 20 or hue(c) >= 330) else 'orange' if hue(c) < 45 else \
                      'gold' if hue(c) < 70 else 'other'
                key = (fam, round(s))
                if key not in best or w > best[key][0]:
                    best[key] = (w, c, hue(c), s, l)

print(f'\nfeasible family/step combos: {len(best)}')
for k in sorted(best):
    w, c, hh, s, l = best[k]
    print(f'  {k[0]:<6} s={k[1]:.2f} {c} worst={w:.2f} h={hh:.0f} L={lum(c):.3f}')

# global ranking: prefer high worst-ratio, high saturation, big hue distance from neighbours
print('\nTOP 12 by worst-ratio then saturation:')
top = sorted(best.values(), key=lambda t: (-(t[0] * 0.5 + t[3] * 1.0)))[:12]
for w, c, hh, s, l in top:
    print(f'  {c} worst={w:.2f} h={hh:.0f} s={s:.2f} L={lum(c):.3f}')
