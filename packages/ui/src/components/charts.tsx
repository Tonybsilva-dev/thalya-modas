"use client";

import * as React from "react";

import { cn } from "../lib/utils";

type ChartDatum = {
  color?: string;
  label: string;
  value: number;
};

type BarChartDatum = ChartDatum & {
  secondaryValue?: number;
};

type ChartSeries = {
  color?: string;
  data: number[];
  label: string;
};

type ScatterDatum = {
  color?: string;
  label: string;
  x: number;
  y: number;
};

type ChartShellProps = React.HTMLAttributes<HTMLDivElement> & {
  description?: string;
  legend?: Array<{ color?: string; label: string }>;
  title: string;
};

type BaseChartProps = Omit<ChartShellProps, "children" | "legend" | "title"> & {
  "aria-label"?: string;
  title?: string;
};

type BarColumnChartProps = BaseChartProps & {
  data: BarChartDatum[];
  primaryLabel?: string;
  secondaryLabel?: string;
};

type LineChartProps = BaseChartProps & {
  labels?: string[];
  series: ChartSeries[];
};

type AreaChartProps = BaseChartProps & {
  labels?: string[];
  series: ChartSeries[];
};

type PieChartProps = BaseChartProps & {
  data: ChartDatum[];
  centerLabel?: string;
  centerDescription?: string;
};

type RadarChartProps = BaseChartProps & {
  data: ChartDatum[];
  seriesLabel?: string;
};

type ScatterChartProps = BaseChartProps & {
  data: ScatterDatum[];
  xLabel?: string;
  yLabel?: string;
};

type HistogramChartProps = BaseChartProps & {
  data: ChartDatum[];
  seriesLabel?: string;
};

type DataBrushChartProps = BaseChartProps & {
  brushEnd?: number;
  brushStart?: number;
  labels?: string[];
  onBrushChange?: (range: { end: number; start: number }) => void;
  series: ChartSeries[];
};

const purple = "#A855F7";
const sky = "#60A5FA";

const defaultPalette = [
  "var(--primary)",
  "var(--secondary)",
  "var(--warning-foreground)",
  "var(--info-foreground)",
  "var(--success-foreground)",
];

function getMaxValue(values: number[]) {
  return Math.max(...values, 1);
}

function getRangeSlice<T>(items: T[], range: { end: number; start: number }) {
  if (items.length <= 1) {
    return items;
  }

  const startIndex = Math.floor(range.start * (items.length - 1));
  const endIndex = Math.ceil(range.end * (items.length - 1));

  return items.slice(startIndex, Math.max(endIndex + 1, startIndex + 2));
}

function getColor(index: number, color?: string) {
  return color ?? defaultPalette[index % defaultPalette.length];
}

