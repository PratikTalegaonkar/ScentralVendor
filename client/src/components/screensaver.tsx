import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const screensaverImages = [
  {
    url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1920&h=1080&fit=crop&auto=format&q=80",
    alt: "Elegant perfume bottles with golden lighting"
  },
  {
    url: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1920&h=1080&fit=crop&auto=format&q=80",
    alt: "Luxury perfume collection with rose petals"
  },
  {
    url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1920&h=1080&fit=crop&auto=format&q=80",
    alt: "Premium glass perfume bottles with artistic shadows"
  },
  {
    url: "https://images.unsplash.com/photo-1607734834519-d8576ae60ea4?w=1920&h=1080&fit=crop&auto=format&q=80",
    alt: "Crystal perfume bottles on marble surface"
  },
  {
    url: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1920&h=1080&fit=crop&auto=format&q=80",
    alt: "Designer perfume with elegant packaging"
  },
  {
    url: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=1920&h=1080&fit=crop&auto=format&q=80",
    alt: "Luxury fragrance bottles with dramatic lighting"
  },
  {
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&h=1080&fit=crop&auto=format&q=80",
    alt: "Premium perfume bottles on silk fabric"
  },
  {
    url: "https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=1920&h=1080&fit=crop&auto=format&q=80",
    alt: "Classy perfume display with gold accents"
  }
];

interface ScreensaverProps {
  onActivate: () => void;
  onAdminAccess: () => void;
}

export default function Screensaver({ onActivate, onAdminAccess }: ScreensaverProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % screensaverImages.length);
    }, 4000); // Slightly longer for better viewing

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed inset-0 cursor-pointer"
      onClick={onActivate}
      onTouchStart={onActivate}
    >
      <div className="relative w-full h-full">
        {/* Background Images Carousel */}
        <div className="absolute inset-0">
          {screensaverImages.map((image, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ 
                opacity: index === currentImageIndex ? 1 : 0,
                scale: index === currentImageIndex ? 1 : 1.1
              }}
              transition={{ 
                duration: 1.5, 
                ease: "easeInOut",
                scale: { duration: 2 }
              }}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Subtle gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            </motion.div>
          ))}
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        
        {/* Branding Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div 
            className="animate-pulse-gold p-8 rounded-2xl bg-black bg-opacity-40 backdrop-blur-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1 className="font-serif text-8xl font-bold text-white mb-4 tracking-wide">
              SCENTRA
            </h1>
            <p className="text-luxe-gold text-2xl font-light tracking-widest mb-8">
              PREMIUM FRAGRANCE EXPERIENCE
            </p>
            <div className="text-platinum text-lg">
              <p className="mb-2">
                Powered by <span className="text-luxe-gold font-semibold">Vendexa</span>
              </p>
              <motion.div 
                className="flex items-center justify-center space-x-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg className="w-6 h-6 text-luxe-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.414l.707-.707zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z"/>
                </svg>
                <span>Touch Screen to Begin</span>
              </motion.div>
              
              

              

              {/* Admin Access */}
              <motion.div 
                className="mt-4 text-center opacity-50 hover:opacity-100 transition-opacity duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 1, delay: 2 }}
              >
                <button 
                  className="text-platinum text-sm underline hover:text-luxe-gold transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdminAccess();
                  }}
                >
                  Admin Access
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
