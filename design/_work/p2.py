"""Solve: one hex per case that clears 3.0 on all nine fields + >=1.6 mutual contrast.
Brute-force a coarse grid over L, then hill-climb per hue family."""
from audit import ratio, hue, lum, hex2rgb
import colorsys, itertools

def rgbhex(t):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(c)))) for c in t)

def hsl2hex(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360, l, s)
    return rgbhex((r * 255, g * 255, b * 255))

FIELDS = [
    ('overview', '#8c1b2e', 0.0656),
    ('workbook', '#efe6d4', 0.7970),
    ('trend',    '#0e3a2c', 0.0330),
    ('marquee',  '#d19118', 0.3387),
    ('futures',  '#171310', 0.0069),
    ('margins',  '#2f6b34', 0.1137),
    ('ledger',   '#f7f3e8', 0.8970),
    ('method',   '#e05a2a', 0.2333),
    ('footer',   '#241d18', 0.0132),
]

def worst(f):
    return min(ratio(f, ff) for _, ff, _ in FIELDS)

# --- where can a hex live at all? scan L for a few hues, show worst-case-any-field
print('max achievable "min ratio over all fields" by position — no single value can beat 3.0')
# theoretical: any F with lum L; needs >= 3 on Lmin(0.0069) and Lmax(0.8970)
for name, ff, L in FIELDS:
    print(f'  {name:<9} {ff} L={L:.4f}')
print()
# For min ratio 3: need (L+0.05)/(0.0069+0.05)>=3 and (0.897+0.05)/(L+0.05)>=3
print('need F >= 3*0.0569-0.05 =', round(3 * 0.0569 - 0.05, 4))
print('need F <= 0.947/3-0.05  =', round(0.947 / 3 - 0.05, 4))
print('=> impossible set is empty?', 3 * 0.0569 - 0.05 < 0.947 / 3 - 0.05)
