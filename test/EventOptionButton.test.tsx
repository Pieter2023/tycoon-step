import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { motion } from 'framer-motion';

/**
 * Test component that replicates the event option button structure from App.tsx
 * This tests that clicking anywhere on the button row triggers the handler.
 */
const EventOptionButton = ({
  label,
  cashChange,
  onClick,
}: {
  label: string;
  cashChange: number;
  onClick: () => void;
}) => (
  <motion.button
    data-testid="event-option-button"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex w-full items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800 active:scale-[0.98]"
  >
    <span data-testid="option-label" className="text-white font-medium">
      {label}
    </span>
    {cashChange !== 0 && (
      <span
        data-testid="option-cash"
        className={`ml-2 text-sm flex-shrink-0 ${cashChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
      >
        ({cashChange >= 0 ? '+' : ''}${Math.abs(cashChange).toLocaleString()})
      </span>
    )}
  </motion.button>
);

describe('EventOptionButton', () => {
  it('should trigger onClick when clicking the button element directly', async () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Accept the offer" cashChange={5000} onClick={handleClick} />
    );

    const button = screen.getByTestId('event-option-button');
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger onClick when clicking the label text (left side)', async () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Accept the offer" cashChange={5000} onClick={handleClick} />
    );

    const label = screen.getByTestId('option-label');
    await userEvent.click(label);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger onClick when clicking the cash amount (right side)', async () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Accept the offer" cashChange={5000} onClick={handleClick} />
    );

    const cashSpan = screen.getByTestId('option-cash');
    await userEvent.click(cashSpan);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger onClick when clicking center of button using coordinates', async () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Accept the offer" cashChange={5000} onClick={handleClick} />
    );

    const button = screen.getByTestId('event-option-button');

    // Simulate click at center of the button
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    fireEvent.click(button, { clientX: centerX, clientY: centerY });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger onClick when clicking right edge of button', async () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Accept the offer" cashChange={5000} onClick={handleClick} />
    );

    const button = screen.getByTestId('event-option-button');

    // Simulate click at right edge of the button
    const rect = button.getBoundingClientRect();
    const rightX = rect.right - 5; // 5px from right edge
    const centerY = rect.top + rect.height / 2;

    fireEvent.click(button, { clientX: rightX, clientY: centerY });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be focusable with Tab and activate with Enter', async () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Accept the offer" cashChange={5000} onClick={handleClick} />
    );

    const button = screen.getByTestId('event-option-button');

    // Focus the button
    button.focus();
    expect(document.activeElement).toBe(button);

    // Press Enter
    await userEvent.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should activate with Space key when focused', async () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Accept the offer" cashChange={5000} onClick={handleClick} />
    );

    const button = screen.getByTestId('event-option-button');

    // Focus and press Space
    button.focus();
    await userEvent.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render without cash change span when cashChange is 0', () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Do nothing" cashChange={0} onClick={handleClick} />
    );

    expect(screen.queryByTestId('option-cash')).not.toBeInTheDocument();
    expect(screen.getByTestId('option-label')).toHaveTextContent('Do nothing');
  });

  it('should display negative cash change correctly', () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Pay the fine" cashChange={-500} onClick={handleClick} />
    );

    const cashSpan = screen.getByTestId('option-cash');
    // The component shows absolute value with parentheses for negative numbers
    expect(cashSpan).toHaveTextContent('($500)');
    expect(cashSpan).toHaveClass('text-red-400');
  });

  it('should display positive cash change correctly', () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Accept bonus" cashChange={1000} onClick={handleClick} />
    );

    const cashSpan = screen.getByTestId('option-cash');
    expect(cashSpan).toHaveTextContent('(+$1,000)');
    expect(cashSpan).toHaveClass('text-emerald-400');
  });

  it('should have proper accessibility attributes', () => {
    const handleClick = vi.fn();
    render(
      <EventOptionButton label="Accept the offer" cashChange={5000} onClick={handleClick} />
    );

    const button = screen.getByTestId('event-option-button');

    // Should be a button element
    expect(button.tagName).toBe('BUTTON');

    // Should have cursor-pointer class (indicates clickability)
    expect(button).toHaveClass('cursor-pointer');

    // Should have flex and w-full for full-width clickability
    expect(button).toHaveClass('flex', 'w-full');
  });
});

/**
 * Test component that replicates the Kids mode event option button structure
 */
const KidsEventOptionButton = ({
  label,
  cashChange,
  onClick,
}: {
  label: string;
  cashChange: number;
  onClick: () => void;
}) => (
  <motion.button
    data-testid="kids-event-option-button"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex w-full p-4 rounded-2xl font-bold text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] ${
      cashChange >= 0
        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 focus:ring-green-500 focus:ring-offset-white'
        : 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 hover:from-orange-200 hover:to-amber-200 focus:ring-orange-500 focus:ring-offset-white'
    }`}
  >
    <div className="flex w-full justify-between items-center">
      <span data-testid="kids-option-label">{label}</span>
      <span
        data-testid="kids-option-cash"
        className={`flex-shrink-0 ${cashChange >= 0 ? 'text-green-600' : 'text-orange-600'}`}
      >
        {cashChange >= 0 ? '+' : ''}${Math.abs(cashChange).toLocaleString()}
      </span>
    </div>
  </motion.button>
);

describe('KidsEventOptionButton', () => {
  it('should trigger onClick when clicking the button element directly', async () => {
    const handleClick = vi.fn();
    render(
      <KidsEventOptionButton label="Help your friend" cashChange={100} onClick={handleClick} />
    );

    const button = screen.getByTestId('kids-event-option-button');
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger onClick when clicking the label (left side)', async () => {
    const handleClick = vi.fn();
    render(
      <KidsEventOptionButton label="Help your friend" cashChange={100} onClick={handleClick} />
    );

    const label = screen.getByTestId('kids-option-label');
    await userEvent.click(label);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger onClick when clicking the cash amount (right side)', async () => {
    const handleClick = vi.fn();
    render(
      <KidsEventOptionButton label="Help your friend" cashChange={100} onClick={handleClick} />
    );

    const cashSpan = screen.getByTestId('kids-option-cash');
    await userEvent.click(cashSpan);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard accessible (Enter key)', async () => {
    const handleClick = vi.fn();
    render(
      <KidsEventOptionButton label="Help your friend" cashChange={100} onClick={handleClick} />
    );

    const button = screen.getByTestId('kids-event-option-button');
    button.focus();
    await userEvent.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard accessible (Space key)', async () => {
    const handleClick = vi.fn();
    render(
      <KidsEventOptionButton label="Help your friend" cashChange={100} onClick={handleClick} />
    );

    const button = screen.getByTestId('kids-event-option-button');
    button.focus();
    await userEvent.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should have flex and w-full classes for full-width clickability', () => {
    const handleClick = vi.fn();
    render(
      <KidsEventOptionButton label="Help your friend" cashChange={100} onClick={handleClick} />
    );

    const button = screen.getByTestId('kids-event-option-button');
    expect(button).toHaveClass('flex', 'w-full');
  });
});
