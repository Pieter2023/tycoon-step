import React from 'react';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { MOTION_DISABLED } from '../ui/motion';

// Event image lightbox: full-size preview of a scenario illustration.
interface ImageLightboxModalProps {
  image: { src: string; alt: string };
  reduceMotion: boolean;
  onClose: () => void;
}

const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ image, reduceMotion, onClose }) => {
  const Img = (MOTION_DISABLED ? 'img' : motion.img) as React.ElementType;
  const Caption = (MOTION_DISABLED ? 'div' : motion.div) as React.ElementType;
  // The picture grows out of the card it came from (a plain fade under reduce motion); the caption follows.
  const imgMotion = MOTION_DISABLED
    ? {}
    : {
        initial: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 },
        animate: reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 },
        transition: reduceMotion ? { duration: 0.2 } : { type: 'spring', bounce: 0, duration: 0.5 }
      };
  const captionMotion = MOTION_DISABLED
    ? {}
    : {
        initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 },
        animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
        transition: reduceMotion ? { duration: 0.2, delay: 0.1 } : { type: 'spring', bounce: 0, duration: 0.45, delay: 0.18 }
      };

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Event image preview"
      overlayClassName="bg-black/85 backdrop-blur-xl"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="max-w-5xl! bg-transparent! border-0! shadow-none! [backdrop-filter:none]! [-webkit-backdrop-filter:none]!"
    >
      <div className="relative w-full">
        <Img
          {...imgMotion}
          src={image.src}
          alt={image.alt}
          className="w-full max-h-[85vh] rounded-[22px] object-contain shadow-[0_40px_90px_-24px_rgb(0_0_0/0.8)] ring-1 ring-white/10"
          draggable={false}
        />

        <Caption {...captionMotion} className="mt-4 flex justify-center">
          <span className="mat-popover rounded-full px-3.5 py-1.5 text-[13px] font-medium text-slate-200">
            <span className="hidden sm:inline">Click</span>
            <span className="sm:hidden">Tap</span>
            <span> outside to close</span>
          </span>
        </Caption>
      </div>
    </Modal>
  );
};

export default ImageLightboxModal;
