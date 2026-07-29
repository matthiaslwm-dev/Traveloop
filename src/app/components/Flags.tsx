const STAR_POINTS =
  "0,-1 0.2234,-0.3074 0.9511,-0.309 0.3614,0.1174 0.5878,0.809 0,0.38 -0.5878,0.809 -0.3614,0.1174 -0.9511,-0.309 -0.2234,-0.3074";

function Star({
  cx,
  cy,
  scale,
  fill = "#fff",
}: {
  cx: number;
  cy: number;
  scale: number;
  fill?: string;
}) {
  return (
    <polygon
      points={STAR_POINTS}
      fill={fill}
      transform={`translate(${cx} ${cy}) scale(${scale})`}
    />
  );
}

export function USFlag({ className }: { className?: string }) {
  const stripeH = 20 / 13;
  const whiteRows = [1, 3, 5, 7, 9, 11];
  const dots = Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 4 }, (_, col) => ({
      cx: 2.2 + col * 2.6,
      cy: 1.9 + row * 1.9,
    }))
  ).flat();

  return (
    <svg className={className} viewBox="0 0 30 20" role="img" aria-label="United States flag">
      <rect width="30" height="20" fill="#B31942" />
      {whiteRows.map((row) => (
        <rect key={row} x="0" y={row * stripeH} width="30" height={stripeH} fill="#fff" />
      ))}
      <rect x="0" y="0" width="12" height={7 * stripeH} fill="#0A3161" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="0.45" fill="#fff" />
      ))}
    </svg>
  );
}

export function CNFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 20" role="img" aria-label="China flag">
      <rect width="30" height="20" fill="#DE2910" />
      <Star cx={5.5} cy={5} scale={2.1} fill="#FFDE00" />
      <Star cx={10.6} cy={2.2} scale={0.65} fill="#FFDE00" />
      <Star cx={12.6} cy={4.4} scale={0.65} fill="#FFDE00" />
      <Star cx={12.6} cy={7.2} scale={0.65} fill="#FFDE00" />
      <Star cx={10.6} cy={9.2} scale={0.65} fill="#FFDE00" />
    </svg>
  );
}
