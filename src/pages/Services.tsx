import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type ServiceStatus = 'Running' | 'Stopped' | 'Restart' | 'Deleted' | 'building' | 'running' | 'stopped' | 'failed';

interface Service {
  idx: number;
  serviceName: string;
  servicePort: number;
  serviceStatus: ServiceStatus;
  serviceLastOnline: string;
}

interface LogEntry {
  serviceIndex: number;
  log: string;
  timestamp: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  Running:  { label: '실행 중',   color: 'bg-green-500' },
  running:  { label: '실행 중',   color: 'bg-green-500' },
  building: { label: '빌드 중',   color: 'bg-yellow-500' },
  Stopped:  { label: '중지',      color: 'bg-red-500' },
  stopped:  { label: '중지',      color: 'bg-red-500' },
  failed:   { label: '오류',      color: 'bg-red-600' },
  Restart:  { label: '재시작 중', color: 'bg-blue-400' },
  Deleted:  { label: '삭제됨',    color: 'bg-gray-500' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? { label: status, color: 'bg-gray-500' };
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${s.color}`} />
      <span className="text-xs text-secondary-text-color">{s.label}</span>
    </span>
  );
}

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [logs, setLogs] = useState<Record<number, LogEntry[]>>({});
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const agentUrl = import.meta.env.VITE_AGENT_URL as string;
    const socketBase = agentUrl.startsWith('/') ? window.location.origin : agentUrl;
    const socketPath = agentUrl.startsWith('/') ? `${agentUrl}/socket.io` : '/socket.io';

    fetch(`${agentUrl}/v1/service`)
      .then(r => r.json())
      .then((data: Service[]) => setServices(data))
      .catch(() => {});

    const socket: Socket = io(`${socketBase}/service`, {
      transports: ['websocket'],
      reconnection: true,
      path: socketPath,
    });

    socket.on('service-status', (data: { serviceIndex: number; status: string }) => {
      setServices(prev =>
        prev.map(s => s.idx === data.serviceIndex ? { ...s, serviceStatus: data.status as ServiceStatus } : s)
      );
    });

    socket.on('service-log', (data: LogEntry) => {
      setLogs(prev => {
        const existing = prev[data.serviceIndex] ?? [];
        const next = [...existing, data];
        return { ...prev, [data.serviceIndex]: next.slice(-500) };
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, selected]);

  const selectedLogs = selected !== null ? (logs[selected] ?? []) : [];

  return (
    <div className="min-h-screen pt-30">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-primary-text-color text-3xl font-bold mb-6">서비스</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 서비스 목록 */}
          <div className="flex flex-col gap-2">
            {services.length === 0 && (
              <div className="bg-modal-background-color border border-border-color rounded-md p-6 text-center">
                <span className="text-secondary-text-color text-sm">배포된 서비스가 없습니다.</span>
              </div>
            )}
            {services.map(svc => (
              <div
                key={svc.idx}
                onClick={() => setSelected(prev => prev === svc.idx ? null : svc.idx)}
                className={`bg-modal-background-color border rounded-md p-4 cursor-pointer transition-colors duration-100 hover:bg-white/5 ${selected === svc.idx ? 'border-service-color' : 'border-border-color'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-primary-text-color font-semibold text-sm">{svc.serviceName}</span>
                  <StatusBadge status={svc.serviceStatus} />
                </div>
                <div className="flex gap-3">
                  <span className="text-xs text-secondary-text-color">포트 {svc.servicePort}</span>
                  <span className="text-xs text-secondary-text-color">
                    마지막 온라인 {new Date(svc.serviceLastOnline).toLocaleString('ko-KR')}
                  </span>
                </div>
                {logs[svc.idx] && logs[svc.idx].length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-service-color animate-pulse" />
                    <span className="text-[10px] text-service-color">로그 수신 중</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 로그 패널 */}
          <div className="bg-modal-background-color border border-border-color rounded-md flex flex-col" style={{ minHeight: '400px' }}>
            <div className="px-4 py-3 border-b border-border-color flex items-center justify-between">
              <span className="text-primary-text-color text-xs font-semibold">
                {selected !== null
                  ? `${services.find(s => s.idx === selected)?.serviceName ?? ''} — 터미널 로그`
                  : '서비스를 선택하면 로그가 표시됩니다'}
              </span>
              {selected !== null && (
                <button
                  onClick={() => setLogs(prev => ({ ...prev, [selected]: [] }))}
                  className="text-[10px] text-secondary-text-color hover:text-primary-text-color transition-colors cursor-pointer"
                >
                  지우기
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-5">
              {selectedLogs.length === 0
                ? <span className="text-secondary-text-color/50">로그 없음</span>
                : selectedLogs.map((entry, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-secondary-text-color/50 shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString('ko-KR')}
                    </span>
                    <span className={entry.log.startsWith('ERROR') ? 'text-red-400' : 'text-primary-text-color'}>
                      {entry.log}
                    </span>
                  </div>
                ))
              }
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
