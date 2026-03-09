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

export function Dashboard() {
  const [cpuData, setCpuData] = useState<CpuDataPoint[]>([]);
  const [memoryData, setMemoryData] = useState<MemoryDataPoint[]>([]);

  useEffect(() => {
    // 기존 데이터 로드
    const loadHistoricalData = async () => {
      try {
        // CPU 데이터 로드
        const cpuResponse = await fetch('http://localhost:3001/cpu-metrics');
        const cpuDataFromApi = await cpuResponse.json();

        if (Array.isArray(cpuDataFromApi)) {
          console.log('Loaded historical CPU data:', cpuDataFromApi.length, 'records');
          setCpuData(cpuDataFromApi);
        } else {
          console.warn('Invalid CPU data format received:', cpuDataFromApi);
          setCpuData([]);
        }

        // 메모리 데이터 로드
        const memoryResponse = await fetch('http://localhost:3001/memory-metrics');
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

    loadHistoricalData();

    // WebSocket 연결
    const socket: Socket = io('http://localhost:3001/info', {
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

    return () => {
      socket.disconnect();
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
    </div>
  );
}
