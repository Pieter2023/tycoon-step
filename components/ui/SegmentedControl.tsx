import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { springs } from './motion';

export type SegmentedOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Accessible name when the label is not plain text. */
  ariaLabel?: string;
  disabled?: boolean;
  /** Extra attributes a caller's tests rely on (ids, aria-controls, data-*). */
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 'tablist' → role=tab + aria-selected; 'radiogroup' → role=radio + aria-checked; 'group' → aria-pressed. */
  role?: 'tablist' | 'radiogroup' | 'group';
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Stretch the segments to fill the row. */
  fill?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: 'min-h-[30px] px-3 text-[13px]',
  md: 'min-h-[36px] px-4 text-sm',
  lg: 'min-h-[44px] px-5 text-[15px]'
};

/**
 * Apple's segmented control: a recessed track with a raised thumb that glides to the chosen
 * segment (a spring re-targeted from wherever it is, so rapid clicks never jump).
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  role = 'tablist',
  ariaLabel,
  size = 'md',
  fill = false,
  className = ''
}: SegmentedControlProps<T>) {
  const thumbId = useId();
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={`relative inline-flex max-w-full items-stretch gap-0.5 overflow-x-auto no-scrollbar rounded-[12px] bg-[rgb(118_118_128/0.2)] p-[3px] ${fill ? 'flex w-full' : ''} ${className}`.trim()}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const roleProps =
          role === 'tablist'
            ? { role: 'tab', 'aria-selected': selected }
            : role === 'radiogroup'
              ? { role: 'radio', 'aria-checked': selected }
              : { 'aria-pressed': selected };
        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            {...roleProps}
            {...option.buttonProps}
            className={`pressable relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] font-semibold outline-offset-0 transition-colors duration-200 disabled:opacity-40 ${sizeClasses[size]} ${fill ? 'flex-1' : ''} ${
              selected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`seg-thumb-${thumbId}`}
                transition={springs.glide}
                className="absolute inset-0 rounded-[9px] bg-[#636366] shadow-[0_3px_8px_rgb(0_0_0/0.28),0_1px_1px_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.12)]"
                aria-hidden
              />
            )}
            <span className="relative z-[1] flex items-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
