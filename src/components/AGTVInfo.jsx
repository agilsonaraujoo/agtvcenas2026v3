import React, { useState, useEffect } from 'react';

const deviceLogos = {
  samsung: '/logos/samsung.png',
  lg: '/logos/lg.png',
  tcl: '/logos/tcl.png',
  android: '/logos/android.png',
  roku: '/logos/roku.png',
  mxq: '/logos/mxq.png',
  miBox: '/logos/mibox.png',
  miStick: '/logos/mistick.png',
  fireStick: '/logos/firestick.png',
  desktop: '/logos/windows.png',
  xbox: '/logos/xbox.png',
};

const devices = [
  { logo: deviceLogos.samsung, name: 'Samsung', size: 'h-72' },
  { logo: deviceLogos.lg, name: 'LG', size: 'h-96' },
  { logo: deviceLogos.tcl, name: 'TCL Android', size: 'h-32 mt-24' },
  { logo: deviceLogos.mxq, name: 'MXQ', size: 'h-40' },
  { logo: deviceLogos.miBox, name: 'Mi Box Xiaomi', size: 'h-40' },
  { logo: deviceLogos.miStick, name: 'Mi Stick Xiaomi', size: 'h-40' },
  { logo: deviceLogos.fireStick, name: 'Fire Stick Amazon', size: 'h-40' },
  { logo: deviceLogos.desktop, name: 'Desktop/Notebook', size: 'h-40' },
  { logo: deviceLogos.xbox, name: 'Xbox', size: 'h-40' },
];

const getVisibleCount = () => {
  if (typeof window === 'undefined') return 3;
  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 1024) return 2;
  return 3;
};

const AGTVInfo = () => {
  const [startIdx, setStartIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(getVisibleCount());

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStartIdx((prev) => (prev + visibleCount) % devices.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [visibleCount]);

  const visibleDevices = [];
  for (let i = 0; i < visibleCount; i++) {
    visibleDevices.push(devices[(startIdx + i) % devices.length]);
  }

  return (
    <section id="agtv-info" className="bg-gray-900 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl mb-8 text-center">Aparelhos Compatíveis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
          {visibleDevices.map((device) => (
            <div key={device.name} className="bg-gray-900 rounded-lg shadow-xl p-6 text-center flex flex-col transform transition-transform hover:scale-105 duration-300 h-96 justify-between">
              <img src={device.logo} alt={device.name} className={`${device.size} object-contain mx-auto mb-4`} />
              <h3 className="text-2xl font-bold text-indigo-400 mb-2">{device.name}</h3>
            </div>
          ))}
        </div>

        <h3 className="text-xl font-semibold mt-12 mb-3">Vantagens da AGTV</h3>
        <ul className="list-disc list-inside mb-4 text-base">
          <li>Conteúdo sob demanda</li>
          <li>Assistir filmes, séries, documentários e programas exclusivos</li>
          <li>Qualidade de imagem HD e 4K</li>
          <li>Facilidade de uso e instalação</li>
          <li>Compatibilidade com diversos dispositivos</li>
        </ul>

        <p className="mt-6 text-lg">
          A AGTV é ideal para quem busca flexibilidade e variedade de conteúdo, sem depender de programação restrita. Basta ter acesso à internet e um dispositivo compatível para aproveitar o melhor do entretenimento digital.
        </p>
      </div>
    </section>
  );
};

export default AGTVInfo;
