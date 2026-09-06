import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { I18nProvider } from '../i18n';
import { CHARACTERS, INITIAL_GAME_STATE } from '../constants';
import TownModal from '../components/town/TownModal';
import { createTownScene } from '../components/town/createTownScene';
vi.mock('../components/town/createTownScene', () => ({ createTownScene: vi.fn() }));
const initial = () => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 1200 });
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const mount = (onClose = vi.fn()) => {
  vi.mocked(createTownScene).mockImplementation(() => { throw new Error('No WebGL'); });
  render(<I18nProvider><TownModal state={initial()} disabled={false} reduceMotion onBuy={vi.fn()} onClose={onClose} onOpenMoney={vi.fn()} onNextMonth={vi.fn()} onBackup={vi.fn()} /></I18nProvider>);
  return onClose;
};

describe('city keyboard and screen-reader support', () => {
  it('closes the side panel with Escape before the city itself', async () => {
    const onClose = mount();
    const panel = screen.getByLabelText('Location opportunities');
    expect(panel).toBeVisible();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(panel).not.toBeVisible());
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('moves focus into the side panel when it opens and back to the trigger when it closes', async () => {
    mount(); const user = userEvent.setup();
    const panel = screen.getByLabelText('Location opportunities');
    await user.click(screen.getByLabelText('Close opportunities'));
    const board = screen.getByRole('button', { name: "Notice board: this month's challenges" });
    board.focus(); await user.click(board);
    await waitFor(() => expect(document.activeElement).toBe(panel));
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(board));
  });
  it('announces where the player is and describes the 3D view for assistive tech', () => {
    mount();
    expect(screen.getByText('On Freedom Square')).toHaveAttribute('role', 'status');
    expect(screen.getByLabelText('Location opportunities')).toHaveAttribute('tabindex', '-1');
  });
});
