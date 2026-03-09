import { useState, useMemo } from 'react';

interface RawDataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  average: number; // MiB
  totalMemory: number; // MiB
}

interface DataPoint {
  time: string;
  average: number | null;
}

type TimeRange = 'Live' | '3h' | '1d';

interface MemoryChartProps {
  rawData: RawDataPoint[]; // 5초 단위 원본 데이터
}

export function MemoryChart({ rawData }: MemoryChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('Live');
  const [visibleMetrics, setVisibleMetrics] = useState({
    peak: true,
    average: true,
    min: true
  });

  const toggleMetric = (metric: 'peak' | 'average' | 'min') => {
    setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const aggregateData = useMemo(() => {
    const now = Date.now();

    // rawData가 배열이 아니면 빈 배열로 처리
    if (!Array.isArray(rawData)) {
      return [];
    }

    // 각 뷰의 고정된 시간 범위와 집계 간격
    const ranges: Record<TimeRange, { span: number, interval: number }> = {
      'Live': { span: 5 * 60 * 1000, interval: 5000 },      // 1분 범위, 5초 단위
      '3h': { span: 3 * 3600 * 1000, interval: 3 * 60000 }, // 3시간 범위, 3분 단위
      '1d': { span: 24 * 3600 * 1000, interval: 30 * 60000 }   // 24시간 범위, 30분 단위
    };

    const { span, interval } = ranges[timeRange];
    const startTime = now - span;

    // 원본 데이터를 시간 간격별로 그룹화
    const groups: Map<number, RawDataPoint[]> = new Map();

    rawData.forEach(point => {
      if (point.timestamp >= startTime) {
        const groupKey = Math.floor(point.timestamp / interval) * interval;
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(point);
      }
    });

    // 모든 타임슬롯 생성 (현재부터 역순으로)
    const aggregated: DataPoint[] = [];
    const slots = Math.ceil(span / interval);

    for (let i = slots - 1; i >= 0; i--) {
      const slotTime = now - (i * interval);
      const slotKey = Math.floor(slotTime / interval) * interval;
      const points = groups.get(slotKey);

      const elapsed = now - slotTime;
      let timeLabel = '';

      if (timeRange === 'Live') {
        timeLabel = `${Math.floor(elapsed / 1000)}s`;
      } else if (timeRange === '3h') {
        timeLabel = `${Math.floor(elapsed / 60000)}m`;
      } else {
        timeLabel = `${Math.floor(elapsed / 3600000)}h`;
      }

      if (points && points.length > 0) {
        const averages = points.map(p => p.average);

        aggregated.push({
          time: timeLabel,
          average: averages.reduce((a, b) => a + b, 0) / averages.length,
        });
      } else {
        // 데이터 없으면 null로 채움 (빈 공간)
        aggregated.push({
          time: timeLabel,
          average: null,
        });
      }
    }

    return aggregated;
  }, [rawData, timeRange]);

  // totalMemory는 가장 최근 데이터에서 가져옴
  const totalMemory = rawData.length > 0 ? rawData[rawData.length - 1].totalMemory : 16384;

  const currentData = aggregateData;
  const maxValue = totalMemory;
  const minValue = 0;

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (currentData.length <= 1) return padding.left;
    return padding.left + (index / (currentData.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  };

  const createPath = (metric: 'average') => {
    let path = '';
    let isFirstPoint = true;

    currentData.forEach((point, index) => {
      const value = point[metric];
      if (value !== null) {
        const x = getX(index);
        const y = getY(value);
        path += `${isFirstPoint ? 'M' : 'L'} ${x} ${y} `;
        isFirstPoint = false;
      } else {
        // null을 만나면 다음 유효한 포인트에서 M(move)로 시작
        isFirstPoint = true;
      }
    });

    return path;
  };

  const formatMemory = (mib: number) => {
    return `${Math.round(mib)} MiB`;
  };

  // Y축 그리드 라인 값 계산 (5등분)
  const gridValues = Array.from({ length: 5 }, (_, i) => (maxValue / 4) * i);

  const metrics = [
    { key: 'average' as const, label: '사용량', color: '#fd7a28' },
  ];

  return (
    <div className="bg-modal-background-color border border-border-color rounded-md p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-secondary-text-color text-xs font-semibold">메모리 사용량</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('Live')}
            className={`px-2 py-1 rounded text-xs transition-colors ${timeRange === 'Live'
              ? 'bg-service-color text-primary-text-color'
              : 'bg-modal-box-color text-secondary-text-color hover:text-primary-text-color'
              }`}
          >
            Live
          </button>
          <button
            onClick={() => setTimeRange('3h')}
            className={`px-2 py-1 rounded text-xs transition-colors ${timeRange === '3h'
              ? 'bg-service-color text-primary-text-color'
              : 'bg-modal-box-color text-secondary-text-color hover:text-primary-text-color'
              }`}
          >
            3시간
          </button>
          <button
            onClick={() => setTimeRange('1d')}
            className={`px-2 py-1 rounded text-xs transition-colors ${timeRange === '1d'
              ? 'bg-service-color text-primary-text-color'
              : 'bg-modal-box-color text-secondary-text-color hover:text-primary-text-color'
              }`}
          >
            1일
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {metrics.map(metric => (
          <button
            key={metric.key}
            onClick={() => toggleMetric(metric.key)}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${visibleMetrics[metric.key]
              ? 'bg-modal-box-color text-primary-text-color'
              : 'bg-modal-box-color text-secondary-text-color opacity-50'
              }`}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: metric.color }}
            />
            {metric.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-2">
        <div>
          <div className="text-secondary-text-color text-[10px]">사용량</div>
          <div className="text-primary-text-color text-lg font-bold" style={{ color: '#fd7a28' }}>
            {currentData[currentData.length - 1]?.average !== null && currentData[currentData.length - 1]?.average !== undefined
              ? Math.round(currentData[currentData.length - 1].average!) + ' MiB'
              : '-'}
          </div>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={padding.left}
              y1={getY(value)}
              x2={width - padding.right}
              y2={getY(value)}
              stroke="#4A3F34"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <text
              x={padding.left - 10}
              y={getY(value)}
              textAnchor="end"
              alignmentBaseline="middle"
              fill="#A0A0A0"
              fontSize="10"
            >
              {formatMemory(value)}
            </text>
          </g>
        ))}

        {/* Lines for each metric */}
        {metrics.map(metric => (
          visibleMetrics[metric.key] && (
            <g key={metric.key}>
              <path
                d={createPath(metric.key)}
                fill="none"
                stroke={metric.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
              {currentData.map((point, index) => {
                const value = point[metric.key];
                if (value === null) return null;

                return (
                  <circle
                    key={`${metric.key}-${index}`}
                    cx={getX(index)}
                    cy={getY(value)}
                    r="2"
                    fill={metric.color}
                    className="cursor-pointer"
                  >
                    <title>{metric.label}: {formatMemory(value)}</title>
                  </circle>
                );
              })}
            </g>
          )
        ))}

        {/* X-axis labels */}
        <text
          x={padding.left}
          y={height - padding.bottom + 20}
          textAnchor="start"
          fill="#A0A0A0"
          fontSize="10"
        >
          -{currentData[0]?.time}
        </text>
        <text
          x={width - padding.right}
          y={height - padding.bottom + 20}
          textAnchor="end"
          fill="#A0A0A0"
          fontSize="10"
        >
          현재
        </text>
      </svg>
    </div>
  );
}
