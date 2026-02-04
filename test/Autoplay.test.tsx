import React, { act, useEffect, useState } from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const AutoplayHarness: React.FC<{ blocked: boolean }> = ({ blocked }) => {
  const [count, setCount] = useState(0);
  const speed = 100;

  useEffect(() => {
    if (blocked) return;
    const t = window.setTimeout(() => {
      setCount((c) => c + 1);
    }, speed);
    return () => window.clearTimeout(t);
  }, [blocked, speed]);

  return <div data-testid="count">{count}</div>;
};

it('pauses autoplay when a decision modal blocks it and resumes after unblocking', () => {
  vi.useFakeTimers();
  const { rerender } = render(<AutoplayHarness blocked />);

  act(() => {
    vi.advanceTimersByTime(200);
  });
  expect(screen.getByTestId('count')).toHaveTextContent('0');

  rerender(<AutoplayHarness blocked={false} />);

  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(screen.getByTestId('count')).toHaveTextContent('1');

  vi.useRealTimers();
});
