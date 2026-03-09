interface DataPoint {
  time: string;
  value: number;
}

interface ResourceChartProps {
  title: string;
  data: DataPoint[];
  color: string;
  unit: string;
}

export function ResourceChart({ title, data, color, unit }: ResourceChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 100);

  return (
    <div className="bg-modal-background-color border border-border-color rounded-md p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-secondary-text-color text-xs font-semibold">{title}</h3>
        <span className="text-primary-text-color text-lg font-bold">
          {data[data.length - 1]?.value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="relative h-32 flex items-end gap-1">
        {data.map((point, index) => (
          <div key={index} className="flex-1 flex flex-col items-center group relative">
            <div
              className="w-full rounded-t transition-all duration-300"
              style={{
                height: `${(point.value / maxValue) * 100}%`,
                backgroundColor: color,
                minHeight: '2px'
              }}
            />
            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-modal-background-color px-2 py-1 rounded text-xs text-primary-text-color whitespace-nowrap">
              {point.value.toFixed(1)}{unit}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-secondary-text-color">
        <span>{data[0]?.time}</span>
        <span>{data[data.length - 1]?.time}</span>
      </div>
    </div>
  );
}
