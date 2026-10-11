import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiMousePointer } from 'react-icons/fi';

const androidApps = [
  { name: 'NewHybrid' },
  { name: 'Dream TV' },
  { name: 'NewBraz' },
  { name: 'LVMAC' },
  { name: 'Outros players compatíveis', note: 'Licença anual' },
];

const smartTvApps = [
  { name: 'Dream TV' },
  { name: 'SmartOne', note: 'Licença anual' },
  { name: 'IBO Player', note: 'Licença anual' },
  { name: 'Outros players compatíveis', note: 'Licença anual' },
];

const devices = [
  { name: 'Samsung', img: '/logos/samsung.png', platform: 'samsung', big: true },
  { name: 'LG', img: '/logos/lg.png', platform: 'lg', big: 'xl' },
  { name: 'TCL Android', img: '/logos/tcl.png', platform: 'android' },
  { name: 'Roku', img: '/logos/roku.png', platform: 'roku', big: true },
  { name: 'MXQ TV Box', img: '/logos/mxq.png', platform: 'android' },
  { name: 'Mi Box Xiaomi', img: '/logos/mibox.png', platform: 'android' },
  { name: 'Mi Stick Xiaomi', img: '/logos/mistick.png', platform: 'android' },
  { name: 'Fire Stick Amazon', img: '/logos/firestick.png', platform: 'android' },
  { name: 'Android TV', img: '/logos/android.png', platform: 'android' },
  { name: 'Celular Android', img: '/logos/mobile-android.png', platform: 'android', mobile: true },
  { name: 'iPhone e iPad (iOS)', img: '/logos/mobile-ios.png', platform: 'ios', mobile: true },
  { name: 'Windows/PC', img: '/logos/windows.png', platform: 'pc' },
];

const appsByPlatform = {
  android: androidApps,
  samsung: smartTvApps,
  lg: smartTvApps,
  roku: [
    { name: 'Dream TV', note: 'Licença própria, sem anuidade' },
    { name: 'Meta Player', note: 'Licença anual' },
  ],
  ios: [
    { name: 'Players compatíveis para iOS', note: 'Consulte o suporte para indicação do app atualizado' },
  ],
  pc: [{ name: 'Smarters Player', note: 'Licença anual' }],
};

// Anel 3D: cada aparelho fica num ângulo do anel e o anel inteiro gira em Y.
const STEP = 360 / devices.length;
const CARD_GAP = 14;
const AUTO_SPEED = 0.006; // graus por ms (~1 volta por minuto)
const DRAG_FACTOR = 0.28; // graus por pixel arrastado
const RESUME_AFTER_MS = 4000;

const mod = (value, n) => ((value % n) + n) % n;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const snap = (value) => Math.round(value / STEP) * STEP;

const logoScale = (device) => {
  if (device.big === 'xl') return 'scale-[1.35]';
  if (device.big) return 'scale-[1.15]';
  return '';
};

