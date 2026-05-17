import { useState } from 'react';
import { TABS } from './tabs/tabsConfig';
import LogoMark from './components/LogoMark';
import ComingSoon from './components/ComingSoon';
import Home from './tabs/Home';
import Audience from './tabs/Audience';
import Relations from './tabs/Relations';
import Execution from './tabs/Execution';
import './styles/app.css';

const TAB_COMPONENTS = {
  home: Home,
  audience: Audience,
  relations: Relations,
  execution: Execution,
};

const ARTIST_ID = 'kyan';

export default function App() {
  const [active, setActive] = useState('home');

  const ActiveComponent = TAB_COMPONENTS[active];
  const activeTab = TABS.find((t) => t.id === active);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <LogoMark size={26} variant="white" />
          <span className="sidebar-brand-name">FERB</span>
        </div>

        <nav className="sidebar-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${active === tab.id ? 'nav-item-active' : ''}`}
              onClick={() => setActive(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.phase > 1 && <span className="badge-soon">em breve</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">Sistema operacional artístico</div>
      </aside>

      <main className="content">
        <div key={active} className="rise">
          {ActiveComponent ? (
            <ActiveComponent artistId={ARTIST_ID} />
          ) : (
            <ComingSoon tab={activeTab} />
          )}
        </div>
      </main>

      <div className="watermark">
        <LogoMark size={40} variant="accent" />
      </div>
    </div>
  );
}
