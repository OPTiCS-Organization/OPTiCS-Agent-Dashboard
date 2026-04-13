interface ServerInfoProps {
  ip?: string;
  hostname?: string;
}

export function ServerInfo({ ip, hostname }: ServerInfoProps) {
  return (
    <div className="bg-modal-background-color border border-border-color rounded-md p-4">
      <h3 className="text-secondary-text-color text-xs font-semibold mb-3">서버 정보</h3>
      <div className="space-y-2">
        <div>
          <div className="text-secondary-text-color text-xs mb-1">IP 주소</div>
          <div className="text-primary-text-color text-sm font-mono">{ip ?? "OFFLINE"}</div>
        </div>
        {hostname && (
          <div>
            <div className="text-secondary-text-color text-xs mb-1">호스트명</div>
            <div className="text-primary-text-color text-sm">{hostname ?? "NOT INITIALIZED"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
