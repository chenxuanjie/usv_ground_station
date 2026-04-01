(function() {
  const { useEffect, useState, useRef } = React;
  const { Icon } = window.MobileUtils;
  const MOBILE_STORAGE_KEYS = Object.freeze({
    autoExecLevel: 'mobile_auto_exec_level',
    deploymentMode: 'mobile_deployment_mode',
    deploymentTaskType: 'mobile_deployment_task_type',
    deploymentKeyboardSelected: 'mobile_deployment_keyboard_selected',
    waypointGuidance: 'mobile_waypoint_guidance',
    waypointController: 'mobile_waypoint_controller',
    waypointSpeedController: 'mobile_waypoint_speed_controller',
    stationKeepHeadingController: 'mobile_station_keep_heading_controller'
  });
  const DEPLOY_CONTROL_PLANNER_MAP = Object.freeze({
    'A*': '1',
    'Hybrid A*': '2',
    'DWA': '3'
  });
  const MOBILE_DEPLOY_ERROR_CODES = Object.freeze({
    sSendFailed: '101',
    cSendFailed: '102',
    ackTimeout: '201',
    ackFormatError: '301',
    ackUnsupported: '302',
    ackInvalidState: '303',
    ackExecFail: '304',
    ackUnknown: '399'
  });
  const Ship = Icon('Ship');
  const Globe = Icon('Globe');
  const Wifi = Icon('Wifi');
  const Help = Icon('Help');
  const Unplug = Icon('Unplug');
  const Link = Icon('Link');
  const Anchor = Icon('Anchor');
  const Waypoints = Icon('Waypoints');
  const FileText = Icon('FileText');
  const Video = Icon('Video');
  const CloudDownload = Icon('CloudDownload');
  const Repeat = Icon('Repeat');
  const Save = Icon('Save');
  const Send = Icon('Send');
  const Check = Icon('Check');

  const SideDrawer = ({
    open,
    onClose,
    lang,
    setLang,
    uiStyle,
    serverIp,
    setServerIp,
    serverPort,
    setServerPort,
    tcpStatus,
    toggleConnection,
    streamOn,
    setStreamOn,
    recvOn,
    setRecvOn,
    controlMode,
    setControlMode,
    keyboardSelected: keyboardSelectedProp,
    setKeyboardSelected: setKeyboardSelectedProp,
    cruiseMode,
    setCruiseMode,
    waypointsCount,
    sendSCommand,
    controlFrameConfig,
    sendCCommand,
    onOpenRouteManager,
    onOpenSaveRoute
  }) => {
    const ui = window.MobileUtils && typeof window.MobileUtils.getMobileTheme === 'function'
      ? window.MobileUtils.getMobileTheme(uiStyle)
      : null;
    const isIos = ui && ui.key === 'ios';

    const t = window.MobileTranslations[lang] || window.MobileTranslations.en;
    const tZh = window.MobileTranslations && window.MobileTranslations.zh ? window.MobileTranslations.zh : (window.MobileTranslations && window.MobileTranslations.en ? window.MobileTranslations.en : {});
    const tEn = window.MobileTranslations && window.MobileTranslations.en ? window.MobileTranslations.en : {};
    const isConnected = tcpStatus === 'ONLINE';
    const isLocked = tcpStatus === 'ONLINE' || tcpStatus === 'CONNECTING';
    const [keyboardSelectedInternal, setKeyboardSelectedInternal] = useState(false);
    const [deploymentTaskType, setDeploymentTaskType] = useState(() => {
      try {
        const stored = window.localStorage ? window.localStorage.getItem(MOBILE_STORAGE_KEYS.deploymentTaskType) : null;
        return ['manual', 'waypoint', 'auto', 'station_keep', 'joystick'].includes(stored) ? stored : 'manual';
      } catch (_) {
        return 'manual';
      }
    });
    const [activePathAlgorithm, setActivePathAlgorithm] = useState('A*');
    const [waypointGuidance, setWaypointGuidance] = useState(() => {
      try {
        const stored = window.localStorage ? window.localStorage.getItem(MOBILE_STORAGE_KEYS.waypointGuidance) : null;
        return stored === 'los' ? 'los' : 'p2p';
      } catch (_) {
        return 'p2p';
      }
    });
    const [waypointController, setWaypointController] = useState(() => {
      try {
        const stored = window.localStorage ? window.localStorage.getItem(MOBILE_STORAGE_KEYS.waypointController) : null;
        return stored === 'ai_pid' ? 'ai_pid' : 'pid';
      } catch (_) {
        return 'pid';
      }
    });
    const [waypointSpeedController, setWaypointSpeedController] = useState(() => {
      try {
        const stored = window.localStorage ? window.localStorage.getItem(MOBILE_STORAGE_KEYS.waypointSpeedController) : null;
        return stored === 'fix_pwm' ? 'fix_pwm' : 'pid';
      } catch (_) {
        return 'pid';
      }
    });
    const [stationKeepHeadingController, setStationKeepHeadingController] = useState(() => {
      try {
        const stored = window.localStorage ? window.localStorage.getItem(MOBILE_STORAGE_KEYS.stationKeepHeadingController) : null;
        return stored === 'ai_pid' ? 'ai_pid' : 'pid';
      } catch (_) {
        return 'pid';
      }
    });
    const [autoExecLevel, setAutoExecLevel] = useState(() => {
      try {
        const stored = window.localStorage ? window.localStorage.getItem(MOBILE_STORAGE_KEYS.autoExecLevel) : null;
        return stored === 'mission' ? 'mission' : 'debug';
      } catch (_) {
        return 'debug';
      }
    });
    const keyboardSelected = typeof keyboardSelectedProp === 'boolean' ? keyboardSelectedProp : keyboardSelectedInternal;
    const setKeyboardSelected = typeof setKeyboardSelectedProp === 'function' ? setKeyboardSelectedProp : setKeyboardSelectedInternal;
    const isTaskExecMode = autoExecLevel === 'mission';
    const selectedDeploymentTaskType = (() => {
      if (!isTaskExecMode) return 'manual';
      if (controlMode === 'W') return 'waypoint';
      if (controlMode === '@') return keyboardSelected ? 'joystick' : 'manual';
      if (controlMode === '#') return deploymentTaskType === 'station_keep' ? 'station_keep' : 'auto';
      return deploymentTaskType;
    })();
    const [hasDeployedThisSession, setHasDeployedThisSession] = useState(false);
    const [deployStatus, setDeployStatus] = useState('idle'); // 'idle' | 'dispatched'
    const prevTcpStatusRef = useRef(tcpStatus);
    const deployCloseTimerRef = useRef(null);

    useEffect(() => {
      return () => {
        if (deployCloseTimerRef.current) window.clearTimeout(deployCloseTimerRef.current);
      };
    }, []);

    useEffect(() => {
      if (controlMode !== '@') setKeyboardSelected(false);
    }, [controlMode, setKeyboardSelected]);

    useEffect(() => {
      try {
        if (!window.localStorage) return;
        const storedMode = window.localStorage.getItem(MOBILE_STORAGE_KEYS.deploymentMode);
        const storedTaskType = window.localStorage.getItem(MOBILE_STORAGE_KEYS.deploymentTaskType);
        const storedKeyboard = window.localStorage.getItem(MOBILE_STORAGE_KEYS.deploymentKeyboardSelected);
        const nextMode = storedMode === '@' || storedMode === 'W' || storedMode === '#' ? storedMode : '';
        if (!nextMode) return;
        const taskTypeFromStorage = ['manual', 'waypoint', 'auto', 'station_keep', 'joystick'].includes(storedTaskType)
          ? storedTaskType
          : '';
        const nextKeyboardSelected = nextMode === '@' && (storedKeyboard === '1' || storedKeyboard === 'true');
        const inferredTaskType = taskTypeFromStorage || (
          nextMode === 'W'
            ? 'waypoint'
            : (nextMode === '#'
              ? 'auto'
              : (nextKeyboardSelected ? 'joystick' : 'manual'))
        );
        if (typeof setControlMode === 'function') setControlMode(nextMode);
        setKeyboardSelected(nextKeyboardSelected);
        setDeploymentTaskType(inferredTaskType);
      } catch (_) {}
    }, [setControlMode, setKeyboardSelected]);

    useEffect(() => {
      const prev = prevTcpStatusRef.current;
      prevTcpStatusRef.current = tcpStatus;
      if (tcpStatus !== 'ONLINE') {
        setHasDeployedThisSession(false);
        setDeployStatus('idle');
        return;
      }
      if (prev !== 'ONLINE') setHasDeployedThisSession(false);
    }, [tcpStatus]);

    useEffect(() => {
      if (isTaskExecMode) return;
      if (controlMode === '@' && !keyboardSelected) return;
      setKeyboardSelected(false);
      if (typeof setControlMode === 'function') setControlMode('@');
    }, [controlMode, isTaskExecMode, keyboardSelected, setControlMode, setKeyboardSelected]);

    useEffect(() => {
      setHasDeployedThisSession(false);
    }, [
      autoExecLevel,
      activePathAlgorithm,
      controlMode,
      cruiseMode,
      deploymentTaskType,
      recvOn,
      stationKeepHeadingController,
      streamOn,
      waypointController,
      waypointGuidance,
      waypointSpeedController,
      waypointsCount
    ]);

    useEffect(() => {
      if (!open) {
        setDeployStatus('idle');
        if (deployCloseTimerRef.current) {
          window.clearTimeout(deployCloseTimerRef.current);
          deployCloseTimerRef.current = null;
        }
      }
    }, [open]);

    const buildDeployControlConfig = () => {
      const baseConfig = controlFrameConfig && typeof controlFrameConfig === 'object' ? controlFrameConfig : {};
      const isWaypointTaskMode = selectedDeploymentTaskType === 'waypoint';
      const isAutoTaskMode = selectedDeploymentTaskType === 'auto';
      const isStationKeepTaskMode = selectedDeploymentTaskType === 'station_keep';
      const isJoystickTaskMode = selectedDeploymentTaskType === 'joystick';
      const plannerValue = DEPLOY_CONTROL_PLANNER_MAP[activePathAlgorithm] || '0';
      const guidanceValue = waypointGuidance === 'los' ? '2' : '1';
      const headingControllerValue = waypointController === 'ai_pid' ? '2' : '1';
      const speedControllerValue = waypointSpeedController === 'fix_pwm' ? '1' : '2';
      const stationKeepHeadingControllerValue = stationKeepHeadingController === 'ai_pid' ? '2' : '1';
      const modeValue = autoExecLevel === 'mission' ? '1' : '0';
      const taskValue = isWaypointTaskMode
        ? '1'
        : (isAutoTaskMode
          ? '2'
          : (isStationKeepTaskMode
            ? '3'
            : (isJoystickTaskMode ? '4' : '0')));

      // 仅对移动端当前可见入口做映射；没有入口的字段统一按 0 发送，不沿用 S/旧状态限制 C。
      return {
        ...baseConfig,
        src: '0',
        mode: modeValue,
        task: taskValue,
        planner: isAutoTaskMode ? plannerValue : '0',
        guidance: isWaypointTaskMode ? guidanceValue : '0',
        heading_controller: isWaypointTaskMode
          ? headingControllerValue
          : (isStationKeepTaskMode ? stationKeepHeadingControllerValue : '0'),
        speed_controller: isWaypointTaskMode
          ? speedControllerValue
          : (isStationKeepTaskMode ? '2' : '0')
      };
    };

    useEffect(() => {
      try {
        if (window.localStorage) window.localStorage.setItem(MOBILE_STORAGE_KEYS.autoExecLevel, autoExecLevel);
      } catch (_) {}
    }, [autoExecLevel]);

    useEffect(() => {
      try {
        if (window.localStorage) {
          window.localStorage.setItem(MOBILE_STORAGE_KEYS.deploymentMode, String(controlMode || '@'));
          window.localStorage.setItem(MOBILE_STORAGE_KEYS.deploymentTaskType, String(selectedDeploymentTaskType || 'manual'));
          window.localStorage.setItem(MOBILE_STORAGE_KEYS.deploymentKeyboardSelected, keyboardSelected ? '1' : '0');
        }
      } catch (_) {}
    }, [controlMode, keyboardSelected, selectedDeploymentTaskType]);

    useEffect(() => {
      try {
        if (window.localStorage) window.localStorage.setItem(MOBILE_STORAGE_KEYS.waypointGuidance, waypointGuidance);
      } catch (_) {}
    }, [waypointGuidance]);

    useEffect(() => {
      try {
        if (window.localStorage) window.localStorage.setItem(MOBILE_STORAGE_KEYS.waypointController, waypointController);
      } catch (_) {}
    }, [waypointController]);

    useEffect(() => {
      try {
        if (window.localStorage) window.localStorage.setItem(MOBILE_STORAGE_KEYS.waypointSpeedController, waypointSpeedController);
      } catch (_) {}
    }, [waypointSpeedController]);

    useEffect(() => {
      try {
        if (window.localStorage) window.localStorage.setItem(MOBILE_STORAGE_KEYS.stationKeepHeadingController, stationKeepHeadingController);
      } catch (_) {}
    }, [stationKeepHeadingController]);

    const getDeployErrorCode = (result) => {
      const ret = Number.parseInt(String(result && result.ret), 10);
      if (!Number.isFinite(ret)) return MOBILE_DEPLOY_ERROR_CODES.ackUnknown;
      if (ret === 1) return MOBILE_DEPLOY_ERROR_CODES.ackFormatError;
      if (ret === 2) return MOBILE_DEPLOY_ERROR_CODES.ackUnsupported;
      if (ret === 3) return MOBILE_DEPLOY_ERROR_CODES.ackInvalidState;
      if (ret === 4) return MOBILE_DEPLOY_ERROR_CODES.ackExecFail;
      return MOBILE_DEPLOY_ERROR_CODES.ackUnknown;
    };

    const buildDeployToastMessage = (isSuccess, errorCode = '') => {
      const base = isSuccess
        ? (t.deploy_success_short || t.toast_deploy_success || 'Deploy OK')
        : (t.deploy_failed_short || t.toast_deploy_failed || 'Deploy failed');
      const code = errorCode || MOBILE_DEPLOY_ERROR_CODES.ackUnknown;
      return isSuccess
        ? base
        : (lang === 'zh' ? `${base}。错误码：${code}` : `${base}. Code: ${code}`);
    };

    const showDeployToast = (isSuccess, errorCode = '') => {
      if (!(window.SystemToast && typeof window.SystemToast.show === 'function')) return;
      window.SystemToast.show(buildDeployToastMessage(isSuccess, errorCode), {
        type: isSuccess ? 'success' : 'error',
        durationMs: isSuccess ? 2500 : 4500
      });
    };

    const handleDeployClick = () => {
      const configOk = typeof sendSCommand === 'function' ? sendSCommand() : false;
      const controlOk = typeof sendCCommand === 'function'
        ? sendCCommand(buildDeployControlConfig(), {
            showToast: false,
            source: 'mobile_deploy',
            onAckResolved: (result) => {
              if (!result || !result.ok) {
                setDeployStatus('idle');
                setHasDeployedThisSession(false);
                showDeployToast(false, getDeployErrorCode(result));
                return;
              }

              setDeployStatus('dispatched');
              setHasDeployedThisSession(true);
              showDeployToast(true);
              if (typeof onClose === 'function') {
                if (deployCloseTimerRef.current) window.clearTimeout(deployCloseTimerRef.current);
                deployCloseTimerRef.current = window.setTimeout(() => {
                  deployCloseTimerRef.current = null;
                  onClose();
                }, 160);
              }
            },
            onAckTimeout: (result) => {
              setDeployStatus('idle');
              setHasDeployedThisSession(false);
              showDeployToast(false, MOBILE_DEPLOY_ERROR_CODES.ackTimeout);
            }
          })
        : false;

      if (controlOk) {
        setDeployStatus('dispatched');
        return;
      }

      const errorCode = !configOk && typeof sendSCommand === 'function'
        ? MOBILE_DEPLOY_ERROR_CODES.sSendFailed
        : MOBILE_DEPLOY_ERROR_CODES.cSendFailed;
      showDeployToast(false, errorCode);
    };

    const TechHeader = ({ icon: IconComp, title, sub }) => (
      <div className={`flex items-end justify-between pb-1 mb-4 ${isIos ? 'mt-5 border-b border-slate-200/60' : 'mt-6 border-b border-cyan-500/20'}`}>
        <div className={`flex items-center gap-2 ${ui?.accentText || 'text-cyan-400'}`}>
          <IconComp className="w-4 h-4" />
          <h3 className={`text-xs font-bold uppercase tracking-[0.15em] ${ui?.drawer?.sectionTitle || (isIos ? 'text-slate-600' : 'text-cyan-100/80')}`}>{title}</h3>
        </div>
        {sub && <span className={`text-[10px] ${isIos ? 'font-sans' : 'font-mono'} ${ui?.drawer?.sectionSub || 'text-cyan-500/60'}`}>{sub}</span>}
      </div>
    );

    const ModeButton = ({ active, label, sub, onClick, colorClass = "cyan", disabled = false }) => {
      if (isIos) {
        const iosActiveTheme = (() => {
          if (colorClass === 'orange') return 'bg-[#FF9500] text-white border-[#FF9500]/35 shadow-[0_8px_30px_-10px_rgba(255,149,0,0.38)]';
          if (colorClass === 'rose') return 'bg-[#FF375F] text-white border-[#FF375F]/35 shadow-[0_8px_30px_-10px_rgba(255,55,95,0.38)]';
          if (colorClass === 'purple') return 'bg-[#5856D6] text-white border-[#5856D6]/35 shadow-[0_8px_30px_-10px_rgba(88,86,214,0.38)]';
          if (colorClass === 'emerald') return 'bg-[#34C759] text-white border-[#34C759]/35 shadow-[0_8px_30px_-10px_rgba(52,199,89,0.38)]';
          return 'bg-[#007AFF] text-white border-[#007AFF]/30 shadow-[0_8px_30px_-10px_rgba(0,122,255,0.35)]';
        })();
        return (
          <button
            onClick={onClick}
            disabled={disabled}
            className={`snap-start shrink-0 min-w-[86px] relative flex flex-col items-center justify-center py-3 px-3 border transition-all duration-200 rounded-[14px] ${
              disabled
                ? 'bg-slate-100/70 border-slate-200/70 text-slate-300 opacity-65 cursor-not-allowed'
                : (active
                  ? `${iosActiveTheme} active:scale-[0.98]`
                  : 'bg-white/70 border-white/50 text-slate-600 hover:bg-white/80 active:scale-[0.98]')
            }`}
          >
            <span className="text-sm font-semibold z-10">{label}</span>
            <span className="text-[9px] font-mono opacity-70 z-10">{sub}</span>
          </button>
        );
      }

      const activeTheme = (() => {
        if (colorClass === 'orange') return 'bg-amber-500/14 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.22)]';
        if (colorClass === 'rose') return 'bg-rose-500/12 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(251,113,133,0.22)]';
        if (colorClass === 'purple') return 'bg-purple-500/10 border-purple-400 text-purple-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
        if (colorClass === 'emerald') return 'bg-emerald-500/10 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
        return 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
      })();

      const activeOverlay = (() => {
        if (colorClass === 'orange') return 'bg-amber-400/5';
        if (colorClass === 'rose') return 'bg-rose-400/5';
        if (colorClass === 'purple') return 'bg-purple-400/5';
        if (colorClass === 'emerald') return 'bg-emerald-400/5';
        return 'bg-cyan-400/5';
      })();

      const activeCorner = (() => {
        if (colorClass === 'orange') return 'border-amber-400';
        if (colorClass === 'rose') return 'border-rose-400';
        if (colorClass === 'purple') return 'border-purple-400';
        if (colorClass === 'emerald') return 'border-emerald-400';
        return 'border-cyan-400';
      })();

      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className={`
            snap-start shrink-0 min-w-[86px] relative flex flex-col items-center justify-center py-3 px-3 border transition-all duration-200 clip-path-slant
            ${disabled
              ? 'bg-transparent border-slate-800 text-slate-600 opacity-55 cursor-not-allowed'
              : (active ? activeTheme : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300')}
          `}
        >
          {active && !disabled && <div className={`absolute inset-0 ${activeOverlay} animate-pulse`}></div>}
          <span className="text-sm font-bold z-10">{label}</span>
          <span className="text-[9px] font-mono opacity-70 z-10">{sub}</span>
          {active && !disabled && (
            <>
              <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${activeCorner}`}></div>
              <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${activeCorner}`}></div>
            </>
          )}
        </button>
      );
    };

    const CapsuleButton = ({ active, label, onClick, accent = 'orange' }) => {
      const iosActive = accent === 'orange'
        ? 'bg-[#FF9500] text-white border-[#FF9500]/35'
        : (accent === 'rose'
          ? 'bg-[#FF375F] text-white border-[#FF375F]/35'
          : 'bg-[#007AFF] text-white border-[#007AFF]/35');
      const iosInactive = 'bg-white/70 text-slate-600 border-slate-200/70 hover:bg-white/85';

      const cyberActive = accent === 'orange'
        ? 'bg-amber-500/14 border-amber-400/70 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.24)]'
        : (accent === 'rose'
          ? 'bg-rose-500/14 border-rose-400/70 text-rose-200 shadow-[0_0_12px_rgba(251,113,133,0.24)]'
          : 'bg-cyan-500/14 border-cyan-400/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.24)]');
      const cyberInactive = 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300';

      return (
        <button
          type="button"
          onClick={onClick}
          className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all ${isIos ? (active ? iosActive : iosInactive) : (active ? cyberActive : cyberInactive)}`}
        >
          {label}
        </button>
      );
    };

    const TechToggle = ({ label, icon: IconComp, checked, onChange, activeColor = "text-cyan-400" }) => (
      isIos ? (
        <div
          onClick={() => onChange(!checked)}
          className={`flex items-center justify-between px-4 py-3 mb-2 rounded-[14px] border border-white/50 bg-white/80 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] cursor-pointer transition-all duration-200 active:scale-[0.99] ${checked ? '' : 'hover:bg-white/90'}`}
        >
          <div className="flex items-center gap-3">
            <IconComp className={`w-4 h-4 ${checked ? 'text-[#007AFF]' : 'text-slate-400'}`} />
            <span className="text-[13px] font-medium text-slate-900">{label}</span>
          </div>
          <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${checked ? 'bg-[#34C759]' : 'bg-slate-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => onChange(!checked)}
          className={`
            flex items-center justify-between p-3 mb-2 rounded border cursor-pointer transition-all duration-300
            ${checked ? 'bg-cyan-900/20 border-cyan-500/50 shadow-glow-inset' : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/5'}
          `}
        >
          <div className="flex items-center gap-3">
            <IconComp className={`w-4 h-4 ${checked ? activeColor : 'text-slate-500'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${checked ? 'text-white' : 'text-slate-400'}`}>{label}</span>
          </div>

          <div className="flex items-center gap-2">
            <span aria-hidden="true" className={`text-[9px] font-mono w-6 text-right ${checked ? 'text-cyan-400' : 'text-slate-600'}`}></span>
            <div className={`w-8 h-1 rounded-sm ${checked ? 'bg-cyan-400 shadow-glow' : 'bg-slate-700'}`}></div>
          </div>
        </div>
      )
    );

    const drawerWidthClass = isIos ? 'w-[82%] max-w-[320px]' : 'w-72';
    const cardRadiusClass = isIos ? 'rounded-[22px]' : 'rounded';
    const cardBase = ui?.drawer?.card || 'bg-slate-900/50 border border-slate-800';

    return (
      <>
        {open && <div className={`absolute inset-0 z-50 transition-opacity ${ui?.overlay || 'bg-black/60 backdrop-blur-sm'}`} onClick={onClose} />}
        <div className={`absolute top-0 left-0 h-full ${drawerWidthClass} z-[55] transform transition-transform duration-300 ease-out flex flex-col ${ui?.drawer?.panel || 'bg-slate-950/95 border-r border-cyan-500/30'} ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className={`h-16 flex items-center px-4 ${ui?.drawer?.header || 'border-b border-cyan-500/20 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent'}`}>
            <Ship className={`${ui?.drawer?.headerIcon || 'text-cyan-400'} mr-2 w-5 h-5`} />
            <span className={`${isIos ? 'font-sans font-bold tracking-tight text-[15px]' : 'font-mono font-bold tracking-wider text-sm'} ${ui?.drawer?.headerTitle || 'text-cyan-100'}`}>{t.usv_control}</span>
          </div>

          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            <style>{`
              @keyframes sideDrawerShimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              @keyframes sideDrawerPulseGlowGreen {
                0%, 100% { box-shadow: 0 0 8px rgba(16,185,129,0.15); }
                50% { box-shadow: 0 0 18px rgba(16,185,129,0.4); }
              }
            `}</style>

            <div>
              <TechHeader icon={Globe} title={t.language} />
              <div className={ui?.drawer?.segment || "flex bg-slate-900 rounded p-1 border border-slate-800"}>
                <button
                  onClick={() => setLang('en')}
                  className={`flex-1 py-1.5 text-xs rounded transition-colors ${isIos ? 'font-semibold' : 'font-mono'} ${lang === 'en' ? (ui?.drawer?.segmentBtnActive || 'bg-cyan-600 text-white shadow-lg') : (ui?.drawer?.segmentBtnInactive || 'text-slate-400 hover:text-white')}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('zh')}
                  className={`flex-1 py-1.5 text-xs rounded transition-colors ${isIos ? 'font-semibold' : 'font-mono'} ${lang === 'zh' ? (ui?.drawer?.segmentBtnActive || 'bg-cyan-600 text-white shadow-lg') : (ui?.drawer?.segmentBtnInactive || 'text-slate-400 hover:text-white')}`}
                >
                  中文
                </button>
              </div>
            </div>

            <div className={`h-px w-full ${ui?.divider || 'bg-cyan-900/30'}`}></div>

            <div>
              <TechHeader icon={Wifi} title={t.connection} />
              <div className={`${cardBase} ${cardRadiusClass} p-3 space-y-3 ${isConnected ? 'border-green-500/30' : ''}`}>
                {isIos ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase block">{t.ip}</label>
                      <input
                        type="text"
                        value={serverIp}
                        onChange={(e) => setServerIp(e.target.value)}
                        disabled={isLocked}
                        className={`w-full border transition-colors ${ui?.drawer?.input || 'bg-slate-950 border-slate-700 text-cyan-100 font-mono text-xs px-2 py-1.5 rounded focus:outline-none focus:border-cyan-500'} ${isLocked ? (ui?.drawer?.inputLocked || 'border-green-500/30 text-green-100 opacity-80 cursor-not-allowed') : ''}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase block">{t.port}</label>
                      <input
                        type="text"
                        value={serverPort}
                        onChange={(e) => setServerPort(e.target.value)}
                        disabled={isLocked}
                        className={`w-full border transition-colors ${ui?.drawer?.input || 'bg-slate-950 border-slate-700 text-cyan-100 font-mono text-xs px-2 py-1.5 rounded focus:outline-none focus:border-cyan-500'} ${isLocked ? (ui?.drawer?.inputLocked || 'border-green-500/30 text-green-100 opacity-80 cursor-not-allowed') : ''}`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative group">
                      <div
                        className={`
                          flex items-center rounded px-3 py-2 border transition-all duration-300
                          ${isLocked ? 'bg-slate-950/40 border-green-500/30 opacity-85' : 'bg-slate-950/40 border-cyan-500/20'}
                          ${!isLocked ? 'focus-within:border-cyan-400 focus-within:shadow-[0_0_8px_rgba(6,182,212,0.25)]' : ''}
                        `}
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-3 min-w-[62px]">{t.ip}</span>
                        <input
                          type="text"
                          value={serverIp}
                          onChange={(e) => setServerIp(e.target.value)}
                          disabled={isLocked}
                          className={`flex-1 bg-transparent border-none font-mono text-sm focus:outline-none ${isLocked ? 'text-green-100 cursor-not-allowed' : 'text-cyan-400'}`}
                        />
                      </div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/70 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    </div>

                    <div className="relative group">
                      <div
                        className={`
                          flex items-center rounded px-3 py-2 border transition-all duration-300
                          ${isLocked ? 'bg-slate-950/40 border-green-500/30 opacity-85' : 'bg-slate-950/40 border-cyan-500/20'}
                          ${!isLocked ? 'focus-within:border-cyan-400 focus-within:shadow-[0_0_8px_rgba(6,182,212,0.25)]' : ''}
                        `}
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-3 min-w-[62px]">{t.port}</span>
                        <input
                          type="text"
                          value={serverPort}
                          onChange={(e) => setServerPort(e.target.value)}
                          disabled={isLocked}
                          className={`flex-1 bg-transparent border-none font-mono text-sm focus:outline-none ${isLocked ? 'text-green-100 cursor-not-allowed' : 'text-cyan-400'}`}
                        />
                      </div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/70 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    </div>
                  </>
                )}
                <button
                  onClick={toggleConnection}
                  className={`w-full py-2 mt-2 font-mono text-xs font-bold border rounded flex items-center justify-center gap-2 transition-all duration-300 ${isIos ? 'rounded-[14px]' : ''} ${
                    isConnected
                      ? (ui?.drawer?.actionDanger || 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20')
                      : (ui?.drawer?.actionPrimary || 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]')
                  }`}
                >
                  {isConnected ? (
                    <><Unplug className="w-4 h-4" /> {t.disconnect_btn}</>
                  ) : (
                    <><Link className="w-4 h-4" /> {t.connect_btn}</>
                  )}
                </button>
              </div>
            </div>

            {isConnected && !hasDeployedThisSession && (
              <div className={`px-3 py-2 rounded border text-[10px] ${isIos ? 'font-sans' : 'font-mono'} border-amber-500/30 bg-amber-500/10 text-amber-100/80`}>
                <div className="flex items-start gap-2">
                  <Help className="w-4 h-4 text-amber-400 flex-none mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-bold tracking-wider text-amber-200/90">{t.deploy_reminder_title}</div>
                    <div className="mt-0.5 text-amber-200/60">{t.deploy_reminder_desc}</div>
                  </div>
                </div>
              </div>
            )}

            <div className={`h-px w-full ${ui?.divider || 'bg-cyan-900/30'}`}></div>

            <div>
              <TechHeader icon={Anchor} title={t.deployment} sub={t.op_mode} />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`${isIos ? 'text-[11px] text-slate-500 font-semibold tracking-wider' : 'text-[10px] text-slate-500 font-bold tracking-wider'}`}>{t.exec_level_label}</span>
                  <div className={`relative flex p-1 border w-[150px] ${isIos ? 'bg-white/70 rounded-[12px] border-slate-200/70' : 'bg-[#0d131f] rounded border-[#1e2a3b]'}`}>
                    <div
                      className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded transition-all duration-300 ease-out ${
                        isTaskExecMode
                          ? (isIos
                            ? 'translate-x-[calc(100%+0px)] bg-cyan-500/18 border border-cyan-500/45'
                            : 'translate-x-[calc(100%+0px)] bg-cyan-500/20 border border-cyan-500/50')
                          : (isIos
                            ? 'translate-x-0 bg-yellow-500/18 border border-yellow-500/45'
                            : 'translate-x-0 bg-yellow-500/20 border border-yellow-500/50')
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAutoExecLevel('debug');
                        setKeyboardSelected(false);
                        if (typeof setControlMode === 'function') setControlMode('@');
                      }}
                      className={`flex-1 relative z-10 text-xs py-1.5 font-bold transition-colors ${
                        !isTaskExecMode
                          ? (isIos ? 'text-[#B45309]' : 'text-yellow-500')
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t.exec_level_debug}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoExecLevel('mission')}
                      className={`flex-1 relative z-10 text-xs py-1.5 font-bold transition-colors ${
                        isTaskExecMode
                          ? (isIos ? 'text-[#0369A1]' : 'text-cyan-400')
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t.exec_level_mission}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-2 snap-x snap-mandatory">
                  <ModeButton
                    label={lang === 'zh' ? tZh.manual : tEn.manual}
                    sub={lang === 'zh' ? tEn.manual_sub : tZh.manual_sub}
                    active={selectedDeploymentTaskType === 'manual'}
                    onClick={() => {
                      setKeyboardSelected(false);
                      setDeploymentTaskType('manual');
                      setControlMode && setControlMode('@');
                    }}
                    colorClass="cyan"
                  />
                  <ModeButton
                    label={lang === 'zh' ? tZh.waypoint_mission : tEn.waypoint_mission}
                    sub={lang === 'zh' ? tEn.waypoint_sub : tZh.waypoint_sub}
                    active={selectedDeploymentTaskType === 'waypoint'}
                    disabled={!isTaskExecMode}
                    onClick={() => {
                      setKeyboardSelected(false);
                      setDeploymentTaskType('waypoint');
                      setControlMode && setControlMode('W');
                    }}
                    colorClass="orange"
                  />
                  <ModeButton
                    label={lang === 'zh' ? tZh.auto : tEn.auto}
                    sub={lang === 'zh' ? tEn.auto_sub : tZh.auto_sub}
                    active={selectedDeploymentTaskType === 'auto'}
                    disabled={!isTaskExecMode}
                    onClick={() => {
                      setKeyboardSelected(false);
                      setDeploymentTaskType('auto');
                      setControlMode && setControlMode('#');
                    }}
                    colorClass="emerald"
                  />
                  <ModeButton
                    label={lang === 'zh' ? tZh.station_keep : tEn.station_keep}
                    sub={lang === 'zh' ? tEn.station_keep_sub : tZh.station_keep_sub}
                    active={selectedDeploymentTaskType === 'station_keep'}
                    disabled={!isTaskExecMode}
                    onClick={() => {
                      setKeyboardSelected(false);
                      setDeploymentTaskType('station_keep');
                      setControlMode && setControlMode('#');
                    }}
                    colorClass="rose"
                  />
                  <ModeButton
                    label={lang === 'zh' ? tZh.keyboard : tEn.keyboard}
                    sub={lang === 'zh' ? tEn.keyboard_sub : tZh.keyboard_sub}
                    active={selectedDeploymentTaskType === 'joystick'}
                    disabled={!isTaskExecMode}
                    onClick={() => {
                      setKeyboardSelected(true);
                      setDeploymentTaskType('joystick');
                      setControlMode && setControlMode('@');
                    }}
                    colorClass="purple"
                  />
                  </div>
                </div>

                {selectedDeploymentTaskType === 'auto' && (
                  <div className="pb-1">
                    <div className={isIos ? `${cardBase} ${cardRadiusClass} p-3` : 'tech-border p-3'}>
                      <div className={`text-[10px] font-bold uppercase mb-2 tracking-wider flex items-center gap-2 ${isIos ? 'text-slate-500' : 'text-slate-500'}`}>
                        <Waypoints className={`w-4 h-4 ${isIos ? 'text-[#007AFF]' : 'text-cyan-400'}`} />
                        <span>{lang === 'zh' ? `${tZh.path_planning} (${tEn.path_planning})` : `${tEn.path_planning} (${tZh.path_planning})`}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {['A*', 'Hybrid A*', 'DWA'].map(algo => (
                          <button
                            key={algo}
                            type="button"
                            onClick={() => setActivePathAlgorithm(algo)}
                            className={`py-2 text-[10px] font-bold border transition-colors ${
                              isIos
                                ? (activePathAlgorithm === algo
                                  ? 'bg-[#007AFF]/10 border-[#007AFF]/40 text-slate-900 rounded-[12px] shadow-[0_6px_16px_-10px_rgba(0,122,255,0.35)]'
                                  : 'bg-white/60 border-slate-200/60 text-slate-500 rounded-[12px] hover:bg-white/80'
                                )
                                : (activePathAlgorithm === algo
                                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                                  : 'border-[#1e2a3b] text-gray-500 hover:border-gray-600'
                                )
                            }`}
                          >
                            {algo}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedDeploymentTaskType === 'waypoint' && (
                  <div className={isIos ? `${cardBase} ${cardRadiusClass} p-3 space-y-3` : 'tech-border p-3 space-y-3'}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isIos ? 'text-slate-500' : 'text-slate-500'}`}>{t.waypoint_mission}</div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`${isIos ? 'text-[12px] text-slate-600 font-semibold' : 'text-[10px] text-slate-400 font-bold uppercase tracking-wider'}`}>{t.guidance_label}</span>
                      <div className="flex items-center gap-2">
                        <CapsuleButton
                          active={waypointGuidance === 'p2p'}
                          label={t.guidance_p2p}
                          onClick={() => setWaypointGuidance('p2p')}
                          accent="orange"
                        />
                        <CapsuleButton
                          active={waypointGuidance === 'los'}
                          label={t.guidance_los}
                          onClick={() => setWaypointGuidance('los')}
                          accent="orange"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`${isIos ? 'text-[12px] text-slate-600 font-semibold' : 'text-[10px] text-slate-400 font-bold uppercase tracking-wider'}`}>{t.heading_controller_label}</span>
                      <div className="flex items-center gap-2">
                        <CapsuleButton
                          active={waypointController === 'pid'}
                          label={t.controller_pid}
                          onClick={() => setWaypointController('pid')}
                          accent="orange"
                        />
                        <CapsuleButton
                          active={waypointController === 'ai_pid'}
                          label={t.controller_ai_pid}
                          onClick={() => setWaypointController('ai_pid')}
                          accent="orange"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`${isIos ? 'text-[12px] text-slate-600 font-semibold' : 'text-[10px] text-slate-400 font-bold uppercase tracking-wider'}`}>{t.speed_controller_label}</span>
                      <div className="flex items-center gap-2">
                        <CapsuleButton
                          active={waypointSpeedController === 'fix_pwm'}
                          label={t.speed_controller_fix_pwm}
                          onClick={() => setWaypointSpeedController('fix_pwm')}
                          accent="orange"
                        />
                        <CapsuleButton
                          active={waypointSpeedController === 'pid'}
                          label={t.speed_controller_pid}
                          onClick={() => setWaypointSpeedController('pid')}
                          accent="orange"
                        />
                      </div>
                    </div>

                    <div className={`flex w-full ${isIos ? 'mt-4 gap-2' : 'mt-6 gap-2'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onClose === 'function') onClose();
                          if (typeof onOpenRouteManager === 'function') {
                            window.setTimeout(() => onOpenRouteManager({ returnToMobileDrawerOnCancel: true }), 120);
                          }
                        }}
                        className={isIos
                          ? 'flex-1 py-2.5 flex items-center justify-center gap-2 bg-white/80 border border-white/70 text-[#007AFF] rounded-[12px] shadow-[0_8px_30px_-16px_rgba(0,0,0,0.2)] active:scale-[0.98] active:bg-white/90 transition-all'
                          : 'flex-1 py-2.5 flex items-center justify-center gap-2 bg-[#162031] border border-[#2a3a50] text-gray-300 rounded-sm active:scale-[0.98] active:bg-[#1c2a41] transition-all'
                        }
                      >
                        <FileText className={`w-3.5 h-3.5 ${isIos ? 'text-[#007AFF]' : 'text-cyan-500'}`} />
                        <span className={`text-xs font-bold ${isIos ? 'tracking-tight' : ''}`}>{t.load_route}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onClose === 'function') onClose();
                          if (typeof onOpenSaveRoute === 'function') {
                            window.setTimeout(() => onOpenSaveRoute({ returnToMobileDrawerOnCancel: true }), 120);
                          }
                        }}
                        className={isIos
                          ? 'flex-1 py-2.5 flex items-center justify-center gap-2 bg-white/80 border border-white/70 text-[#007AFF] rounded-[12px] shadow-[0_8px_30px_-16px_rgba(0,0,0,0.2)] active:scale-[0.98] active:bg-white/90 transition-all'
                          : 'flex-1 py-2.5 flex items-center justify-center gap-2 bg-[#162031] border border-[#2a3a50] text-gray-300 rounded-sm active:scale-[0.98] active:bg-[#1c2a41] transition-all'
                        }
                      >
                        <Save className={`w-3.5 h-3.5 ${isIos ? 'text-[#007AFF]' : 'text-cyan-500'}`} />
                        <span className={`text-xs font-bold ${isIos ? 'tracking-tight' : ''}`}>{t.save_route}</span>
                      </button>
                    </div>

                    <div className="flex justify-center mt-4 mb-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onClose === 'function') onClose();
                          if (typeof sendWaypointsCommand === 'function') {
                            window.setTimeout(() => sendWaypointsCommand(), 120);
                          }
                        }}
                        className={isIos
                          ? 'w-[75%] py-2.5 flex items-center justify-center gap-2 bg-[#34C759]/18 border border-[#34C759]/55 text-[#1d8a46] font-bold rounded-[12px] active:scale-[0.95] active:bg-[#34C759]/30 transition-all duration-200 relative overflow-hidden shadow-[0_10px_30px_-16px_rgba(52,199,89,0.45)]'
                          : 'w-[75%] py-2.5 flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-500/60 text-emerald-400 font-bold tracking-widest active:scale-[0.95] active:bg-emerald-600/40 transition-all duration-200 relative overflow-hidden rounded-sm'
                        }
                        style={isIos ? undefined : { animation: 'sideDrawerPulseGlowGreen 2s infinite' }}
                      >
                        <div
                          className={isIos ? 'absolute inset-0 bg-gradient-to-r from-transparent via-[#34C759]/20 to-transparent' : 'absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent'}
                          style={{ animation: 'sideDrawerShimmer 3s infinite linear' }}
                        />
                        <Send className={`relative z-10 w-4 h-4 -rotate-12 -translate-y-[1px] ${isIos ? 'text-[#1d8a46]' : ''}`} />
                        <span className={`relative z-10 ${isIos ? 'text-[13px] tracking-tight' : 'text-sm'}`}>{t.track_route}</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedDeploymentTaskType === 'station_keep' && (
                  <div className={isIos ? `${cardBase} ${cardRadiusClass} p-3 space-y-3` : 'tech-border p-3 space-y-3'}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isIos ? 'text-slate-500' : 'text-slate-500'}`}>{t.station_keep}</div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`${isIos ? 'text-[12px] text-slate-600 font-semibold' : 'text-[10px] text-slate-400 font-bold uppercase tracking-wider'}`}>{t.heading_controller_label}</span>
                      <div className="flex items-center gap-2">
                        <CapsuleButton
                          active={stationKeepHeadingController === 'pid'}
                          label={t.controller_pid}
                          onClick={() => setStationKeepHeadingController('pid')}
                          accent="rose"
                        />
                        <CapsuleButton
                          active={stationKeepHeadingController === 'ai_pid'}
                          label={t.controller_ai_pid}
                          onClick={() => setStationKeepHeadingController('ai_pid')}
                          accent="rose"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`${isIos ? 'text-[12px] text-slate-600 font-semibold' : 'text-[10px] text-slate-400 font-bold uppercase tracking-wider'}`}>{t.speed_controller_label}</span>
                      <div className="flex items-center gap-2">
                        <CapsuleButton
                          active={true}
                          label={t.speed_controller_pid}
                          onClick={() => {}}
                          accent="rose"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className={isIos ? `${cardBase} rounded-[22px] p-3` : 'tech-border p-2'}>
                  <TechToggle
                    label={t.video_feed}
                    icon={Video}
                    checked={!!streamOn}
                    onChange={() => setStreamOn && setStreamOn(!streamOn)}
                    activeColor="text-blue-400"
                  />
                  <TechToggle
                    label={t.telemetry}
                    icon={CloudDownload}
                    checked={!!recvOn}
                    onChange={() => setRecvOn && setRecvOn(!recvOn)}
                    activeColor="text-purple-400"
                  />
                  <TechToggle
                    label={t.loop_mode}
                    icon={Repeat}
                    checked={cruiseMode === '1'}
                    onChange={() => setCruiseMode && setCruiseMode(cruiseMode === '1' ? '0' : '1')}
                    activeColor="text-yellow-400"
                  />
                </div>

                <div className="hidden tech-border p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-cyan-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.speed_limit}</span>
                    </div>
                    <div className="font-mono text-cyan-300 text-lg">
                      0 <span className="text-xs text-slate-500">m/s</span>
                    </div>
                  </div>
                  <input type="range" min="0" max="10" step="0.1" value={0} readOnly className="w-full" />
                </div>

                <div className="pt-4 pb-2">
                  <button
                    onClick={handleDeployClick}
                    className={`w-full py-3 text-white font-bold text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-all ${
                      isIos
                        ? (deployStatus === 'dispatched'
                          ? 'bg-[#34C759] hover:bg-[#2fd157] rounded-[14px] shadow-[0_10px_36px_-14px_rgba(52,199,89,0.45)] active:scale-[0.99]'
                          : 'bg-[#007AFF] hover:bg-[#1b86ff] rounded-[14px] shadow-[0_8px_30px_-10px_rgba(0,122,255,0.35)] active:scale-[0.99]'
                        )
                        : (deployStatus === 'dispatched'
                          ? 'bg-green-600/90 hover:bg-green-500 clip-path-slant transition-colors shadow-[0_0_18px_rgba(34,197,94,0.35)]'
                          : 'bg-cyan-600/90 hover:bg-cyan-500 clip-path-slant transition-colors shadow-glow'
                        )
                    }`}
                  >
                    {deployStatus === 'dispatched' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {deployStatus === 'dispatched' ? (t.deploy_dispatched || t.saved) : t.deploy_config}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px bg-cyan-900/30 w-full"></div>

            <div className="pt-6 pb-2">
              <div className="pt-4 flex flex-col items-center gap-2">
                <a
                  href="https://github.com/chenxuanjie/usv_ground_station"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={isIos
                    ? "group inline-flex items-center gap-2 px-3 py-2 rounded-[14px] border border-white/60 bg-white/70 backdrop-blur-xl text-[13px] font-sans text-slate-700 hover:text-[#007AFF] hover:bg-white/85 transition-colors shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30"
                    : "group inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/30 text-xs text-slate-400 hover:text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:shadow-[0_0_18px_rgba(6,182,212,0.28)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                  }
                  title="https://github.com/chenxuanjie/usv_ground_station"
                  aria-label="Open usv_ground_station on GitHub"
                >
                  <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.1-.75.08-.74.08-.74 1.21.09 1.85 1.25 1.85 1.25 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12 12 0 0 0 12 .5z"
                    />
                  </svg>
                  <span className="tracking-wider">GitHub · usv_ground_station</span>
                </a>
                <div className={`${isIos ? 'text-[11px] text-slate-500 font-sans' : 'text-[10px] text-slate-600 font-mono'} text-center`}>{t.mobile_footer}</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  window.MobileComponents = window.MobileComponents || {};
  window.MobileComponents.SideDrawer = SideDrawer;
})();
