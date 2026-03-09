import { useEffect, useState } from "react";
import { useGlobalVariable } from "../context/GlobalVariable.context"
import { Panel } from "../types/Panel";
import { LayoutPanelTop, Settings } from "lucide-react";

const IconSize = 'w-5 h-5'

const menu = [
  { name: 'Dashboard', id: Panel.Dashboard, icon: <LayoutPanelTop className={IconSize} /> },
  { name: 'Setting', id: Panel.Setting, icon: <Settings className={IconSize} /> },
]

interface SidebarProps {
  onNavigate: (target: Panel) => void,
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { activePanel } = useGlobalVariable();
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (activePanel === Panel.Initialize) return;
    setRendered(true);
  }, [activePanel])

  return (
    <div className={`h-5/6 border-r border-t border-b rounded-r-md relative top-1/2 -translate-y-1/2 border-border-color bg-modal-background-color transition-transform duration-500 pl-6 overflow-hidden ${rendered ? "translate-x-0" : "-translate-x-1/1"}`}>
      <div className="mt-8">
        <h1 className="text-primary-text-color font-extrabold text-2xl leading-5">OPTiCS LCD</h1>
        <span className="text-xs text-secondary-text-color ">Agent Client v0.1</span><span className="text-[9px] text-secondary-text-color font-light">(Dev)</span>
      </div>
      <div className="w-full mt-2 overflow-x-hidden overflow-y-scroll">
        {menu.map((m, index) => {
          return <div key={index} onClick={() => { onNavigate(m.id) }} className={`p-2 hover:bg-white/10 hover:cursor-pointer active:bg-white/7.5 rounded-l-sm transition-colors duration-100 mt-1.5 border-r-2 flex flex-row ${activePanel === m.id ? 'border-service-color bg-white/10' : 'border-service-color/0'}`}>
            <span className="text-primary-text-color mr-2">{m.icon}</span>
            <span className="text-primary-text-color font-bold text-sm leading-tight">{m.name}</span>
          </div>
        })}
      </div>
    </div>
  );
}