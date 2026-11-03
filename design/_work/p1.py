from audit import ratio, hue, lum, is_blue, hex2rgb

FIELDS = [
    ('overview', '#8c1b2e'),
    ('workbook', '#efe6d4'),
    ('trend',    '#0e3a2c'),
    ('marquee',  '#d19118'),
    ('futures',  '#171310'),
    ('margins',  '#2f6b34'),
    ('ledger',   '#f7f3e8'),
    ('method',   '#e05a2a'),
    ('footer',   '#241d18'),
]
inks = ['#fff6e6', '#1b1512', '#2a1a16']
for n, f in FIELDS:
    print(f'{n:<9} {f} h={hue(f):5.0f} lum={lum(f):.4f}', end='  ')
    for i in inks:
        r = ratio(f, i)
        print(f'{i}:{r:5.2f}', end='  ')
    print()

print()
pairs = {
 'marquee ink dark': ('#d19118', '#1b1512'),
 'marquee ink deep-red': ('#d19118', '#4a1410'),
 'method ink': ('#e05a2a', '#241310'),
}
for k, (a, b) in pairs.items():
    print(f'{k:<24} {ratio(a,b):.2f}')

print()
print('neighbour field deltas (lum ratio between adjacent fields):')
for i in range(len(FIELDS) - 1):
    a = FIELDS[i][1]; b = FIELDS[i + 1][1]
    print(f'  {FIELDS[i][0]:>8} -> {FIELDS[i+1][0]:<9} {ratio(a,b):5.2f}')

print()
CASES = {
 'Bear  #0f6b45': '#0f6b45',
 'Bear  #0c6b48': '#0c6b48',
 'Base  #c4162f': '#c4162f',
 'Base  #b8142c': '#b8142c',
 'Bull  #a8781a': '#a8781a',
 'Bull  #b8860b': '#b8860b',
 'Bull  #aa7c10': '#aa7c10',
 'BearL #1fa870': '#1fa870',
 'BullL #e0a523': '#e0a523',
 'BaseL #b81b32': '#b81b32',
}
print('case colours vs all nine fields (floor 3.0):')
hdr = ''.join(f'{n:>9}' for n, _ in FIELDS)
print(f'{"":<14}' + ''.join(f'{n[:6]:>8}' for n, _ in FIELDS))
for cn, c in CASES.items():
    vals = [ratio(c, f) for _, f in FIELDS]
    fails = [FIELDS[i][0] for i, v in enumerate(vals) if v < 3.0]
    print(f'{cn:<14}' + ''.join(f'{v:8.2f}' for v in vals), ' FAIL:' + ','.join(fails) if fails else '')

print()
print('case colours vs each other (want >= 2.0 pairwise):')
names = list(CASES)
for i in range(len(names)):
    for j in range(i + 1, len(names)):
        r = ratio(CASES[names[i]], CASES[names[j]])
        print(f'  {names[i]} / {names[j]}: {r:.2f}')
