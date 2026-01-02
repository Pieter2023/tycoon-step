import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useI18n } from '../i18n';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  closeButtonAriaLabel?: string;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  overlayClassName?: string;
  contentClassName?: string;
  overlayStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  zIndex?: number;
  initialFocusRef?: React.RefObject<HTMLElement>;
  preventScroll?: boolean;
  role?: 'dialog' | 'alertdialog';
};

const joinClassNames = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

let openModalCount = 0;
let previousBodyOverflow = '';
let previousBodyPaddingRight = '';

const lockBodyScroll = () => {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  openModalCount += 1;
};

const unlockBodyScroll = () => {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }
};

const modalStack: string[] = [];
const registerModal = (id: string) => {
  modalStack.push(id);
};
const unregisterModal = (id: string) => {
  const idx = modalStack.lastIndexOf(id);
  if (idx >= 0) modalStack.splice(idx, 1);
};
const isTopModal = (id: string) => modalStack[modalStack.length - 1] === id;

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable="true"]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',')
  );

  return Array.from(nodes).filter((el) => {
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    return el.getClientRects().length > 0;
  });
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  ariaLabel,
  ariaLabelledBy,
  closeButtonAriaLabel,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  overlayClassName,
  contentClassName,
  overlayStyle,
  contentStyle,
  zIndex = 1000,
  initialFocusRef,
  preventScroll = true,
  role = 'dialog'
}) => {
  const modalId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { t } = useI18n();
  const title = ariaLabel ?? t('modal.title');
  const closeLabel = closeButtonAriaLabel ?? t('modal.close');

  useEffect(() => {
    if (!isOpen) return;
    registerModal(modalId);
    if (preventScroll) lockBodyScroll();
    return () => {
      unregisterModal(modalId);
      if (preventScroll) unlockBodyScroll();
    };
  }, [isOpen, modalId, preventScroll]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const focusTarget = initialFocusRef?.current || getFocusableElements(contentRef.current)[0] || contentRef.current;
    if (focusTarget) {
      window.setTimeout(() => focusTarget.focus(), 0);
    }
    return () => {
      const prev = previousFocusRef.current;
      if (prev && document.contains(prev)) {
        window.setTimeout(() => prev.focus(), 0);
      }
    };
  }, [isOpen, initialFocusRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal(modalId)) return;
      if (event.key === 'Escape' && closeOnEsc) {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = getFocusableElements(contentRef.current);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !contentRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (!active || active === last || !contentRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!isTopModal(modalId)) return;
      if (!contentRef.current) return;
      if (contentRef.current.contains(event.target as Node)) return;
      const focusTarget = initialFocusRef?.current || getFocusableElements(contentRef.current)[0] || contentRef.current;
      focusTarget?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [isOpen, modalId, closeOnEsc, onClose, initialFocusRef]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={joinClassNames(
        'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4',
        overlayClassName
      )}
      style={{ zIndex, ...overlayStyle }}
      onClick={() => {
        if (closeOnOverlayClick && isTopModal(modalId)) onClose();
      }}
    >
      <div
        ref={contentRef}
        role={role}
        aria-modal="true"
        aria-label={ariaLabelledBy ? undefined : title}
        aria-labelledby={ariaLabelledBy}
        className={joinClassNames(
          'relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl outline-none',
          contentClassName
        )}
        style={contentStyle}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
            aria-label={closeLabel}
          >
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
