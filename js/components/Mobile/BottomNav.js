(function() {
  const { Icon } = window.MobileUtils;
  const MapIcon = Icon('Map');
  const Video = Icon('Video');
  const FileText = Icon('FileText');
  const LineChart = Icon('LineChart');

  const NavButton = ({ id, icon, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-300 group relative ${active ? 'text-cyan-400 bg-cyan-500/5' : 'text-slate-500 hover:text-cyan-200 hover:bg-slate-900'}`}
    >
      <div className={`transition-transform duration-300 ${active ? '-translate-y-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-bold mt-1 tracking-widest transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
        {label}
      </span>
      {active && <div className="absolute top-0 w-12 h-[2px] bg-cyan-400 shadow-[0_0_10px_cyan]"></div>}
    </button>
  );

  const BottomNav = ({ activeTab, setActiveTab, lang }) => {
    const t = window.MobileTranslations[lang] || window.MobileTranslations.en;
    return (
      <div className="absolute bottom-0 left-0 w-full z-40 bg-slate-950/95 backdrop-blur-xl border-t border-cyan-500/20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16 px-2">
          <NavButton id="map" icon={<MapIcon className="w-5 h-5" />} label={t.map} active={activeTab === 'map'} onClick={setActiveTab} />
          <div className="w-px h-6 bg-cyan-900/30"></div>
          <NavButton id="video" icon={<Video className="w-5 h-5" />} label={t.video} active={activeTab === 'video'} onClick={setActiveTab} />
          <div className="w-px h-6 bg-cyan-900/30"></div>
          <NavButton id="charts" icon={<LineChart className="w-5 h-5" />} label={t.data} active={activeTab === 'charts'} onClick={setActiveTab} />
          <div className="w-px h-6 bg-cyan-900/30"></div>
          <NavButton id="logs" icon={<FileText className="w-5 h-5" />} label={t.log} active={activeTab === 'logs'} onClick={setActiveTab} />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
      </div>
    );
  };

  window.MobileComponents = window.MobileComponents || {};
  window.MobileComponents.BottomNav = BottomNav;
})();
