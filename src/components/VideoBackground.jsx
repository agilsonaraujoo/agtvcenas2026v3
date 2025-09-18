import React, { useEffect, useState, useRef } from 'react';

const VideoBackground = () => {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      // try to play, but ignore AbortError
      video.play().catch(err => {
        if (err.name !== 'AbortError') console.error('Erro ao iniciar o vídeo:', err);
      });
      setIsVideoReady(true);
    };

    const handleError = () => {
      console.error('Erro ao carregar o vídeo');
      setIsVideoReady(false);
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/AGTV.jpg"
        className="bg-video"
        data-video-type="background"
      >
        <source src="/videos/fundo-original.mp4" type="video/mp4" />
        Seu navegador não suporta vídeo HTML5.
      </video>

      {/* fallback image while video not ready */}
      {!isVideoReady && (
        <div className="bg-fallback" aria-hidden="true" />
      )}
    </>
  );
};

export default VideoBackground;
