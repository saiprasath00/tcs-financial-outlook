from audit import ratio, lum, hue
import itertools

FIELDS = {
    'overview': '#8c1b2e', 'workbook': '#efe6d4', 'trend': '#0e3a2c', 'marquee': '#d19118',
    'futures': '#171310', 'margins': '#2f6b34', 'ledger': '#f7f3e8', 'method': '#e05a2a',
    'footer': '#241d18',
}
L = {k: lum(v) for k, v in FIELDS.items()}

def feasible_band(a, b, need=3.0):
    """luminance window F such that ratio(F,a)>=need and ratio(F,b)>=need"""
    lo = max(L[a], L[b]); hi = min(L[a], L[b])
    # F must be >= need*(hi+0.05)-0.05  and  F <= (lo+0.05)/need - 0.05
    f_lo = need * (hi + 0.05) - 0.05
    f_hi = (lo + 0.05) / need - 0.05
    return f_lo, f_hi, f_lo <= f_hi

print('feasibility of a single 3:1 colour across each pair of fields:')
bad = []
for a, b in itertools.combinations(FIELDS, 2):
    lo, hi, ok = feasible_band(a, b)
    if not ok:
        bad.append((a, b, ratio(FIELDS[a], FIELDS[b])))
bad.sort(key=lambda t: -t[2])
print(f'{len(bad)} of {len(list(itertools.combinations(FIELDS,2)))} pairs are impossible:')
for a, b, r in bad[:20]:
    print(f'   {a:<9} vs {b:<9} field-vs-field ratio {r:5.2f}')

print()
print('=> the design constraint: any two fields that a 2px case stroke must survive must')
print('   differ by AT MOST 3:1 in luminance (in fact <= ~2.6 for margin).')
