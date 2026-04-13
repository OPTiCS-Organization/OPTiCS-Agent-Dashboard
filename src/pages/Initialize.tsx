import { useEffect } from "react";
import { Button } from "../components/Button";
import { useGlobalVariable } from "../context/GlobalVariable.context";

interface InitializeProps {
  onNavigate: () => void;
}

export function Initialize({ onNavigate }: InitializeProps) {
  const { setIp, agentCode, setAgentCode } = useGlobalVariable();

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`${import.meta.env.VITE_AGENT_URL}/connect`);
      const data = await response.json();
      setAgentCode(data.agentCode);
      setIp(data.agentIp);
    };

    fetchData();
  }, [setAgentCode, setIp]);


  return (
    <div className="w-90 bg-modal-background-color rounded-md left-1/2 top-1/2 absolute -translate-1/2 border border-border-color shadow-md p-4 flex flex-col items-center">
      <div className="w-full h-22.5 bg-modal-box-color border border-border-color rounded-sm items-center justify-center flex flex-col relative">
        <h2 className="text-service-color font-bold text-2xl">{(agentCode?.toUpperCase()) ?? 'OFFLINE'}</h2>
        <span className="text-[10px] text-secondary-text-color leading-3">@ Connection Code</span>
      </div>
      <Button className="mt-2.5 self-end" duration={3000} onClick={onNavigate}>
        나중에 연결하겠습니다.
      </Button>
      <span className="text-[10px] text-center text-secondary-text-color absolute top-1/1 mt-1.5">위 코드는 메인 서버 대시보드에서 컨테이너 생성 후 연결 코드로 사용됩니다.</span>
    </div>
  )
}