import React, { useRef, useState, useEffect } from 'react';

const deviceGroups = [
  {
    title: 'Smart TVs Compatíveis',
    devices: [
      { logo: '/logos/samsung.png', name: 'Samsung', size: 'h-72' },
      { logo: '/logos/lg.png', name: 'LG', size: 'h-96' },
      { logo: '/logos/tcl.png', name: 'TCL Android', size: 'h-32 mt-24' },
    ],
  },
  {
    title: 'TV Box Compatíveis',
    devices: [
      { logo: '/logos/mxq.png', name: 'MXQ', size: 'h-40' },
      { logo: '/logos/mibox.png', name: 'Mi Box Xiaomi', size: 'h-40' },
      { logo: '/logos/mistick.png', name: 'Mi Stick Xiaomi', size: 'h-40' },
      { logo: '/logos/firestick.png', name: 'Fire Stick Amazon', size: 'h-40' },
    ],
  },
  {
    title: 'Outros Dispositivos',
    devices: [
      { logo: '/logos/windows.png', name: 'Desktop/Notebook', size: 'h-40' },
      { logo: '/logos/xbox.png', name: 'Xbox', size: 'h-40' },
    ],
  },
];

const allDevices = deviceGroups.flatMap(group => group.devices.map(device => ({ ...device, group: group.title })));

const DeviceCarousel = () => {
  const carouselRef = useRef(null);
  const [currentGroup, setCurrentGroup] = useState(deviceGroups[0].title);

  // Detect group by scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!carouselRef.current) return;
      const scrollLeft = carouselRef.current.scrollLeft;
      const cardWidth = carouselRef.current.firstChild?.offsetWidth || 1;
      const index = Math.round(scrollLeft / cardWidth);
      let groupIdx = 0, count = 0;
      for (let i = 0; i < deviceGroups.length; i++) {
        count += deviceGroups[i].devices.length;
        if (index < count) {
          groupIdx = i;
          break;
        }
      }
      setCurrentGroup(deviceGroups[groupIdx].title);
    };
    const ref = carouselRef.current;
    if (ref) ref.addEventListener('scroll', handleScroll);
    return () => ref && ref.removeEventListener('scroll', handleScroll);
  }, []);

  // Responsive image size
  const getImgClass = (device) => {
    return `${device.size} mb-4 object-contain max-w-full sm:max-w-xs md:max-w-sm lg:max-w-md`;
  };

  return (
    <section className="bg-gray-900 text-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center animate-fade-in-up">{currentGroup}</h2>
        <div
          ref={carouselRef}
          className="flex overflow-x-auto gap-8 pb-6 hide-scrollbar snap-x snap-mandatory"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {allDevices.map((device, idx) => (
            <div
              key={device.name + idx}
              className="bg-gray-800 rounded-xl shadow-lg flex flex-col items-center p-6 hover:scale-105 transition-transform h-96 justify-between w-72 min-w-[18rem] snap-center"
            >
              <img src={device.logo} alt={device.name} className={getImgClass(device)} style={{display: 'block', marginLeft: 'auto', marginRight: 'auto'}} />
              <span className="text-lg font-semibold text-center w-full block mb-2">{device.name}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4 gap-2">
          {deviceGroups.map((group, idx) => (
            <button
              key={group.title}
              className={`w-3 h-3 rounded-full ${currentGroup === group.title ? 'bg-indigo-500' : 'bg-gray-600'}`}
              onClick={() => {
                if (!carouselRef.current) return;
                let offset = 0;
                for (let i = 0; i < idx; i++) offset += deviceGroups[i].devices.length;
                const cardWidth = carouselRef.current.firstChild?.offsetWidth || 1;
                carouselRef.current.scrollTo({ left: offset * cardWidth, behavior: 'smooth' });
              }}
              aria-label={group.title}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DeviceCarousel;
