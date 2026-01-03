(function() {
  const NullIcon = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" opacity="0.35"></circle>
      <path d="M8 12h8" opacity="0.55"></path>
    </svg>
  );

  const Icon = (name, fallback = NullIcon) => (window.Icons && window.Icons[name]) ? window.Icons[name] : fallback;

  window.MobileUtils = {
    Icon,
    NullIcon
  };
})();