function getAreaColor(index: number, color?: string) {
  return color ?? [purple, sky][index % 2];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPoint(index: number, value: number, total: number, max: number) {
  const x = 36 + (index / Math.max(total - 1, 1)) * 488;
  const y = 176 - (value / max) * 148;

  return { x, y };
}

function linePath(values: number[], max: number) {
  return values
    .map((value, index) => {
      const point = getPoint(index, value, values.length, max);

      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    })
    .join(" ");
}

function smoothLinePath(points: Array<{ x: number; y: number }>) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;

    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function smoothChartPath(values: number[], max: number) {
  return smoothLinePath(
    values.map((value, index) => getPoint(index, value, values.length, max)),
  );
}

function smoothChartAreaPath(values: number[], max: number) {
  const points = values.map((value, index) => getPoint(index, value, values.length, max));
  const first = points[0];
  const last = points[points.length - 1];

  if (!first || !last) {
    return "";
  }

  return `${smoothLinePath(points)} L ${last.x} 176 L ${first.x} 176 Z`;
}

function areaPath(values: number[], max: number) {
  const path = linePath(values, max);

  return `${path} L 524 176 L 36 176 Z`;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angle: number) {
  const angleInRadians = ((angle - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function pieSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

const ChartShell = React.forwardRef<HTMLDivElement, ChartShellProps>(
  ({ children, className, description, legend, title, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        "grid min-w-0 w-full gap-3.5 border border-border bg-card p-4 text-card-foreground sm:p-[18px]",
        className,
      )}
      {...props}
    >
      <div className="grid gap-1">
        <h3 className="text-lg font-medium leading-7 text-card-foreground">{title}</h3>
        {description ? (
          <p className="text-sm leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {legend?.length ? (
        <div className="flex flex-wrap items-center gap-3">
          {legend.map((item, index) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"
            >
              <span
                aria-hidden="true"
                className="size-2.5 bg-current"
                style={{ color: getColor(index, item.color) }}
              />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      {children}
    </section>
  ),
);
ChartShell.displayName = "ChartShell";

function ChartSurface({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="nitro-chart-surface aspect-[560/230] min-h-[160px] overflow-hidden border border-border bg-background sm:min-h-[210px] lg:min-h-[230px]">
      <svg
        aria-label={label}
        className="h-full w-full overflow-hidden"
        role="img"
        viewBox="0 0 560 210"
      >
        {children}
      </svg>
    </div>
  );
}

function GridLines() {
  return (
    <g className="nitro-chart-axis" stroke="var(--border)" strokeWidth="1">
      {[28, 65, 102, 139, 176].map((y) => (
        <line key={y} opacity="0.9" x1="36" x2="524" y1={y} y2={y} />
      ))}
    </g>
  );
}

function AxisLabels({ labels }: { labels?: string[] }) {
  if (!labels?.length) {
    return null;
  }

  return (
    <g fill="var(--muted-foreground)" fontSize="11">
      {labels.map((label, index) => {
        const x = 36 + (index / Math.max(labels.length - 1, 1)) * 488;

        return (
          <text key={label} textAnchor="middle" x={x} y="198">
            {label}
          </text>
        );
      })}
    </g>
  );
}

const BarColumnChart = React.forwardRef<HTMLDivElement, BarColumnChartProps>(
  (
    {
      "aria-label": ariaLabel,
      className,
      data,
      description = "Comparação por categoria ou período.",
      primaryLabel = "Receita",
      secondaryLabel = "Pedidos",
      title = "Bar Column",
      ...props
    },
    ref,
  ) => {
    const max = getMaxValue(
      data.flatMap((item) => [item.value, item.secondaryValue ?? 0]),
    );
    const groupWidth = 488 / Math.max(data.length, 1);
    const barWidth = Math.min(28, groupWidth / 3);

    return (
      <ChartShell
        ref={ref}
        className={className}
        description={description}
        legend={[{ label: primaryLabel }, { color: "var(--secondary)", label: secondaryLabel }]}
        title={title}
        {...props}
      >
        <ChartSurface label={ariaLabel ?? title}>
          <GridLines />
          {data.map((item, index) => {
            const x = 36 + index * groupWidth + groupWidth / 2;
            const primaryHeight = (item.value / max) * 148;
            const secondaryHeight = ((item.secondaryValue ?? 0) / max) * 148;

            return (
              <g key={item.label}>
                <rect
                  className="nitro-chart-bar"
                  fill={getColor(0, item.color)}
                  height={primaryHeight}
                  style={{ "--chart-delay": `${index * 42}ms` } as React.CSSProperties}
                  x={x - barWidth - 2}
                  y={176 - primaryHeight}
                  width={barWidth}
                />
                {item.secondaryValue !== undefined ? (
                  <rect
                    className="nitro-chart-bar"
                    fill="var(--secondary)"
                    height={secondaryHeight}
                    opacity="0.9"
                    style={{ "--chart-delay": `${index * 42 + 70}ms` } as React.CSSProperties}
                    x={x + 2}
                    y={176 - secondaryHeight}
                    width={barWidth}
                  />
                ) : null}
                <text
                  fill="var(--muted-foreground)"
                  fontSize="11"
                  textAnchor="middle"
                  x={x}
                  y="198"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </ChartSurface>
      </ChartShell>
    );
  },
);
BarColumnChart.displayName = "BarColumnChart";

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  (
    {
      "aria-label": ariaLabel,
      className,
      description = "Tendência temporal com pontos e tooltip.",
      labels,
      series,
      title = "Line",
      ...props
    },
    ref,
  ) => {
    const max = getMaxValue(series.flatMap((item) => item.data));

    return (
      <ChartShell
        ref={ref}
        className={className}
        description={description}
        legend={series.map((item, index) => ({
          ...item,
          color: item.color ?? (index === 1 ? purple : getColor(index)),
        }))}
        title={title}
        {...props}
      >
        <ChartSurface label={ariaLabel ?? title}>
          <GridLines />
          {series.map((item, seriesIndex) => {
            const color = item.color ?? (seriesIndex === 1 ? purple : getColor(seriesIndex));

            return (
              <g key={item.label}>
                <path
                  className="nitro-chart-line"
                  d={smoothChartPath(item.data, max)}
                  fill="none"
                  stroke={color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  style={
                    {
                      "--chart-delay": `${seriesIndex * 90}ms`,
                      "--chart-path-length": 820,
                    } as React.CSSProperties
                  }
                />
                {item.data.map((value, index) => {
                  const point = getPoint(index, value, item.data.length, max);

                  return (
                    <circle
                      className="nitro-chart-point"
                      key={`${item.label}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      fill="var(--card)"
                      r="4"
                      stroke={color}
                      strokeWidth="2"
                      style={
                        {
                          "--chart-delay": `${seriesIndex * 90 + index * 28 + 220}ms`,
                        } as React.CSSProperties
                      }
                    />
                  );
                })}
              </g>
            );
          })}
          <AxisLabels labels={labels} />
        </ChartSurface>
      </ChartShell>
    );
  },
);
LineChart.displayName = "LineChart";

const AreaChart = React.forwardRef<HTMLDivElement, AreaChartProps>(
  (
    {
      "aria-label": ariaLabel,
      className,
      description = "Volume acumulado com preenchimento.",
      labels,
      series,
      title = "Area",
      ...props
    },
    ref,
  ) => {
    const max = getMaxValue(series.flatMap((item) => item.data));

    return (
      <ChartShell
        ref={ref}
        className={className}
        description={description}
        legend={series.map((item, index) => ({
          ...item,
          color: getAreaColor(index, item.color),
        }))}
        title={title}
        {...props}
      >
        <ChartSurface label={ariaLabel ?? title}>
          <GridLines />
          {series.map((item, index) => {
            const color = getAreaColor(index, item.color);

            return (
              <g key={item.label}>
                <path
                  className="nitro-chart-area"
                  d={smoothChartAreaPath(item.data, max)}
                  fill={color}
                  opacity="0.22"
                  style={{ "--chart-delay": `${index * 90 + 140}ms` } as React.CSSProperties}
                />
                <path
                  className="nitro-chart-line"
                  d={smoothChartPath(item.data, max)}
                  fill="none"
                  stroke={color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  style={
                    {
                      "--chart-delay": `${index * 90}ms`,
                      "--chart-path-length": 820,
                    } as React.CSSProperties
                  }
                />
              </g>
            );
          })}
          <AxisLabels labels={labels} />
        </ChartSurface>
      </ChartShell>
    );
  },
);
AreaChart.displayName = "AreaChart";

const PieChart = React.forwardRef<HTMLDivElement, PieChartProps>(
  (
    {
      "aria-label": ariaLabel,
      centerDescription = "categoria principal",
      centerLabel,
      className,
      data,
      description = "Distribuição por participação.",
      title = "Pie",
      ...props
    },
    ref,
  ) => {
    const total = getMaxValue([data.reduce((sum, item) => sum + item.value, 0)]);
    let startAngle = 0;
    const leading = centerLabel ?? `${Math.round(((data[0]?.value ?? 0) / total) * 100)}%`;

    return (
      <ChartShell
        ref={ref}
        className={className}
        description={description}
        legend={data.map((item, index) => ({
          ...item,
          color: getAreaColor(index, item.color),
        }))}
        title={title}
        {...props}
      >
        <div className="nitro-chart-surface grid aspect-[320/210] min-h-[210px] place-items-center overflow-hidden border border-border bg-background">
          <svg aria-label={ariaLabel ?? title} role="img" viewBox="0 0 320 210">
            {data.map((item, index) => {
              const endAngle = startAngle + (item.value / total) * 360;
              const path = pieSlicePath(96, 105, 70, startAngle, endAngle);
              startAngle = endAngle;

              return (
                <path
                  className="nitro-chart-slice"
                  key={item.label}
                  d={path}
                  fill={getAreaColor(index, item.color)}
                  stroke="var(--background)"
                  strokeWidth="2"
                  style={{ "--chart-delay": `${index * 70}ms` } as React.CSSProperties}
                />
              );
            })}
            <text
              fill="var(--foreground)"
              fontSize="28"
              fontWeight="700"
              x="196"
              y="96"
            >
              {leading}
            </text>
            <text
              fill="var(--muted-foreground)"
              fontSize="12"
              x="196"
              y="122"
            >
              {centerDescription.split(" ").slice(0, 2).join(" ")}
              <tspan x="196" y="138">
                {centerDescription.split(" ").slice(2).join(" ")}
              </tspan>
            </text>
          </svg>
        </div>
      </ChartShell>
    );
  },
);
PieChart.displayName = "PieChart";

const RadarChart = React.forwardRef<HTMLDivElement, RadarChartProps>(
  (
    {
      "aria-label": ariaLabel,
      className,
      data,
      description = "Comparação multi-variável.",
      seriesLabel = "Loja",
      title = "Radar",
      ...props
    },
    ref,
  ) => {
    const max = getMaxValue(data.map((item) => item.value));
    const center = 110;
    const radius = 70;
    const points = data.map((item, index) => {
      const angle = -Math.PI / 2 + (index / data.length) * Math.PI * 2;
      const distance = (item.value / max) * radius;

      return {
        label: item.label,
        x: center + Math.cos(angle) * distance,
        xAxis: center + Math.cos(angle) * radius,
        xLabel: center + Math.cos(angle) * (radius + 22),
        y: center + Math.sin(angle) * distance,
        yAxis: center + Math.sin(angle) * radius,
        yLabel: center + Math.sin(angle) * (radius + 22),
      };
    });

    return (
      <ChartShell
        ref={ref}
        className={className}
        description={description}
        legend={[{ label: seriesLabel }]}
        title={title}
        {...props}
      >
        <div className="nitro-chart-surface grid min-h-[230px] place-items-center overflow-hidden border border-border bg-background">
          <svg aria-label={ariaLabel ?? title} role="img" viewBox="0 0 220 220">
            {[0.35, 0.7, 1].map((scale) => (
              <polygon
                key={scale}
                fill="none"
                points={data
                  .map((_, index) => {
                    const angle = -Math.PI / 2 + (index / data.length) * Math.PI * 2;

                    return `${center + Math.cos(angle) * radius * scale},${
                      center + Math.sin(angle) * radius * scale
                    }`;
                  })
                  .join(" ")}
                stroke="var(--border)"
              />
            ))}
            {points.map((point) => (
              <g key={point.label}>
                <line
                  stroke="var(--border)"
                  x1={center}
                  x2={point.xAxis}
                  y1={center}
                  y2={point.yAxis}
                />
                <text
                  fill="var(--muted-foreground)"
                  fontSize="10"
                  textAnchor="middle"
                  x={point.xLabel}
                  y={point.yLabel}
                >
                  {point.label}
                </text>
              </g>
            ))}
            <polygon
              className="nitro-chart-area"
              fill="var(--primary)"
              fillOpacity="0.18"
              points={points.map((point) => `${point.x},${point.y}`).join(" ")}
              stroke="var(--primary)"
              strokeWidth="3"
              style={{ "--chart-delay": "120ms" } as React.CSSProperties}
            />
          </svg>
        </div>
      </ChartShell>
    );
  },
);
RadarChart.displayName = "RadarChart";

const ScatterChart = React.forwardRef<HTMLDivElement, ScatterChartProps>(
  (
    {
      "aria-label": ariaLabel,
      className,
      data,
      description = "Correlação, dispersão e outliers.",
      title = "Scatter",
      xLabel = "Pedidos",
      yLabel = "Ticket alto",
      ...props
    },
    ref,
  ) => {
    const xMax = getMaxValue(data.map((item) => item.x));
    const yMax = getMaxValue(data.map((item) => item.y));

    return (
      <ChartShell
        ref={ref}
        className={className}
        description={description}
        legend={[{ label: xLabel }, { color: "var(--secondary)", label: yLabel }]}
        title={title}
        {...props}
      >
        <ChartSurface label={ariaLabel ?? title}>
          <GridLines />
          {data.map((item, index) => (
            <circle
              className="nitro-chart-point"
              key={item.label}
              cx={36 + (item.x / xMax) * 488}
              cy={176 - (item.y / yMax) * 148}
              fill={getColor(index, item.color)}
              opacity="0.9"
              r={index % 3 === 0 ? 7 : 5}
              style={{ "--chart-delay": `${index * 34}ms` } as React.CSSProperties}
            />
          ))}
        </ChartSurface>
      </ChartShell>
    );
  },
);
ScatterChart.displayName = "ScatterChart";

const HistogramChart = React.forwardRef<HTMLDivElement, HistogramChartProps>(
  (
    {
      "aria-label": ariaLabel,
      className,
      data,
      description = "Distribuição de frequência por intervalo.",
      seriesLabel = "Frequência",
      title = "Histogram",
      ...props
    },
    ref,
  ) => {
    const max = getMaxValue(data.map((item) => item.value));
    const barWidth = 488 / Math.max(data.length, 1);
    const highestValue = Math.max(...data.map((item) => item.value));

    return (
      <ChartShell
        ref={ref}
        className={className}
        description={description}
        legend={[{ label: seriesLabel }]}
        title={title}
        {...props}
      >
        <ChartSurface label={ariaLabel ?? title}>
          <GridLines />
          {data.map((item, index) => {
            const height = (item.value / max) * 148;

            return (
              <rect
                className="nitro-chart-bar"
                key={item.label}
                fill={item.value === highestValue ? purple : "var(--primary)"}
                height={height}
                style={{ "--chart-delay": `${index * 42}ms` } as React.CSSProperties}
                x={36 + index * barWidth + 2}
                y={176 - height}
                width={Math.max(barWidth - 4, 4)}
              />
            );
          })}
        </ChartSurface>
      </ChartShell>
    );
  },
);
HistogramChart.displayName = "HistogramChart";

const DataBrushChart = React.forwardRef<HTMLDivElement, DataBrushChartProps>(
  (
    {
      "aria-label": ariaLabel,
      brushEnd = 0.82,
      brushStart = 0.18,
      className,
      description = "Novos tenants e tickets por mês; arraste a régua para filtrar o período.",
      labels,
      onBrushChange,
      series,
      title = "Crescimento - últimos 6 meses",
      ...props
    },
    ref,
  ) => {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const dragRef = React.useRef<{
      offset: number;
      type: "end" | "range" | "start";
    } | null>(null);
    const gradientId = React.useId();
    const [range, setRange] = React.useState({
      end: clamp(brushEnd, 0, 1),
      start: clamp(brushStart, 0, 1),
    });
    const max = getMaxValue(series.flatMap((item) => item.data));
    const mainLeft = 58;
    const mainTop = 40;
    const mainWidth = 760;
    const mainHeight = 182;
    const brushTop = 252;
    const brushHeight = 32;
    const start = mainLeft + range.start * mainWidth;
    const end = mainLeft + range.end * mainWidth;
    const visibleSeries = series.map((item) => ({
      ...item,
      data: getRangeSlice(item.data, range),
    }));
    const visibleMax = getMaxValue(visibleSeries.flatMap((item) => item.data));
    const visibleLabels = labels ? getRangeSlice(labels, range) : undefined;
    const chartLabels =
      visibleLabels && visibleLabels.length > 3
        ? [
            visibleLabels[0],
            visibleLabels[Math.floor(visibleLabels.length / 2)],
            visibleLabels[visibleLabels.length - 1],
          ]
        : visibleLabels;

    const getBrushPoint = (index: number, value: number, total: number, height: number) => ({
      x: mainLeft + (index / Math.max(total - 1, 1)) * mainWidth,
      y: mainTop + height - (value / max) * height,
    });

    const getPreviewPoint = (index: number, value: number, total: number, height: number) => ({
      x: mainLeft + (index / Math.max(total - 1, 1)) * mainWidth,
      y: brushTop + 6 + height - (value / max) * height,
    });

    const getMainPoint = (index: number, value: number, total: number) => ({
      x: mainLeft + (index / Math.max(total - 1, 1)) * mainWidth,
      y: mainTop + mainHeight - (value / visibleMax) * mainHeight,
    });

    const setBrushRange = React.useCallback(
      (nextRange: { end: number; start: number }) => {
        const normalizedRange = {
          end: clamp(nextRange.end, 0, 1),
          start: clamp(nextRange.start, 0, 1),
        };

        setRange(normalizedRange);
        onBrushChange?.(normalizedRange);
      },
      [onBrushChange],
    );

    const getPointerRatio = React.useCallback((event: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;

      if (!svg) {
        return 0;
      }

      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;

      const screenMatrix = svg.getScreenCTM();

      if (!screenMatrix) {
        return 0;
      }

      const svgPoint = point.matrixTransform(screenMatrix.inverse());

      return clamp((svgPoint.x - mainLeft) / mainWidth, 0, 1);
    }, []);

    const handlePointerDown = React.useCallback(
      (
        event: React.PointerEvent<SVGElement>,
        type: "end" | "range" | "start",
      ) => {
        const svg = svgRef.current;

        if (!svg) {
          return;
        }

        const ratio = getPointerRatio(event as React.PointerEvent<SVGSVGElement>);

        dragRef.current = {
          offset: type === "range" ? ratio - range.start : 0,
          type,
        };

        svg.setPointerCapture(event.pointerId);
      },
      [getPointerRatio, range.start],
    );

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<SVGSVGElement>) => {
        const drag = dragRef.current;

        if (!drag) {
          return;
        }

        const ratio = getPointerRatio(event);
        const minGap = 0.08;

        if (drag.type === "start") {
          setBrushRange({
            end: range.end,
            start: clamp(ratio, 0, range.end - minGap),
          });
          return;
        }

        if (drag.type === "end") {
          setBrushRange({
            end: clamp(ratio, range.start + minGap, 1),
            start: range.start,
          });
          return;
        }

        const width = range.end - range.start;
        const nextStart = clamp(ratio - drag.offset, 0, 1 - width);

        setBrushRange({
          end: nextStart + width,
          start: nextStart,
        });
      },
      [getPointerRatio, range, setBrushRange],
    );

    const handlePointerUp = React.useCallback((event: React.PointerEvent<SVGSVGElement>) => {
      dragRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }, []);

    const visibleLinePath = (values: number[]) =>
      smoothLinePath(
        values.map((value, index) => getMainPoint(index, value, values.length)),
      );

    const visibleAreaPath = (values: number[]) => {
      const points = values.map((value, index) =>
        getMainPoint(index, value, values.length),
      );
      const first = points[0];
      const last = points[points.length - 1];

      if (!first || !last) {
        return "";
      }

      return `${smoothLinePath(points)} L ${last.x} ${mainTop + mainHeight} L ${first.x} ${
        mainTop + mainHeight
      } Z`;
    };

    const brushLinePath = (values: number[], height = mainHeight) =>
      smoothLinePath(
        values.map((value, index) => getBrushPoint(index, value, values.length, height)),
      );

    const brushAreaPath = (values: number[]) => {
      const points = values.map((value, index) =>
        getBrushPoint(index, value, values.length, mainHeight),
      );
      const first = points[0];
      const last = points[points.length - 1];

      if (!first || !last) {
        return "";
      }

      return `${smoothLinePath(points)} L ${last.x} ${mainTop + mainHeight} L ${first.x} ${
        mainTop + mainHeight
      } Z`;
    };

    return (
      <section
        ref={ref}
        className={cn(
          "grid min-w-0 w-full gap-4 border border-border bg-card p-4 text-card-foreground sm:gap-[18px] sm:p-5",
          className,
        )}
        {...props}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="grid gap-1">
            <h3 className="text-lg font-semibold leading-7 text-card-foreground">
              {title}
            </h3>
            {description ? (
              <p className="text-sm leading-5 text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {series.map((item, index) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full bg-current"
                  style={{ color: getAreaColor(index, item.color) }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="nitro-chart-surface aspect-[860/292] min-h-[260px] overflow-hidden border border-border bg-card sm:min-h-[292px]">
          <svg
            ref={svgRef}
            aria-label={ariaLabel ?? title}
            className="h-full w-full"
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            role="img"
            viewBox="0 0 860 292"
          >
            <defs>
              <linearGradient id={`${gradientId}-blue`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={sky} stopOpacity="0.6" />
                <stop offset="100%" stopColor={sky} stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`${gradientId}-purple`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={purple} stopOpacity="0.55" />
                <stop offset="100%" stopColor={purple} stopOpacity="0" />
              </linearGradient>
            </defs>

            {[1, 2 / 3, 1 / 3, 0].map((ratio) => {
              const value = Math.round(visibleMax * ratio);
              const y = mainTop + mainHeight - ratio * mainHeight;

              return (
                <g key={ratio}>
                  <line
                    stroke="var(--border)"
                    x1={mainLeft - 14}
                    x2={mainLeft + mainWidth + 6}
                    y1={y}
                    y2={y}
                  />
                  <text
                    fill="var(--muted-foreground)"
                    fontSize="12"
                    textAnchor="end"
                    x={mainLeft - 24}
                    y={y + 4}
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {visibleSeries.map((item, index) => {
              const color = getAreaColor(index, item.color);

              return (
                <g key={item.label}>
                  <path
                    className="nitro-chart-area"
                    d={visibleAreaPath(item.data)}
                    fill={
                      index === 0
                        ? `url(#${gradientId}-purple)`
                        : `url(#${gradientId}-blue)`
                    }
                    style={{ "--chart-delay": `${index * 90 + 120}ms` } as React.CSSProperties}
                  />
                  <path
                    className="nitro-chart-line"
                    d={visibleLinePath(item.data)}
                    fill="none"
                    stroke={color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    style={
                      {
                        "--chart-delay": `${index * 90}ms`,
                        "--chart-path-length": 900,
                      } as React.CSSProperties
                    }
                  />
                </g>
              );
            })}

            {chartLabels?.map((label, index) => (
              <text
                key={label}
                fill="var(--muted-foreground)"
                fontSize="12"
                textAnchor={index === 0 ? "start" : index === chartLabels.length - 1 ? "end" : "middle"}
                x={
                  index === 0
                    ? mainLeft
                    : index === chartLabels.length - 1
                      ? mainLeft + mainWidth
                      : mainLeft + mainWidth / 2
                }
                y={mainTop + mainHeight + 24}
              >
                {label}
              </text>
            ))}

            {series.map((item, index) => {
              const color = getAreaColor(index, item.color);
              const points = item.data.map((value, pointIndex) =>
                getPreviewPoint(pointIndex, value, item.data.length, 20),
              );

              return (
                <path
                  className="nitro-chart-line"
                  key={`${item.label}-preview`}
                  d={smoothLinePath(points)}
                  fill="none"
                  stroke={color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  style={
                    {
                      "--chart-delay": `${index * 70 + 180}ms`,
                      "--chart-path-length": 820,
                    } as React.CSSProperties
                  }
                />
              );
            })}

            <rect
              className="nitro-chart-brush"
              fill={`${purple}12`}
              height={brushHeight}
              onPointerDown={(event) => handlePointerDown(event, "range")}
              stroke={purple}
              style={{ cursor: "grab", touchAction: "none" }}
              width={end - start}
              x={start}
              y={brushTop}
            />
            {[
              [start, "start"],
              [end, "end"],
            ].map(([x, type]) => (
              <rect
                className="nitro-chart-handle"
                key={type}
                fill="var(--foreground)"
                height={brushHeight}
                onPointerDown={(event) =>
                  handlePointerDown(event, type as "end" | "start")
                }
                role="slider"
                style={{ cursor: "ew-resize", touchAction: "none" }}
                tabIndex={0}
                width="8"
                x={(x as number) - 4}
                y={brushTop}
              />
            ))}
          </svg>
        </div>
      </section>
    );
  },
);
DataBrushChart.displayName = "DataBrushChart";

export {
  AreaChart,
  BarColumnChart,
  DataBrushChart,
  HistogramChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
};
export type {
  AreaChartProps,
  BarChartDatum,
  BarColumnChartProps,
  ChartDatum,
  ChartSeries,
  DataBrushChartProps,
  HistogramChartProps,
  LineChartProps,
  PieChartProps,
  RadarChartProps,
  ScatterChartProps,
  ScatterDatum,
};
