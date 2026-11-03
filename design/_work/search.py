"""Search non-blue palettes: fields, inks, case colours. Prints candidate sets."""
from audit import hex2rgb, lum, ratio, hue, is_blue, mix

def rgbhex(t):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(c)))) for c in t)

def hsl2hex(h, s, l):
    import colorsys
    r, g, b = colorsys.hls_to_rgb(h / 360, l, s)
    return rgbhex((r * 255, g * 255, b * 255))

print('=== candidate light papers (hue 35-100, warm ochre/olive/parchment) ===')
for h in (38, 44, 50, 56, 62, 70):
    for s in (0.10, 0.14, 0.18):
        for l in (0.90, 0.92, 0.94):
            c = hsl2hex(h, s, l)
            print(c, 'h=%3d s=%.2f L=%.2f' % (hue(c), s, l) if False else 'h=%3.0f s=%.2f' % (hue(c), s),
                  'lum=%.3f' % lum(c))

print()
print('=== candidate dark neutrals (warm charcoal / black-brown) ===')
for h in (20, 26, 30, 34, 40):
    for s in (0.06, 0.10, 0.14):
        for l in (0.035, 0.06, 0.09):
            c = hsl2hex(h, s, l)
            print(c, 'h=%3.0f  lum=%.4f  ratio vs paper %.1f' % (hue(c), lum(c), ratio(c, '#f3ebd8')))

print()
print('=== candidate saturated fields ===')
for name, h, s, l in [
    ('crimson', 352, 0.70, 0.29), ('oxblood', 348, 0.62, 0.26), ('garnet', 345, 0.55, 0.28),
    ('lacquer', 356, 0.66, 0.33), ('teal', 183, 0.82, 0.24), ('teal2', 178, 0.80, 0.22),
    ('umber', 28, 0.72, 0.26), ('marigold', 40, 0.85, 0.48), ('tangerine', 20, 0.90, 0.52),
    ('plum', 330, 0.55, 0.26), ('saskatoon', 344, 0.50, 0.30),
]:
    c = hsl2hex(h, s, l)
    print('%-11s %s h=%3.0f lum=%.4f' % (name, c, hue(c), lum(c)))
