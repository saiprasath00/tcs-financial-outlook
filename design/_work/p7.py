"""Step 3: how dark/light can each field be pushed so that ONE hex clears 3:1 across all?
Loss is multiplicative per field: each field contributes (Lf+.05)/(F+.05) for the binding side."""
from audit import ratio, lum, hue

base = {
    'overview': '#8c1b2e', 'workbook': '#efe6d4', 'trend': '#0e3a2c', 'futures': '#161311',
    'margins': '#2a6a3e', 'ledger': '#f6f0e3', 'method': '#d9532b',
}
L = {k: lum(v) for k, v in base.items()}
print('current luminances:')
for k, v in L.items():
    print(f'  {k:<9} {base[k]} L={v:.4f}')

print('\nfeasible F window per field for 3:1 floor:')
need = 3.0
for k, l in L.items():
    print(f'  {k:<9} F must be >= {need*(l+0.05)-0.05:.4f} or <= {(l+0.05)/need-0.05:.4f}')

# Consider: every field must be on the SAME side of F. Either all-dark fields (F big)
# or all-light fields (F small).
print('\nOption A — all fields dark (F ≈ 0.25): each field L must be >= F*3+... i.e. light enough')
print('  for F=0.25: each field L must be >= 3*(Lf+.05)-.05 => Lf <= (F+.05)/3-.05')
for F in (0.18, 0.22, 0.25, 0.30, 0.35):
    print(f'  F={F:.2f}: all fields need L <= {(F+.05)/3-0.05:.4f}  and fields stay distinguishable')
print()
print('Option B — all fields light (F ≈ 0.08): each field L must be <= 3*(Lf+.05)-.05')
for F in (0.03, 0.06, 0.08, 0.10):
    print(f'  F={F:.2f}: all fields need L <= {3*(F+.05)-0.05:.4f}')
