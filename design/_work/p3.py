"""Brute-force: find ONE hex per case that clears 3:1 on all nine fields.
Also report which fields are binding, and the mutual contrast between the three."""
from audit import ratio, hue, lum
import colorsys

def rgbhex(t):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(c)))) for c in t)

FIELDS = {
    'overview': '#8c1b2e',
    'workbook': '#efe6d4',
    'trend':    '#0e3a2c',
    'marquee':  '#d19118',
    'futures':  '#171310',
    'margins':  '#2f6b34',
    'ledger':   '#f7f3e8',
    'method':   '#e05a2a',
    'footer':   '#241d18',
}

def score(c):
    return min(ratio(c, f) for f in FIELDS.values())

# coarse grid over the sRGB cube, step 6 (about 43^3 = 80k, fine)
best = []
for r in range(0, 256, 5):
    for g in range(0, 256, 5):
        for b in range(0, 256, 5):
            c = '#%02x%02x%02x' % (r, g, b)
            s = score(c)
            if s >= 3.0:
                best.append((s, c))

print('hexes clearing 3:1 on ALL nine fields:', len(best))
# group by dominant hue family and take the strongest few per family
byfam = {}
for s, c in best:
    h = hue(c)
    fam = 'red' if h < 20 or h >= 340 else 'orange' if h < 45 else 'yellow' if h < 70 else \
          'green' if h < 170 else 'teal' if h < 185 else 'BLUE' if h < 265 else 'violet' if h < 300 else 'magenta' if h < 340 else 'red'
    byfam.setdefault(fam, []).append((s, c))

for fam in sorted(byfam):
    lst = sorted(byfam[fam], reverse=True)
    print(f'\n{fam}: {len(lst)} candidates; top:')
    for s, c in lst[:6]:
        print(f'   {c} min={s:.2f} h={hue(c):.0f} L={lum(c):.4f}')
    # most saturated / most distinctive member
    def sat(c):
        r, g, b = [int(c[i:i+2], 16) / 255 for i in (1, 3, 5)]
        hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
        return ss
    lst2 = sorted(lst, key=lambda t: -sat(t[1]))
    print('   most saturated:')
    for s, c in lst2[:4]:
        print(f'   {c} min={s:.2f} h={hue(c):.0f} S={sat(c):.2f} L={lum(c):.4f}')

# pick one strong per family and test mutual separation
picks = {}
for fam in ('red', 'orange', 'yellow', 'green'):
    if fam not in byfam:
        continue
    lst = sorted(byfam[fam], key=lambda t: -((t[0] - 3) * 0.4 + (lambda c: (lambda x: x[1])(colorsys.rgb_to_hls(*[int(c[i:i+2],16)/255 for i in (1,3,5)])))(t[1]) * 1.0))
    picks[fam] = lst[0][1]
print('\npicks:', picks)
print('mutual ratios:')
for a in picks:
    for b in picks:
        if a < b:
            print(f'   {a}/{b}: {ratio(picks[a], picks[b]):.2f}')

print('\nfull table for picks:')
for fam, c in picks.items():
    print(f'{fam:<7} {c}', ' '.join(f'{n[:4]}:{ratio(c, f):.2f}' for n, f in FIELDS.items()))
