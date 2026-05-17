export default function LogoMark({ size = 32, variant = 'white', color }) {
  const w = size * 2.4;
  const colors = { white: '#ffffff', accent: '#fa243c', dim: '#b0b0b0' };
  const stroke = color || colors[variant] || colors.white;
  return (
    <svg width={w} height={size} viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="EHXIS" style={{ display: 'block' }}>
      <rect x="6"   y="18" width="104" height="64" rx="32" stroke={stroke} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="130" y="18" width="104" height="64" rx="32" stroke={stroke} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="104" y="40" width="32"  height="20" rx="4"  fill={stroke} opacity="0.85" />
    </svg>
  );
}
