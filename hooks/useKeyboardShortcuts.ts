import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  action: () => void;
  description: string;
  modifier?: 'ctrl' | 'alt' | 'shift' | 'meta';
  preventDefault?: boolean;
  ignoreRepeat?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[], enabled: boolean = true) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      if (event.defaultPrevented) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isTyping) return;

      shortcuts.forEach((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        if (!keyMatches) return;
        if (shortcut.ignoreRepeat && event.repeat) return;

        // Unmodified shortcuts must not fire with any modifier held; the
        // shift exception lets shifted characters like '?' through.
        const modifierMatches = shortcut.modifier
          ? event[`${shortcut.modifier}Key`]
          : !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey &&
            (!event.shiftKey || event.key === shortcut.key);

        if (modifierMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
        }
      });
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Common game shortcuts — the single source of truth for in-game key
// bindings. The same array drives the keydown listener AND the "?" overlay.
export const createGameShortcuts = (handlers: {
  onNextMonth: () => void;
  onConfirmPreview: () => void;
  onToggleAutoplay: () => void;
  onOpenActions: () => void;
  onNavigateToInvest: () => void;
  onNavigateToPortfolio: () => void;
  onNavigateToBank: () => void;
  onNavigateToCareer: () => void;
  onNavigateToEducation: () => void;
  onNavigateToSideHustles: () => void;
  onNavigateToLifestyle: () => void;
  onShowShortcuts?: () => void;
}): ShortcutConfig[] => [
  {
    key: 'n',
    action: handlers.onNextMonth,
    description: 'Next Month',
    preventDefault: true,
  },
  {
    key: 'Enter',
    action: handlers.onConfirmPreview,
    description: 'Confirm Preview',
    preventDefault: false,
  },
  {
    key: 't',
    action: handlers.onToggleAutoplay,
    description: 'Toggle Autoplay',
    preventDefault: true,
  },
  {
    key: 'a',
    modifier: 'shift',
    action: handlers.onToggleAutoplay,
    description: 'Toggle Autoplay',
    ignoreRepeat: true,
    preventDefault: true,
  },
  {
    key: 'a',
    action: handlers.onOpenActions,
    description: 'Actions Panel',
    preventDefault: true,
  },
  {
    key: 'i',
    action: handlers.onNavigateToInvest,
    description: 'Invest Tab',
    preventDefault: true,
  },
  {
    key: 'p',
    action: handlers.onNavigateToPortfolio,
    description: 'Portfolio',
    preventDefault: true,
  },
  {
    key: 'b',
    action: handlers.onNavigateToBank,
    description: 'Bank',
    preventDefault: true,
  },
  {
    key: 'c',
    action: handlers.onNavigateToCareer,
    description: 'Career',
    preventDefault: true,
  },
  {
    key: 'e',
    action: handlers.onNavigateToEducation,
    description: 'Education',
    preventDefault: true,
  },
  {
    key: 's',
    action: handlers.onNavigateToSideHustles,
    description: 'Side Hustles',
    preventDefault: true,
  },
  {
    key: 'l',
    action: handlers.onNavigateToLifestyle,
    description: 'Lifestyle',
    preventDefault: true,
  },
  {
    key: '?',
    action: handlers.onShowShortcuts || (() => {}),
    description: 'Show Shortcuts',
    preventDefault: true,
  },
];

export default useKeyboardShortcuts;
