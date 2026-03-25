var { useEffect, useMemo, useState } = React;

function RouteManagerModal({
    isOpen,
    mode = 'load',
    onClose,
    routes = [],
    currentWaypointsCount = 0,
    onLoadRoute,
    onSaveRoute,
    onRenameRoute,
    onToggleFavoriteRoute,
    onDeleteRoute,
    t,
    isMobile = false,
    uiStyle = 'cyber'
}) {
    const isIos = !!isMobile && uiStyle === 'ios';
    const [draftName, setDraftName] = useState('');
    const [editingRouteId, setEditingRouteId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRouteId, setSelectedRouteId] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setDraftName('');
            setEditingRouteId(null);
            setEditingName('');
            setErrorMsg('');
            setIsSubmitting(false);
            setSelectedRouteId(null);
        }
    }, [isOpen, mode]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const sortedRoutes = useMemo(() => {
        return (Array.isArray(routes) ? routes : []).slice().sort((a, b) => {
            const aFavorite = !!(a && a.favorite);
            const bFavorite = !!(b && b.favorite);
            if (aFavorite !== bFavorite) return bFavorite ? 1 : -1;
            const aId = Number(a && a.id) || 0;
            const bId = Number(b && b.id) || 0;
            return bId - aId;
        });
    }, [routes]);
    const matchedDraftRoute = useMemo(() => {
        const nextName = String(draftName || '').trim();
        if (!nextName) return null;
        return sortedRoutes.find((route) => String(route && route.name ? route.name : '').trim() === nextName) || null;
    }, [draftName, sortedRoutes]);

    useEffect(() => {
        if (!isOpen || mode !== 'save') return;
        const nextSelectedRouteId = matchedDraftRoute ? matchedDraftRoute.id : null;
        setSelectedRouteId((prev) => (prev === nextSelectedRouteId ? prev : nextSelectedRouteId));
    }, [isOpen, matchedDraftRoute, mode]);

    if (!isOpen) return null;

    const title = mode === 'save'
        ? t('save_route')
        : t('load_route');
    const isRouteSelectable = (mode === 'load' || mode === 'save') && !isSubmitting;
    const saveButtonLabel = matchedDraftRoute ? t('btn_overwrite_route') : t('btn_save_new_route');

    const handleSave = () => {
        const nextName = String(draftName || '').trim();
        if (!nextName) {
            setErrorMsg(t('route_name_required'));
            return;
        }
        setErrorMsg('');
        setIsSubmitting(true);
        Promise.resolve(onSaveRoute(nextName))
            .then((result) => {
                if (result === false) {
                    setIsSubmitting(false);
                    return;
                }
                setDraftName('');
                setIsSubmitting(false);
                onClose();
            })
            .catch((error) => {
                setIsSubmitting(false);
                setErrorMsg((error && error.message) ? String(error.message) : t('route_save_failed'));
            });
    };

    const handleRename = (routeId) => {
        const nextName = String(editingName || '').trim();
        if (!nextName) {
            setErrorMsg(t('route_name_required'));
            return;
        }
        setErrorMsg('');
        setIsSubmitting(true);
        Promise.resolve(onRenameRoute(routeId, nextName))
            .then((result) => {
                if (result === false) {
                    setIsSubmitting(false);
                    return;
                }
                setEditingRouteId(null);
                setEditingName('');
                setIsSubmitting(false);
            })
            .catch((error) => {
                setIsSubmitting(false);
                setErrorMsg((error && error.message) ? String(error.message) : t('route_rename_failed'));
            });
    };

    const handleDelete = (route) => {
        const routeName = route && route.name ? route.name : t('unnamed_route');
        if (!window.confirm(t('route_delete_confirm').replace('{name}', routeName))) return;
        setErrorMsg('');
        setIsSubmitting(true);
        Promise.resolve(onDeleteRoute(route.id))
            .then((result) => {
                if (result === false) {
                    setIsSubmitting(false);
                    return;
                }
                setIsSubmitting(false);
            })
            .catch((error) => {
                setIsSubmitting(false);
                setErrorMsg((error && error.message) ? String(error.message) : t('route_delete_failed'));
            });
    };

    const handleToggleFavorite = (route) => {
        if (isSubmitting || !route || typeof onToggleFavoriteRoute !== 'function') return;
        setErrorMsg('');
        setIsSubmitting(true);
        Promise.resolve(onToggleFavoriteRoute(route.id, !route.favorite))
            .then((result) => {
                if (result === false) {
                    setIsSubmitting(false);
                    return;
                }
                setIsSubmitting(false);
            })
            .catch((error) => {
                setIsSubmitting(false);
                setErrorMsg((error && error.message) ? String(error.message) : t('route_favorite_failed'));
            });
    };

    const handleSelectRoute = (route) => {
        if (isSubmitting) return;
        if (mode === 'save') {
            setDraftName(route && route.name ? route.name : '');
            setSelectedRouteId(route && route.id ? route.id : null);
            setErrorMsg('');
            return;
        }
        if (mode !== 'load') return;
        Promise.resolve(onLoadRoute(route))
            .then((result) => {
                if (result === false) return;
                if (!isIos) {
                    onClose();
                    return;
                }
                setSelectedRouteId(route.id);
                window.setTimeout(() => {
                    setSelectedRouteId(null);
                    onClose();
                }, 320);
            })
            .catch((error) => {
                setErrorMsg((error && error.message) ? String(error.message) : t('route_load_failed'));
            });
    };

    const panelClass = isIos
        ? 'bg-white/90 border border-white/70 rounded-[24px] shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)]'
        : 'relative bg-slate-950/95 border border-cyan-500/25 rounded-md shadow-[0_0_28px_rgba(6,182,212,0.12)]';
    const cardClass = isIos
        ? 'bg-white/75 border border-slate-200/70 rounded-[18px]'
        : 'bg-slate-900/55 border border-slate-800/70 rounded-md';
    const actionBtnClass = isIos
        ? 'rounded-[12px] border border-slate-200/80 bg-white/80 text-slate-700 hover:bg-white'
        : 'rounded border border-slate-700 bg-slate-800 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-100';
    const routeRowDesktopClass = 'group relative rounded-md border border-slate-700/80 bg-slate-800/45 transition-colors duration-200 hover:border-cyan-600/80 hover:bg-slate-800/70';
    const desktopIconBtnClass = 'p-1.5 rounded transition-colors';

    return (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 ${isIos ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/80 backdrop-blur-sm'}`}>
            <div className={`w-full max-w-[34rem] max-h-[80vh] flex flex-col overflow-hidden ${panelClass}`}>
                {!isIos && (
                    <>
                        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400 pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400 pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400 pointer-events-none"></div>
                    </>
                )}

                <div className={`h-16 flex items-center justify-between px-4 shrink-0 ${isIos ? 'border-b border-slate-200/70' : 'bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent border-b border-cyan-500/20'}`}>
                    <div className="flex items-center gap-2">
                        <Icons.MapPin className={`w-5 h-5 ${isIos ? 'text-[#007AFF]' : 'text-cyan-400'}`} />
                        <h3 className={`${isIos ? 'text-[17px] font-semibold text-slate-900' : 'font-mono font-bold text-cyan-100 text-sm tracking-wider'}`}>{title}</h3>
                    </div>
                    <button onClick={onClose} className={`${isIos ? 'w-8 h-8 rounded-full hover:bg-slate-200/60 text-slate-500' : 'text-cyan-500 hover:text-white transition-colors'} flex items-center justify-center`}>
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isIos ? '' : 'bg-slate-900/90'}`}>
                    {mode === 'save' && (
                        <div className={`${cardClass} p-4 space-y-3`}>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className={`${isIos ? 'text-[13px] font-medium text-slate-900' : 'text-xs font-bold text-cyan-100 uppercase tracking-wider'}`}>{t('route_name')}</div>
                                    <div className={`${isIos ? 'text-[12px] text-slate-500 mt-1' : 'text-[10px] text-slate-500 mt-1'}`}>{t('save_route_hint')}</div>
                                </div>
                                <div className={`${isIos ? 'text-[12px] text-slate-500' : 'text-[10px] font-mono text-slate-500'}`}>{t('current_points')}: {currentWaypointsCount}</div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={draftName}
                                    onChange={(event) => {
                                        setDraftName(event.target.value);
                                        setErrorMsg('');
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && currentWaypointsCount > 0 && !isSubmitting) handleSave();
                                    }}
                                    placeholder={t('route_name_placeholder')}
                                    className={`flex-1 px-3 py-2 outline-none transition-colors ${isIos ? 'rounded-[12px] border border-slate-200/80 bg-white text-slate-900 focus:border-[#007AFF]/50' : 'rounded border border-slate-700 bg-slate-900 text-cyan-100 focus:border-cyan-500/60 font-mono text-sm'}`}
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={currentWaypointsCount === 0 || isSubmitting}
                                    className={`${currentWaypointsCount === 0 || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} ${isIos ? 'px-4 py-2 rounded-[12px] bg-[#007AFF] text-white font-semibold' : 'px-4 py-2 rounded bg-cyan-600 text-white font-bold text-xs tracking-wider'}`}
                                >
                                    {saveButtonLabel}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`${cardClass} p-4`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`${isIos ? 'text-[13px] font-medium text-slate-900' : 'text-xs font-bold text-cyan-100 uppercase tracking-wider'}`}>{t('route_library')}</div>
                            <div className={`${isIos ? 'text-[12px] text-slate-500' : 'px-2 py-1 rounded-sm border border-slate-800 bg-slate-950/70 text-[10px] font-mono text-cyan-300'}`}>{sortedRoutes.length} {t('route_points')}</div>
                        </div>

                        {sortedRoutes.length === 0 ? (
                            <div className={`${isIos ? 'text-[13px] text-slate-400' : 'text-xs text-slate-500'} text-center py-8`}>{t('no_saved_routes')}</div>
                        ) : (
                            <div className="space-y-2">
                                {sortedRoutes.map((route) => {
                                    const pointCount = Array.isArray(route && route.waypoints) ? route.waypoints.length : 0;
                                    const isEditing = editingRouteId === route.id;
                                    const isFavorite = !!(route && route.favorite);
                                    const favoriteAccentClass = isFavorite
                                        ? (isIos
                                            ? 'border-amber-300/90 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(255,255,255,0.92))] ring-1 ring-amber-200/70 shadow-[0_10px_24px_-18px_rgba(245,158,11,0.65)]'
                                            : 'border-amber-400/55 bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(15,23,42,0.08)_42%,rgba(15,23,42,0.55))] ring-1 ring-amber-400/20 shadow-[0_0_22px_rgba(245,158,11,0.16)]')
                                        : '';
                                    return (
                                        <div
                                            key={route.id}
                                            className={`${isIos ? `${cardClass}` : routeRowDesktopClass} ${favoriteAccentClass} p-4 transition-all duration-300 ${
                                                selectedRouteId === route.id
                                                    ? (isIos ? 'ring-2 ring-[#34C759]/60 bg-[#34C759]/10' : 'border-cyan-400 bg-slate-800/80 shadow-[0_0_18px_rgba(8,145,178,0.16)]')
                                                    : ''
                                            }`}
                                        >
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <input
                                                        value={editingName}
                                                        onChange={(event) => setEditingName(event.target.value)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter' && !isSubmitting) handleRename(route.id);
                                                        }}
                                                        className={`w-full px-3 py-2 outline-none transition-colors ${isIos ? 'rounded-[12px] border border-slate-200/80 bg-white text-slate-900 focus:border-[#007AFF]/50' : 'rounded border border-slate-700 bg-slate-950 text-cyan-100 focus:border-cyan-500/60 font-mono text-sm'}`}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRename(route.id)} disabled={isSubmitting} className={`flex-1 px-3 py-2 ${actionBtnClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>{t('btn_save')}</button>
                                                        <button onClick={() => { setEditingRouteId(null); setEditingName(''); setErrorMsg(''); }} className={`flex-1 px-3 py-2 ${actionBtnClass}`}>{t('btn_cancel')}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectRoute(route)}
                                                        disabled={!isRouteSelectable}
                                                        className={`flex-1 min-w-0 text-left transition-colors ${isRouteSelectable ? 'cursor-pointer' : 'cursor-default'} ${isSubmitting ? 'opacity-60' : ''} ${!isIos && isRouteSelectable ? 'pr-3' : ''}`}
                                                    >
                                                        <div className={`${isIos ? 'text-[14px] font-medium text-slate-900' : 'text-[16px] font-bold text-slate-100 group-hover:text-cyan-300'} truncate transition-colors`}>{route.name || t('unnamed_route')}</div>
                                                        <div className={`${isIos ? 'text-[12px] text-slate-500 mt-1' : 'text-[11px] text-slate-500 font-mono mt-2 tracking-[0.03em]'}`}>{t('route_points')}: {pointCount}</div>
                                                    </button>
                                                    <div className={`flex items-center gap-1 shrink-0 ${isIos ? '' : 'opacity-50 group-hover:opacity-100 transition-opacity'}`}>
                                                        <button
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleToggleFavorite(route);
                                                            }}
                                                            disabled={isSubmitting}
                                                            title={isFavorite ? t('route_unfavorite') : t('route_favorite')}
                                                            className={isIos
                                                                ? `w-9 h-9 ${actionBtnClass} flex items-center justify-center ${isFavorite ? 'text-amber-500 bg-amber-50 border-amber-200 shadow-[0_6px_18px_-12px_rgba(245,158,11,0.75)]' : 'text-slate-400'}`
                                                                : `${desktopIconBtnClass} ${isFavorite ? 'text-amber-300 bg-amber-500/10 shadow-[0_0_14px_rgba(245,158,11,0.32)] hover:bg-amber-500/15' : 'text-slate-500 hover:bg-slate-700/60'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`
                                                            }
                                                        >
                                                            <Icons.Star filled={isFavorite} className={`w-4 h-4 ${isFavorite ? 'drop-shadow-[0_0_4px_rgba(251,191,36,0.9)]' : ''}`} />
                                                        </button>
                                                        <button
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setEditingRouteId(route.id);
                                                                setEditingName(route.name || '');
                                                                setErrorMsg('');
                                                            }}
                                                            className={isIos
                                                                ? `w-9 h-9 ${actionBtnClass} flex items-center justify-center`
                                                                : `${desktopIconBtnClass} text-blue-400 hover:bg-blue-900/50`
                                                            }
                                                        >
                                                            <Icons.Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleDelete(route);
                                                            }}
                                                            className={isIos
                                                                ? `w-9 h-9 ${actionBtnClass} flex items-center justify-center text-rose-400 hover:text-rose-300`
                                                                : `${desktopIconBtnClass} text-red-400 hover:bg-red-900/50`
                                                            }
                                                        >
                                                            <Icons.Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {errorMsg && (
                        <div className={`${isIos ? 'text-[12px] text-[#FF3B30] bg-[#FF3B30]/8 border border-[#FF3B30]/20 rounded-[14px]' : 'text-xs text-rose-300 bg-rose-950/40 border border-rose-500/20 rounded'} px-3 py-2`}>
                            {errorMsg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
