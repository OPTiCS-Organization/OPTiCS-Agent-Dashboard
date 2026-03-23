import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerStats } from '../components/ServerStats';
import { ServerInfo } from '../components/ServerInfo';
import { CpuChart } from '../components/CpuChart';
import { MemoryChart } from '../components/MemoryChart';

interface CpuDataPoint {
  timestamp: number;
  peak: number;
  average: number;
  min: number;
}

interface MemoryDataPoint {
  timestamp: number;
  peak: number;
  average: number;
  min: number;
  totalMemory: number;
}

interface InfoType {
  cpu: CpuDataPoint,
  memory: MemoryDataPoint,
}

interface ConnectRequestNotification {
  workspaceOwnerName: string;
  workspaceName: string;
  requestDatetime: string;
  type: number;
}

function useElapsed(timestamp: string) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    function calc() {
      const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      const parts = [];
      if (h > 0) parts.push(`${h}시간`);
      if (m > 0) parts.push(`${m}분`);
      parts.push(`${s}초`);
      setElapsed(parts.join(' ') + ' 전');
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [timestamp]);

  return elapsed;
}

function ConnectRequestBar({ notify, onAccept, onReject }: {
  notify: ConnectRequestNotification;
  onAccept: () => void;
  onReject: () => void;
}) {
  const elapsed = useElapsed(notify.requestDatetime);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
      <div className="mx-4 rounded-md border border-border-color bg-modal-background-color shadow-2xl overflow-hidden">
        <div className="px-5 py-4">
          <p className="text-primary-text-color font-semibold text-sm mb-3">연결 요청 받음</p>
          <div className="space-y-1 mb-4">
            <p className="text-secondary-text-color text-xs">
              <span className="text-primary-text-color font-medium">워크스페이스</span>
              &ensp;{notify.workspaceName}
            </p>
            <p className="text-secondary-text-color text-xs">
              <span className="text-primary-text-color font-medium">소유자</span>
              &ensp;{notify.workspaceOwnerName}
            </p>
            <p className="text-secondary-text-color text-xs">
              <span className="text-primary-text-color font-medium">요청 시각</span>
              &ensp;{new Date(notify.requestDatetime).toLocaleString('ko-KR')}
              <span className="ml-1 text-secondary-text-color/60">({elapsed})</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="flex-1 py-1.5 rounded-sm bg-service-color text-white text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            >
              수락
            </button>
            <button
              onClick={onReject}
              className="flex-1 py-1.5 rounded-sm border border-border-color text-secondary-text-color text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
            >
              거부
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [cpuData, setCpuData] = useState<CpuDataPoint[]>([]);
  const [memoryData, setMemoryData] = useState<MemoryDataPoint[]>([]);
  const [connectRequest, setConnectRequest] = useState<ConnectRequestNotification | null>(null);

  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const cpuResponse = await fetch(`${import.meta.env.VITE_AGENT_URL}/cpu-metrics`);
        const cpuDataFromApi = await cpuResponse.json();
        if (Array.isArray(cpuDataFromApi)) {
          console.log('Loaded historical CPU data:', cpuDataFromApi.length, 'records');
          setCpuData(cpuDataFromApi);
        } else {
          console.warn('Invalid CPU data format received:', cpuDataFromApi);
          setCpuData([]);
        }

        const memoryResponse = await fetch(`${import.meta.env.VITE_AGENT_URL}/memory-metrics`);
        const memoryDataFromApi = await memoryResponse.json();
        if (Array.isArray(memoryDataFromApi)) {
          console.log('Loaded historical Memory data:', memoryDataFromApi.length, 'records');
          setMemoryData(memoryDataFromApi);
        } else {
          console.warn('Invalid Memory data format received:', memoryDataFromApi);
          setMemoryData([]);
        }
      } catch (error) {
        console.error('Failed to load historical data:', error);
        setCpuData([]);
        setMemoryData([]);
      }
    };

    const loadPendingRequest = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_AGENT_URL}/v1/notify/connect-request/pending`);
        const json = await res.json() as { data: ConnectRequestNotification | null };
        if (json.data) setConnectRequest(json.data);
      } catch {
        // 미처리 요청 없음
      }
    };

    loadHistoricalData();
    loadPendingRequest();

    const socket: Socket = io(`${import.meta.env.VITE_AGENT_URL}/info`, {
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('Connected to monitoring socket');
    });

    socket.on('info', (data: InfoType) => {
      console.log('Received data:', data);
      setCpuData((prev) => {
        const newData = [...prev, data.cpu];
        if (newData.length > 120960) {
          return newData.slice(-120960);
        }
        return newData;
      });

      setMemoryData((prev) => {
        const newData = [...prev, data.memory];
        if (newData.length > 120960) {
          return newData.slice(-120960);
        }
        return newData;
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from monitoring socket');
    });

    const notifSocket: Socket = io(`${import.meta.env.VITE_AGENT_URL}/notification`, {
      transports: ['websocket'],
      reconnection: true,
    });

    notifSocket.on('notification', (data: ConnectRequestNotification) => {
      setConnectRequest(data);
    });

    return () => {
      socket.disconnect();
      notifSocket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen pt-30">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-primary-text-color text-3xl font-bold mb-6">대시보드</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <ServerStats activeServers={3} isConnected={true} />
          <ServerInfo ip="192.168.1.100" hostname="agent-server-01" />
          <div className="bg-modal-box-color border border-border-color rounded-md p-4 flex items-center justify-center">
            <span className="text-secondary-text-color text-sm">추가 정보</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CpuChart rawData={cpuData} />
          <MemoryChart rawData={memoryData} />
        </div>
      </div>

      {connectRequest && (
        <ConnectRequestBar
          notify={connectRequest}
          onAccept={async () => {
            await fetch(`${import.meta.env.VITE_AGENT_URL}/v1/notify/connect-request/accept`, { method: 'POST' });
            setConnectRequest(null);
          }}
          onReject={async () => {
            await fetch(`${import.meta.env.VITE_AGENT_URL}/v1/notify/connect-request/reject`, { method: 'POST' });
            setConnectRequest(null);
          }}
        />
      )}
    </div>
  );
}
