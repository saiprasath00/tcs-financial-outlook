"""Full solve: find seven flat fields + three universal case hexes.
Fields keep their hue identities but chroma may be reduced until ONE hex per case
clears the 3:1 graphical floor on every field.
Output: the sharpest (most saturated) field set that still admits the cases."""
from audit import ratio, lum, hue, hex2rgb
import colorsys, itertools

def rgbhex(t):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(c)))) for c in t)

def lch(h, c, l):   # treat c as chroma proxy in HSL saturation terms
    r, g, b = colorsys.hls_to_rgb(h / 360, l, c)
    return rgbhex((r * 255, g * 255, b * 255))

# field hue identities (all outside 185-265)
HUE = {'overview': 350, 'workbook': 40, 'trend': 161, 'futures': 24, 'margins': 139, 'ledger': 41, 'method': 14}
# light fields sit at high L, dark at low L
SIDE = {'overview': 'dark', 'workbook': 'light', 'trend': 'dark', 'futures': 'dark',
        'margins': 'dark', 'ledger': 'light', 'method': 'mid'}

def build(sat_dark, sat_light, sat_mid, Ldark, Llight, Lmid):
    out = {}
    for k, h in HUE.items():
        if SIDE[k] == 'dark':
            out[k] = lch(h, sat_dark, Ldark)
        elif SIDE[k] == 'light':
            out[k] = lch(h, sat_light, Llight)
        else:
            out[k] = lch(h, sat_mid, Lmid)
    return out

def feasible(F, fields, need=3.0):
    return all(ratio(F, f) >= need for f in fields.values())

def in_blue(c):
    return 185 <= hue(c) <= 265

# search the case hexes on a fine grid, prefer high saturation
def best_case(fields, hue_ranges):
    found = []
    for h in range(0, 360):
        if 185 <= h <= 265:
            continue
        fam = None
        for name, lo, hi in hue_ranges:
            if lo <= h <= hi:
                fam = name
        if not fam:
            continue
        for s in (1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6):
            for L in [x / 1000 for x in range(80, 360, 2)]:
                c = lch(h, s, L)
                if in_blue(c):
                    continue
                if feasible(c, fields):
                    found.append((fam, s, c, h, L))
                    break
            else:
                continue
    return found

hue_ranges = [('green', 85, 170), ('red', 335, 25), ('gold', 38, 70)]

best_combo = None
for Ld, Ll, Lm in [(l / 100 for l in range(6, 14)) for _ in [0]][0:0] or []:
    pass

results = []
for Ldark in (0.09, 0.10, 0.11, 0.12, 0.13, 0.14):
    for Llight in (0.86, 0.88, 0.90):
        for sd in (0.55, 0.65, 0.75):
            for sl in (0.25, 0.35, 0.45):
                # mid field L chosen so it balances: must be dark enough that a light case works
                for Lmid in (0.14, 0.16, 0.18):
                    for sm in (0.55, 0.70, 0.85):
                        fields = build(sd, sl, sm, Ldark, Llight, Lmid)
                        found = best_case(fields, hue_ranges)
                        fams = {}
                        for fam, s, c, h, L in found:
                            fams.setdefault(fam, []).append((s, c, h, L))
                        if len(fams) == 3:
                            results.append(((Ldark, Llight, Lmid, sd, sl, sm), fields, fams))

print('configurations where all three case families work:', len(results))
for cfg, fields, fams in results[:8]:
    print('\ncfg Ld/Ll/Lm=%s sat=%s' % (cfg[:3], cfg[3:]))
    print('  fields:', fields)
    for fam in fams:
        best = max(fams[fam])
        print(f'    {fam:<6} most saturated = {best[1]} h={best[2]} L={best[3]:.3f} s={best[0]:.2f}')
