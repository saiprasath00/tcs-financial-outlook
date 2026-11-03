"""Per-case dual ink: each case has a LIGHT variant (for dark fields) and a DARK variant
(for light fields). Under the WCAG 3:1 rule for graphical objects, a stroke that is >=3:1
against what is directly adjacent to it (the field it is drawn on) passes; the pair is
chosen so that each case's identity survives because BOTH variants sit in the same hue
family, well clear of the other two cases' families."""
from audit import ratio, hue, lum
import colorsys, itertools

def rgbhex(t):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(c)))) for c in t)

def hsl2hex(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360, l, s)
    return rgbhex((r * 255, g * 255, b * 255))

FIELDS = [
    ('overview', '#8c1b2e', 'dark'),
    ('workbook', '#efe6d4', 'light'),
    ('trend',    '#0e3a2c', 'dark'),
    ('marquee',  '#d19118', 'mid'),
    ('futures',  '#171310', 'dark'),
    ('margins',  '#2f6b34', 'dark'),
    ('ledger',   '#f7f3e8', 'light'),
    ('method',   '#e05a2a', 'mid'),
    ('footer',   '#241d18', 'dark'),
]

CAND = {
    'bear-light': ['#7ef0b8', '#5fe3a4', '#86efac', '#4ade80', '#6ee7b7', '#34d399'],
    'bear-dark':  ['#0f7a4d', '#0b6b43', '#157a4e', '#0d7347', '#12795c'],
    'base-light': ['#ffc9a8', '#ffb899', '#ffd0a0', '#f8c39a'],
    'base-dark':  ['#8f1130', '#7d1b2e', '#a01a24', '#991b2f', '#8c1b2e'],
    'bull-light': ['#fde68a', '#fcd34d', '#ffd93d', '#f5d76e', '#eab308'],
    'bull-dark':  ['#7a5a05', '#6b4f00', '#8a6508', '#7c5c0a'],
}

print('per-field contrast of every candidate:')
for k, vals in CAND.items():
    print(f'\n{k}')
    for c in vals:
        row = ' '.join(f'{n[:4]}:{ratio(c, f):5.2f}' for n, f, _ in FIELDS)
        print(f'  {c} h={hue(c):5.1f} L={lum(c):.3f} {row}')

print('\n--- evaluate a concrete assignment ---')
def check(assign, lightfields, darkfields, midfields):
    ok = True
    for case, (cl, cd) in assign.items():
        for n, f, k in FIELDS:
            use = cl if k in lightfields else cd if k in darkfields else None
            if use is None:
                print(f'  {case} {n} UNASSIGNED'); ok = False; continue
            r = ratio(use, f)
            if r < 3.0:
                print(f'  FAIL {case} {n}: {use} on {f} = {r:.2f}'); ok = False
    return ok

# marquee #d19118 (L .339) and method #e05a2a (L .233) are the mid fields.
# test: which ink works on the mid fields for each case?
for n, f, k in FIELDS:
    if k != 'mid':
        continue
    print(f'\nmid field {n} {f}:')
    for case in ('bear', 'base', 'bull'):
        light_best = sorted(CAND[case + '-light'], key=lambda c: -ratio(c, f))[:2]
        dark_best = sorted(CAND[case + '-dark'], key=lambda c: -ratio(c, f))[:2]
        print(f'  {case:<5} light:', ', '.join(f'{c}={ratio(c,f):.2f}' for c in light_best),
              '| dark:', ', '.join(f'{c}={ratio(c,f):.2f}' for c in dark_best))
