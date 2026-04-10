import { createContext, useContext, useState, type PropsWithChildren } from "react"
import { Panel } from "../types/Panel";

interface GlobalVariableType {
  activePanel: Panel,
  setActivePanel: React.Dispatch<React.SetStateAction<Panel>>
  ip: string | undefined,
  setIp: React.Dispatch<React.SetStateAction<string | undefined>>,
  agentCode: string | undefined,
  setAgentCode: React.Dispatch<React.SetStateAction<string | undefined>>,
}

const GlobalVariableContext = createContext<GlobalVariableType | undefined>(undefined);

export const GlobalVariableProvider = ({ children }: PropsWithChildren) => {
  const [activePanel, setActivePanel] = useState<Panel>(Panel.Initialize);
  const [ip, setIp] = useState<string | undefined>();
  const [agentCode, setAgentCode] = useState<string | undefined>();
  const value: GlobalVariableType = {
    activePanel: activePanel,
    setActivePanel: setActivePanel,
    ip, setIp,
    agentCode, setAgentCode,
  };

  return (
    <GlobalVariableContext.Provider value={value}>
      {children}
    </GlobalVariableContext.Provider>
  );
}

export const useGlobalVariable = () => {
  const context = useContext(GlobalVariableContext);
  if (context === undefined) {
    throw new Error('useGlobalVariable이 GlovalVariableProvider 외부에서 호출되었습니다.');
  }
  return context;
}