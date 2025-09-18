import React, { useRef, useEffect } from 'react';

const devices = [
  { name: 'Samsung', img: '/logos/samsung.png', big: true },
  { name: 'LG', img: '/logos/lg.png', big: 'xl' },
  { name: 'TCL Android', img: '/logos/tcl.png', tclMargin: true },
  { name: 'Roku', img: '/logos/roku.png', big: true },
  { name: 'MXQ TV Box', img: '/logos/mxq.png' },
  { name: 'Mi Box Xiaomi', img: '/logos/mibox.png' },
  { name: 'Mi Stick Xiaomi', img: '/logos/mistick.png' },
  { name: 'Fire Stick Amazon', img: '/logos/firestick.png' },
  { name: 'Windows/PC', img: '/logos/windows.png' },
  { name: 'Xbox', img: '/logos/xbox.png' },
];

const scrollSpeed = 0.12;

const AGTVDevicesCarousel = () => {
  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const lastScrollTimeRef = useRef(0);

  const animateScroll = (timestamp) => {
    if (!lastScrollTimeRef.current) {
      lastScrollTimeRef.current = timestamp;
    }
    const deltaTime = timestamp - lastScrollTimeRef.current;
    lastScrollTimeRef.current = timestamp;
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollLeft += scrollSpeed * deltaTime;
      const originalContentWidth = container.scrollWidth / 2;
      if (container.scrollLeft >= originalContentWidth) {
        container.scrollLeft -= originalContentWidth;
      }
    }
    scrollAnimationRef.current = requestAnimationFrame(animateScroll);
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      lastScrollTimeRef.current = 0;
      scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  // Duplicar os dispositivos para loop infinito
  const itemsToDisplay = [...devices, ...devices];

  return (
    <section id="agtv-devices-carousel" className="bg-gray-900 text-white py-16 px-4 relative">
      <div className="container mx-auto mb-12">
        <h2 className="text-4xl font-extrabold text-white text-center sm:text-5xl lg:text-6xl mb-4">
          Aparelhos Compatíveis
        </h2>
        <p className="text-xl text-gray-300 text-center mb-8">
          Os principais dispositivos para assistir AGTV
        </p>
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-scroll pb-4 hide-scrollbar cursor-grab active:cursor-grabbing"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {itemsToDisplay.map((device, index) => (
            <div
              key={device.name + index}
              className="flex-none w-full sm:w-56 md:w-64 lg:w-72 xl:w-80 mr-4 snap-center transform transition-transform hover:scale-105 duration-300"
              style={{ maxWidth: '100vw' }}
            >
              <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden h-full flex flex-col items-center justify-center p-6">
                <div className="flex items-center justify-center w-full h-full min-h-[10rem]">
                  <img
                    src={device.img}
                    alt={device.name}
                    className={
                      device.big === 'xl'
                        ? "h-[28rem] sm:h-96 object-contain rounded-t-lg mb-4 select-none"
                        : device.big
                          ? "h-[22rem] sm:h-72 object-contain rounded-t-lg mb-4 select-none"
                          : device.tclMargin
                            ? "h-[14rem] sm:h-40 object-contain rounded-t-lg mb-4 mt-12 select-none"
                            : "h-[14rem] sm:h-40 object-contain rounded-t-lg mb-4 select-none"
                    }
                    style={{ marginLeft: 'auto', marginRight: 'auto', display: 'block', userSelect: 'none' }}
                    draggable={false}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x225/000000/FFFFFF?text=Imagem+Nao+Disponivel'; }}
                  />
                </div>
                <h3 className="text-xl sm:text-lg font-bold text-indigo-400 mb-2 text-center">
                  {device.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AGTVDevicesCarousel;
