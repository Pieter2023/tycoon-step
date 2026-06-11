import React from 'react';
import { motion } from 'framer-motion';
import Modal from '../Modal';

// Event image lightbox: full-size preview of a scenario illustration.
interface ImageLightboxModalProps {
  image: { src: string; alt: string };
  reduceMotion: boolean;
  onClose: () => void;
}

const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ image, reduceMotion, onClose }) => (
  <Modal
    isOpen
    onClose={onClose}
    ariaLabel="Event image preview"
    overlayClassName="bg-black/90 backdrop-blur-sm"
    closeOnOverlayClick
    closeOnEsc
    contentClassName="relative w-full max-w-5xl bg-transparent border-0 shadow-none"
  >
    <motion.div
      initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97, y: 8 }}
      animate={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative w-full"
    >
      <motion.img
        src={image.src}
        alt={image.alt}
        className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-700"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1 }}
        transition={{ duration: 0.35 }}
        draggable={false}
      />

      <div className="mt-3 text-center text-xs text-slate-300">
        <span className="hidden sm:inline">Click</span>
        <span className="sm:hidden">Tap</span>
        <span> outside to close</span>
      </div>
    </motion.div>
  </Modal>
);

export default ImageLightboxModal;
