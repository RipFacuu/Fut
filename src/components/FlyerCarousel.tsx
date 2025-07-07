import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Flyer, getActiveFlyers } from '../services/flyersService';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

const FlyerCarousel: React.FC = () => {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageAspect, setImageAspect] = useState<'vertical' | 'horizontal' | 'square' | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    loadFlyers();
  }, []);

  useEffect(() => {
    if (flyers.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % flyers.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [flyers.length]);

  useEffect(() => {
    if (flyers.length > 0) {
      const img = new window.Image();
      img.src = flyers[currentIndex].image_url;
      img.onload = () => {
        if (img.naturalWidth > img.naturalHeight) setImageAspect('horizontal');
        else if (img.naturalWidth < img.naturalHeight) setImageAspect('vertical');
        else setImageAspect('square');
      };
    }
  }, [flyers, currentIndex]);

  const loadFlyers = async () => {
    try {
      const activeFlyers = await getActiveFlyers();
      setFlyers(activeFlyers);
    } catch (error) {
      console.error('Error cargando flyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? flyers.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === flyers.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl animate-pulse flex items-center justify-center">
        <div className="text-slate-500">Cargando flyers...</div>
      </div>
    );
  }

  if (flyers.length === 0) {
    return null;
  }

  // Ajustar altura y ancho según aspecto y pantalla
  let containerHeight = 'h-80 md:h-96';
  let containerWidth = 'w-full';
  if (imageAspect === 'vertical') {
    containerHeight = 'h-[520px] md:h-[620px]';
    containerWidth = 'max-w-[420px]';
  }
  if (imageAspect === 'horizontal') {
    containerHeight = 'h-64 md:h-80';
    containerWidth = 'max-w-4xl';
  }
  if (imageAspect === 'square') {
    containerHeight = 'h-80 md:h-96';
    containerWidth = 'max-w-[520px]';
  }

  return (
    <div className={`relative mx-auto mb-12 flex flex-col items-center ${containerWidth}`}>
      {lightboxOpen && (
        flyers.length > 1 ? (
          <Lightbox
            mainSrc={flyers[currentIndex].image_url}
            nextSrc={currentIndex < flyers.length - 1 ? flyers[currentIndex + 1].image_url : undefined}
            prevSrc={currentIndex > 0 ? flyers[currentIndex - 1].image_url : undefined}
            onCloseRequest={() => setLightboxOpen(false)}
            onMovePrevRequest={() => setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : 0)}
            onMoveNextRequest={() => setCurrentIndex(currentIndex < flyers.length - 1 ? currentIndex + 1 : currentIndex)}
            imageTitle={flyers[currentIndex].title}
            imageCaption={flyers[currentIndex].description}
          />
        ) : (
          <Lightbox
            mainSrc={flyers[currentIndex].image_url}
            onCloseRequest={() => setLightboxOpen(false)}
            imageTitle={flyers[currentIndex].title}
            imageCaption={flyers[currentIndex].description}
          />
        )
      )}
      <div className={`relative overflow-hidden flex items-center justify-center bg-transparent ${containerHeight} w-full`}>
        {/* Imagen principal adaptativa */}
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={flyers[currentIndex].image_url}
            alt={flyers[currentIndex].title}
            className="max-h-full max-w-full object-contain cursor-zoom-in transition-transform duration-200 hover:scale-105"
            style={{ background: 'transparent' }}
            onClick={() => setLightboxOpen(true)}
          />
          {/* Overlay gradiente para texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          {/* Contenido del flyer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg text-white">
              {flyers[currentIndex].title}
            </h3>
            {flyers[currentIndex].description && (
              <p className="text-lg md:text-xl opacity-90 mb-4 drop-shadow">
                {flyers[currentIndex].description}
              </p>
            )}
            {flyers[currentIndex].link_url && (
              <a
                href={flyers[currentIndex].link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30"
              >
                Ver más
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        {/* Botones de navegación */}
        {flyers.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 border border-white/30 z-20"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 border border-white/30 z-20"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      {/* Indicadores */}
      {flyers.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {flyers.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary-600 scale-125'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Ir al flyer ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlyerCarousel; 