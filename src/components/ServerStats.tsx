interface ServerStatsProps {
  activeServers: number;
  isConnected: boolean;
}

export function ServerStats({ activeServers, isConnected }: ServerStatsProps) {
  return (
    <div className="bg-modal-background-color border border-border-color rounded-md p-4">
      <h3 className="text-secondary-text-color text-xs font-semibold mb-3">서버 상태</h3>
      <div className="flex items-end gap-2 mb-4">
        <span className="text-service-color text-4xl font-bold">{activeServers}</span>
        <span className="text-secondary-text-color text-sm mb-1">활성 서버</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-secondary-text-color">
          {isConnected ? '중앙 서버 연결됨' : '중앙 서버 연결 끊김'}
        </span>
      </div>
    </div>
  );
}
