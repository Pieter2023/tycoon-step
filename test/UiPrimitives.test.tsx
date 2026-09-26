import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import SegmentedControl from '../components/ui/SegmentedControl';
import ActivityRing from '../components/ui/ActivityRing';
import { MOTION_DISABLED, project, rubberband } from '../components/ui/motion';

// The Apple-style UI primitives (docs/ui-design-system.md). Under Vitest they render final values
// synchronously, so integration tests can read figures without waiting for springs.

it('runs with motion disabled under Vitest', () => {
  expect(MOTION_DISABLED).toBe(true);
});

it('AnimatedNumber shows the formatted value immediately and follows updates', () => {
  const format = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
  const { rerender } = render(<AnimatedNumber value={1200} format={format} />);
  expect(screen.getByText('$1,200')).toHaveClass('num');
  rerender(<AnimatedNumber value={98500} format={format} />);
  expect(screen.getByText('$98,500')).toBeInTheDocument();
});

it('SegmentedControl exposes tabs with aria-selected and reports the choice', async () => {
  const user = userEvent.setup();
  const Harness = () => {
    const [value, setValue] = useState<'invest' | 'bank'>('invest');
    return (
      <SegmentedControl
        ariaLabel="Money sections"
        value={value}
        onChange={setValue}
        options={[{ value: 'invest', label: 'Invest' }, { value: 'bank', label: 'Bank' }]}
      />
    );
  };
  render(<Harness />);
  expect(screen.getByRole('tablist', { name: 'Money sections' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Invest' })).toHaveAttribute('aria-selected', 'true');
  await user.click(screen.getByRole('tab', { name: 'Bank' }));
  expect(screen.getByRole('tab', { name: 'Bank' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Invest' })).toHaveAttribute('aria-selected', 'false');
});

it('SegmentedControl can act as a radio group or a pressed-button group', () => {
  const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
  const { rerender } = render(<SegmentedControl role="radiogroup" value="b" onChange={() => undefined} options={options} />);
  expect(screen.getByRole('radio', { name: 'B' })).toHaveAttribute('aria-checked', 'true');
  rerender(<SegmentedControl role="group" value="a" onChange={() => undefined} options={options} />);
  expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
});

it('ActivityRing is labelled and clamps its progress', () => {
  render(<ActivityRing progress={1.7} ariaLabel="Freedom 170%" />);
  const ring = screen.getByRole('img', { name: 'Freedom 170%' });
  const arc = ring.querySelectorAll('circle')[1];
  expect(arc.getAttribute('stroke-dasharray')).toBe('1 1');
});

it('momentum projection and rubber-banding follow Apple’s curves', () => {
  // A 1000 px/s flick at the normal deceleration rate travels ~499 px.
  expect(project(1000)).toBeCloseTo(499, 0);
  expect(project(0)).toBe(0);
  // Resistance grows with distance: 100 px past the edge moves the element far less than 100 px.
  const moved = rubberband(100, 400);
  expect(moved).toBeGreaterThan(0);
  expect(moved).toBeLessThan(100);
  expect(rubberband(-100, 400)).toBeCloseTo(-moved, 6);
});
