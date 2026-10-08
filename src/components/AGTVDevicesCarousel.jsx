import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiChevronDown, FiCheckCircle, FiMousePointer } from 'react-icons/fi';

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
  { name: 'TCL Android', img: '/logos/tcl.png', platform: 'android', tclMargin: true },
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

const scrollSpeed = 0.12;

const AGTVDevicesCarousel = () => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const interactionTimeoutRef = useRef(null);
  const clickSuppressionTimeoutRef = useRef(null);
  const justDraggedRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const interactionEndRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const animateScroll = useCallback((timestamp) => {
    if (!lastScrollTimeRef.current) {
      lastScrollTimeRef.current = timestamp;
    }
    const deltaTime = timestamp - lastScrollTimeRef.current;
    lastScrollTimeRef.current = timestamp;
    const container = scrollContainerRef.current;
    if (container && !dragRef.current.active) {
      container.scrollLeft += scrollSpeed * deltaTime;
      const originalContentWidth = container.scrollWidth / 2;
      if (container.scrollLeft >= originalContentWidth) {
        container.scrollLeft -= originalContentWidth;
      }
    }
    scrollAnimationRef.current = requestAnimationFrame(animateScroll);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (
      prefersReducedMotion
      || !scrollContainerRef.current
      || !window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches
    ) return;
    stopAutoScroll();
    lastScrollTimeRef.current = 0;
    scrollAnimationRef.current = requestAnimationFrame(animateScroll);
  }, [animateScroll, prefersReducedMotion, stopAutoScroll]);

  const handleInteractionEnd = useCallback(() => {
    window.clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = window.setTimeout(() => {
      if (!dragRef.current.active) startAutoScroll();
    }, 1000);
  }, [startAutoScroll]);
  interactionEndRef.current = handleInteractionEnd;

  const handleMouseDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: scrollContainerRef.current.scrollLeft,
      moved: false,
    };
    stopAutoScroll();
  };

  useEffect(() => {
    const handleMouseMove = (event) => {
      const drag = dragRef.current;
      if (!drag.active || !scrollContainerRef.current) return;
      const distance = event.clientX - drag.startX;
      if (Math.abs(distance) > 4) drag.moved = true;
      if (drag.moved) {
        scrollContainerRef.current.scrollLeft = drag.startScrollLeft - distance;
        event.preventDefault();
      }
    };

    const handleMouseUp = () => {
      const drag = dragRef.current;
      if (!drag.active) return;
      drag.active = false;
      if (drag.moved) {
        justDraggedRef.current = true;
        window.clearTimeout(clickSuppressionTimeoutRef.current);
        clickSuppressionTimeoutRef.current = window.setTimeout(() => {
          justDraggedRef.current = false;
        }, 100);
      }
      interactionEndRef.current();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      stopAutoScroll();
      window.clearTimeout(interactionTimeoutRef.current);
      window.clearTimeout(clickSuppressionTimeoutRef.current);
    };
  }, [stopAutoScroll]);

  useEffect(() => {
    if (!prefersReducedMotion) startAutoScroll();
    return stopAutoScroll;
  }, [prefersReducedMotion, startAutoScroll, stopAutoScroll]);

  const itemsToDisplay = [...devices, ...devices];

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
        <p className="mb-8 flex items-center justify-center gap-2 text-xs text-gray-500 sm:text-sm">
          <FiMousePointer aria-hidden="true" className="text-[#b7ff4a]" />
          <span>Arraste com o mouse ou deslize com o dedo</span>
          <FiChevronDown aria-hidden="true" className="text-[#9a7bff]" />
        </p>

        <div
          ref={scrollContainerRef}
          className="flex snap-x snap-mandatory touch-pan-x select-none overflow-x-auto pb-5 hide-scrollbar cursor-grab active:cursor-grabbing md:snap-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onMouseDown={handleMouseDown}
          onTouchStart={stopAutoScroll}
          onTouchEnd={handleInteractionEnd}
          onTouchCancel={handleInteractionEnd}
        >
          {itemsToDisplay.map((device, index) => {
            const isSelected = selectedDevice?.name === device.name;
            return (
              <div
                key={`${device.name}-${index}`}
                className="flex-none w-64 sm:w-56 md:w-64 lg:w-72 mr-4 snap-center"
                style={{ maxWidth: '82vw' }}
              >
                <button
                  type="button"
                  data-device-name={device.name}
                  data-analytics={`device_${device.name.replace(/\s+/g, '_').toLowerCase()}`}
                  aria-pressed={isSelected}
                  aria-label={`Ver aplicativos compatíveis com ${device.name}`}
                  onClick={() => {
                    if (justDraggedRef.current) return;
                    setSelectedDevice(device);
                  }}
                  className={`flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 text-center shadow-xl transition duration-300 ${
                    isSelected
                      ? 'border-[#b7ff4a]/70 bg-gradient-to-br from-[#34384a] via-[#1d202b] to-[#302448] ring-2 ring-[#b7ff4a]/20'
                      : 'border-white/10 bg-gradient-to-br from-[#292b38] via-[#191b26] to-[#28213b] hover:-translate-y-1 hover:border-[#9a7bff]/50'
                  }`}
                >
                  <div className="flex min-h-[10rem] w-full items-center justify-center">
                    <img
                      src={device.img}
                      alt=""
                      className={
                        device.mobile
                          ? 'h-48 w-44 rounded-xl bg-white p-1 object-contain shadow-lg md:h-52 md:w-48'
                          : device.big === 'xl'
                          ? 'h-[18rem] sm:h-64 object-contain mb-4'
                          : device.big
                            ? 'h-[15rem] sm:h-56 object-contain mb-4'
                            : device.mobile
                              ? 'h-56 sm:h-64 object-contain mb-4'
                              : device.tclMargin
                                ? 'h-[12rem] sm:h-40 object-contain mb-4 mt-8'
                                : 'h-[12rem] sm:h-40 object-contain mb-4'
                      }
                      style={{ marginLeft: 'auto', marginRight: 'auto', display: 'block' }}
                      draggable={false}
                      onDragStart={(event) => event.preventDefault()}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = 'https://placehold.co/400x225/000000/FFFFFF?text=Imagem+Nao+Disponivel';
                      }}
                    />
                  </div>
                  <span className="text-lg font-bold text-indigo-400">{device.name}</span>
                  {isSelected && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#c9ff83]">
                      <FiCheckCircle aria-hidden="true" />
                      Ver compatibilidade
                    </span>
                  )}
                </button>
              </div>
            );
          })}
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
              Clique em um aparelho para conferir os aplicativos disponíveis.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default AGTVDevicesCarousel;
