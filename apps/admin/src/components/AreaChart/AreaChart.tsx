import { useId } from 'react';
import styles from './AreaChart.module.scss';

interface AreaChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  /** Accessible summary of the trend. */
  title: string;
}

/** Single-series area chart: green line, faint green fill, gold dot on the latest point. */
export function AreaChart({ data, width = 640, height = 220, title }: AreaChartProps) {
  const gradientId = useId();
  if (data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.value)) * 1.15;
  const x = (i: number) => (i / (data.length - 1)) * width;
  const y = (v: number) => height - (v / max) * height;
  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const last = data[data.length - 1];
  const labelEvery = Math.ceil(data.length / 7);

  return (
    // 8px bleed on each side so the latest-point dot is never clipped.
    <svg className={styles.chart} viewBox={`-8 -8 ${width + 16} ${height + 32}`} role="img" aria-label={title}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" className={styles.fillTop} />
          <stop offset="1" className={styles.fillBottom} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} className={styles.grid} />
      ))}
      <polygon points={`0,${height} ${line} ${width},${height}`} fill={`url(#${gradientId})`} />
      <polyline points={line} className={styles.line} />
      <circle cx={x(data.length - 1)} cy={y(last.value)} r="5" className={styles.latest} />
      {data.map((d, i) =>
        i % labelEvery === 0 || i === data.length - 1 ? (
          <text
            key={d.label}
            x={x(i)}
            y={height + 18}
            className={styles.axis}
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {d.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
