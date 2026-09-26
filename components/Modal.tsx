import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Variants } from 'framer-motion';
import { MOTION_DISABLED, materialize, springs } from './ui/motion';

const sideSheet: Variants = {
  hidden: { x: '104%', opacity: 0.6 },
  show: { x: 0, opacity: 1, transition: springs.smooth },
  exit: { x: '104%', opacity: 0.6, transition: { type: 'spring', bounce: 0, duration: 0.32 } }
};

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

  if (typeof document === 'undefined') return null;
  if (!isOpen && MOTION_DISABLED) return null;

  // A dialog taller than the screen (the Sales quiz on a phone) must stay reachable: the page is
  // scroll-locked, so the overlay scrolls instead. Auto margins centre the dialog while it fits and
  // pin it to the top when it doesn't (plain centring would push its close button off the top).
  //
  // Motion: the scrim fades while the dialog materialises (scale + blur + rise) and it leaves by the
  // same path. While it leaves it no longer takes clicks, focus or keys (the modal stack has already
  // let it go), so the player is never kept waiting on an exit.
  const overlayMotion = MOTION_DISABLED
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }
      };
  // Side sheets (overlay pinned to the right edge) slide in from that edge and leave the same way;
  // everything else materialises in place.
  const isSideSheet = /(^|\s)justify-end(\s|$)/.test(overlayClassName ?? '');
  const contentMotion = MOTION_DISABLED
    ? {}
    : { variants: isSideSheet ? sideSheet : materialize, initial: 'hidden', animate: 'show', exit: 'exit' };
  const Overlay = (MOTION_DISABLED ? 'div' : motion.div) as React.ElementType;
  const Content = (MOTION_DISABLED ? 'div' : motion.div) as React.ElementType;

  const dialog = isOpen ? (
    <Overlay
      key="modal-overlay"
      {...overlayMotion}
      className={joinClassNames(
        'fixed inset-0 bg-black/55 backdrop-blur-[6px] flex items-center justify-center p-4 overflow-y-auto overscroll-contain',
        overlayClassName
      )}
      style={{ zIndex, ...overlayStyle }}
      onClick={() => {
        if (closeOnOverlayClick && isTopModal(modalId)) onClose();
      }}
    >
      <Content
        ref={contentRef}
        {...contentMotion}
        role={role}
        aria-modal="true"
        aria-label={ariaLabelledBy ? undefined : title}
        aria-labelledby={ariaLabelledBy}
        className={joinClassNames(
          'relative w-full mat-sheet rounded-[28px] outline-none',
          // Default width only when the caller sets none: two max-w utilities would fight on CSS order.
          !/(^|\s)!?max-w-/.test(contentClassName ?? '') && 'max-w-lg',
          contentClassName
        )}
        style={{ marginTop: 'auto', marginBottom: 'auto', ...contentStyle }}
        tabIndex={-1}
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="pressable absolute top-2 right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-slate-300 hover:text-white group"
            aria-label={closeLabel}
          >
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[rgb(118_118_128/0.28)] transition-colors group-hover:bg-[rgb(118_118_128/0.42)]">
              <X size={15} strokeWidth={2.6} />
            </span>
          </button>
        )}
        {children}
      </Content>
    </Overlay>
  ) : null;

  return createPortal(MOTION_DISABLED ? dialog : <AnimatePresence>{dialog}</AnimatePresence>, document.body);
};

export default Modal;
