/**
 * ZZZ Poster Studio - Core Canvas & Multi-Layer Editing Engine (v2.3)
 * Supports Multi-Selection, Single-Selection, Marquee Box Selection, Shift/Ctrl Toggle, Deselection & Precision Hit-Testing
 */

(function() {
  'use strict';

  // Application State
  const state = {
    projectTitle: '绝区零海报作品',
    canvasWidth: 1920,
    canvasHeight: 1080,
    padX: 864,
    padY: 486,
    currentPresetName: '16:9 标准横版',
    zoom: 1,
    showRulers: true,
    snappingEnabled: true,
    activeAlignmentMask: 'none', // 'none' | 'thirds' | 'center' | 'safe-area' | 'grid' | 'golden'
    userGuides: [],
    background: {
      type: 'gradient', // 'color' | 'gradient' | 'popdots' | 'film' | 'image'
      color: '#0f172a',
      gradient: {
        type: 'linear',
        angle: 135,
        color1: '#0f172a',
        color2: '#1e293b'
      },
      popdots: {
        bgColor: '#fbbf24',
        dotColor: '#18181b',
        pattern: 'staggered', // 'staggered' | 'grid' | 'radial' | 'micro'
        dotRadius: 10,
        dotSpacing: 36,
        opacity: 0.95
      },
      film: {
        style: 'cinema-h', // 'cinema-h' | 'cinema-v' | 'manga-4panel' | 'polaroid'
        frameColor: '#09090b',
        innerColor: '#ffffff',
        sprocketColor: 'rgba(255, 255, 255, 0.95)',
        borderThickness: 90,
        textLabel: 'NEW ERIDU FILM 500T',
        frameNumber: '▶ 24'
      },
      decoration: {
        type: 'none', // 'none' | 'speedlines' | 'hazard' | 'cybergrid' | 'scanlines' | 'screentone' | 'vignette'
        color: '#ffffff',
        opacity: 0.35,
        scale: 1
      },
      image: null,
      imageSrc: null,
      imageFit: 'cover',
      blur: 0,
      overlayOpacity: 0.2
    },
    layers: [],
    selectedLayerIds: [], // Multi-selection array (Empty by default / when deselected)
    get selectedLayerId() {
      return this.selectedLayerIds.length > 0 ? this.selectedLayerIds[this.selectedLayerIds.length - 1] : null;
    },
    set selectedLayerId(id) {
      this.selectedLayerIds = id ? [id] : [];
    },
    history: [],
    historyIndex: -1,
    maxHistory: 30,
    activeTab: 'tab-stickers',
    activePropTab: 'properties',
    activeCategory: 'all',
    lockAspectRatio: true,
    customUploads: [],
    exportSettings: {
      format: 'image/png',
      ext: 'png',
      scale: 2
    },
    // Interaction tracking
    interaction: {
      type: null, // 'dragging' | 'resizing' | 'rotating' | 'marquee' | 'dragging-guide'
      handle: null,
      startX: 0,
      startY: 0,
      canvasStartX: 0,
      canvasStartY: 0,
      hasMoved: false,
      potentialSingleSelectId: null,
      layersSnapshot: [],
      groupStartBox: null,
      layerStartX: 0,
      layerStartY: 0,
      layerStartW: 0,
      layerStartH: 0,
      layerStartAngle: 0,
      initialAspect: 1,
      initialSelectedIds: [],
      activeGuideType: null,
      activeGuidePos: 0
    }
  };

  // DOM Elements cache
  let dom = {};

  function cacheDOMElements() {
    dom = {
      mainCanvas: document.getElementById('main-canvas'),
      ctx: document.getElementById('main-canvas').getContext('2d'),
      artboardWrapper: document.getElementById('artboard-wrapper'),
      viewport: document.getElementById('canvas-viewport'),
      selectionOverlay: document.getElementById('selection-overlay'),
      alignmentMaskOverlay: document.getElementById('alignment-mask-overlay'),
      smartGuidesOverlay: document.getElementById('smart-guides-overlay'),
      guidesContainer: document.getElementById('guides-container'),
      rulerCorner: document.getElementById('ruler-corner'),
      rulerH: document.getElementById('ruler-horizontal'),
      rulerV: document.getElementById('ruler-vertical'),
      rulerCtxH: document.getElementById('ruler-horizontal') ? document.getElementById('ruler-horizontal').getContext('2d') : null,
      rulerCtxV: document.getElementById('ruler-vertical') ? document.getElementById('ruler-vertical').getContext('2d') : null,
      toastContainer: document.getElementById('toast-container'),
      
      // Header
      btnSizeSelector: document.getElementById('btn-size-selector'),
      labelCurrentSize: document.getElementById('label-current-size'),
      labelCurrentDims: document.getElementById('label-current-dims'),
      btnUndo: document.getElementById('btn-undo'),
      btnRedo: document.getElementById('btn-redo'),
      btnClearCanvas: document.getElementById('btn-clear-canvas'),
      btnSaveDraft: document.getElementById('btn-save-draft'),
      btnPwaInstall: document.getElementById('btn-pwa-install'),
      btnCopyClipboard: document.getElementById('btn-copy-clipboard'),
      btnOpenExport: document.getElementById('btn-open-export'),

      // Navigation & Drawers
      navTabBtns: document.querySelectorAll('.nav-tab-btn'),
      drawerTabPanes: document.querySelectorAll('.drawer-tab-pane'),
      inputStickerSearch: document.getElementById('input-sticker-search'),
      stickerCategoryList: document.getElementById('sticker-category-list'),
      stickerGridContainer: document.getElementById('sticker-grid-container'),
      btnAddCustomText: document.getElementById('btn-add-custom-text'),
      templateListContainer: document.getElementById('template-list-container'),
      dropZoneUpload: document.getElementById('drop-zone-upload'),
      fileCustomUpload: document.getElementById('file-custom-upload'),
      customUploadsGrid: document.getElementById('custom-uploads-grid'),

      // Background Controls
      bgTypeColor: document.getElementById('bg-type-color'),
      bgTypeGradient: document.getElementById('bg-type-gradient'),
      bgTypePopdots: document.getElementById('bg-type-popdots'),
      bgTypeFilm: document.getElementById('bg-type-film'),
      bgTypeImage: document.getElementById('bg-type-image'),
      bgColorSettings: document.getElementById('bg-color-settings'),
      bgGradientSettings: document.getElementById('bg-gradient-settings'),
      bgPopdotsSettings: document.getElementById('bg-popdots-settings'),
      bgFilmSettings: document.getElementById('bg-film-settings'),
      bgImageSettings: document.getElementById('bg-image-settings'),
      inputBgColor: document.getElementById('input-bg-color'),
      inputBgColorHex: document.getElementById('input-bg-color-hex'),
      inputGradColor1: document.getElementById('input-grad-color1'),
      inputGradColor2: document.getElementById('input-grad-color2'),
      sliderGradAngle: document.getElementById('slider-grad-angle'),
      labelGradAngle: document.getElementById('label-grad-angle'),
      inputPopBgColor: document.getElementById('input-pop-bg-color'),
      inputPopDotColor: document.getElementById('input-pop-dot-color'),
      selectPopPattern: document.getElementById('select-pop-pattern'),
      sliderPopDotSize: document.getElementById('slider-pop-dot-size'),
      labelPopDotSize: document.getElementById('label-pop-dot-size'),
      sliderPopDotSpacing: document.getElementById('slider-pop-dot-spacing'),
      labelPopDotSpacing: document.getElementById('label-pop-dot-spacing'),
      filmPresetBtns: document.querySelectorAll('.film-preset-btn'),
      inputFilmFrameColor: document.getElementById('input-film-frame-color'),
      inputFilmInnerColor: document.getElementById('input-film-inner-color'),
      inputFilmLabel: document.getElementById('input-film-label'),
      inputFilmNumber: document.getElementById('input-film-number'),
      sliderFilmThickness: document.getElementById('slider-film-thickness'),
      labelFilmThickness: document.getElementById('label-film-thickness'),
      selectBgDecorationType: document.getElementById('select-bg-decoration-type'),
      bgDecorationControls: document.getElementById('bg-decoration-controls'),
      inputBgDecColor: document.getElementById('input-bg-dec-color'),
      sliderBgDecOpacity: document.getElementById('slider-bg-dec-opacity'),
      labelBgDecOpacity: document.getElementById('label-bg-dec-opacity'),
      btnUploadBgImg: document.getElementById('btn-upload-bg-img'),
      fileBgImg: document.getElementById('file-bg-img'),
      selectBgFit: document.getElementById('select-bg-fit'),
      btnRemoveBgImg: document.getElementById('btn-remove-bg-img'),
      sliderBgBlur: document.getElementById('slider-bg-blur'),
      labelBgBlur: document.getElementById('label-bg-blur'),
      sliderBgOverlay: document.getElementById('slider-bg-overlay'),
      labelBgOverlay: document.getElementById('label-bg-overlay'),

      // Bottom Bar (Zoom, Ruler, Snapping, Mask)
      btnZoomOut: document.getElementById('btn-zoom-out'),
      btnZoomIn: document.getElementById('btn-zoom-in'),
      btnZoomFit: document.getElementById('btn-zoom-fit'),
      btnZoom100: document.getElementById('btn-zoom-100'),
      labelZoomLevel: document.getElementById('label-zoom-level'),
      btnToggleRuler: document.getElementById('btn-toggle-ruler'),
      labelRulerBtn: document.getElementById('label-ruler-btn'),
      btnToggleSnap: document.getElementById('btn-toggle-snap'),
      selectAlignmentMask: document.getElementById('select-alignment-mask'),

      // Right Sidebar
      tabBtnProperties: document.getElementById('tab-btn-properties'),
      tabBtnLayers: document.getElementById('tab-btn-layers'),
      propPaneInspector: document.getElementById('prop-pane-inspector'),
      propPaneLayers: document.getElementById('prop-pane-layers'),
      layerCountBadge: document.getElementById('layer-count-badge'),
      noSelectionHint: document.getElementById('no-selection-hint'),
      layerPropertiesForm: document.getElementById('layer-properties-form'),
      layerListContainer: document.getElementById('layer-list-container'),
      
      // Properties Inputs
      propWidth: document.getElementById('prop-width'),
      propHeight: document.getElementById('prop-height'),
      btnLockAspectRatio: document.getElementById('btn-lock-aspect-ratio'),
      propRotation: document.getElementById('prop-rotation'),
      propOpacity: document.getElementById('prop-opacity'),
      inspectorTextSection: document.getElementById('inspector-text-section'),
      propTextContent: document.getElementById('prop-text-content'),
      propTextFont: document.getElementById('prop-text-font'),
      propTextSize: document.getElementById('prop-text-size'),
      propTextColor: document.getElementById('prop-text-color'),
      propTextStrokeColor: document.getElementById('prop-text-stroke-color'),
      propTextStrokeWidth: document.getElementById('prop-text-stroke-width'),
      propTextBgFill: document.getElementById('prop-text-bg-fill'),
      btnToggleTextBg: document.getElementById('btn-toggle-text-bg'),
      btnTextAlignLeft: document.getElementById('btn-text-align-left'),
      btnTextAlignCenter: document.getElementById('btn-text-align-center'),
      btnTextAlignRight: document.getElementById('btn-text-align-right'),
      propTextShadowType: document.getElementById('prop-text-shadow-type'),
      textShadowControls: document.getElementById('text-shadow-controls'),
      propTextShadowColor: document.getElementById('prop-text-shadow-color'),
      groupHalftoneType: document.getElementById('group-halftone-type'),
      propTextHalftoneType: document.getElementById('prop-text-halftone-type'),
      sliderTextShadowOffset: document.getElementById('slider-text-shadow-offset'),
      labelTextShadowOffset: document.getElementById('label-text-shadow-offset'),
      groupHalftoneDensity: document.getElementById('group-halftone-density'),
      btnHalftoneDense: document.getElementById('btn-halftone-dense'),
      btnHalftoneNormal: document.getElementById('btn-halftone-normal'),
      btnHalftoneCoarse: document.getElementById('btn-halftone-coarse'),
      btnPresetComicHares: document.getElementById('btn-preset-comic-hares'),
      btnPresetCyberGlow: document.getElementById('btn-preset-cyber-glow'),
      inspectorImageSection: document.getElementById('inspector-image-section'),
      btnFlipH: document.getElementById('btn-flip-h'),
      btnFlipV: document.getElementById('btn-flip-v'),
      inspectorShapeSection: document.getElementById('inspector-shape-section'),
      propShapeFill: document.getElementById('prop-shape-fill'),
      propShapeStroke: document.getElementById('prop-shape-stroke'),
      propShapeStrokeWidth: document.getElementById('prop-shape-stroke-width'),
      propShapeRadius: document.getElementById('prop-shape-radius'),
      btnPropBringFront: document.getElementById('btn-prop-bring-front'),
      btnPropSendBack: document.getElementById('btn-prop-send-back'),
      btnPropDuplicate: document.getElementById('btn-prop-duplicate'),
      btnPropDelete: document.getElementById('btn-prop-delete'),
      btnLayerUp: document.getElementById('btn-layer-up'),
      btnLayerDown: document.getElementById('btn-layer-down'),
      btnLockAllLayers: document.getElementById('btn-lock-all-layers'),
      iconLockAll: document.getElementById('icon-lock-all'),
      labelLockAll: document.getElementById('label-lock-all'),

      // Canvas Top Contextual Action Bar
      canvasTopContextBar: document.getElementById('canvas-top-context-bar'),
      contextBarType: document.getElementById('context-bar-type'),
      contextBarName: document.getElementById('context-bar-name'),
      ctxBtnTop: document.getElementById('ctx-btn-top'),
      ctxBtnBottom: document.getElementById('ctx-btn-bottom'),
      ctxBtnDup: document.getElementById('ctx-btn-dup'),
      ctxBtnDel: document.getElementById('ctx-btn-del'),

      // Modals
      modalSizePresets: document.getElementById('modal-size-presets'),
      modalExport: document.getElementById('modal-export'),
      btnOpenProjectModal: document.getElementById('btn-open-project-modal'),
      modalProject: document.getElementById('modal-project'),
      inputProjectName: document.getElementById('input-project-name'),
      inputCustomW: document.getElementById('input-custom-w'),
      inputCustomH: document.getElementById('input-custom-h'),
      btnApplyCustomSize: document.getElementById('btn-apply-custom-size'),
      exportFmtPng: document.getElementById('export-fmt-png'),
      exportFmtJpg: document.getElementById('export-fmt-jpg'),
      exportFmtWebp: document.getElementById('export-fmt-webp'),
      exportScale1: document.getElementById('export-scale-1'),
      exportScale2: document.getElementById('export-scale-2'),
      exportScale3: document.getElementById('export-scale-3'),
      exportResLabel: document.getElementById('export-res-label'),
      btnDoDownload: document.getElementById('btn-do-download'),
      btnSaveProject: document.getElementById('btn-save-project'),
      btnLoadProjectTrigger: document.getElementById('btn-load-project-trigger'),
      fileLoadProject: document.getElementById('file-load-project'),
      btnOpenAboutModal: document.getElementById('btn-open-about-modal'),
      modalAbout: document.getElementById('modal-about')
    };
  }

  // Image preloading cache map
  const imageCache = new Map();

  function preloadImage(src) {
    if (!src) return Promise.resolve(null);
    if (imageCache.has(src)) return Promise.resolve(imageCache.get(src));
    return new Promise((resolve) => {
      const img = new Image();
      if (src.startsWith('http://') || src.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn('[ImageLoader] Failed to load image:', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  function ensureBackgroundState() {
    if (!state.background) {
      state.background = { type: 'color', color: '#f8fafc' };
    }
    if (!state.background.gradient) {
      state.background.gradient = {
        type: state.background.gradientType || 'linear',
        angle: state.background.angle !== undefined ? state.background.angle : 135,
        color1: state.background.color1 || '#0f172a',
        color2: state.background.color2 || '#1e293b'
      };
    }
    if (!state.background.type) state.background.type = 'color';
    if (!state.background.color) state.background.color = '#f8fafc';
    if (state.background.blur === undefined) state.background.blur = 0;
    if (state.background.overlayOpacity === undefined) state.background.overlayOpacity = 0;
  }

  // =========================================================================
  // Initialize Application
  // =========================================================================
  async function init() {
    cacheDOMElements();
    ensureBackgroundState();
    updateAspectRatioLockUI();
    bindEvents();
    bindShortcuts();

    try {
      initServiceWorker();
    } catch (e) {
      console.warn('[PWA] Service Worker skipped:', e);
    }

    try {
      initStickerLibrary();
    } catch (e) {
      console.error('[Stickers] Init error:', e);
    }

    try {
      initTemplates();
    } catch (e) {
      console.error('[Templates] Init error:', e);
    }

    // Try to restore user auto-save draft first!
    const restored = await loadAutoDraft();
    if (!restored) {
      if (window.ZZZ_TEMPLATES && window.ZZZ_TEMPLATES.length > 0) {
        applyTemplate(window.ZZZ_TEMPLATES[0]);
      } else {
        updateCanvasDimensions(1920, 1080, '16:9 标准横版');
        recordHistory();
      }
    }

    setTimeout(() => {
      autoFitCanvas();
      renderRulers();
      renderAlignmentMask();
    }, 100);

    window.addEventListener('resize', () => {
      autoFitCanvas();
      renderRulers();
    });
  }

  // =========================================================================
  // PWA Service Worker & Install Prompt
  // =========================================================================
  let deferredInstallPrompt = null;

  function initServiceWorker() {
    if (window.location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[PWA] Service Worker registered with scope:', reg.scope))
        .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (dom.btnPwaInstall) {
        dom.btnPwaInstall.style.display = 'inline-flex';
      }
    });

    if (dom.btnPwaInstall) {
      dom.btnPwaInstall.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('感谢安装 ZZZ Poster Studio！', 'success');
        }
        deferredInstallPrompt = null;
        dom.btnPwaInstall.style.display = 'none';
      });
    }
  }

  // =========================================================================
  // Stickers Catalog & Tabs (Tag Cloud & Search)
  // =========================================================================
  function initStickerLibrary() {
    if (!window.ZZZ_EMOJIS || window.ZZZ_EMOJIS.length === 0) {
      console.warn('[Stickers] No emoji data found in window.ZZZ_EMOJIS');
      return;
    }

    const catCounts = {};
    window.ZZZ_EMOJIS.forEach(item => {
      if (item.category) {
        catCounts[item.category] = (catCounts[item.category] || 0) + 1;
      }
    });

    const categories = window.ZZZ_CATEGORIES || Object.keys(catCounts);
    const cats = ['all', ...categories];

    if (dom.stickerCategoryList) {
      dom.stickerCategoryList.innerHTML = cats.map(cat => {
        const count = cat === 'all' ? window.ZZZ_EMOJIS.length : (catCounts[cat] || 0);
        const label = cat === 'all' ? '全部' : cat;
        return `<button class="category-pill ${cat === 'all' ? 'active' : ''}" data-cat="${cat}">${label} <span style="opacity:0.7; font-size:10px;">(${count})</span></button>`;
      }).join('');

      dom.stickerCategoryList.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-pill');
        if (!btn) return;
        dom.stickerCategoryList.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeCategory = btn.dataset.cat;
        renderStickers();
      });
    }

    renderStickers();

    if (dom.inputStickerSearch) {
      dom.inputStickerSearch.addEventListener('input', () => {
        renderStickers();
      });
    }
  }

  function renderStickers() {
    if (!dom.stickerGridContainer) return;
    const query = (dom.inputStickerSearch ? dom.inputStickerSearch.value : '').trim().toLowerCase();
    const activeCat = state.activeCategory || 'all';

    const filtered = (window.ZZZ_EMOJIS || []).filter(item => {
      const matchesCat = (activeCat === 'all' || item.category === activeCat);
      if (!matchesCat) return false;
      if (!query) return true;
      return (item.tags && item.tags.some(tag => tag.includes(query))) || (item.name && item.name.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      dom.stickerGridContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); font-size: 12px; padding: 24px 0;">未找到相关表情贴图</div>';
      return;
    }

    dom.stickerGridContainer.innerHTML = filtered.map(item => `
      <div class="sticker-item" data-src="${item.path}" title="${item.name}" draggable="true">
        <img src="${item.path}" alt="${item.name}" loading="lazy">
      </div>
    `).join('');

    dom.stickerGridContainer.querySelectorAll('.sticker-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        addStickerLayer(itemEl.dataset.src, itemEl.title);
      });

      itemEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', itemEl.dataset.src);
        e.dataTransfer.setData('text/uri-list', itemEl.dataset.src);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  }

  // =========================================================================
  // Preset Templates & Background Presets
  // =========================================================================
  function initTemplates() {
    if (!window.ZZZ_TEMPLATES || !dom.templateListContainer) return;

    dom.templateListContainer.innerHTML = window.ZZZ_TEMPLATES.map((tmpl, idx) => `
      <div class="text-preset-card template-card" data-idx="${idx}">
        <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${tmpl.name}</div>
        <div style="font-size: 11px; color: var(--accent-primary); font-weight: 500;">${tmpl.category} · ${tmpl.width} × ${tmpl.height}</div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">包含 ${tmpl.layers.length} 个预设贴画与主题配色</div>
      </div>
    `).join('');

    dom.templateListContainer.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        if (state.layers.length > 0) {
          if (!confirm(`载入模板“${window.ZZZ_TEMPLATES[idx].name}”将替换当前画布内容，是否确定？`)) return;
        }
        applyTemplate(window.ZZZ_TEMPLATES[idx]);
        showToast(`已载入模版: ${window.ZZZ_TEMPLATES[idx].name}`, 'info');
      });
    });
  }

  async function applyTemplate(tmpl) {
    updateCanvasDimensions(tmpl.width, tmpl.height, tmpl.name);
    state.background = JSON.parse(JSON.stringify(tmpl.background));
    ensureBackgroundState();
    state.layers = [];

    // Preload all layers images
    for (const l of tmpl.layers) {
      const layerCopy = JSON.parse(JSON.stringify(l));
      if (layerCopy.type === 'sticker' && layerCopy.src) {
        layerCopy.img = await preloadImage(layerCopy.src);
      }
      if (layerCopy.type === 'text') {
        const dims = calculateTextLayerDimensions(layerCopy);
        layerCopy.width = dims.width;
        layerCopy.height = dims.height;
      }
      state.layers.push(layerCopy);
    }

    // Default to unselected on template load so handles don't obstruct view
    state.selectedLayerIds = [];
    syncBackgroundControls();
    recordHistory();
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
    autoFitCanvas();
    renderRulers();
    renderAlignmentMask();
  }

  // =========================================================================
  // Canvas Sizing & Navigation Viewport
  // =========================================================================
  function updateCanvasDimensions(w, h, name) {
    state.canvasWidth = w;
    state.canvasHeight = h;
    if (name) state.currentPresetName = name;

    state.padX = Math.round(w * 0.45);
    state.padY = Math.round(h * 0.45);

    dom.mainCanvas.width = w + state.padX * 2;
    dom.mainCanvas.height = h + state.padY * 2;

    dom.labelCurrentSize.textContent = state.currentPresetName;
    dom.labelCurrentDims.textContent = `${w} × ${h}`;

    updateExportResLabel();
    autoFitCanvas();
    renderCanvas();
    renderRulers();
    renderAlignmentMask();
  }

  function autoFitCanvas() {
    if (!dom.viewport) return;
    const vpRect = dom.viewport.getBoundingClientRect();
    const margin = 48;
    const availW = Math.max(100, vpRect.width - margin * 2);
    const availH = Math.max(100, vpRect.height - margin * 2);

    const scaleX = availW / state.canvasWidth;
    const scaleY = availH / state.canvasHeight;
    const fitZoom = Math.min(scaleX, scaleY, 1.2);

    setZoom(fitZoom);
  }

  function setZoom(val) {
    state.zoom = Math.max(0.1, Math.min(3.0, val));
    if (dom.labelZoomLevel) {
      dom.labelZoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
    }

    const padX = state.padX || Math.round(state.canvasWidth * 0.45);
    const padY = state.padY || Math.round(state.canvasHeight * 0.45);

    if (dom.artboardWrapper) {
      dom.artboardWrapper.style.width = `${state.canvasWidth * state.zoom}px`;
      dom.artboardWrapper.style.height = `${state.canvasHeight * state.zoom}px`;
    }

    if (dom.mainCanvas) {
      dom.mainCanvas.style.position = 'absolute';
      dom.mainCanvas.style.left = `${-padX * state.zoom}px`;
      dom.mainCanvas.style.top = `${-padY * state.zoom}px`;
      dom.mainCanvas.style.width = `${(state.canvasWidth + padX * 2) * state.zoom}px`;
      dom.mainCanvas.style.height = `${(state.canvasHeight + padY * 2) * state.zoom}px`;
    }

    renderCanvas();
    renderRulers();
  }

  // =========================================================================
  // Pixel Rulers System
  // =========================================================================
  function renderRulers() {
    if (!dom.rulerH || !dom.rulerV || !dom.rulerCorner || !dom.viewport || !dom.artboardWrapper) return;

    if (!state.showRulers) {
      dom.rulerCorner.style.display = 'none';
      dom.rulerH.style.display = 'none';
      dom.rulerV.style.display = 'none';
      return;
    }

    dom.rulerCorner.style.display = 'flex';
    dom.rulerH.style.display = 'block';
    dom.rulerV.style.display = 'block';

    const vpRect = dom.viewport.getBoundingClientRect();
    const artRect = dom.artboardWrapper.getBoundingClientRect();

    const rulerThickness = 20;
    const vpW = vpRect.width - rulerThickness;
    const vpH = vpRect.height - rulerThickness;
    const dpr = window.devicePixelRatio || 1;

    dom.rulerH.width = vpW * dpr;
    dom.rulerH.height = rulerThickness * dpr;
    dom.rulerH.style.width = `${vpW}px`;
    dom.rulerH.style.height = `${rulerThickness}px`;

    dom.rulerV.width = rulerThickness * dpr;
    dom.rulerV.height = vpH * dpr;
    dom.rulerV.style.width = `${rulerThickness}px`;
    dom.rulerV.style.height = `${vpH}px`;

    const ctxH = dom.rulerCtxH;
    const ctxV = dom.rulerCtxV;
    if (!ctxH || !ctxV) return;

    ctxH.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxV.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctxH.clearRect(0, 0, vpW, rulerThickness);
    ctxV.clearRect(0, 0, rulerThickness, vpH);

    const artOffsetX = (artRect.left - vpRect.left) - rulerThickness;
    const artOffsetY = (artRect.top - vpRect.top) - rulerThickness;
    const zoom = state.zoom;

    let step = 100;
    if (zoom >= 2) step = 50;
    if (zoom <= 0.4) step = 200;
    if (zoom <= 0.2) step = 500;

    // Draw Horizontal Ruler
    ctxH.fillStyle = '#64748b';
    ctxH.strokeStyle = '#cbd5e1';
    ctxH.lineWidth = 1;
    ctxH.font = '9px system-ui, sans-serif';
    ctxH.textAlign = 'left';
    ctxH.textBaseline = 'top';

    const startCanvasX = Math.floor((-artOffsetX / zoom) / step) * step - step;
    const endCanvasX = Math.ceil(((vpW - artOffsetX) / zoom) / step) * step + step;

    for (let cX = startCanvasX; cX <= endCanvasX; cX += (step / 5)) {
      const screenX = artOffsetX + cX * zoom;
      if (screenX < 0 || screenX > vpW) continue;

      const isMajor = Math.abs(cX % step) < 0.1;
      const isMedium = Math.abs(cX % (step / 2)) < 0.1;
      const tickH = isMajor ? 12 : (isMedium ? 7 : 4);

      ctxH.beginPath();
      ctxH.moveTo(screenX, rulerThickness - tickH);
      ctxH.lineTo(screenX, rulerThickness);
      ctxH.stroke();

      if (isMajor) {
        ctxH.fillText(`${Math.round(cX)}`, screenX + 2, 2);
      }
    }

    // Draw Vertical Ruler
    ctxV.fillStyle = '#64748b';
    ctxV.strokeStyle = '#cbd5e1';
    ctxV.lineWidth = 1;
    ctxV.font = '9px system-ui, sans-serif';
    ctxV.textAlign = 'left';
    ctxV.textBaseline = 'top';

    const startCanvasY = Math.floor((-artOffsetY / zoom) / step) * step - step;
    const endCanvasY = Math.ceil(((vpH - artOffsetY) / zoom) / step) * step + step;

    for (let cY = startCanvasY; cY <= endCanvasY; cY += (step / 5)) {
      const screenY = artOffsetY + cY * zoom;
      if (screenY < 0 || screenY > vpH) continue;

      const isMajor = Math.abs(cY % step) < 0.1;
      const isMedium = Math.abs(cY % (step / 2)) < 0.1;
      const tickW = isMajor ? 12 : (isMedium ? 7 : 4);

      ctxV.beginPath();
      ctxV.moveTo(rulerThickness - tickW, screenY);
      ctxV.lineTo(rulerThickness, screenY);
      ctxV.stroke();

      if (isMajor) {
        ctxV.save();
        ctxV.translate(2, screenY + 2);
        ctxV.rotate(-Math.PI / 2);
        ctxV.fillText(`${Math.round(cY)}`, -20, 0);
        ctxV.restore();
      }
    }
  }

  // =========================================================================
  // Alignment & Composition Mask System (SVG Overlay)
  // =========================================================================
  function renderAlignmentMask() {
    if (dom.alignmentMaskOverlay) {
      dom.alignmentMaskOverlay.innerHTML = '';
    }
    renderCanvas();
  }

  function drawAlignmentMaskOnCanvas(ctx, w, h) {
    const mask = state.activeAlignmentMask;
    if (!mask || mask === 'none') return;

    ctx.save();

    if (mask === 'thirds') {
      const x1 = w * (1 / 3);
      const x2 = w * (2 / 3);
      const y1 = h * (1 / 3);
      const y2 = h * (2 / 3);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);

      // Grid Lines
      ctx.beginPath();
      ctx.moveTo(x1, 0); ctx.lineTo(x1, h);
      ctx.moveTo(x2, 0); ctx.lineTo(x2, h);
      ctx.moveTo(0, y1); ctx.lineTo(w, y1);
      ctx.moveTo(0, y2); ctx.lineTo(w, y2);
      ctx.stroke();

      // 4 Golden Focal Dots
      ctx.setLineDash([]);
      const focalPoints = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x1, y: y2 },
        { x: x2, y: y2 }
      ];

      for (const pt of focalPoints) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    } else if (mask === 'center') {
      const cx = w / 2;
      const cy = h / 2;

      ctx.strokeStyle = 'rgba(244, 63, 94, 0.95)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 6]);

      // Center Axes
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.stroke();

      // Diagonal Lines
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, h);
      ctx.moveTo(w, 0); ctx.lineTo(0, h);
      ctx.stroke();

      // Center Reticle
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.95)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0055';
      ctx.fill();
    } else if (mask === 'safe-area') {
      const aMarginX = w * 0.05;
      const aMarginY = h * 0.05;
      const aW = w * 0.9;
      const aH = h * 0.9;

      const tMarginX = w * 0.1;
      const tMarginY = h * 0.1;
      const tW = w * 0.8;
      const tH = h * 0.8;

      // 90% Action Safe
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.95)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(aMarginX, aMarginY, aW, aH);

      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText('90% 画面安全区 (Action Safe)', aMarginX + 16, aMarginY + 28);

      // 80% Title Safe
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.95)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(tMarginX, tMarginY, tW, tH);

      ctx.fillStyle = '#facc15';
      ctx.fillText('80% 文字/标题安全区 (Title Safe)', tMarginX + 16, tMarginY + 28);
    } else if (mask === 'grid') {
      const gridSize = 50;
      for (let x = gridSize; x < w; x += gridSize) {
        const isMajor = x % (gridSize * 4) === 0;
        ctx.strokeStyle = isMajor ? 'rgba(99, 102, 241, 0.7)' : 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = isMajor ? 1.5 : 0.8;
        ctx.setLineDash(isMajor ? [] : [3, 4]);
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = gridSize; y < h; y += gridSize) {
        const isMajor = y % (gridSize * 4) === 0;
        ctx.strokeStyle = isMajor ? 'rgba(99, 102, 241, 0.7)' : 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = isMajor ? 1.5 : 0.8;
        ctx.setLineDash(isMajor ? [] : [3, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(w, y);
        ctx.stroke();
      }
    } else if (mask === 'golden') {
      const gx1 = w * 0.382;
      const gx2 = w * 0.618;
      const gy1 = h * 0.382;
      const gy2 = h * 0.618;

      ctx.strokeStyle = 'rgba(244, 114, 182, 0.95)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 6]);

      ctx.beginPath();
      ctx.moveTo(gx1, 0); ctx.lineTo(gx1, h);
      ctx.moveTo(gx2, 0); ctx.lineTo(gx2, h);
      ctx.moveTo(0, gy1); ctx.lineTo(w, gy1);
      ctx.moveTo(0, gy2); ctx.lineTo(w, gy2);
      ctx.stroke();

      // Diagonals
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, h); ctx.lineTo(w, 0);
      ctx.moveTo(0, 0); ctx.lineTo(w, h);
      ctx.stroke();

      // Golden Dots
      ctx.setLineDash([]);
      ctx.fillStyle = '#f472b6';
      const pts = [
        { x: gx1, y: gy1 },
        { x: gx2, y: gy1 },
        { x: gx1, y: gy2 },
        { x: gx2, y: gy2 }
      ];
      for (const pt of pts) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // Smart Magnetic Snapping System & Guides Overlay
  // =========================================================================
  function renderSmartGuides(guides) {
    if (!dom.smartGuidesOverlay) return;
    if (!guides || guides.length === 0) {
      dom.smartGuidesOverlay.innerHTML = '';
      return;
    }

    const w = state.canvasWidth;
    const h = state.canvasHeight;
    dom.smartGuidesOverlay.setAttribute('viewBox', `0 0 ${w} ${h}`);

    dom.smartGuidesOverlay.innerHTML = guides.map(g => {
      if (g.type === 'x') {
        return `<line x1="${g.pos}" y1="0" x2="${g.pos}" y2="${h}" stroke="#e11d48" stroke-width="2" stroke-dasharray="4,2"/>`;
      } else {
        return `<line x1="0" y1="${g.pos}" x2="${w}" y2="${g.pos}" stroke="#e11d48" stroke-width="2" stroke-dasharray="4,2"/>`;
      }
    }).join('');
  }

  function clearSmartGuides() {
    if (dom.smartGuidesOverlay) dom.smartGuidesOverlay.innerHTML = '';
  }

  // =========================================================================
  // Layer Selection & Multi-Selection Helpers
  // =========================================================================
  function generateId(prefix = 'layer') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  function getSelectedLayers() {
    return state.layers.filter(l => state.selectedLayerIds.includes(l.id));
  }

  function getSelectedLayer() {
    const selected = getSelectedLayers();
    return selected.length > 0 ? selected[selected.length - 1] : null;
  }

  function isLayerSelected(id) {
    return state.selectedLayerIds.includes(id);
  }

  function selectLayer(id, isToggle = false, isAdditive = false) {
    if (!id) {
      state.selectedLayerIds = [];
    } else if (isToggle) {
      if (state.selectedLayerIds.includes(id)) {
        state.selectedLayerIds = state.selectedLayerIds.filter(x => x !== id);
      } else {
        state.selectedLayerIds.push(id);
      }
    } else if (isAdditive) {
      if (!state.selectedLayerIds.includes(id)) {
        state.selectedLayerIds.push(id);
      }
    } else {
      state.selectedLayerIds = [id];
    }
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
  }

  function selectAllLayers() {
    state.selectedLayerIds = state.layers.filter(l => l.visible && !l.locked).map(l => l.id);
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
    if (state.selectedLayerIds.length > 0) {
      showToast(`已全选 ${state.selectedLayerIds.length} 个贴画`, 'info');
    }
  }

  function clearSelection() {
    if (state.selectedLayerIds.length === 0) return;
    state.selectedLayerIds = [];
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
  }

  // Precision measurement of text bounding box
  function calculateTextLayerDimensions(layer) {
    if (!dom.ctx) return { width: layer.width || 200, height: layer.height || 60 };
    dom.ctx.save();
    dom.ctx.font = `${layer.fontWeight || 'normal'} ${layer.fontSize || 40}px ${layer.fontFamily || 'sans-serif'}`;
    const lines = (layer.text || '').split('\n');
    let maxW = 0;
    for (const line of lines) {
      const m = dom.ctx.measureText(line);
      if (m.width > maxW) maxW = m.width;
    }
    dom.ctx.restore();
    const padX = layer.fontSize * 0.4;
    const lineHeight = layer.fontSize * 1.3;
    const totalH = lines.length * lineHeight;
    const shadowOffset = (layer.shadowType === 'halftone' || layer.shadowType === 'solid') ? (layer.shadowOffset || 8) : 0;
    return {
      width: Math.max(40, Math.round(maxW + padX * 2 + shadowOffset)),
      height: Math.max(20, Math.round(totalH + layer.fontSize * 0.2 + shadowOffset))
    };
  }

  // Calculate Axis-Aligned Bounding Box (AABB) of rotated layer
  function getLayerAABB(layer) {
    const rad = ((layer.rotation || 0) * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const halfW = (layer.width || 0) / 2;
    const halfH = (layer.height || 0) / 2;
    const boundHalfW = halfW * cos + halfH * sin;
    const boundHalfH = halfW * sin + halfH * cos;
    return {
      minX: layer.x - boundHalfW,
      minY: layer.y - boundHalfH,
      maxX: layer.x + boundHalfW,
      maxY: layer.y + boundHalfH,
      width: boundHalfW * 2,
      height: boundHalfH * 2,
      centerX: layer.x,
      centerY: layer.y
    };
  }

  function getGroupAABB(layers) {
    if (!layers || layers.length === 0) return null;
    if (layers.length === 1) {
      const l = layers[0];
      return {
        minX: l.x - l.width / 2,
        minY: l.y - l.height / 2,
        maxX: l.x + l.width / 2,
        maxY: l.y + l.height / 2,
        width: l.width,
        height: l.height,
        x: l.x,
        y: l.y,
        rotation: l.rotation || 0
      };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of layers) {
      const box = getLayerAABB(l);
      if (box.minX < minX) minX = box.minX;
      if (box.minY < minY) minY = box.minY;
      if (box.maxX > maxX) maxX = box.maxX;
      if (box.maxY > maxY) maxY = box.maxY;
    }

    return {
      minX: minX,
      minY: minY,
      maxX: maxX,
      maxY: maxY,
      width: maxX - minX,
      height: maxY - minY,
      x: minX + (maxX - minX) / 2,
      y: minY + (maxY - minY) / 2,
      rotation: 0
    };
  }

  // =========================================================================
  // Layer Creation Functions
  // =========================================================================
  async function addStickerLayer(src, name = '贴图', posX, posY) {
    const img = await preloadImage(src);
    if (!img) {
      showToast('无法载入贴图图片', 'warning');
      return;
    }

    const minDim = Math.min(state.canvasWidth, state.canvasHeight);
    const targetSize = Math.round(minDim * 0.45);
    const aspect = (img.width && img.height) ? (img.width / img.height) : 1;
    
    let w = targetSize;
    let h = targetSize;
    if (aspect >= 1) {
      h = Math.round(w / aspect);
    } else {
      w = Math.round(h * aspect);
    }

    const x = (posX !== undefined && !isNaN(posX)) ? posX : state.canvasWidth / 2;
    const y = (posY !== undefined && !isNaN(posY)) ? posY : state.canvasHeight / 2;

    const layer = {
      id: generateId('sticker'),
      type: 'sticker',
      name: name.replace(/\.png|\.jpg|\.gif|\.webp/gi, ''),
      src: src,
      img: img,
      x: x,
      y: y,
      width: w,
      height: h,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false
    };

    state.layers.push(layer);
    state.selectedLayerIds = [layer.id];
    recordHistory();
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
    showToast('贴纸已添加到画布！', 'success');
  }

  function addTextLayer(presetType = 'normal', posX, posY) {
    let text = '「 世界全剧终，欢迎来到新艾利都 」';
    let fontSize = 54;
    let fontWeight = 'bold';
    let fontStyle = 'normal';
    let fillColor = '#0f172a';
    let strokeColor = '#000000';
    let strokeWidth = 0;
    let bgFill = null;
    let bgRadius = 0;
    let shadowType = 'none';
    let shadowColor = '#334155';
    let shadowBlur = 0;
    let shadowOffset = 8;
    let halftoneType = 'dots';
    let halftoneSpacing = 6;
    let halftoneSize = 2.2;
    let align = 'center';

    if (presetType === 'comic-pop') {
      text = '「 世界全剧终，欢迎来到新艾利都 」';
      fontSize = 54;
      fontWeight = '900';
      fillColor = '#ffffff';
      strokeColor = '#000000';
      strokeWidth = 6;
      shadowType = 'halftone';
      shadowColor = '#334155';
      shadowOffset = 8;
      halftoneType = 'dots';
      halftoneSpacing = 6;
      halftoneSize = 2.2;
    } else if (presetType === 'neon') {
      text = '「 世界全剧终，欢迎来到新艾利都 」';
      fontSize = 52;
      fontWeight = '900';
      fillColor = '#ffffff';
      strokeColor = '#0284c7';
      strokeWidth = 2;
      shadowType = 'glow';
      shadowColor = '#38bdf8';
      shadowBlur = 24;
    } else if (presetType === 'main-title') {
      text = '「 世界全剧终，欢迎来到新艾利都 」';
      fontSize = 64;
      fontWeight = '900';
      fillColor = '#0f172a';
    } else if (presetType === 'subtitle') {
      text = '「 世界全剧终，欢迎来到新艾利都 」';
      fontSize = 38;
      fontWeight = '600';
      fillColor = '#475569';
    } else if (presetType === 'badge') {
      text = '「 世界全剧终，欢迎来到新艾利都 」';
      fontSize = 30;
      fontWeight = 'bold';
      fillColor = '#e11d48';
      bgFill = '#ffe4e6';
      bgRadius = 9999;
    } else if (presetType === 'quote') {
      text = '「 世界全剧终，欢迎来到新艾利都 」';
      fontSize = 36;
      fontStyle = 'italic';
      fontWeight = '500';
      fillColor = '#334155';
    }

    const x = (posX !== undefined && !isNaN(posX)) ? posX : state.canvasWidth / 2;
    const y = (posY !== undefined && !isNaN(posY)) ? posY : state.canvasHeight / 2;

    const layer = {
      id: generateId('text'),
      type: 'text',
      name: text.slice(0, 10),
      text: text,
      fontFamily: "'Noto Sans SC', sans-serif",
      fontSize: fontSize,
      fontWeight: fontWeight,
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWidth: strokeWidth,
      shadowType: shadowType,
      shadowColor: shadowColor,
      shadowBlur: shadowBlur,
      shadowOffset: shadowOffset,
      halftoneType: halftoneType,
      halftoneSpacing: halftoneSpacing,
      halftoneSize: halftoneSize,
      bgFill: bgFill,
      bgRadius: bgRadius,
      align: align,
      x: x,
      y: y,
      width: 400,
      height: 80,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    };

    const dims = calculateTextLayerDimensions(layer);
    layer.width = dims.width;
    layer.height = dims.height;

    state.layers.push(layer);
    state.selectedLayerIds = [layer.id];
    recordHistory();
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
    showToast('文字已添加', 'info');
  }

  function addShapeLayer(shapeType, posX, posY) {
    const minDim = Math.min(state.canvasWidth, state.canvasHeight);
    const size = Math.round(minDim * 0.4);
    const x = (posX !== undefined && !isNaN(posX)) ? posX : state.canvasWidth / 2;
    const y = (posY !== undefined && !isNaN(posY)) ? posY : state.canvasHeight / 2;

    const layer = {
      id: generateId('shape'),
      type: 'shape',
      shapeType: shapeType,
      name: shapeType === 'circle' ? '圆形装饰' : '圆角底卡',
      x: x,
      y: y,
      width: size,
      height: shapeType === 'roundedRect' ? Math.round(size * 0.7) : size,
      rotation: 0,
      fillColor: '#ffffff',
      strokeColor: '#cbd5e1',
      strokeWidth: 4,
      borderRadius: 24,
      opacity: 0.9,
      visible: true,
      locked: false
    };

    state.layers.push(layer);
    state.selectedLayerIds = [layer.id];
    recordHistory();
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
    showToast('装饰图形已添加', 'info');
  }

  // Halftone Pattern Generator Cache for Pop-Art / Screentone Dots
  const halftonePatternCache = new Map();

  function getHalftonePattern(type = 'dots', color = '#334155', size = 2.2, spacing = 6) {
    const key = `${type}_${color}_${size}_${spacing}`;
    if (halftonePatternCache.has(key)) return halftonePatternCache.get(key);

    const pCanvas = document.createElement('canvas');
    pCanvas.width = spacing;
    pCanvas.height = spacing;
    const pCtx = pCanvas.getContext('2d');

    pCtx.fillStyle = color;
    if (type === 'dots') {
      pCtx.beginPath();
      pCtx.arc(spacing / 2, spacing / 2, size, 0, Math.PI * 2);
      pCtx.fill();
    } else if (type === 'checker') {
      const half = spacing / 2;
      pCtx.fillRect(0, 0, half, half);
      pCtx.fillRect(half, half, half, half);
    } else if (type === 'stripes') {
      pCtx.strokeStyle = color;
      pCtx.lineWidth = size;
      pCtx.beginPath();
      pCtx.moveTo(0, 0); pCtx.lineTo(spacing, spacing);
      pCtx.moveTo(-spacing / 2, spacing / 2); pCtx.lineTo(spacing / 2, spacing * 1.5);
      pCtx.moveTo(spacing / 2, -spacing / 2); pCtx.lineTo(spacing * 1.5, spacing / 2);
      pCtx.stroke();
    }

    halftonePatternCache.set(key, pCanvas);
    return pCanvas;
  }

  // Bleed Hazard Stripe Pattern Cache for High-Performance Shading
  let cachedBleedStripePattern = null;

  function getBleedHazardPattern() {
    if (cachedBleedStripePattern) return cachedBleedStripePattern;

    const pCanvas = document.createElement('canvas');
    const size = 16;
    pCanvas.width = size;
    pCanvas.height = size;
    const pCtx = pCanvas.getContext('2d');

    pCtx.strokeStyle = 'rgba(0, 0, 0, 0.48)';
    pCtx.lineWidth = 4;
    pCtx.beginPath();
    pCtx.moveTo(0, 0); pCtx.lineTo(size, size);
    pCtx.moveTo(-size / 2, size / 2); pCtx.lineTo(size / 2, size * 1.5);
    pCtx.moveTo(size / 2, -size / 2); pCtx.lineTo(size * 1.5, size / 2);
    pCtx.stroke();

    cachedBleedStripePattern = pCanvas;
    return cachedBleedStripePattern;
  }

  // =========================================================================
  // Canvas Rendering Pipeline (Background + Alignment Mask + Layers + Overflow Bleed Mask)
  // =========================================================================
  function renderCanvas() {
    if (!dom.ctx) return;
    const ctx = dom.ctx;
    const w = state.canvasWidth;
    const h = state.canvasHeight;
    const padX = state.padX !== undefined ? state.padX : Math.round(w * 0.45);
    const padY = state.padY !== undefined ? state.padY : Math.round(h * 0.45);

    ctx.save();
    // Clear the full extended canvas (including overflow margins)
    ctx.clearRect(0, 0, w + padX * 2, h + padY * 2);

    // Translate so (0, 0) corresponds to the Artboard top-left
    ctx.translate(padX, padY);

    // 1. Draw Artboard drop shadow and base container
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 2. Clip & Draw Artboard Background within artboard bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    drawBackground(ctx, w, h);
    ctx.restore();

    // 3. Draw All Layers in order (Stickers, Texts, Shapes)
    // Layers can freely render across the artboard and overflow into margins!
    for (const layer of state.layers) {
      if (!layer.visible) continue;
      drawLayer(ctx, layer);
    }

    // 4. Draw Alignment Masks & Safe Areas ON TOP of all element layers
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    drawAlignmentMaskOnCanvas(ctx, w, h);
    ctx.restore();

    // 5. Draw ZZZ Diagonal Hazard Stripe Bleed Mask on the Overflow Area
    drawOverflowBleedMask(ctx, w, h, padX, padY);

    ctx.restore();

    // 6. Update selection overlay & handles
    updateSelectionOverlay();
  }

  function drawOverflowBleedMask(ctx, w, h, padX, padY) {
    ctx.save();
    // 1. Cutout clip: Outer extended bounds MINUS inner Artboard rectangle
    ctx.beginPath();
    ctx.rect(-padX, -padY, w + padX * 2, h + padY * 2);
    ctx.rect(0, 0, w, h);
    ctx.clip('evenodd');

    // 2. Only paint on top of existing non-transparent layer pixels!
    ctx.globalCompositeOperation = 'source-atop';

    // 2.1 Translucent dark tint covering only the overflowing element pixels
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(-padX, -padY, w + padX * 2, h + padY * 2);

    // 2.2 Instant GPU-accelerated pattern fill for 135° diagonal hazard stripes
    const patternTile = getBleedHazardPattern();
    const pattern = ctx.createPattern(patternTile, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(-padX, -padY, w + padX * 2, h + padY * 2);

    ctx.restore();

    // 3. Crisp boundary border around the exact rendered Artboard
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();
  }

  function ensureBackgroundState() {
    if (!state.background) {
      state.background = {
        type: 'color',
        color: '#f8fafc'
      };
    }
    if (!state.background.type) state.background.type = 'color';
    if (!state.background.color) state.background.color = '#f8fafc';
    if (!state.background.gradient) {
      state.background.gradient = {
        type: 'linear',
        angle: 135,
        color1: '#0f172a',
        color2: '#1e293b'
      };
    }
    if (!state.background.popdots) {
      state.background.popdots = {
        bgColor: '#fbbf24',
        dotColor: '#18181b',
        pattern: 'staggered',
        dotRadius: 10,
        dotSpacing: 36,
        opacity: 0.95
      };
    }
    if (!state.background.film) {
      state.background.film = {
        style: 'cinema-h',
        frameColor: '#09090b',
        innerColor: '#ffffff',
        sprocketColor: 'rgba(255, 255, 255, 0.95)',
        borderThickness: 90,
        textLabel: 'NEW ERIDU FILM 500T',
        frameNumber: '▶ 24'
      };
    }
    if (!state.background.decoration) {
      state.background.decoration = {
        type: 'none',
        color: '#ffffff',
        opacity: 0.35,
        scale: 1
      };
    }
    if (state.background.blur === undefined) state.background.blur = 0;
    if (state.background.overlayOpacity === undefined) state.background.overlayOpacity = 0;
  }

  function drawPopDotsBackground(ctx, w, h, opts) {
    const bgColor = opts.bgColor || '#ffffff';
    const dotColor = opts.dotColor || '#0f172a';
    const radius = opts.dotRadius !== undefined ? opts.dotRadius : 3;
    const spacing = opts.dotSpacing || 10;
    const pattern = opts.pattern || 'micro';
    const opacity = opts.opacity !== undefined ? opts.opacity : 0.95;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = dotColor;

    if (pattern === 'staggered' || pattern === 'micro') {
      let rowIndex = 0;
      for (let y = -radius; y <= h + radius; y += spacing * 0.866) {
        const xOffset = (rowIndex % 2 === 1) ? (spacing / 2) : 0;
        for (let x = -radius + xOffset; x <= w + radius; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        rowIndex++;
      }
    } else if (pattern === 'grid') {
      for (let y = -radius; y <= h + radius; y += spacing) {
        for (let x = -radius; x <= w + radius; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pattern === 'radial') {
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.hypot(w, h) / 2;
      for (let y = 0; y <= h + spacing; y += spacing) {
        for (let x = 0; x <= w + spacing; x += spacing) {
          const dist = Math.hypot(x - cx, y - cy);
          const factor = (dist / maxR);
          const r = Math.max(0.8, radius * (0.2 + factor * 1.5));
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pattern === 'gradient-v' || pattern === 'shadow') {
      let rowIndex = 0;
      for (let y = 0; y <= h + spacing; y += spacing * 0.866) {
        const factor = y / h; // 0 to 1
        const r = Math.max(0.6, radius * (0.15 + factor * 1.6));
        const xOffset = (rowIndex % 2 === 1) ? (spacing / 2) : 0;
        for (let x = -radius + xOffset; x <= w + radius; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        rowIndex++;
      }
    }
    ctx.restore();
  }

  function drawFilmBackground(ctx, w, h, opts) {
    const style = opts.style || 'cinema-h';
    const frameColor = opts.frameColor || '#09090b';
    const innerColor = opts.innerColor || '#ffffff';
    const sprocketColor = opts.sprocketColor || 'rgba(255, 255, 255, 0.95)';
    const thickness = opts.borderThickness || (Math.round(h * 0.12));
    const label = opts.textLabel || 'NEW ERIDU FILM 500T';
    const frameNum = opts.frameNumber || '▶ 24';

    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, w, h);

    if (style === 'cinema-h') {
      const innerY = thickness;
      const innerH = h - thickness * 2;
      ctx.fillStyle = innerColor;
      ctx.fillRect(0, innerY, w, innerH);

      const holeW = 20;
      const holeH = 14;
      const holeRadius = 4;
      const holePitch = 38;

      ctx.fillStyle = sprocketColor;
      for (let x = 16; x < w - 16; x += holePitch) {
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, (thickness - holeH) / 2, holeW, holeH, holeRadius);
          ctx.fill();
        } else {
          ctx.fillRect(x, (thickness - holeH) / 2, holeW, holeH);
        }
      }
      for (let x = 16; x < w - 16; x += holePitch) {
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, h - thickness + (thickness - holeH) / 2, holeW, holeH, holeRadius);
          ctx.fill();
        } else {
          ctx.fillRect(x, h - thickness + (thickness - holeH) / 2, holeW, holeH);
        }
      }
      ctx.fillStyle = 'rgba(234, 179, 8, 0.9)';
      ctx.font = 'bold 11px monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(`• KODAK 500T • ${label} • ${frameNum}`, 32, thickness - 8);
      ctx.fillText(`SAFETY FILM • ISO 800 • ZZZ STUDIO • 24 FPS`, 32, h - 8);
    } else if (style === 'cinema-v') {
      const sideW = Math.round(w * 0.1);
      const innerX = sideW;
      const innerW = w - sideW * 2;
      ctx.fillStyle = innerColor;
      ctx.fillRect(innerX, 0, innerW, h);

      const holeW = 14;
      const holeH = 20;
      const holeRadius = 4;
      const holePitch = 38;

      ctx.fillStyle = sprocketColor;
      for (let y = 16; y < h - 16; y += holePitch) {
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect((sideW - holeW) / 2, y, holeW, holeH, holeRadius);
          ctx.fill();
        } else {
          ctx.fillRect((sideW - holeW) / 2, y, holeW, holeH);
        }
      }
      for (let y = 16; y < h - 16; y += holePitch) {
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(w - sideW + (sideW - holeW) / 2, y, holeW, holeH, holeRadius);
          ctx.fill();
        } else {
          ctx.fillRect(w - sideW + (sideW - holeW) / 2, y, holeW, holeH);
        }
      }
    } else if (style === 'manga-4panel') {
      const margin = 24;
      const gap = 16;
      const halfW = (w - margin * 2 - gap) / 2;
      const halfH = (h - margin * 2 - gap) / 2;
      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = innerColor;
      ctx.fillRect(margin, margin, halfW, halfH);
      ctx.fillRect(margin + halfW + gap, margin, halfW, halfH);
      ctx.fillRect(margin, margin + halfH + gap, halfW, halfH);
      ctx.fillRect(margin + halfW + gap, margin + halfH + gap, halfW, halfH);
    } else if (style === 'polaroid') {
      const sideMargin = Math.round(w * 0.06);
      const topMargin = Math.round(h * 0.06);
      const bottomMargin = Math.round(h * 0.18);
      ctx.fillStyle = frameColor || '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = innerColor;
      const innerW = w - sideMargin * 2;
      const innerH = h - topMargin - bottomMargin;
      ctx.fillRect(sideMargin, topMargin, innerW, innerH);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label || '★ NEW ERIDU MEMORIES ★', w / 2, h - bottomMargin / 2 + 6);
      ctx.textAlign = 'left';
    }
  }

  function drawBackgroundDecoration(ctx, w, h, dec) {
    if (!dec || !dec.type || dec.type === 'none') return;
    ctx.save();
    ctx.globalAlpha = dec.opacity !== undefined ? dec.opacity : 0.35;

    if (dec.type === 'speedlines') {
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.hypot(w, h);
      const lineCount = 64;
      ctx.fillStyle = dec.color || '#ffffff';
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const angleOffset = 0.015 + ((i % 3) * 0.008);
        const innerDist = Math.min(w, h) * 0.22;
        const x1 = cx + Math.cos(angle - angleOffset) * innerDist;
        const y1 = cy + Math.sin(angle - angleOffset) * innerDist;
        const x2 = cx + Math.cos(angle + angleOffset) * innerDist;
        const y2 = cy + Math.sin(angle + angleOffset) * innerDist;
        const x3 = cx + Math.cos(angle) * maxR;
        const y3 = cy + Math.sin(angle) * maxR;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();
      }
    } else if (dec.type === 'hazard') {
      const stripeW = 40;
      ctx.fillStyle = dec.color || '#eab308';
      ctx.beginPath();
      for (let x = -h - stripeW * 2; x < w + h + stripeW * 2; x += stripeW * 2) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeW, 0);
        ctx.lineTo(x + stripeW + h, h);
        ctx.lineTo(x + h, h);
        ctx.closePath();
      }
      ctx.fill();
    } else if (dec.type === 'cybergrid') {
      const step = 50;
      ctx.strokeStyle = dec.color || '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += step) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += step) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
      ctx.fillStyle = dec.color || '#38bdf8';
      for (let x = step * 2; x < w; x += step * 4) {
        for (let y = step * 2; y < h; y += step * 4) {
          ctx.fillRect(x - 4, y - 1, 9, 2);
          ctx.fillRect(x - 1, y - 4, 2, 9);
        }
      }
    } else if (dec.type === 'vignette') {
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) / 2);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, dec.color || 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (dec.type === 'scanlines') {
      ctx.fillStyle = dec.color || '#000000';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1.5);
      }
    } else if (dec.type === 'screentone') {
      const patternCanvas = getHalftonePattern('dots', dec.color || '#000000', 1.5, 5);
      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  function drawBackground(ctx, w, h) {
    ensureBackgroundState();
    const bg = state.background;
    ctx.save();

    if (bg.type === 'color') {
      ctx.fillStyle = bg.color || '#f8fafc';
      ctx.fillRect(0, 0, w, h);
    } else if (bg.type === 'gradient') {
      const angle = (bg.gradient.angle || 135) * (Math.PI / 180);
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.sqrt(w * w + h * h) / 2;
      const x0 = cx - Math.cos(angle) * r;
      const y0 = cy - Math.sin(angle) * r;
      const x1 = cx + Math.cos(angle) * r;
      const y1 = cy + Math.sin(angle) * r;

      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, bg.gradient.color1 || '#ffffff');
      grad.addColorStop(1, bg.gradient.color2 || '#e2e8f0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (bg.type === 'popdots') {
      drawPopDotsBackground(ctx, w, h, bg.popdots || {});
    } else if (bg.type === 'film') {
      drawFilmBackground(ctx, w, h, bg.film || {});
    } else if (bg.type === 'image' && bg.image) {
      if (bg.blur > 0) {
        ctx.filter = `blur(${bg.blur}px)`;
      }

      const img = bg.image;
      const imgAspect = (img.width && img.height) ? (img.width / img.height) : 1;
      const canvasAspect = w / h;
      let drawW, drawH, dx, dy;

      if (bg.imageFit === 'contain') {
        if (imgAspect > canvasAspect) {
          drawW = w;
          drawH = w / imgAspect;
        } else {
          drawH = h;
          drawW = h * imgAspect;
        }
        dx = (w - drawW) / 2;
        dy = (h - drawH) / 2;
      } else if (bg.imageFit === 'stretch') {
        drawW = w; drawH = h; dx = 0; dy = 0;
      } else {
        // Cover
        if (imgAspect > canvasAspect) {
          drawH = h;
          drawW = h * imgAspect;
        } else {
          drawW = w;
          drawH = w / imgAspect;
        }
        dx = (w - drawW) / 2;
        dy = (h - drawH) / 2;
      }

      if (bg.blur > 0) {
        const bleed = bg.blur * 2;
        ctx.drawImage(img, dx - bleed, dy - bleed, drawW + bleed * 2, drawH + bleed * 2);
      } else {
        ctx.drawImage(img, dx, dy, drawW, drawH);
      }

      ctx.filter = 'none';
    }

    if (bg.decoration && bg.decoration.type && bg.decoration.type !== 'none') {
      drawBackgroundDecoration(ctx, w, h, bg.decoration);
    }

    if (bg.overlayOpacity > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${bg.overlayOpacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  function drawLayer(ctx, layer) {
    ctx.save();

    ctx.translate(layer.x, layer.y);
    ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);
    ctx.scale(layer.scaleX || 1, layer.scaleY || 1);
    ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

    const halfW = layer.width / 2;
    const halfH = layer.height / 2;

    if (layer.type === 'sticker' || layer.type === 'image') {
      if (layer.img) {
        ctx.drawImage(layer.img, -halfW, -halfH, layer.width, layer.height);
      }
    } else if (layer.type === 'text') {
      drawTextLayerContent(ctx, layer, -halfW, -halfH);
    } else if (layer.type === 'shape') {
      drawShapeLayerContent(ctx, layer, -halfW, -halfH);
    }

    ctx.restore();
  }

  function drawTextLayerContent(ctx, layer, x, y) {
    const lines = (layer.text || '').split('\n');
    ctx.font = `${layer.fontWeight || 'normal'} ${layer.fontSize || 40}px ${layer.fontFamily || 'sans-serif'}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = layer.align || 'center';

    const lineHeight = layer.fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    let startY = -(totalHeight / 2) + (lineHeight / 2);

    // 1. Background Badge
    if (layer.bgFill && layer.bgFill !== 'transparent') {
      ctx.save();
      ctx.fillStyle = layer.bgFill;
      const padX = layer.fontSize * 0.4;
      const padY = layer.fontSize * 0.2;
      const bgW = layer.width + padX * 2;
      const bgH = totalHeight + padY * 2;
      const bgRadius = layer.bgRadius || 12;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, bgRadius);
      } else {
        ctx.rect(-bgW / 2, -bgH / 2, bgW, bgH);
      }
      ctx.fill();
      ctx.restore();
    }

    const shadowType = layer.shadowType || (layer.shadowBlur > 0 ? 'glow' : 'none');
    const shadowOffset = layer.shadowOffset !== undefined ? layer.shadowOffset : (layer.shadowOffsetX || 8);
    const shadowColor = layer.shadowColor || '#334155';

    // 2. Draw Halftone Screentone Shadow (绝区零波普漫画风灰色网点阴影)
    if (shadowType === 'halftone') {
      ctx.save();
      const patternCanvas = getHalftonePattern(
        layer.halftoneType || 'dots',
        shadowColor,
        layer.halftoneSize || 2.2,
        layer.halftoneSpacing || 6
      );
      const pattern = ctx.createPattern(patternCanvas, 'repeat');

      const offX = shadowOffset;
      const offY = shadowOffset;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let posX = 0;
        if (layer.align === 'left') posX = -layer.width / 2;
        if (layer.align === 'right') posX = layer.width / 2;

        const sX = posX + offX;
        const sY = startY + i * lineHeight + offY;

        // Shadow Outer Contour Stroke
        if (layer.strokeWidth > 0 && layer.strokeColor && layer.strokeColor !== 'transparent') {
          ctx.save();
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth * 2;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(line, sX, sY);
          ctx.restore();
        }

        // Fill Shadow with Halftone Pattern
        ctx.fillStyle = pattern;
        ctx.fillText(line, sX, sY);
      }
      ctx.restore();
    }
    // 3. Draw Solid Offset Shadow (实体硬投影)
    else if (shadowType === 'solid') {
      ctx.save();
      const offX = shadowOffset;
      const offY = shadowOffset;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let posX = 0;
        if (layer.align === 'left') posX = -layer.width / 2;
        if (layer.align === 'right') posX = layer.width / 2;

        const sX = posX + offX;
        const sY = startY + i * lineHeight + offY;

        if (layer.strokeWidth > 0 && layer.strokeColor && layer.strokeColor !== 'transparent') {
          ctx.save();
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth * 2;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(line, sX, sY);
          ctx.restore();
        }

        ctx.fillStyle = shadowColor;
        ctx.fillText(line, sX, sY);
      }
      ctx.restore();
    }
    // 4. Soft Glow
    else if (shadowType === 'glow') {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = layer.shadowBlur || 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
    }

    // 5. Draw Foreground Text
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let posX = 0;
      if (layer.align === 'left') posX = -layer.width / 2;
      if (layer.align === 'right') posX = layer.width / 2;

      const fX = posX;
      const fY = startY + i * lineHeight;

      // Stroke (Draw before fill for crisp outer outline)
      if (layer.strokeWidth > 0 && layer.strokeColor && layer.strokeColor !== 'transparent') {
        ctx.save();
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = layer.strokeWidth * 2;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(line, fX, fY);
        ctx.restore();
      }

      // Fill text
      ctx.fillStyle = layer.fillColor || '#0f172a';
      ctx.fillText(line, posX, startY + i * lineHeight);
    }
  }

  function drawShapeLayerContent(ctx, layer, x, y) {
    ctx.beginPath();

    if (layer.shapeType === 'circle') {
      const r = Math.min(layer.width, layer.height) / 2;
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else if (layer.shapeType === 'roundedRect') {
      if (ctx.roundRect) {
        ctx.roundRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height, layer.borderRadius || 16);
      } else {
        ctx.rect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
      }
    } else if (layer.shapeType === 'badge') {
      const spikes = 8;
      const outerRadius = layer.width / 2;
      const innerRadius = outerRadius * 0.65;
      let rot = Math.PI / 2 * 3;
      let step = Math.PI / spikes;
      ctx.moveTo(0, -outerRadius);
      for (let i = 0; i < spikes; i++) {
        let sx = Math.cos(rot) * outerRadius;
        let sy = Math.sin(rot) * outerRadius;
        ctx.lineTo(sx, sy);
        rot += step;
        sx = Math.cos(rot) * innerRadius;
        sy = Math.sin(rot) * innerRadius;
        ctx.lineTo(sx, sy);
        rot += step;
      }
      ctx.lineTo(0, -outerRadius);
      ctx.closePath();
    } else {
      ctx.rect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
    }

    if (layer.fillColor && layer.fillColor !== 'transparent') {
      ctx.fillStyle = layer.fillColor;
      ctx.fill();
    }

    if (layer.strokeWidth > 0 && layer.strokeColor && layer.strokeColor !== 'transparent') {
      ctx.strokeStyle = layer.strokeColor;
      ctx.lineWidth = layer.strokeWidth;
      ctx.stroke();
    }
  }

  // =========================================================================
  // Selection Overlay & Interactive Handles (Single & Multi-Selection)
  // =========================================================================
  // Canvas Selection Overlay & Fixed Top Contextual Action Bar
  // =========================================================================
  function updateSelectionOverlay() {
    if (!dom.selectionOverlay) return;

    const selectedLayers = getSelectedLayers();
    if (selectedLayers.length === 0) {
      dom.selectionOverlay.innerHTML = '';
      if (dom.canvasTopContextBar) dom.canvasTopContextBar.style.display = 'none';
      return;
    }

    const zoom = state.zoom;

    // Single Layer Selection Mode
    if (selectedLayers.length === 1) {
      const selected = selectedLayers[0];
      const boxW = selected.width * zoom;
      const boxH = selected.height * zoom;
      const boxX = selected.x * zoom;
      const boxY = selected.y * zoom;
      const rot = selected.rotation || 0;

      const isAspectLocked = state.lockAspectRatio;
      const edgeHandlesHtml = isAspectLocked ? '' : `
          <div class="handle handle-n"  data-handle="n"></div>
          <div class="handle handle-e"  data-handle="e"></div>
          <div class="handle handle-s"  data-handle="s"></div>
          <div class="handle handle-w"  data-handle="w"></div>
      `;

      dom.selectionOverlay.innerHTML = `
        <div class="bounding-box ${isAspectLocked ? 'aspect-locked' : ''}" id="active-bounding-box" style="
          width: ${boxW}px;
          height: ${boxH}px;
          left: ${boxX}px;
          top: ${boxY}px;
          transform: translate(-50%, -50%) rotate(${rot}deg);
        ">
          <!-- 4 Corner Resize handles -->
          <div class="handle handle-nw" data-handle="nw"></div>
          <div class="handle handle-ne" data-handle="ne"></div>
          <div class="handle handle-se" data-handle="se"></div>
          <div class="handle handle-sw" data-handle="sw"></div>
          ${edgeHandlesHtml}

          <!-- Rotation arm & Prominent rotation handle -->
          <div class="rotate-arm"></div>
          <div class="handle-rotate" data-handle="rotate" title="拖拽旋转 (按住 Shift 吸附15°)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </div>
        </div>
      `;

      // Update Fixed Top Contextual Action Bar
      if (dom.canvasTopContextBar) {
        let typeLabel = '贴画素材';
        if (selected.type === 'text') typeLabel = '艺术标语';
        else if (selected.type === 'shape') typeLabel = '装饰图形';

        const displayName = selected.text ? `"${selected.text}"` : (selected.name || '已选组件');
        if (dom.contextBarType) dom.contextBarType.textContent = typeLabel;
        if (dom.contextBarName) dom.contextBarName.textContent = displayName;
        dom.canvasTopContextBar.style.display = 'flex';
      }
      return;
    }

    // Multi-Selection Mode
    const groupAABB = getGroupAABB(selectedLayers);
    if (!groupAABB) return;

    const subBoxesHtml = selectedLayers.map(l => `
      <div class="sub-bounding-box" style="
        width: ${l.width * zoom}px;
        height: ${l.height * zoom}px;
        left: ${l.x * zoom}px;
        top: ${l.y * zoom}px;
        transform: translate(-50%, -50%) rotate(${l.rotation || 0}deg);
      "></div>
    `).join('');

    const groupW = groupAABB.width * zoom;
    const groupH = groupAABB.height * zoom;
    const groupX = groupAABB.x * zoom;
    const groupY = groupAABB.y * zoom;

    const isGroupAspectLocked = state.lockAspectRatio;
    const groupEdgeHandlesHtml = isGroupAspectLocked ? '' : `
        <div class="handle handle-n"  data-handle="n"></div>
        <div class="handle handle-e"  data-handle="e"></div>
        <div class="handle handle-s"  data-handle="s"></div>
        <div class="handle handle-w"  data-handle="w"></div>
    `;

    dom.selectionOverlay.innerHTML = `
      ${subBoxesHtml}
      <div class="bounding-box multi-group ${isGroupAspectLocked ? 'aspect-locked' : ''}" id="active-bounding-box" style="
        width: ${groupW}px;
        height: ${groupH}px;
        left: ${groupX}px;
        top: ${groupY}px;
        transform: translate(-50%, -50%);
      ">
        <!-- 4 Corner Group Resize handles -->
        <div class="handle handle-nw" data-handle="nw"></div>
        <div class="handle handle-ne" data-handle="ne"></div>
        <div class="handle handle-se" data-handle="se"></div>
        <div class="handle handle-sw" data-handle="sw"></div>
        ${groupEdgeHandlesHtml}

        <div class="multi-selection-badge">已选中 ${selectedLayers.length} 个组件 (可整体拖动/缩放)</div>
      </div>
    `;

    // Update Fixed Top Contextual Action Bar for Multi-Selection
    if (dom.canvasTopContextBar) {
      if (dom.contextBarType) dom.contextBarType.textContent = '组合多选';
      if (dom.contextBarName) dom.contextBarName.textContent = `已选 ${selectedLayers.length} 个画面组件`;
      dom.canvasTopContextBar.style.display = 'flex';
    }
  }

  // =========================================================================
  // Canvas Mouse Interaction Engine (Dragging, Resizing, Rotating, Marquee)
  // =========================================================================
  function getCanvasCoords(clientX, clientY) {
    if (!dom.artboardWrapper) return { x: 0, y: 0 };
    const rect = dom.artboardWrapper.getBoundingClientRect();
    const zoom = state.zoom || 1;
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    return { x, y };
  }

  function hitTestLayer(layer, canvasX, canvasY) {
    const dx = canvasX - layer.x;
    const dy = canvasY - layer.y;
    const rad = (-(layer.rotation || 0) * Math.PI) / 180;
    const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

    const halfW = layer.width / 2;
    const halfH = layer.height / 2;

    return Math.abs(localX) <= halfW && Math.abs(localY) <= halfH;
  }

  function handleCanvasMouseDown(e) {
    if (e.button !== 0) return; // Only left click
    if (e.target.closest('.layer-floating-bar')) return; // Ignore clicks inside floating toolbar

    e.preventDefault();

    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;
    const handleEl = e.target.closest('[data-handle]');
    const selectedLayers = getSelectedLayers();

    // 1. Handle Resize / Rotate Handle Interacted
    if (handleEl && selectedLayers.length > 0) {
      const handle = handleEl.dataset.handle;
      const groupAABB = getGroupAABB(selectedLayers);

      state.interaction.type = handle === 'rotate' ? 'rotating' : 'resizing';
      state.interaction.handle = handle;
      state.interaction.startX = e.clientX;
      state.interaction.startY = e.clientY;
      state.interaction.hasMoved = false;
      state.interaction.potentialSingleSelectId = null;
      state.interaction.groupStartBox = groupAABB;
      state.interaction.layersSnapshot = selectedLayers.map(l => ({
        id: l.id,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        rotation: l.rotation || 0,
        fontSize: l.fontSize || 40
      }));

      if (selectedLayers.length === 1) {
        const selected = selectedLayers[0];
        state.interaction.layerStartX = selected.x;
        state.interaction.layerStartY = selected.y;
        state.interaction.layerStartW = selected.width;
        state.interaction.layerStartH = selected.height;
        state.interaction.layerStartAngle = selected.rotation || 0;
        state.interaction.layerStartFontSize = selected.fontSize || 40;
        state.interaction.initialAspect = selected.width / selected.height;
      }

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      e.stopPropagation();
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    let clickedLayer = null;

    // Check hit test from top layer down to bottom layer
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const l = state.layers[i];
      if (!l.visible || l.locked) continue;
      if (hitTestLayer(l, x, y)) {
        clickedLayer = l;
        break;
      }
    }

    // 2. Clicked on a Layer
    if (clickedLayer) {
      if (isShift || isCtrl) {
        // Toggle selection (Add or Remove)
        if (state.selectedLayerIds.includes(clickedLayer.id)) {
          state.selectedLayerIds = state.selectedLayerIds.filter(id => id !== clickedLayer.id);
        } else {
          state.selectedLayerIds.push(clickedLayer.id);
        }
        state.interaction.potentialSingleSelectId = null;
      } else {
        // Normal click
        if (state.selectedLayerIds.includes(clickedLayer.id)) {
          // If already part of multi-selection, keep multi-selection for potential group drag,
          // but record potential single-select if user simply clicks without moving!
          state.interaction.potentialSingleSelectId = clickedLayer.id;
        } else {
          // Single select this layer immediately
          state.selectedLayerIds = [clickedLayer.id];
          state.interaction.potentialSingleSelectId = null;
        }
      }

      const currentSelected = getSelectedLayers();
      state.interaction.type = 'dragging';
      state.interaction.startX = e.clientX;
      state.interaction.startY = e.clientY;
      state.interaction.hasMoved = false;
      state.interaction.layersSnapshot = currentSelected.map(l => ({
        id: l.id,
        x: l.x,
        y: l.y
      }));

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    } else {
      // 3. Clicked on Empty Space -> Deselect All immediately & start Marquee Box
      if (!isShift && !isCtrl) {
        state.selectedLayerIds = [];
      }

      state.interaction.type = 'marquee';
      state.interaction.startX = e.clientX;
      state.interaction.startY = e.clientY;
      state.interaction.canvasStartX = x;
      state.interaction.canvasStartY = y;
      state.interaction.hasMoved = false;
      state.interaction.potentialSingleSelectId = null;
      state.interaction.initialSelectedIds = [...state.selectedLayerIds];

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
  }

  function handleWindowMouseMove(e) {
    const inter = state.interaction;
    if (!inter.type) return;

    e.preventDefault();

    const dist = Math.hypot(e.clientX - inter.startX, e.clientY - inter.startY);
    if (dist > 3) {
      inter.hasMoved = true;
      inter.potentialSingleSelectId = null; // Confirmed dragging, do not isolate single layer on mouseup
    }

    const dx = (e.clientX - inter.startX) / state.zoom;
    const dy = (e.clientY - inter.startY) / state.zoom;

    // A. Dragging Layer / Multi-Layer Group with Smart Magnetic Snapping
    if (inter.type === 'dragging') {
      const selectedLayers = getSelectedLayers();
      let snapGuides = [];
      let moveDx = dx;
      let moveDy = dy;

      if (state.snappingEnabled && selectedLayers.length > 0) {
        const snapThreshold = 8;
        const groupAABB = getGroupAABB(selectedLayers);

        if (groupAABB) {
          const testX = groupAABB.x + dx;
          const testY = groupAABB.y + dy;

          // Snap to Canvas Center X
          if (Math.abs(testX - state.canvasWidth / 2) < snapThreshold) {
            moveDx = (state.canvasWidth / 2 - groupAABB.x);
            snapGuides.push({ type: 'x', pos: state.canvasWidth / 2 });
          }
          // Snap to Canvas Center Y
          if (Math.abs(testY - state.canvasHeight / 2) < snapThreshold) {
            moveDy = (state.canvasHeight / 2 - groupAABB.y);
            snapGuides.push({ type: 'y', pos: state.canvasHeight / 2 });
          }
        }
      }

      for (const snap of inter.layersSnapshot) {
        const l = state.layers.find(x => x.id === snap.id);
        if (l) {
          l.x = Math.round(snap.x + moveDx);
          l.y = Math.round(snap.y + moveDy);
        }
      }

      renderSmartGuides(snapGuides);
      renderCanvas();
      updateInspectorFields();
    }
    // B. Resizing Single or Group
    else if (inter.type === 'resizing') {
      const selectedLayers = getSelectedLayers();
      if (selectedLayers.length === 1) {
        const selected = selectedLayers[0];
        const rad = (-(selected.rotation || 0) * Math.PI) / 180;
        const ldx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ldy = dx * Math.sin(rad) + dy * Math.cos(rad);

        let newW = inter.layerStartW;
        let newH = inter.layerStartH;
        const aspect = inter.initialAspect || (inter.layerStartW / (inter.layerStartH || 1));
        const lockAspect = state.lockAspectRatio || e.shiftKey;

        if (lockAspect) {
          // Strict proportional scaling
          if (inter.handle === 'se') {
            newW = Math.max(20, inter.layerStartW + ldx * 2);
            newH = Math.round(newW / aspect);
          } else if (inter.handle === 'nw') {
            newW = Math.max(20, inter.layerStartW - ldx * 2);
            newH = Math.round(newW / aspect);
          } else if (inter.handle === 'ne') {
            newW = Math.max(20, inter.layerStartW + ldx * 2);
            newH = Math.round(newW / aspect);
          } else if (inter.handle === 'sw') {
            newW = Math.max(20, inter.layerStartW - ldx * 2);
            newH = Math.round(newW / aspect);
          } else if (inter.handle === 'e') {
            newW = Math.max(20, inter.layerStartW + ldx * 2);
            newH = Math.round(newW / aspect);
          } else if (inter.handle === 'w') {
            newW = Math.max(20, inter.layerStartW - ldx * 2);
            newH = Math.round(newW / aspect);
          } else if (inter.handle === 's') {
            newH = Math.max(20, inter.layerStartH + ldy * 2);
            newW = Math.round(newH * aspect);
          } else if (inter.handle === 'n') {
            newH = Math.max(20, inter.layerStartH - ldy * 2);
            newW = Math.round(newH * aspect);
          }
        } else {
          // Free Non-Proportional Scaling (When Unlocked)
          if (inter.handle === 'se') {
            newW = Math.max(20, inter.layerStartW + ldx * 2);
            newH = Math.max(20, inter.layerStartH + ldy * 2);
          } else if (inter.handle === 'nw') {
            newW = Math.max(20, inter.layerStartW - ldx * 2);
            newH = Math.max(20, inter.layerStartH - ldy * 2);
          } else if (inter.handle === 'ne') {
            newW = Math.max(20, inter.layerStartW + ldx * 2);
            newH = Math.max(20, inter.layerStartH - ldy * 2);
          } else if (inter.handle === 'sw') {
            newW = Math.max(20, inter.layerStartW - ldx * 2);
            newH = Math.max(20, inter.layerStartH + ldy * 2);
          } else if (inter.handle === 'e') {
            newW = Math.max(20, inter.layerStartW + ldx * 2);
          } else if (inter.handle === 'w') {
            newW = Math.max(20, inter.layerStartW - ldx * 2);
          } else if (inter.handle === 's') {
            newH = Math.max(20, inter.layerStartH + ldy * 2);
          } else if (inter.handle === 'n') {
            newH = Math.max(20, inter.layerStartH - ldy * 2);
          }
        }

        if (selected.type === 'text') {
          const scale = Math.max(0.1, newW / inter.layerStartW);
          selected.fontSize = Math.max(10, Math.round(inter.layerStartFontSize * scale));
          const dims = calculateTextLayerDimensions(selected);
          selected.width = dims.width;
          selected.height = dims.height;
          if (dom.propTextSize) dom.propTextSize.value = selected.fontSize;
        } else {
          selected.width = Math.round(newW);
          selected.height = Math.round(newH);
        }
      } else if (selectedLayers.length > 1 && inter.groupStartBox) {
        const gBox = inter.groupStartBox;
        let scaleFactorX = 1;
        let scaleFactorY = 1;
        const lockAspect = state.lockAspectRatio || e.shiftKey;

        if (lockAspect) {
          if (inter.handle === 'se' || inter.handle === 'ne') {
            const newW = Math.max(30, gBox.width + dx * 2);
            scaleFactorX = newW / gBox.width;
            scaleFactorY = scaleFactorX;
          } else if (inter.handle === 'nw' || inter.handle === 'sw') {
            const newW = Math.max(30, gBox.width - dx * 2);
            scaleFactorX = newW / gBox.width;
            scaleFactorY = scaleFactorX;
          } else if (inter.handle === 'e') {
            scaleFactorX = Math.max(0.1, (gBox.width + dx * 2) / gBox.width);
            scaleFactorY = scaleFactorX;
          } else if (inter.handle === 'w') {
            scaleFactorX = Math.max(0.1, (gBox.width - dx * 2) / gBox.width);
            scaleFactorY = scaleFactorX;
          } else if (inter.handle === 's') {
            scaleFactorY = Math.max(0.1, (gBox.height + dy * 2) / gBox.height);
            scaleFactorX = scaleFactorY;
          } else if (inter.handle === 'n') {
            scaleFactorY = Math.max(0.1, (gBox.height - dy * 2) / gBox.height);
            scaleFactorX = scaleFactorY;
          }
        } else {
          if (inter.handle === 'se') {
            scaleFactorX = Math.max(0.1, (gBox.width + dx * 2) / gBox.width);
            scaleFactorY = Math.max(0.1, (gBox.height + dy * 2) / gBox.height);
          } else if (inter.handle === 'nw') {
            scaleFactorX = Math.max(0.1, (gBox.width - dx * 2) / gBox.width);
            scaleFactorY = Math.max(0.1, (gBox.height - dy * 2) / gBox.height);
          } else if (inter.handle === 'ne') {
            scaleFactorX = Math.max(0.1, (gBox.width + dx * 2) / gBox.width);
            scaleFactorY = Math.max(0.1, (gBox.height - dy * 2) / gBox.height);
          } else if (inter.handle === 'sw') {
            scaleFactorX = Math.max(0.1, (gBox.width - dx * 2) / gBox.width);
            scaleFactorY = Math.max(0.1, (gBox.height + dy * 2) / gBox.height);
          } else if (inter.handle === 'e') {
            scaleFactorX = Math.max(0.1, (gBox.width + dx * 2) / gBox.width);
          } else if (inter.handle === 'w') {
            scaleFactorX = Math.max(0.1, (gBox.width - dx * 2) / gBox.width);
          } else if (inter.handle === 's') {
            scaleFactorY = Math.max(0.1, (gBox.height + dy * 2) / gBox.height);
          } else if (inter.handle === 'n') {
            scaleFactorY = Math.max(0.1, (gBox.height - dy * 2) / gBox.height);
          }
        }

        for (const snap of inter.layersSnapshot) {
          const l = state.layers.find(x => x.id === snap.id);
          if (l) {
            const relX = snap.x - gBox.x;
            const relY = snap.y - gBox.y;
            l.x = Math.round(gBox.x + relX * scaleFactorX);
            l.y = Math.round(gBox.y + relY * scaleFactorY);
            if (l.type === 'text') {
              l.fontSize = Math.max(10, Math.round((snap.fontSize || 40) * scaleFactorX));
              const dims = calculateTextLayerDimensions(l);
              l.width = dims.width;
              l.height = dims.height;
            } else {
              l.width = Math.round(Math.max(10, snap.width * scaleFactorX));
              l.height = Math.round(Math.max(10, snap.height * scaleFactorY));
            }
          }
        }
      }

      renderCanvas();
      updateInspectorFields();
    }
    // C. Rotating Single Layer
    else if (inter.type === 'rotating') {
      const selected = getSelectedLayer();
      if (selected) {
        const { x: mouseCanvasX, y: mouseCanvasY } = getCanvasCoords(e.clientX, e.clientY);
        let angle = Math.atan2(mouseCanvasY - selected.y, mouseCanvasX - selected.x) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        if (e.shiftKey) {
          angle = Math.round(angle / 15) * 15;
        }

        selected.rotation = Math.round(angle % 360);
        renderCanvas();
        updateInspectorFields();
      }
    }
    // D. Marquee Rubber-Band Area Selection
    else if (inter.type === 'marquee') {
      const { x: curCanvasX, y: curCanvasY } = getCanvasCoords(e.clientX, e.clientY);
      const cMinX = Math.min(curCanvasX, inter.canvasStartX);
      const cMaxX = Math.max(curCanvasX, inter.canvasStartX);
      const cMinY = Math.min(curCanvasY, inter.canvasStartY);
      const cMaxY = Math.max(curCanvasY, inter.canvasStartY);

      const marqueeHits = [];
      for (const l of state.layers) {
        if (!l.visible || l.locked) continue;
        const box = getLayerAABB(l);
        const intersects = !(box.maxX < cMinX || box.minX > cMaxX || box.maxY < cMinY || box.minY > cMaxY);
        if (intersects) {
          marqueeHits.push(l.id);
        }
      }

      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        state.selectedLayerIds = Array.from(new Set([...inter.initialSelectedIds, ...marqueeHits]));
      } else {
        state.selectedLayerIds = marqueeHits;
      }

      updateSelectionOverlay();
      const zoom = state.zoom;
      const marqueeDiv = document.createElement('div');
      marqueeDiv.className = 'marquee-selection-box';
      marqueeDiv.style.left = `${cMinX * zoom}px`;
      marqueeDiv.style.top = `${cMinY * zoom}px`;
      marqueeDiv.style.width = `${(cMaxX - cMinX) * zoom}px`;
      marqueeDiv.style.height = `${(cMaxY - cMinY) * zoom}px`;
      dom.selectionOverlay.appendChild(marqueeDiv);

      updateLayersUI();
      updateInspectorUI();
    }
  }

  function handleWindowMouseUp() {
    if (state.interaction.type) {
      const type = state.interaction.type;
      const hasMoved = state.interaction.hasMoved;
      const potentialSingleSelectId = state.interaction.potentialSingleSelectId;

      state.interaction.type = null;
      state.interaction.hasMoved = false;
      state.interaction.potentialSingleSelectId = null;

      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);

      // If user performed a pure click on one element of an existing multi-selection without dragging -> isolate it
      if (potentialSingleSelectId && !hasMoved) {
        state.selectedLayerIds = [potentialSingleSelectId];
      }

      clearSmartGuides();
      renderCanvas();
      updateLayersUI();
      updateInspectorUI();

      if (type === 'marquee' && state.selectedLayerIds.length > 1 && hasMoved) {
        showToast(`已框选 ${state.selectedLayerIds.length} 个贴画`, 'info');
      }

      if (hasMoved && (type === 'dragging' || type === 'resizing' || type === 'rotating')) {
        recordHistory();
      }
    }
  }

  // =========================================================================
  // Layer Operations (Reorder, Duplicate, Flip, Delete, Alignment)
  // =========================================================================
  function moveLayerToTop(id) {
    const idx = state.layers.findIndex(l => l.id === id);
    if (idx === -1 || idx === state.layers.length - 1) return;
    const [layer] = state.layers.splice(idx, 1);
    state.layers.push(layer);
    recordHistory();
    renderCanvas();
    updateLayersUI();
    showToast('贴画已置于顶层', 'info');
  }

  function moveLayerToBottom(id) {
    const idx = state.layers.findIndex(l => l.id === id);
    if (idx === -1 || idx === 0) return;
    const [layer] = state.layers.splice(idx, 1);
    state.layers.unshift(layer);
    recordHistory();
    renderCanvas();
    updateLayersUI();
    showToast('贴画已置于底层', 'info');
  }

  function moveSelectedLayersToTop() {
    if (state.selectedLayerIds.length === 0) return;
    const selected = state.layers.filter(l => state.selectedLayerIds.includes(l.id));
    state.layers = state.layers.filter(l => !state.selectedLayerIds.includes(l.id));
    state.layers.push(...selected);
    recordHistory();
    renderCanvas();
    updateLayersUI();
    showToast(`已将选中的 ${selected.length} 个贴画置于顶层`, 'info');
  }

  function moveSelectedLayersToBottom() {
    if (state.selectedLayerIds.length === 0) return;
    const selected = state.layers.filter(l => state.selectedLayerIds.includes(l.id));
    state.layers = state.layers.filter(l => !state.selectedLayerIds.includes(l.id));
    state.layers.unshift(...selected);
    recordHistory();
    renderCanvas();
    updateLayersUI();
    showToast(`已将选中的 ${selected.length} 个贴画置于底层`, 'info');
  }

  function moveLayerUp(id) {
    const idx = state.layers.findIndex(l => l.id === id);
    if (idx === -1 || idx === state.layers.length - 1) return;
    const temp = state.layers[idx];
    state.layers[idx] = state.layers[idx + 1];
    state.layers[idx + 1] = temp;
    recordHistory();
    renderCanvas();
    updateLayersUI();
  }

  function moveLayerDown(id) {
    const idx = state.layers.findIndex(l => l.id === id);
    if (idx <= 0) return;
    const temp = state.layers[idx];
    state.layers[idx] = state.layers[idx - 1];
    state.layers[idx - 1] = temp;
    recordHistory();
    renderCanvas();
    updateLayersUI();
  }

  function duplicateLayer(id) {
    const target = state.layers.find(l => l.id === id);
    if (!target) return;
    const copy = JSON.parse(JSON.stringify(target));
    copy.id = generateId(target.type);
    copy.name = `${target.name} 副本`;
    copy.x += 30;
    copy.y += 30;
    if (target.img) copy.img = target.img;

    state.layers.push(copy);
    state.selectedLayerIds = [copy.id];
    recordHistory();
    renderCanvas();
    updateLayersUI();
    selectLayer(copy.id);
    showToast('贴画已复制', 'info');
  }

  function duplicateSelectedLayers() {
    if (state.selectedLayerIds.length === 0) return;
    const newSelectedIds = [];
    const newLayers = [];

    for (const id of state.selectedLayerIds) {
      const target = state.layers.find(l => l.id === id);
      if (!target) continue;
      const copy = JSON.parse(JSON.stringify(target));
      copy.id = generateId(target.type);
      copy.name = `${target.name} 副本`;
      copy.x += 30;
      copy.y += 30;
      if (target.img) copy.img = target.img;
      newLayers.push(copy);
      newSelectedIds.push(copy.id);
    }

    state.layers.push(...newLayers);
    state.selectedLayerIds = newSelectedIds;
    state.selectedLayerId = newSelectedIds[0] || null;

    recordHistory();
    renderCanvas();
    updateLayersUI();
    updateSelectionOverlay();
    updateInspectorUI();
    showToast(`已批量复制 ${newSelectedIds.length} 个贴画`, 'info');
  }

  function deleteLayer(id) {
    const idx = state.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    state.layers.splice(idx, 1);
    if (state.selectedLayerId === id) state.selectedLayerId = null;
    state.selectedLayerIds = state.selectedLayerIds.filter(x => x !== id);
    recordHistory();
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
    showToast('贴画已删除', 'info');
  }

  function deleteSelectedLayers() {
    if (state.selectedLayerIds.length === 0) return;
    const count = state.selectedLayerIds.length;
    state.layers = state.layers.filter(l => !state.selectedLayerIds.includes(l.id));
    state.selectedLayerIds = [];
    state.selectedLayerId = null;
    recordHistory();
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
    showToast(`已删除 ${count} 个贴画`, 'info');
  }

  function toggleFlipH(id) {
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;
    layer.scaleX = (layer.scaleX || 1) * -1;
    recordHistory();
    renderCanvas();
    showToast('已水平镜像翻转', 'info');
  }

  function flipSelectedLayersH() {
    const selected = getSelectedLayers();
    if (selected.length === 0) return;
    const groupAABB = getGroupAABB(selected);
    for (const l of selected) {
      l.scaleX = (l.scaleX || 1) * -1;
      if (selected.length > 1 && groupAABB) {
        const distToCenter = l.x - groupAABB.x;
        l.x = groupAABB.x - distToCenter;
      }
    }
    recordHistory();
    renderCanvas();
    showToast(`已水平翻转 ${selected.length} 个贴画`, 'info');
  }

  function toggleFlipV(id) {
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;
    layer.scaleY = (layer.scaleY || 1) * -1;
    recordHistory();
    renderCanvas();
  }

  // =========================================================================
  // History Undo / Redo Stack & Auto-Save Draft
  // =========================================================================
  function recordHistory(shouldSaveDraft = true) {
    state.history = state.history.slice(0, state.historyIndex + 1);

    const snapshot = {
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      presetName: state.currentPresetName,
      background: JSON.parse(JSON.stringify(state.background)),
      layers: state.layers.map(l => {
        const copy = JSON.parse(JSON.stringify(l));
        if (l.img) copy.img = l.img;
        return copy;
      })
    };

    state.history.push(snapshot);
    if (state.history.length > state.maxHistory) {
      state.history.shift();
    }
    state.historyIndex = state.history.length - 1;
    updateHistoryButtons();

    if (shouldSaveDraft !== false) {
      saveAutoDraft();
    }
  }

  function saveAutoDraft() {
    try {
      const draft = {
        timestamp: Date.now(),
        projectTitle: state.projectTitle || '绝区零海报作品',
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        currentPresetName: state.currentPresetName,
        background: {
          type: state.background.type,
          color: state.background.color,
          gradient: state.background.gradient,
          popdots: state.background.popdots,
          film: state.background.film,
          decoration: state.background.decoration,
          imageSrc: state.background.imageSrc,
          imageFit: state.background.imageFit || 'cover',
          blur: state.background.blur || 0,
          overlayOpacity: state.background.overlayOpacity || 0
        },
        layers: state.layers.map(l => {
          const copy = { ...l };
          delete copy.img;
          return copy;
        }),
        selectedLayerIds: state.selectedLayerIds
      };
      localStorage.setItem('zzz_poster_autosave_draft', JSON.stringify(draft));
    } catch (e) {
      console.warn('[AutoSave] Failed to save draft:', e);
    }
  }

  async function loadAutoDraft() {
    try {
      const raw = localStorage.getItem('zzz_poster_autosave_draft');
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (!draft || !draft.canvasWidth || !draft.canvasHeight) return false;

      updateCanvasDimensions(draft.canvasWidth, draft.canvasHeight, draft.currentPresetName || '自定义画布');
      state.projectTitle = draft.projectTitle || '绝区零海报作品';

      state.background = {
        type: draft.background.type || 'color',
        color: draft.background.color || '#f8fafc',
        gradient: draft.background.gradient || { type: 'linear', angle: 135, color1: '#0f172a', color2: '#1e293b' },
        popdots: draft.background.popdots,
        film: draft.background.film,
        decoration: draft.background.decoration,
        imageSrc: draft.background.imageSrc || null,
        imageFit: draft.background.imageFit || 'cover',
        blur: draft.background.blur || 0,
        overlayOpacity: draft.background.overlayOpacity || 0,
        image: null
      };

      if (state.background.imageSrc) {
        state.background.image = await preloadImage(state.background.imageSrc);
      }

      ensureBackgroundState();

      state.layers = [];
      for (const l of (draft.layers || [])) {
        const layerCopy = { ...l };
        if (layerCopy.type === 'sticker' && layerCopy.src) {
          layerCopy.img = await preloadImage(layerCopy.src);
        }
        if (layerCopy.type === 'text') {
          const dims = calculateTextLayerDimensions(layerCopy);
          layerCopy.width = dims.width;
          layerCopy.height = dims.height;
        }
        state.layers.push(layerCopy);
      }

      state.selectedLayerIds = draft.selectedLayerIds || [];
      syncBackgroundControls();
      recordHistory(false);
      renderCanvas();
      updateLayersUI();
      updateInspectorUI();
      showToast('✨ 已自动恢复您上次编辑的草稿！', 'success');
      return true;
    } catch (e) {
      console.warn('[AutoSave] Failed to load draft:', e);
      return false;
    }
  }

  function undo() {
    if (state.historyIndex <= 0) return;
    state.historyIndex--;
    applyHistorySnapshot(state.history[state.historyIndex]);
    showToast('已撤销', 'info');
  }

  function redo() {
    if (state.historyIndex >= state.history.length - 1) return;
    state.historyIndex++;
    applyHistorySnapshot(state.history[state.historyIndex]);
    showToast('已重做', 'info');
  }

  function applyHistorySnapshot(snap) {
    if (!snap) return;
    state.canvasWidth = snap.canvasWidth;
    state.canvasHeight = snap.canvasHeight;
    state.currentPresetName = snap.presetName;
    state.background = JSON.parse(JSON.stringify(snap.background));
    ensureBackgroundState();
    state.layers = snap.layers.map(l => {
      const copy = JSON.parse(JSON.stringify(l));
      if (l.src && imageCache.has(l.src)) {
        copy.img = imageCache.get(l.src);
      }
      return copy;
    });

    updateCanvasDimensions(state.canvasWidth, state.canvasHeight, state.currentPresetName);
    syncBackgroundControls();
    updateHistoryButtons();
    renderCanvas();
    updateLayersUI();
    updateInspectorUI();
  }

  function updateHistoryButtons() {
    if (!dom.btnUndo || !dom.btnRedo) return;
    dom.btnUndo.disabled = state.historyIndex <= 0;
    dom.btnRedo.disabled = state.historyIndex >= state.history.length - 1;
    dom.btnUndo.style.opacity = dom.btnUndo.disabled ? '0.4' : '1';
    dom.btnRedo.style.opacity = dom.btnRedo.disabled ? '0.4' : '1';
  }

  // =========================================================================
  // UI Syncing (Layers List & Inspector Panels)
  // =========================================================================
  function updateLayersUI() {
    if (!dom.layerCountBadge || !dom.layerListContainer) return;
    dom.layerCountBadge.textContent = state.layers.length;

    // Sync Lock All Button UI & Icon
    const allLocked = state.layers.length > 0 && state.layers.every(l => l.locked);
    if (dom.labelLockAll) dom.labelLockAll.textContent = allLocked ? '解锁全部' : '锁定全部';
    if (dom.btnLockAllLayers) {
      dom.btnLockAllLayers.classList.toggle('active', allLocked);
      dom.btnLockAllLayers.title = allLocked ? '点击一键解锁所有贴画与组件' : '锁定所有贴画 (防误触拖动)';
    }
    if (dom.iconLockAll) {
      dom.iconLockAll.innerHTML = allLocked
        ? `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`
        : `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    }

    const reversed = [...state.layers].reverse();
    dom.layerListContainer.innerHTML = reversed.map(l => {
      const isSelected = isLayerSelected(l.id);
      let thumbHtml = '';
      if (l.type === 'sticker' && l.src) {
        thumbHtml = `<img src="${l.src}" alt="${l.name}">`;
      } else if (l.type === 'text') {
        thumbHtml = `<span style="font-weight: bold; font-size: 14px;">T</span>`;
      } else {
        thumbHtml = `<span style="font-size: 12px;">◻</span>`;
      }

      return `
        <div class="layer-item ${isSelected ? 'active' : ''}" data-layer-id="${l.id}">
          <div class="layer-thumb">${thumbHtml}</div>
          <span class="layer-name">${l.name}</span>
          <div class="layer-actions">
            <button class="layer-action-btn btn-toggle-vis" title="${l.visible ? '隐藏' : '显示'}">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                ${l.visible ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="2" x2="23" y2="23"/>'}
              </svg>
            </button>
            <button class="layer-action-btn btn-toggle-lock" title="${l.locked ? '解锁' : '锁定'}">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                ${l.locked ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    dom.layerListContainer.querySelectorAll('.layer-item').forEach(itemEl => {
      const layerId = itemEl.dataset.layerId;
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.layer-action-btn')) return;
        const isToggle = e.shiftKey || e.ctrlKey || e.metaKey;
        selectLayer(layerId, isToggle);
      });

      const visBtn = itemEl.querySelector('.btn-toggle-vis');
      if (visBtn) {
        visBtn.addEventListener('click', () => {
          const l = state.layers.find(x => x.id === layerId);
          if (l) {
            l.visible = !l.visible;
            recordHistory();
            renderCanvas();
            updateLayersUI();
          }
        });
      }

      const lockBtn = itemEl.querySelector('.btn-toggle-lock');
      if (lockBtn) {
        lockBtn.addEventListener('click', () => {
          const l = state.layers.find(x => x.id === layerId);
          if (l) {
            l.locked = !l.locked;
            recordHistory();
            updateLayersUI();
          }
        });
      }
    });
  }

  function updateInspectorUI() {
    const selectedLayers = getSelectedLayers();
    if (selectedLayers.length === 0) {
      if (dom.noSelectionHint) dom.noSelectionHint.style.display = 'block';
      if (dom.layerPropertiesForm) dom.layerPropertiesForm.style.display = 'none';
      return;
    }

    if (dom.noSelectionHint) dom.noSelectionHint.style.display = 'none';
    if (dom.layerPropertiesForm) dom.layerPropertiesForm.style.display = 'flex';

    updateInspectorFields();

    // Show/hide type-specific sections
    if (selectedLayers.length === 1) {
      const selected = selectedLayers[0];
      if (dom.inspectorTextSection) dom.inspectorTextSection.style.display = selected.type === 'text' ? 'flex' : 'none';
      if (dom.inspectorImageSection) dom.inspectorImageSection.style.display = (selected.type === 'sticker' || selected.type === 'image') ? 'flex' : 'none';
      if (dom.inspectorShapeSection) dom.inspectorShapeSection.style.display = selected.type === 'shape' ? 'flex' : 'none';
    } else {
      if (dom.inspectorTextSection) dom.inspectorTextSection.style.display = 'none';
      if (dom.inspectorImageSection) dom.inspectorImageSection.style.display = 'none';
      if (dom.inspectorShapeSection) dom.inspectorShapeSection.style.display = 'none';
    }
  }

  function updateInspectorFields() {
    const selectedLayers = getSelectedLayers();
    if (selectedLayers.length === 0) return;

    if (selectedLayers.length === 1) {
      const selected = selectedLayers[0];
      if (dom.propWidth) dom.propWidth.value = Math.round(selected.width);
      if (dom.propHeight) dom.propHeight.value = Math.round(selected.height);
      if (dom.propRotation) dom.propRotation.value = Math.round(selected.rotation || 0);
      if (dom.propOpacity) dom.propOpacity.value = Math.round((selected.opacity !== undefined ? selected.opacity : 1) * 100);

      if (selected.type === 'text') {
        if (dom.propTextContent) dom.propTextContent.value = selected.text || '';
        let curFont = selected.fontFamily || "'Noto Sans SC', sans-serif";
        if (curFont.includes('KuaiLe') || curFont.includes('Impact') || curFont.includes('Georgia')) {
          curFont = "'Noto Sans SC', sans-serif";
          selected.fontFamily = curFont;
        }
        if (dom.propTextFont) dom.propTextFont.value = curFont;
        if (dom.propTextSize) dom.propTextSize.value = selected.fontSize || 40;
        if (dom.propTextColor) dom.propTextColor.value = selected.fillColor || '#0f172a';
        if (dom.propTextStrokeColor) dom.propTextStrokeColor.value = (selected.strokeColor && selected.strokeColor !== 'transparent') ? selected.strokeColor : '#000000';
        if (dom.propTextStrokeWidth) dom.propTextStrokeWidth.value = selected.strokeWidth || 0;
        
        const sw = selected.strokeWidth || 0;
        if (document.getElementById('btn-stroke-0')) document.getElementById('btn-stroke-0').classList.toggle('active', sw === 0);
        if (document.getElementById('btn-stroke-2')) document.getElementById('btn-stroke-2').classList.toggle('active', sw === 2);
        if (document.getElementById('btn-stroke-6')) document.getElementById('btn-stroke-6').classList.toggle('active', sw === 6);
        if (document.getElementById('btn-stroke-12')) document.getElementById('btn-stroke-12').classList.toggle('active', sw === 12);

        if (dom.propTextBgFill) dom.propTextBgFill.value = selected.bgFill && selected.bgFill !== 'transparent' ? selected.bgFill : '#ffffff';
        if (dom.btnToggleTextBg) {
          dom.btnToggleTextBg.textContent = selected.bgFill ? '已启用底色' : '无底色';
          dom.btnToggleTextBg.style.background = selected.bgFill ? 'var(--accent-primary-light)' : 'transparent';
        }

        // Text Shadow & Halftone Inspector Sync
        const sType = selected.shadowType || (selected.shadowBlur > 0 ? 'glow' : 'none');
        if (dom.propTextShadowType) dom.propTextShadowType.value = sType;
        if (dom.textShadowControls) dom.textShadowControls.style.display = (sType !== 'none') ? 'block' : 'none';
        if (dom.groupHalftoneType) dom.groupHalftoneType.style.display = (sType === 'halftone') ? 'block' : 'none';
        if (dom.groupHalftoneDensity) dom.groupHalftoneDensity.style.display = (sType === 'halftone') ? 'block' : 'none';
        if (dom.propTextShadowColor) dom.propTextShadowColor.value = selected.shadowColor || '#334155';
        if (dom.propTextHalftoneType) dom.propTextHalftoneType.value = selected.halftoneType || 'dots';
        const off = selected.shadowOffset !== undefined ? selected.shadowOffset : 8;
        if (dom.sliderTextShadowOffset) dom.sliderTextShadowOffset.value = off;
        if (dom.labelTextShadowOffset) dom.labelTextShadowOffset.textContent = `${off} px`;

        const spacing = selected.halftoneSpacing || 6;
        if (dom.btnHalftoneDense) dom.btnHalftoneDense.classList.toggle('active', spacing === 4);
        if (dom.btnHalftoneNormal) dom.btnHalftoneNormal.classList.toggle('active', spacing === 6);
        if (dom.btnHalftoneCoarse) dom.btnHalftoneCoarse.classList.toggle('active', spacing === 9);
      } else if (selected.type === 'shape') {
        if (dom.propShapeFill) dom.propShapeFill.value = selected.fillColor || '#ffffff';
        if (dom.propShapeStroke) dom.propShapeStroke.value = selected.strokeColor || '#cbd5e1';
        if (dom.propShapeStrokeWidth) dom.propShapeStrokeWidth.value = selected.strokeWidth || 2;
        if (dom.propShapeRadius) dom.propShapeRadius.value = selected.borderRadius || 16;
      }
    } else {
      const gBox = getGroupAABB(selectedLayers);
      if (gBox) {
        if (dom.propWidth) dom.propWidth.value = Math.round(gBox.width);
        if (dom.propHeight) dom.propHeight.value = Math.round(gBox.height);
        if (dom.propRotation) dom.propRotation.value = 0;
      }
    }
  }

  function updateAspectRatioLockUI() {
    if (!dom.btnLockAspectRatio) return;
    if (state.lockAspectRatio) {
      dom.btnLockAspectRatio.classList.add('active');
      dom.btnLockAspectRatio.title = '长宽比已锁定 (点击解锁)';
      dom.btnLockAspectRatio.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      `;
    } else {
      dom.btnLockAspectRatio.classList.remove('active');
      dom.btnLockAspectRatio.title = '长宽比已解锁 (点击锁定)';
      dom.btnLockAspectRatio.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          <line x1="2" y1="2" x2="22" y2="22" stroke-width="2"/>
        </svg>
      `;
    }
  }

  function setBgType(type) {
    state.background.type = type;
    if (dom.bgTypeColor) dom.bgTypeColor.classList.toggle('active', type === 'color');
    if (dom.bgTypeGradient) dom.bgTypeGradient.classList.toggle('active', type === 'gradient');
    if (dom.bgTypePopdots) dom.bgTypePopdots.classList.toggle('active', type === 'popdots');
    if (dom.bgTypeFilm) dom.bgTypeFilm.classList.toggle('active', type === 'film');
    if (dom.bgTypeImage) dom.bgTypeImage.classList.toggle('active', type === 'image');

    if (dom.bgColorSettings) dom.bgColorSettings.style.display = (type === 'color') ? 'block' : 'none';
    if (dom.bgGradientSettings) dom.bgGradientSettings.style.display = (type === 'gradient') ? 'block' : 'none';
    if (dom.bgPopdotsSettings) dom.bgPopdotsSettings.style.display = (type === 'popdots') ? 'block' : 'none';
    if (dom.bgFilmSettings) dom.bgFilmSettings.style.display = (type === 'film') ? 'block' : 'none';
    if (dom.bgImageSettings) dom.bgImageSettings.style.display = (type === 'image') ? 'block' : 'none';
  }

  function syncBackgroundControls() {
    ensureBackgroundState();
    const bg = state.background;

    if (dom.sliderBgBlur) {
      dom.sliderBgBlur.value = bg.blur || 0;
      dom.labelBgBlur.textContent = `${bg.blur || 0} px`;
    }
    if (dom.sliderBgOverlay) {
      dom.sliderBgOverlay.value = Math.round((bg.overlayOpacity || 0) * 100);
      dom.labelBgOverlay.textContent = `${Math.round((bg.overlayOpacity || 0) * 100)}%`;
    }

    // Base Type Switching
    setBgType(bg.type || 'color');

    if (bg.type === 'color') {
      if (dom.inputBgColor) dom.inputBgColor.value = bg.color;
      if (dom.inputBgColorHex) dom.inputBgColorHex.value = bg.color;
    } else if (bg.type === 'gradient') {
      if (dom.inputGradColor1) dom.inputGradColor1.value = bg.gradient.color1;
      if (dom.inputGradColor2) dom.inputGradColor2.value = bg.gradient.color2;
      if (dom.sliderGradAngle) {
        dom.sliderGradAngle.value = bg.gradient.angle;
        dom.labelGradAngle.textContent = `${bg.gradient.angle}°`;
      }
    } else if (bg.type === 'popdots' && bg.popdots) {
      if (dom.inputPopBgColor) dom.inputPopBgColor.value = bg.popdots.bgColor;
      if (dom.inputPopDotColor) dom.inputPopDotColor.value = bg.popdots.dotColor;
      if (dom.selectPopPattern) dom.selectPopPattern.value = bg.popdots.pattern;
      if (dom.sliderPopDotSize) {
        dom.sliderPopDotSize.value = bg.popdots.dotRadius;
        if (dom.labelPopDotSize) dom.labelPopDotSize.textContent = `${bg.popdots.dotRadius} px`;
      }
      if (dom.sliderPopDotSpacing) {
        dom.sliderPopDotSpacing.value = bg.popdots.dotSpacing;
        if (dom.labelPopDotSpacing) dom.labelPopDotSpacing.textContent = `${bg.popdots.dotSpacing} px`;
      }
    } else if (bg.type === 'film' && bg.film) {
      if (dom.inputFilmFrameColor) dom.inputFilmFrameColor.value = bg.film.frameColor;
      if (dom.inputFilmInnerColor) dom.inputFilmInnerColor.value = bg.film.innerColor;
      if (dom.inputFilmLabel) dom.inputFilmLabel.value = bg.film.textLabel;
      if (dom.inputFilmNumber) dom.inputFilmNumber.value = bg.film.frameNumber;
      if (dom.sliderFilmThickness) {
        dom.sliderFilmThickness.value = bg.film.borderThickness;
        if (dom.labelFilmThickness) dom.labelFilmThickness.textContent = `${bg.film.borderThickness} px`;
      }
      if (dom.filmPresetBtns) {
        dom.filmPresetBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filmstyle === bg.film.style));
      }
    }

    // Decoration Overlays
    if (dom.selectBgDecorationType) {
      const decType = (bg.decoration && bg.decoration.type) ? bg.decoration.type : 'none';
      dom.selectBgDecorationType.value = decType;
      if (dom.bgDecorationControls) {
        dom.bgDecorationControls.style.display = (decType !== 'none') ? 'block' : 'none';
      }
      if (dom.inputBgDecColor && bg.decoration) {
        dom.inputBgDecColor.value = bg.decoration.color || '#ffffff';
      }
      if (dom.sliderBgDecOpacity && bg.decoration) {
        const opVal = Math.round((bg.decoration.opacity !== undefined ? bg.decoration.opacity : 0.35) * 100);
        dom.sliderBgDecOpacity.value = opVal;
        if (dom.labelBgDecOpacity) dom.labelBgDecOpacity.textContent = `${opVal}%`;
      }
    }
  }

  // =========================================================================
  // Event Bindings
  // =========================================================================
  function bindEvents() {
    // Navigation Tabs Switching
    dom.navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.navTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = btn.dataset.tab;
        dom.drawerTabPanes.forEach(pane => {
          pane.style.display = pane.id === `pane-${targetTab.replace('tab-', '')}` ? 'flex' : 'none';
        });
      });
    });

    // Right Sidebar Tab Switching
    dom.tabBtnProperties.addEventListener('click', () => {
      dom.tabBtnProperties.classList.add('active');
      dom.tabBtnLayers.classList.remove('active');
      dom.propPaneInspector.style.display = 'block';
      dom.propPaneLayers.style.display = 'none';
    });

    dom.tabBtnLayers.addEventListener('click', () => {
      dom.tabBtnLayers.classList.add('active');
      dom.tabBtnProperties.classList.remove('active');
      dom.propPaneLayers.style.display = 'block';
      dom.propPaneInspector.style.display = 'none';
    });

    // Canvas Mouse & Viewport Deselection
    dom.mainCanvas.addEventListener('mousedown', handleCanvasMouseDown);
    dom.artboardWrapper.addEventListener('mousedown', handleCanvasMouseDown);

    // Clicking outside the artboard in the viewport deselects all layers
    dom.viewport.addEventListener('mousedown', (e) => {
      if (e.target === dom.viewport) {
        clearSelection();
      }
    });

    dom.mainCanvas.addEventListener('dragstart', (e) => e.preventDefault());
    dom.artboardWrapper.addEventListener('dragstart', (e) => e.preventDefault());
    if (dom.selectionOverlay) {
      dom.selectionOverlay.addEventListener('dragstart', (e) => e.preventDefault());
    }

    // Viewport and Window Drag & Drop
    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    dom.viewport.addEventListener('dragover', handleDragOver);
    dom.artboardWrapper.addEventListener('dragover', handleDragOver);

    const handleDrop = async (e) => {
      e.preventDefault();
      const rawData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);

      if (rawData) {
        if (rawData.startsWith('zzz-preset-text:')) {
          const preset = rawData.replace('zzz-preset-text:', '');
          addTextLayer(preset, x, y);
          return;
        }
        if (rawData.startsWith('zzz-shape:')) {
          const shape = rawData.replace('zzz-shape:', '');
          addShapeLayer(shape, x, y);
          return;
        }
        addStickerLayer(rawData, '贴图', x, y);
        return;
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => addStickerLayer(ev.target.result, file.name, x, y);
          reader.readAsDataURL(file);
        }
      }
    };

    dom.viewport.addEventListener('drop', handleDrop);
    dom.artboardWrapper.addEventListener('drop', handleDrop);

    // Zoom Controls
    dom.btnZoomIn.addEventListener('click', () => setZoom(state.zoom + 0.1));
    dom.btnZoomOut.addEventListener('click', () => setZoom(state.zoom - 0.1));
    dom.btnZoomFit.addEventListener('click', autoFitCanvas);
    if (dom.btnZoom100) dom.btnZoom100.addEventListener('click', () => setZoom(1.0));

    // Ruler Toggle Button
    if (dom.btnToggleRuler) {
      dom.btnToggleRuler.addEventListener('click', () => {
        state.showRulers = !state.showRulers;
        dom.btnToggleRuler.classList.toggle('active', state.showRulers);
        if (dom.labelRulerBtn) dom.labelRulerBtn.textContent = state.showRulers ? '标尺' : '标尺: 关';
        renderRulers();
        showToast(state.showRulers ? '已显示像素标尺' : '已隐藏像素标尺', 'info');
      });
    }

    if (dom.rulerCorner) {
      dom.rulerCorner.addEventListener('click', () => {
        state.showRulers = !state.showRulers;
        renderRulers();
      });
    }

    // Snapping Toggle Button
    if (dom.btnToggleSnap) {
      dom.btnToggleSnap.addEventListener('click', () => {
        state.snappingEnabled = !state.snappingEnabled;
        dom.btnToggleSnap.classList.toggle('active', state.snappingEnabled);
        showToast(state.snappingEnabled ? '已开启智能磁性吸附对齐' : '已关闭智能吸附', 'info');
      });
    }

    // Alignment Mask Select Dropdown
    if (dom.selectAlignmentMask) {
      dom.selectAlignmentMask.addEventListener('change', (e) => {
        state.activeAlignmentMask = e.target.value;
        renderAlignmentMask();
        showToast(`已切换构图蒙版: ${dom.selectAlignmentMask.options[dom.selectAlignmentMask.selectedIndex].text}`, 'info');
      });
    }

    dom.viewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        setZoom(state.zoom + delta);
      }
    }, { passive: false });

    // History controls & Canvas Clear
    dom.btnUndo.addEventListener('click', undo);
    dom.btnRedo.addEventListener('click', redo);
    dom.btnClearCanvas.addEventListener('click', () => {
      if (confirm('确认清空所有贴画与文字组件并重置画布为纯色背景吗？')) {
        state.layers = [];
        state.selectedLayerIds = [];
        state.background = {
          type: 'color',
          color: '#ffffff',
          gradient: { type: 'linear', angle: 135, color1: '#0f172a', color2: '#1e293b' },
          popdots: null,
          film: null,
          decoration: { type: 'none', color: '#ffffff', opacity: 0.35, scale: 1 },
          image: null,
          imageSrc: null,
          imageFit: 'cover',
          blur: 0,
          overlayOpacity: 0
        };
        ensureBackgroundState();
        syncBackgroundControls();
        recordHistory();
        renderCanvas();
        updateLayersUI();
        updateInspectorUI();
        showToast('画布贴画与组件已全部清空恢复纯色', 'info');
      }
    });

    if (dom.btnSaveDraft) {
      dom.btnSaveDraft.addEventListener('click', () => {
        saveAutoDraft();
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        showToast(`✨ 草稿已成功暂存！(${timeStr}) 随时刷新页面均可自动恢复`, 'success');

        const originalHtml = dom.btnSaveDraft.innerHTML;
        dom.btnSaveDraft.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
          <span style="color: #10b981; font-weight: 600;">已暂存</span>
        `;
        setTimeout(() => {
          dom.btnSaveDraft.innerHTML = originalHtml;
        }, 1500);
      });
    }

    // Size presets modal
    dom.btnSizeSelector.addEventListener('click', () => {
      dom.modalSizePresets.showModal();
    });

    document.querySelectorAll('.size-opt-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = parseInt(btn.dataset.w, 10);
        const h = parseInt(btn.dataset.h, 10);
        const name = btn.dataset.name;
        updateCanvasDimensions(w, h, name);
        recordHistory();
        dom.modalSizePresets.close();
      });
    });

    dom.btnApplyCustomSize.addEventListener('click', () => {
      const w = parseInt(dom.inputCustomW.value, 10) || 1200;
      const h = parseInt(dom.inputCustomH.value, 10) || 800;
      updateCanvasDimensions(w, h, `自定义 (${w}×${h})`);
      recordHistory();
      dom.modalSizePresets.close();
    });

    // Background Type Switching
    dom.bgTypeColor.addEventListener('click', () => { setBgType('color'); recordHistory(); renderCanvas(); });
    dom.bgTypeGradient.addEventListener('click', () => { setBgType('gradient'); recordHistory(); renderCanvas(); });
    if (dom.bgTypePopdots) dom.bgTypePopdots.addEventListener('click', () => { setBgType('popdots'); recordHistory(); renderCanvas(); });
    if (dom.bgTypeFilm) dom.bgTypeFilm.addEventListener('click', () => { setBgType('film'); recordHistory(); renderCanvas(); });
    dom.bgTypeImage.addEventListener('click', () => { setBgType('image'); recordHistory(); renderCanvas(); });

    // Pop-Art Polka Dots Swatches & Controls
    document.querySelectorAll('.pop-preset-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        ensureBackgroundState();
        state.background.type = 'popdots';
        state.background.popdots.bgColor = swatch.dataset.popbg || '#fbbf24';
        state.background.popdots.dotColor = swatch.dataset.popdot || '#18181b';
        state.background.popdots.pattern = swatch.dataset.poppattern || 'staggered';
        state.background.popdots.dotRadius = parseInt(swatch.dataset.popsize, 10) || 10;
        state.background.popdots.dotSpacing = parseInt(swatch.dataset.popspacing, 10) || 36;
        syncBackgroundControls();
        recordHistory();
        renderCanvas();
        showToast(`已应用【${swatch.title || '波普波点'}】风格！`, 'success');
      });
    });

    if (dom.inputPopBgColor) {
      dom.inputPopBgColor.addEventListener('input', (e) => {
        ensureBackgroundState();
        state.background.popdots.bgColor = e.target.value;
        renderCanvas();
      });
      dom.inputPopBgColor.addEventListener('change', recordHistory);
    }

    if (dom.inputPopDotColor) {
      dom.inputPopDotColor.addEventListener('input', (e) => {
        ensureBackgroundState();
        state.background.popdots.dotColor = e.target.value;
        renderCanvas();
      });
      dom.inputPopDotColor.addEventListener('change', recordHistory);
    }

    if (dom.selectPopPattern) {
      dom.selectPopPattern.addEventListener('change', (e) => {
        ensureBackgroundState();
        state.background.popdots.pattern = e.target.value;
        recordHistory();
        renderCanvas();
      });
    }

    if (dom.sliderPopDotSize) {
      dom.sliderPopDotSize.addEventListener('input', (e) => {
        ensureBackgroundState();
        const val = parseInt(e.target.value, 10) || 10;
        state.background.popdots.dotRadius = val;
        if (dom.labelPopDotSize) dom.labelPopDotSize.textContent = `${val} px`;
        renderCanvas();
      });
      dom.sliderPopDotSize.addEventListener('change', recordHistory);
    }

    if (dom.sliderPopDotSpacing) {
      dom.sliderPopDotSpacing.addEventListener('input', (e) => {
        ensureBackgroundState();
        const val = parseInt(e.target.value, 10) || 36;
        state.background.popdots.dotSpacing = val;
        if (dom.labelPopDotSpacing) dom.labelPopDotSpacing.textContent = `${val} px`;
        renderCanvas();
      });
      dom.sliderPopDotSpacing.addEventListener('change', recordHistory);
    }

    // Cartoon Film Preset Buttons & Controls
    document.querySelectorAll('.film-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ensureBackgroundState();
        state.background.type = 'film';
        state.background.film.style = btn.dataset.filmstyle || 'cinema-h';
        syncBackgroundControls();
        recordHistory();
        renderCanvas();
        showToast(`已应用【${btn.textContent.trim()}】画框！`, 'success');
      });
    });

    if (dom.inputFilmFrameColor) {
      dom.inputFilmFrameColor.addEventListener('input', (e) => {
        ensureBackgroundState();
        state.background.film.frameColor = e.target.value;
        renderCanvas();
      });
      dom.inputFilmFrameColor.addEventListener('change', recordHistory);
    }

    if (dom.inputFilmInnerColor) {
      dom.inputFilmInnerColor.addEventListener('input', (e) => {
        ensureBackgroundState();
        state.background.film.innerColor = e.target.value;
        renderCanvas();
      });
      dom.inputFilmInnerColor.addEventListener('change', recordHistory);
    }

    if (dom.inputFilmLabel) {
      dom.inputFilmLabel.addEventListener('input', (e) => {
        ensureBackgroundState();
        state.background.film.textLabel = e.target.value;
        renderCanvas();
      });
      dom.inputFilmLabel.addEventListener('change', recordHistory);
    }

    if (dom.inputFilmNumber) {
      dom.inputFilmNumber.addEventListener('input', (e) => {
        ensureBackgroundState();
        state.background.film.frameNumber = e.target.value;
        renderCanvas();
      });
      dom.inputFilmNumber.addEventListener('change', recordHistory);
    }

    if (dom.sliderFilmThickness) {
      dom.sliderFilmThickness.addEventListener('input', (e) => {
        ensureBackgroundState();
        const val = parseInt(e.target.value, 10) || 90;
        state.background.film.borderThickness = val;
        if (dom.labelFilmThickness) dom.labelFilmThickness.textContent = `${val} px`;
        renderCanvas();
      });
      dom.sliderFilmThickness.addEventListener('change', recordHistory);
    }

    // Universal Background Decoration Controls
    if (dom.selectBgDecorationType) {
      dom.selectBgDecorationType.addEventListener('change', (e) => {
        ensureBackgroundState();
        state.background.decoration.type = e.target.value;
        if (dom.bgDecorationControls) {
          dom.bgDecorationControls.style.display = (e.target.value !== 'none') ? 'block' : 'none';
        }
        recordHistory();
        renderCanvas();
      });
    }

    if (dom.inputBgDecColor) {
      dom.inputBgDecColor.addEventListener('input', (e) => {
        ensureBackgroundState();
        state.background.decoration.color = e.target.value;
        renderCanvas();
      });
      dom.inputBgDecColor.addEventListener('change', recordHistory);
    }

    if (dom.sliderBgDecOpacity) {
      dom.sliderBgDecOpacity.addEventListener('input', (e) => {
        ensureBackgroundState();
        const val = parseInt(e.target.value, 10) / 100;
        state.background.decoration.opacity = val;
        if (dom.labelBgDecOpacity) dom.labelBgDecOpacity.textContent = `${Math.round(val * 100)}%`;
        renderCanvas();
      });
      dom.sliderBgDecOpacity.addEventListener('change', recordHistory);
    }

    // Solid Color Swatches
    document.querySelectorAll('.color-swatch[data-color]').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.color;
        state.background.color = color;
        dom.inputBgColor.value = color;
        dom.inputBgColorHex.value = color;
        setBgType('color');
        recordHistory();
        renderCanvas();
      });
    });

    dom.inputBgColor.addEventListener('input', (e) => {
      state.background.color = e.target.value;
      dom.inputBgColorHex.value = e.target.value;
      state.background.type = 'color';
      renderCanvas();
    });
    dom.inputBgColor.addEventListener('change', recordHistory);

    // Gradient Swatches
    document.querySelectorAll('.color-swatch[data-grad]').forEach(swatch => {
      swatch.addEventListener('click', () => {
        ensureBackgroundState();
        const [c1, c2] = swatch.dataset.grad.split(',');
        state.background.gradient.color1 = c1;
        state.background.gradient.color2 = c2;
        dom.inputGradColor1.value = c1;
        dom.inputGradColor2.value = c2;
        state.background.type = 'gradient';
        dom.bgTypeGradient.classList.add('active');
        dom.bgTypeColor.classList.remove('active');
        dom.bgTypeImage.classList.remove('active');
        dom.bgGradientSettings.style.display = 'block';
        dom.bgColorSettings.style.display = 'none';
        dom.bgImageSettings.style.display = 'none';
        recordHistory();
        renderCanvas();
      });
    });

    dom.inputGradColor1.addEventListener('input', (e) => {
      ensureBackgroundState();
      state.background.type = 'gradient';
      state.background.gradient.color1 = e.target.value;
      renderCanvas();
    });
    dom.inputGradColor1.addEventListener('change', recordHistory);

    dom.inputGradColor2.addEventListener('input', (e) => {
      ensureBackgroundState();
      state.background.type = 'gradient';
      state.background.gradient.color2 = e.target.value;
      renderCanvas();
    });
    dom.inputGradColor2.addEventListener('change', recordHistory);

    dom.sliderGradAngle.addEventListener('input', (e) => {
      ensureBackgroundState();
      state.background.type = 'gradient';
      state.background.gradient.angle = parseInt(e.target.value, 10);
      dom.labelGradAngle.textContent = `${state.background.gradient.angle}°`;
      renderCanvas();
    });
    dom.sliderGradAngle.addEventListener('change', recordHistory);

    // Background Image Upload & Blur
    dom.btnUploadBgImg.addEventListener('click', () => dom.fileBgImg.click());
    dom.fileBgImg.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const img = await preloadImage(ev.target.result);
        state.background.image = img;
        state.background.imageSrc = ev.target.result;
        state.background.type = 'image';
        dom.bgTypeImage.click();
        recordHistory();
        renderCanvas();
      };
      reader.readAsDataURL(file);
    });

    dom.selectBgFit.addEventListener('change', (e) => {
      state.background.imageFit = e.target.value;
      recordHistory();
      renderCanvas();
    });

    dom.btnRemoveBgImg.addEventListener('click', () => {
      state.background.image = null;
      state.background.imageSrc = null;
      state.background.type = 'color';
      dom.bgTypeColor.click();
      recordHistory();
      renderCanvas();
      showToast('已清除背景图片，恢复纯色背景', 'info');
    });

    // Gaussian Blur
    dom.sliderBgBlur.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.background.blur = val;
      dom.labelBgBlur.textContent = `${val} px`;
      renderCanvas();
    });
    dom.sliderBgBlur.addEventListener('change', recordHistory);

    // Background Tint
    dom.sliderBgOverlay.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) / 100;
      state.background.overlayOpacity = val;
      dom.labelBgOverlay.textContent = `${Math.round(val * 100)}%`;
      renderCanvas();
    });
    dom.sliderBgOverlay.addEventListener('change', recordHistory);

    // Text Preset Cards Click & Drag-and-Drop
    if (dom.btnAddCustomText) {
      dom.btnAddCustomText.setAttribute('draggable', 'true');
      dom.btnAddCustomText.addEventListener('click', () => addTextLayer('main-title'));
      dom.btnAddCustomText.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'zzz-preset-text:main-title');
        e.dataTransfer.effectAllowed = 'copy';
      });
    }

    document.querySelectorAll('.text-preset-card[data-preset]').forEach(card => {
      card.setAttribute('draggable', 'true');
      card.addEventListener('click', () => addTextLayer(card.dataset.preset));
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'zzz-preset-text:' + card.dataset.preset);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });

    // Shapes Cards Click & Drag-and-Drop
    document.querySelectorAll('[data-shape]').forEach(btn => {
      btn.setAttribute('draggable', 'true');
      btn.addEventListener('click', () => addShapeLayer(btn.dataset.shape));
      btn.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'zzz-shape:' + btn.dataset.shape);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });

    // Custom Uploads
    dom.dropZoneUpload.addEventListener('click', () => dom.fileCustomUpload.click());
    dom.fileCustomUpload.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target.result;
          state.customUploads.push({ name: file.name, src: src });
          renderCustomUploads();
          addStickerLayer(src, file.name);
        };
        reader.readAsDataURL(file);
      });
    });

    // Property Inspector Form Inputs
    if (dom.btnLockAspectRatio) {
      dom.btnLockAspectRatio.addEventListener('click', () => {
        state.lockAspectRatio = !state.lockAspectRatio;
        updateAspectRatioLockUI();
        updateSelectionOverlay();
      });
    }

    dom.propWidth.addEventListener('input', (e) => {
      const selected = getSelectedLayers();
      if (selected.length === 1) {
        const layer = selected[0];
        const newW = Math.max(10, parseInt(e.target.value, 10) || 10);
        if (state.lockAspectRatio && layer.width > 0 && layer.height > 0) {
          const ratio = layer.height / layer.width;
          const newH = Math.max(10, Math.round(newW * ratio));
          layer.width = newW;
          layer.height = newH;
          if (dom.propHeight) dom.propHeight.value = newH;
        } else {
          layer.width = newW;
        }
        renderCanvas();
      }
    });
    dom.propWidth.addEventListener('change', recordHistory);

    dom.propHeight.addEventListener('input', (e) => {
      const selected = getSelectedLayers();
      if (selected.length === 1) {
        const layer = selected[0];
        const newH = Math.max(10, parseInt(e.target.value, 10) || 10);
        if (state.lockAspectRatio && layer.width > 0 && layer.height > 0) {
          const ratio = layer.width / layer.height;
          const newW = Math.max(10, Math.round(newH * ratio));
          layer.height = newH;
          layer.width = newW;
          if (dom.propWidth) dom.propWidth.value = newW;
        } else {
          layer.height = newH;
        }
        renderCanvas();
      }
    });
    dom.propHeight.addEventListener('change', recordHistory);

    dom.propRotation.addEventListener('input', (e) => {
      const selected = getSelectedLayers();
      if (selected.length === 1) {
        selected[0].rotation = parseInt(e.target.value, 10) || 0;
        renderCanvas();
      }
    });
    dom.propRotation.addEventListener('change', recordHistory);

    dom.propOpacity.addEventListener('input', (e) => {
      const selected = getSelectedLayers();
      const val = (parseInt(e.target.value, 10) || 0) / 100;
      for (const s of selected) {
        s.opacity = val;
      }
      renderCanvas();
    });
    dom.propOpacity.addEventListener('change', recordHistory);

    // Text Inspector Inputs
    dom.propTextContent.addEventListener('input', (e) => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') {
        s.text = e.target.value;
        s.name = s.text.slice(0, 10) || '文本';
        const dims = calculateTextLayerDimensions(s);
        s.width = dims.width;
        s.height = dims.height;
        renderCanvas();
        updateLayersUI();
      }
    });
    dom.propTextContent.addEventListener('change', recordHistory);

    dom.propTextFont.addEventListener('change', (e) => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') {
        s.fontFamily = e.target.value;
        const dims = calculateTextLayerDimensions(s);
        s.width = dims.width;
        s.height = dims.height;
        recordHistory();
        renderCanvas();
      }
    });

    dom.propTextSize.addEventListener('input', (e) => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') {
        s.fontSize = parseInt(e.target.value, 10) || 12;
        const dims = calculateTextLayerDimensions(s);
        s.width = dims.width;
        s.height = dims.height;
        renderCanvas();
      }
    });
    dom.propTextSize.addEventListener('change', recordHistory);

    dom.propTextColor.addEventListener('input', (e) => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') { s.fillColor = e.target.value; renderCanvas(); }
    });
    dom.propTextColor.addEventListener('change', recordHistory);

    dom.propTextStrokeColor.addEventListener('input', (e) => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') {
        s.strokeColor = e.target.value;
        if (!s.strokeWidth || s.strokeWidth === 0) {
          s.strokeWidth = 4;
          if (dom.propTextStrokeWidth) dom.propTextStrokeWidth.value = 4;
        }
        updateInspectorFields();
        renderCanvas();
      }
    });
    dom.propTextStrokeColor.addEventListener('change', recordHistory);

    dom.propTextStrokeWidth.addEventListener('input', (e) => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') {
        s.strokeWidth = parseInt(e.target.value, 10) || 0;
        if (!s.strokeColor || s.strokeColor === 'transparent') {
          s.strokeColor = dom.propTextStrokeColor ? dom.propTextStrokeColor.value : '#000000';
        }
        updateInspectorFields();
        renderCanvas();
      }
    });
    dom.propTextStrokeWidth.addEventListener('change', recordHistory);

    // Stroke Quick Preset Buttons
    const setStrokeWidth = (w) => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') {
        s.strokeWidth = w;
        if (w > 0 && (!s.strokeColor || s.strokeColor === 'transparent')) {
          s.strokeColor = dom.propTextStrokeColor ? dom.propTextStrokeColor.value : '#000000';
        }
        updateInspectorFields();
        recordHistory();
        renderCanvas();
      }
    };

    if (document.getElementById('btn-stroke-0')) document.getElementById('btn-stroke-0').onclick = () => setStrokeWidth(0);
    if (document.getElementById('btn-stroke-2')) document.getElementById('btn-stroke-2').onclick = () => setStrokeWidth(2);
    if (document.getElementById('btn-stroke-6')) document.getElementById('btn-stroke-6').onclick = () => setStrokeWidth(6);
    if (document.getElementById('btn-stroke-12')) document.getElementById('btn-stroke-12').onclick = () => setStrokeWidth(12);

    dom.propTextBgFill.addEventListener('input', (e) => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') { s.bgFill = e.target.value; renderCanvas(); }
    });
    dom.propTextBgFill.addEventListener('change', recordHistory);

    dom.btnToggleTextBg.addEventListener('click', () => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') {
        s.bgFill = s.bgFill ? null : dom.propTextBgFill.value;
        s.bgRadius = 14;
        updateInspectorFields();
        recordHistory();
        renderCanvas();
      }
    });

    // Text Alignments
    dom.btnTextAlignLeft.addEventListener('click', () => setTextAlign('left'));
    dom.btnTextAlignCenter.addEventListener('click', () => setTextAlign('center'));
    dom.btnTextAlignRight.addEventListener('click', () => setTextAlign('right'));

    function setTextAlign(align) {
      const s = getSelectedLayer();
      if (s && s.type === 'text') {
        s.align = align;
        dom.btnTextAlignLeft.classList.toggle('active', align === 'left');
        dom.btnTextAlignCenter.classList.toggle('active', align === 'center');
        dom.btnTextAlignRight.classList.toggle('active', align === 'right');
        recordHistory();
        renderCanvas();
      }
    }

    // Text Shadow & Pop-Art Halftone Controls
    if (dom.propTextShadowType) {
      dom.propTextShadowType.addEventListener('change', (e) => {
        const s = getSelectedLayer();
        if (s && s.type === 'text') {
          s.shadowType = e.target.value;
          if (s.shadowType === 'halftone') {
            if (!s.shadowColor) s.shadowColor = '#334155';
            if (s.shadowOffset === undefined) s.shadowOffset = 8;
            if (!s.halftoneType) s.halftoneType = 'dots';
            if (!s.halftoneSpacing) s.halftoneSpacing = 6;
            if (!s.halftoneSize) s.halftoneSize = 2.2;
          } else if (s.shadowType === 'solid') {
            if (!s.shadowColor) s.shadowColor = '#000000';
            if (s.shadowOffset === undefined) s.shadowOffset = 8;
          } else if (s.shadowType === 'glow') {
            if (!s.shadowColor) s.shadowColor = '#38bdf8';
            if (!s.shadowBlur) s.shadowBlur = 18;
          }
          const dims = calculateTextLayerDimensions(s);
          s.width = dims.width;
          s.height = dims.height;
          updateInspectorFields();
          recordHistory();
          renderCanvas();
        }
      });
    }

    if (dom.propTextShadowColor) {
      dom.propTextShadowColor.addEventListener('input', (e) => {
        const s = getSelectedLayer();
        if (s && s.type === 'text') {
          s.shadowColor = e.target.value;
          renderCanvas();
        }
      });
      dom.propTextShadowColor.addEventListener('change', recordHistory);
    }

    if (dom.propTextHalftoneType) {
      dom.propTextHalftoneType.addEventListener('change', (e) => {
        const s = getSelectedLayer();
        if (s && s.type === 'text') {
          s.halftoneType = e.target.value;
          recordHistory();
          renderCanvas();
        }
      });
    }

    if (dom.sliderTextShadowOffset) {
      dom.sliderTextShadowOffset.addEventListener('input', (e) => {
        const s = getSelectedLayer();
        if (s && s.type === 'text') {
          const val = parseInt(e.target.value, 10) || 8;
          s.shadowOffset = val;
          s.shadowOffsetX = val;
          s.shadowOffsetY = val;
          if (dom.labelTextShadowOffset) dom.labelTextShadowOffset.textContent = `${val} px`;
          const dims = calculateTextLayerDimensions(s);
          s.width = dims.width;
          s.height = dims.height;
          renderCanvas();
        }
      });
      dom.sliderTextShadowOffset.addEventListener('change', recordHistory);
    }

    const setHalftoneDensity = (spacing, size) => {
      const s = getSelectedLayer();
      if (s && s.type === 'text') {
        s.halftoneSpacing = spacing;
        s.halftoneSize = size;
        updateInspectorFields();
        recordHistory();
        renderCanvas();
      }
    };
    if (dom.btnHalftoneDense) dom.btnHalftoneDense.onclick = () => setHalftoneDensity(4, 1.5);
    if (dom.btnHalftoneNormal) dom.btnHalftoneNormal.onclick = () => setHalftoneDensity(6, 2.2);
    if (dom.btnHalftoneCoarse) dom.btnHalftoneCoarse.onclick = () => setHalftoneDensity(9, 3.2);

    // Quick Text Style Presets
    if (dom.btnPresetComicHares) {
      dom.btnPresetComicHares.addEventListener('click', () => {
        const s = getSelectedLayer();
        if (s && s.type === 'text') {
          s.fillColor = '#ffffff';
          s.strokeColor = '#000000';
          s.strokeWidth = 8;
          s.shadowType = 'halftone';
          s.shadowColor = '#334155';
          s.shadowOffset = 8;
          s.halftoneType = 'dots';
          s.halftoneSpacing = 6;
          s.halftoneSize = 2.2;
          s.fontWeight = '900';
          const dims = calculateTextLayerDimensions(s);
          s.width = dims.width;
          s.height = dims.height;
          updateInspectorFields();
          recordHistory();
          renderCanvas();
          showToast('已应用【狡兔屋波普灰色网点】风格！', 'success');
        }
      });
    }

    if (dom.btnPresetCyberGlow) {
      dom.btnPresetCyberGlow.addEventListener('click', () => {
        const s = getSelectedLayer();
        if (s && s.type === 'text') {
          s.fillColor = '#ffffff';
          s.strokeColor = '#0284c7';
          s.strokeWidth = 3;
          s.shadowType = 'glow';
          s.shadowColor = '#38bdf8';
          s.shadowBlur = 20;
          const dims = calculateTextLayerDimensions(s);
          s.width = dims.width;
          s.height = dims.height;
          updateInspectorFields();
          recordHistory();
          renderCanvas();
          showToast('已应用【赛博霓虹发光】风格！', 'success');
        }
      });
    }

    // Canvas Alignments (Supports Single & Multi-Selection)
    document.getElementById('btn-align-left').onclick = () => alignSelectedLayers('left');
    document.getElementById('btn-align-center-h').onclick = () => alignSelectedLayers('center-h');
    document.getElementById('btn-align-right').onclick = () => alignSelectedLayers('right');
    document.getElementById('btn-align-top').onclick = () => alignSelectedLayers('top');
    document.getElementById('btn-align-center-v').onclick = () => alignSelectedLayers('center-v');
    document.getElementById('btn-align-bottom').onclick = () => alignSelectedLayers('bottom');

    function alignSelectedLayers(type) {
      const selected = getSelectedLayers();
      if (selected.length === 0) return;

      if (selected.length === 1) {
        const s = selected[0];
        if (type === 'left') s.x = s.width / 2;
        if (type === 'center-h') s.x = state.canvasWidth / 2;
        if (type === 'right') s.x = state.canvasWidth - s.width / 2;
        if (type === 'top') s.y = s.height / 2;
        if (type === 'center-v') s.y = state.canvasHeight / 2;
        if (type === 'bottom') s.y = state.canvasHeight - s.height / 2;
      } else {
        const groupAABB = getGroupAABB(selected);
        if (!groupAABB) return;

        for (const s of selected) {
          if (type === 'left') s.x = groupAABB.minX + s.width / 2;
          if (type === 'center-h') s.x = groupAABB.x;
          if (type === 'right') s.x = groupAABB.maxX - s.width / 2;
          if (type === 'top') s.y = groupAABB.minY + s.height / 2;
          if (type === 'center-v') s.y = groupAABB.y;
          if (type === 'bottom') s.y = groupAABB.maxY - s.height / 2;
        }
      }

      recordHistory();
      renderCanvas();
      updateInspectorFields();
    }

    // Shape inspector inputs (guarded for backward compatibility)
    if (dom.propShapeFill) {
      dom.propShapeFill.addEventListener('input', (e) => {
        const s = getSelectedLayer();
        if (s && s.type === 'shape') { s.fillColor = e.target.value; renderCanvas(); }
      });
      dom.propShapeFill.addEventListener('change', recordHistory);
    }

    if (dom.propShapeStroke) {
      dom.propShapeStroke.addEventListener('input', (e) => {
        const s = getSelectedLayer();
        if (s && s.type === 'shape') { s.strokeColor = e.target.value; renderCanvas(); }
      });
      dom.propShapeStroke.addEventListener('change', recordHistory);
    }

    if (dom.propShapeStrokeWidth) {
      dom.propShapeStrokeWidth.addEventListener('input', (e) => {
        const s = getSelectedLayer();
        if (s && s.type === 'shape') { s.strokeWidth = parseInt(e.target.value, 10) || 0; renderCanvas(); }
      });
      dom.propShapeStrokeWidth.addEventListener('change', recordHistory);
    }

    if (dom.propShapeRadius) {
      dom.propShapeRadius.addEventListener('input', (e) => {
        const s = getSelectedLayer();
        if (s && s.type === 'shape') { s.borderRadius = parseInt(e.target.value, 10) || 0; renderCanvas(); }
      });
      dom.propShapeRadius.addEventListener('change', recordHistory);
    }

    // Fixed Top Contextual Action Bar buttons
    if (dom.ctxBtnTop) {
      dom.ctxBtnTop.addEventListener('click', () => {
        const selected = getSelectedLayers();
        if (selected.length > 1) moveSelectedLayersToTop();
        else if (selected.length === 1) moveLayerToTop(selected[0].id);
      });
    }
    if (dom.ctxBtnBottom) {
      dom.ctxBtnBottom.addEventListener('click', () => {
        const selected = getSelectedLayers();
        if (selected.length > 1) moveSelectedLayersToBottom();
        else if (selected.length === 1) moveLayerToBottom(selected[0].id);
      });
    }
    if (dom.ctxBtnDup) {
      dom.ctxBtnDup.addEventListener('click', () => {
        const selected = getSelectedLayers();
        if (selected.length > 1) duplicateSelectedLayers();
        else if (selected.length === 1) duplicateLayer(selected[0].id);
      });
    }
    if (dom.ctxBtnDel) {
      dom.ctxBtnDel.addEventListener('click', () => {
        const selected = getSelectedLayers();
        if (selected.length > 1) deleteSelectedLayers();
        else if (selected.length === 1) deleteLayer(selected[0].id);
      });
    }

    // Inspector Action buttons
    if (dom.btnPropBringFront) {
      dom.btnPropBringFront.addEventListener('click', () => {
        if (state.selectedLayerIds.length > 1) moveSelectedLayersToTop();
        else if (state.selectedLayerId) moveLayerToTop(state.selectedLayerId);
      });
    }
    if (dom.btnPropSendBack) {
      dom.btnPropSendBack.addEventListener('click', () => {
        if (state.selectedLayerIds.length > 1) moveSelectedLayersToBottom();
        else if (state.selectedLayerId) moveLayerToBottom(state.selectedLayerId);
      });
    }
    dom.btnPropDuplicate.addEventListener('click', () => {
      if (state.selectedLayerIds.length > 1) duplicateSelectedLayers();
      else if (state.selectedLayerId) duplicateLayer(state.selectedLayerId);
    });
    dom.btnPropDelete.addEventListener('click', () => {
      if (state.selectedLayerIds.length > 1) deleteSelectedLayers();
      else if (state.selectedLayerId) deleteLayer(state.selectedLayerId);
    });
    dom.btnFlipH.addEventListener('click', () => {
      if (state.selectedLayerIds.length > 1) flipSelectedLayersH();
      else if (state.selectedLayerId) toggleFlipH(state.selectedLayerId);
    });
    dom.btnFlipV.addEventListener('click', () => {
      if (state.selectedLayerId) toggleFlipV(state.selectedLayerId);
    });
    if (dom.btnLayerUp) {
      dom.btnLayerUp.addEventListener('click', () => {
        if (state.selectedLayerId) moveLayerUp(state.selectedLayerId);
      });
    }
    if (dom.btnLayerDown) {
      dom.btnLayerDown.addEventListener('click', () => {
        if (state.selectedLayerId) moveLayerDown(state.selectedLayerId);
      });
    }
    if (dom.btnLockAllLayers) {
      dom.btnLockAllLayers.addEventListener('click', () => {
        if (state.layers.length === 0) {
          showToast('画布中暂无贴画与组件', 'info');
          return;
        }
        const allLocked = state.layers.every(l => l.locked);
        const targetState = !allLocked;
        state.layers.forEach(l => l.locked = targetState);
        recordHistory();
        updateLayersUI();
        updateSelectionOverlay();
        showToast(targetState ? '已锁定全部贴画（防止误触拖动）' : '已解锁全部贴画', 'info');
      });
    }

    // Export & Copy Modal
    dom.btnOpenExport.addEventListener('click', () => {
      updateExportResLabel();
      dom.modalExport.showModal();
    });

    // Dedicated Project Management Modal
    if (dom.btnOpenProjectModal) {
      dom.btnOpenProjectModal.addEventListener('click', () => {
        if (dom.inputProjectName) dom.inputProjectName.value = state.projectTitle || '绝区零海报作品';
        dom.modalProject.showModal();
      });
    }

    // About Information Modal
    if (dom.btnOpenAboutModal && dom.modalAbout) {
      dom.btnOpenAboutModal.addEventListener('click', () => {
        dom.modalAbout.showModal();
      });
    }

    dom.btnCopyClipboard.addEventListener('click', copyCanvasToClipboard);

    // Export Format Toggles
    dom.exportFmtPng.addEventListener('click', () => setExportFormat('image/png', 'png'));
    dom.exportFmtJpg.addEventListener('click', () => setExportFormat('image/jpeg', 'jpg'));
    dom.exportFmtWebp.addEventListener('click', () => setExportFormat('image/webp', 'webp'));

    function setExportFormat(fmt, ext) {
      state.exportSettings.format = fmt;
      state.exportSettings.ext = ext;
      dom.exportFmtPng.classList.toggle('active', ext === 'png');
      dom.exportFmtJpg.classList.toggle('active', ext === 'jpg');
      dom.exportFmtWebp.classList.toggle('active', ext === 'webp');
    }

    // Export Scale Toggles
    dom.exportScale1.addEventListener('click', () => setExportScale(1));
    dom.exportScale2.addEventListener('click', () => setExportScale(2));
    dom.exportScale3.addEventListener('click', () => setExportScale(3));

    function setExportScale(scale) {
      state.exportSettings.scale = scale;
      dom.exportScale1.classList.toggle('active', scale === 1);
      dom.exportScale2.classList.toggle('active', scale === 2);
      dom.exportScale3.classList.toggle('active', scale === 3);
      updateExportResLabel();
    }

    dom.btnDoDownload.addEventListener('click', downloadExportImage);

    // Project Save / Load (.zzzposter / .json v2.0)
    dom.btnSaveProject.addEventListener('click', saveProjectJSON);
    dom.btnLoadProjectTrigger.addEventListener('click', () => dom.fileLoadProject.click());
    dom.fileLoadProject.addEventListener('change', loadProjectJSON);
  }

  function renderCustomUploads() {
    if (state.customUploads.length === 0) {
      dom.customUploadsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); font-size: 12px; padding: 12px 0;">暂无自定义素材</div>';
      return;
    }
    dom.customUploadsGrid.innerHTML = state.customUploads.map(item => `
      <div class="sticker-item" data-src="${item.src}" title="${item.name}">
        <img src="${item.src}" alt="${item.name}">
      </div>
    `).join('');
    dom.customUploadsGrid.querySelectorAll('.sticker-item').forEach(el => {
      el.addEventListener('click', () => addStickerLayer(el.dataset.src, el.title));
    });
  }

  function updateExportResLabel() {
    const scale = state.exportSettings.scale;
    const w = state.canvasWidth * scale;
    const h = state.canvasHeight * scale;
    if (dom.exportResLabel) {
      dom.exportResLabel.textContent = `导出分辨率: ${w} × ${h} px`;
    }
  }

  // =========================================================================
  // Keyboard Shortcuts
  // =========================================================================
  function bindShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAllLayers();
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dom.btnSaveDraft) dom.btnSaveDraft.click();
        else {
          saveAutoDraft();
          showToast('✨ 草稿已成功暂存！', 'success');
        }
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedLayerIds.length > 0) {
          e.preventDefault();
          deleteSelectedLayers();
        }
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'd') {
        if (state.selectedLayerIds.length > 0) {
          e.preventDefault();
          duplicateSelectedLayers();
        }
      } else if (e.key === 'Escape') {
        clearSelection();
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const selected = getSelectedLayers();
        if (selected.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          for (const s of selected) {
            if (e.key === 'ArrowLeft') s.x -= step;
            if (e.key === 'ArrowRight') s.x += step;
            if (e.key === 'ArrowUp') s.y -= step;
            if (e.key === 'ArrowDown') s.y += step;
          }
          renderCanvas();
          updateInspectorFields();
        }
      }
    });
  }

  // =========================================================================
  // High-Resolution Exporting & Clipboard
  // =========================================================================
  function generateHighResCanvas() {
    const scale = (state.exportSettings && state.exportSettings.scale) || 2;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = state.canvasWidth * scale;
    offCanvas.height = state.canvasHeight * scale;
    const offCtx = offCanvas.getContext('2d');

    offCtx.scale(scale, scale);
    drawBackground(offCtx, state.canvasWidth, state.canvasHeight);

    for (const layer of state.layers) {
      if (!layer.visible) continue;
      drawLayer(offCtx, layer);
    }

    return offCanvas;
  }

  function downloadExportImage() {
    try {
      const canvas = generateHighResCanvas();
      const fmt = (state.exportSettings && state.exportSettings.format) || 'image/png';
      const ext = (state.exportSettings && state.exportSettings.ext) || 'png';

      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `ZZZ_Poster_${Date.now()}.${ext}`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            if (dom.modalExport) dom.modalExport.close();
            showToast('海报已开始下载！', 'success');
          } else {
            fallbackDataUrlDownload(canvas, fmt, ext);
          }
        }, fmt, 0.95);
      } else {
        fallbackDataUrlDownload(canvas, fmt, ext);
      }
    } catch (err) {
      console.error('[ExportDownloadError]', err);
      showToast('导出图片失败：' + (err.message || '画布跨域或受限'), 'danger');
    }
  }

  function fallbackDataUrlDownload(canvas, fmt, ext) {
    try {
      const dataUrl = canvas.toDataURL(fmt, 0.95);
      const link = document.createElement('a');
      link.download = `ZZZ_Poster_${Date.now()}.${ext}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (dom.modalExport) dom.modalExport.close();
      showToast('海报已开始下载！', 'success');
    } catch (e) {
      console.error('DataURL download failed:', e);
      showToast('导出失败：若使用本地 file:// 打开，请使用 python start.py 启动服务', 'warning');
    }
  }

  async function copyCanvasToClipboard() {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error('当前环境不支持直接剪贴板写入');
      }

      const canvas = generateHighResCanvas();
      
      const blob = await new Promise((resolve, reject) => {
        try {
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('生成图像数据失败'));
          }, 'image/png');
        } catch (e) {
          reject(e);
        }
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('已复制高清图片到剪贴板！可以直接粘贴', 'success');
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      showToast('浏览器安全限制：已自动为您转为一键下载高清海报！', 'info');
      try {
        downloadExportImage();
      } catch (e) {
        showToast('请在右上角点击“导出图片”下载', 'warning');
      }
    }
  }

  // =========================================================================
  // Project Save / Load JSON (v2.0 Specification)
  // =========================================================================
  function saveProjectJSON() {
    try {
      ensureBackgroundState();

      if (dom.inputProjectName && dom.inputProjectName.value.trim()) {
        state.projectTitle = dom.inputProjectName.value.trim();
      }
      
      let thumbnailDataUrl = null;
      try {
        const thumbCanvas = document.createElement('canvas');
        const thumbScale = 300 / Math.max(state.canvasWidth, state.canvasHeight);
        thumbCanvas.width = Math.round(state.canvasWidth * thumbScale);
        thumbCanvas.height = Math.round(state.canvasHeight * thumbScale);
        const thumbCtx = thumbCanvas.getContext('2d');
        thumbCtx.scale(thumbScale, thumbScale);
        drawBackground(thumbCtx, state.canvasWidth, state.canvasHeight);
        for (const layer of state.layers) {
          if (layer.visible) drawLayer(thumbCtx, layer);
        }
        thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);
      } catch (thumbErr) {
        console.warn('Thumbnail generation skipped:', thumbErr);
      }

      const project = {
        $schema: 'https://zzz-poster-studio.app/schemas/project-v2.json',
        version: '2.0.0',
        app: 'ZZZ Poster Studio',
        id: generateId('proj'),
        metadata: {
          title: state.projectTitle || '绝区零海报作品',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          targetPlatform: state.currentPresetName
        },
        canvas: {
          width: state.canvasWidth,
          height: state.canvasHeight,
          presetName: state.currentPresetName,
          dpi: 72
        },
        background: {
          type: state.background.type,
          color: state.background.color,
          gradient: state.background.gradient,
          popdots: state.background.popdots,
          film: state.background.film,
          decoration: state.background.decoration,
          image: {
            src: state.background.imageSrc,
            fit: state.background.imageFit || 'cover'
          },
          effects: {
            blur: state.background.blur || 0,
            overlayOpacity: state.background.overlayOpacity || 0
          }
        },
        layers: state.layers.map(l => {
          const copy = { ...l };
          delete copy.img;
          return copy;
        }),
        previewThumbnail: thumbnailDataUrl
      };

      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${(state.projectTitle || 'ZZZ_Project').replace(/\s+/g, '_')}_${Date.now()}.zzzposter`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      if (dom.modalProject) dom.modalProject.close();
      showToast('工程文件 (.zzzposter) 已成功导出保存！', 'success');
    } catch (err) {
      console.error('[ProjectSaveError]', err);
      showToast('保存失败：' + (err.message || err), 'danger');
    }
  }

  function loadProjectJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const project = JSON.parse(ev.target.result);
        
        const canvasW = project.canvas ? project.canvas.width : project.canvasWidth;
        const canvasH = project.canvas ? project.canvas.height : project.canvasHeight;
        const presetName = project.canvas ? project.canvas.presetName : (project.presetName || '自定义工程');

        if (canvasW && canvasH) {
          updateCanvasDimensions(canvasW, canvasH, presetName);
          
          if (project.metadata && project.metadata.title) {
            state.projectTitle = project.metadata.title;
            if (dom.inputProjectName) dom.inputProjectName.value = state.projectTitle;
          }

          // Restore background
          if (project.background) {
            state.background.type = project.background.type || 'color';
            state.background.color = project.background.color || '#f8fafc';
            state.background.popdots = project.background.popdots;
            state.background.film = project.background.film;
            state.background.decoration = project.background.decoration;
            
            if (project.background.gradient) {
              state.background.gradient = {
                type: project.background.gradient.type || 'linear',
                angle: project.background.gradient.angle !== undefined ? project.background.gradient.angle : 135,
                color1: project.background.gradient.color1 || '#0f172a',
                color2: project.background.gradient.color2 || '#1e293b'
              };
            }
            
            if (project.background.image && project.background.image.src) {
              state.background.imageSrc = project.background.image.src;
              state.background.imageFit = project.background.image.fit || 'cover';
              state.background.image = await preloadImage(project.background.image.src);
            } else if (project.background.imageSrc) {
              state.background.imageSrc = project.background.imageSrc;
              state.background.image = await preloadImage(project.background.imageSrc);
            }

            if (project.background.effects) {
              state.background.blur = project.background.effects.blur || 0;
              state.background.overlayOpacity = project.background.effects.overlayOpacity || 0;
            } else {
              state.background.blur = project.background.blur || 0;
              state.background.overlayOpacity = project.background.overlayOpacity || 0;
            }
          }

          ensureBackgroundState();

          // Restore layers
          state.layers = [];
          const rawLayers = project.layers || [];
          for (const l of rawLayers) {
            const layerCopy = { ...l };
            if (layerCopy.type === 'sticker' && layerCopy.src) {
              layerCopy.img = await preloadImage(layerCopy.src);
            } else if (layerCopy.resource && layerCopy.resource.src) {
              layerCopy.src = layerCopy.resource.src;
              layerCopy.img = await preloadImage(layerCopy.resource.src);
            }
            if (layerCopy.type === 'text') {
              const dims = calculateTextLayerDimensions(layerCopy);
              layerCopy.width = dims.width;
              layerCopy.height = dims.height;
            }
            state.layers.push(layerCopy);
          }

          state.selectedLayerIds = [];
          syncBackgroundControls();
          recordHistory();
          renderCanvas();
          updateLayersUI();
          updateInspectorUI();
          renderRulers();
          renderAlignmentMask();
          if (dom.modalProject) dom.modalProject.close();
          if (dom.modalExport) dom.modalExport.close();
          showToast('工程载入成功！已完整恢复全部图层与背景设置', 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('工程文件解析失败，请检查文件格式', 'warning');
      }
    };
    reader.readAsText(file);
    dom.fileLoadProject.value = '';
  }

  // =========================================================================
  // Toast Notifications
  // =========================================================================
  function showToast(message, type = 'info') {
    if (!dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>';
    if (type === 'success') {
      iconSvg = '<polyline points="20 6 9 17 4 12"/>';
    } else if (type === 'warning') {
      iconSvg = '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
    } else if (type === 'danger' || type === 'error') {
      iconSvg = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
    }

    toast.innerHTML = `
      <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.3" fill="none" style="flex-shrink: 0;">
        ${iconSvg}
      </svg>
      <span>${message}</span>
    `;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px) scale(0.96)';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