const AGTVDevicesCarousel = () => {
  const prefersReducedMotion = useReducedMotion();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [frontIndex, setFrontIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(200);

  const stageRef = useRef(null);
  const ringRef = useRef(null);
  const rotationRef = useRef(0);
  const targetRef = useRef(0);
  const frontIndexRef = useRef(0);
  const autoRotateRef = useRef(true);
  const pausedUntilRef = useRef(0);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const justDraggedRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, startTarget: 0, moved: false });

  const radius = Math.round((cardWidth / 2 + CARD_GAP) / Math.tan(Math.PI / devices.length));
  const cardHeight = Math.round(cardWidth * 1.22);
  const radiusRef = useRef(radius);
  radiusRef.current = radius;

  const applyTransform = useCallback(() => {
    if (ringRef.current) {
      ringRef.current.style.transform = `translateZ(${-radiusRef.current}px) rotateY(${rotationRef.current}deg)`;
    }
    const index = mod(Math.round(-rotationRef.current / STEP), devices.length);
    if (index !== frontIndexRef.current) {
      frontIndexRef.current = index;
      setFrontIndex(index);
    }
  }, []);

  const tick = useCallback((now) => {
    const dt = lastTimeRef.current ? Math.min(now - lastTimeRef.current, 64) : 16;
    lastTimeRef.current = now;

    if (!dragRef.current.active && autoRotateRef.current && !prefersReducedMotion && now > pausedUntilRef.current) {
      targetRef.current -= AUTO_SPEED * dt;
    }

    const diff = targetRef.current - rotationRef.current;
    rotationRef.current = prefersReducedMotion
      ? targetRef.current
      : rotationRef.current + diff * Math.min(1, dt * (dragRef.current.active ? 0.03 : 0.008));
    applyTransform();
    frameRef.current = requestAnimationFrame(tick);
  }, [applyTransform, prefersReducedMotion]);

  // Só anima enquanto a seção está na tela, para não gastar bateria.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const start = () => {
      if (frameRef.current) return;
      lastTimeRef.current = 0;
      frameRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { rootMargin: '100px' });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [tick]);

  // Tamanho dos cards acompanha a largura da tela.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const resize = () => {
      const width = stage.clientWidth;
      // No celular o card ocupa uma fatia maior da tela para o aparelho da frente ficar legível.
      setCardWidth(Math.round(clamp(width * (width < 640 ? 0.46 : 0.36), 150, 220)));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    applyTransform();
  }, [radius, applyTransform]);

  const pauseAuto = (ms = RESUME_AFTER_MS) => {
    pausedUntilRef.current = performance.now() + ms;
  };

  const rotateToIndex = (index) => {
    const desired = -index * STEP;
    targetRef.current = desired + 360 * Math.round((targetRef.current - desired) / 360);
  };

  const step = (direction) => {
    targetRef.current = snap(targetRef.current) - direction * STEP;
    pauseAuto(6000);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = { active: true, startX: event.clientX, startTarget: targetRef.current, moved: false };
  };

  useEffect(() => {
    const handleMove = (event) => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const distance = event.clientX - drag.startX;
      if (Math.abs(distance) > 6) drag.moved = true;
      if (drag.moved) targetRef.current = drag.startTarget + distance * DRAG_FACTOR;
    };
    const handleUp = () => {
      const drag = dragRef.current;
      if (!drag.active) return;
      drag.active = false;
      if (drag.moved) {
        targetRef.current = snap(targetRef.current);
        justDraggedRef.current = true;
        window.setTimeout(() => { justDraggedRef.current = false; }, 120);
        pausedUntilRef.current = performance.now() + RESUME_AFTER_MS;
      }
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
  };

  const selectDevice = (device, index) => {
    if (justDraggedRef.current) return;
    setSelectedDevice(device);
    rotateToIndex(index);
    // Depois de escolher, o anel para de girar sozinho para o aparelho ficar na frente.
    autoRotateRef.current = false;
  };

  const perspective = Math.max(900, radius * 2.8);

  return (
    <section id="agtv-devices-carousel" className="relative bg-gray-900 px-4 py-12 text-white sm:py-16">
      <div className="container mx-auto mb-8 sm:mb-10">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">ASSISTA DO SEU JEITO</span>
          <h2 className="agtv-section-title">
            Aparelhos <span>Compatíveis</span>
          </h2>
        </div>
        <p className="agtv-section-description mb-4">
          Escolha seu aparelho para ver os players compatíveis.
        </p>
        <p className="mb-4 flex items-center justify-center gap-2 text-xs text-gray-500 sm:text-sm">
          <FiMousePointer aria-hidden="true" className="text-[#b7ff4a]" />
          <span>Arraste para girar ou use as setas</span>
        </p>

        <div className="relative -mx-4 overflow-hidden px-4 sm:mx-0 sm:px-0">
          <div
            ref={stageRef}
            role="group"
            aria-roledescription="carrossel"
            aria-label="Aparelhos compatíveis"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            className="relative mx-auto select-none cursor-grab active:cursor-grabbing"
            style={{ height: cardHeight + 48, perspective: `${perspective}px`, touchAction: 'pan-y' }}
          >
            <div
              ref={ringRef}
              className="absolute inset-x-0 top-6 mx-auto"
              style={{ width: cardWidth, height: cardHeight, transformStyle: 'preserve-3d' }}
            >
              {devices.map((device, index) => {
                const isSelected = selectedDevice?.name === device.name;
                const isFront = index === frontIndex;
                return (
                  <button
                    key={device.name}
                    type="button"
                    data-device-name={device.name}
                    data-analytics={`device_${device.name.replace(/\s+/g, '_').toLowerCase()}`}
                    aria-pressed={isSelected}
                    aria-label={`Ver aplicativos compatíveis com ${device.name}`}
                    onClick={() => selectDevice(device, index)}
                    onFocus={() => { rotateToIndex(index); pauseAuto(8000); }}
                    className={`absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-2xl border p-4 text-center transition-[border-color,box-shadow,filter] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b7ff4a] ${
                      isSelected
                        ? 'border-[#b7ff4a]/80 bg-gradient-to-br from-[#34384a] via-[#1d202b] to-[#302448] shadow-[0_0_40px_rgba(183,255,74,0.25)]'
                        : isFront
                          ? 'border-[#9a7bff]/60 bg-gradient-to-br from-[#2d3040] via-[#1b1d28] to-[#2c2442] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(154,123,255,0.18)]'
                          : 'border-white/10 bg-gradient-to-br from-[#292b38] via-[#191b26] to-[#28213b] brightness-75'
                    }`}
                    style={{
                      transform: `rotateY(${index * STEP}deg) translateZ(${radius}px)`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <span className="flex w-full flex-1 items-center justify-center" style={{ minHeight: 0 }}>
                      <img
                        src={device.img}
                        alt=""
                        className={
                          device.mobile
                            ? 'max-h-full w-auto rounded-xl bg-white p-1 object-contain shadow-lg'
                            : `max-h-[85%] w-full object-contain ${logoScale(device)}`
                        }
                        style={{ height: device.mobile ? '92%' : undefined }}
                        draggable={false}
                        onDragStart={(event) => event.preventDefault()}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = 'https://placehold.co/400x225/000000/FFFFFF?text=Imagem+Nao+Disponivel';
                        }}
                      />
                    </span>
                    <span className="mt-2 text-sm font-bold leading-tight text-indigo-300 sm:text-base">{device.name}</span>
                    {isSelected && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#c9ff83]">
                        <FiCheckCircle aria-hidden="true" />
                        Selecionado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Reflexo no "chão" embaixo do anel */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-10 max-w-md rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(154,123,255,0.28),transparent_70%)] blur-md"
            />
          </div>

          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Aparelho anterior"
            data-analytics="device_ring_prev"
            className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#101116]/80 text-white backdrop-blur transition hover:border-[#b7ff4a]/60 hover:text-[#b7ff4a] sm:left-4"
          >
            <FiChevronLeft aria-hidden="true" size={22} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Próximo aparelho"
            data-analytics="device_ring_next"
            className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#101116]/80 text-white backdrop-blur transition hover:border-[#b7ff4a]/60 hover:text-[#b7ff4a] sm:right-4"
          >
            <FiChevronRight aria-hidden="true" size={22} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {selectedDevice ? (
            <motion.div
              key={selectedDevice.name}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mx-auto mt-7 max-w-4xl rounded-2xl border border-[#9a7bff]/25 bg-[#101116]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-7"
              aria-live="polite"
            >
              <div className="mb-5 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b7ff4a]">
                  Players compatíveis
                </p>
                <h3 className="mt-2 text-2xl font-extrabold text-white">
                  {selectedDevice.name}
                </h3>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {appsByPlatform[selectedDevice.platform].map((app) => (
                  <div
                    key={app.name}
                    className="flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <FiCheckCircle aria-hidden="true" className="shrink-0 text-[#b7ff4a]" />
                    <span className="font-semibold text-gray-100">{app.name}</span>
                    {app.note && (
                      <span className="text-xs text-gray-400">{app.note}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="device-selection-hint"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 text-center text-sm text-gray-500"
            >
              Toque em um aparelho para conferir os aplicativos disponíveis.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default AGTVDevicesCarousel;
