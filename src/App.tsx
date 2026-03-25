import { useState } from "react"
import { Initialize } from "./pages/Initialize"
import { Dashboard } from "./pages/Dashboard"
import { Services } from "./pages/Services"
import { Sidebar } from "./components/Sidebar";
import { useGlobalVariable } from "./context/GlobalVariable.context";
import { Panel } from "./types/Panel";
import { Setting } from "./pages/Setting";


function App() {
  const { activePanel, setActivePanel } = useGlobalVariable();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNavigate = (panel: Panel) => {
    if (panel == activePanel) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActivePanel(panel);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  return (
    <>
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {activePanel === Panel.Initialize && <Initialize onNavigate={() => handleNavigate(Panel.Dashboard)} />}
      </div>
      {activePanel !== Panel.Initialize &&
        <div className="grid grid-cols-[1fr_7fr]">
          <Sidebar onNavigate={handleNavigate} />
          <div className={`transition-opacity duration-300 max-h-screen overflow-y-scroll ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {activePanel === Panel.Dashboard && <Dashboard />}
            {activePanel === Panel.Services && <Services />}
            {activePanel === Panel.Setting && <Setting />}
          </div>
        </div>
      }
    </>
  )
}

export default App
