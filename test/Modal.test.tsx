import React, { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../components/Modal';
import { I18nProvider } from '../i18n';

const ModalHarness: React.FC = () => {
  const [open, setOpen] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open modal
      </button>
      <button type="button">Outside button</button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        ariaLabel="Test modal"
        closeOnOverlayClick
        closeOnEsc
        initialFocusRef={primaryRef}
      >
        <div className="p-4 space-y-2">
          <button type="button" ref={primaryRef}>
            Primary
          </button>
          <button type="button">Secondary</button>
        </div>
      </Modal>
    </div>
  );
};

it('traps focus, restores focus, and locks scroll', async () => {
  const user = userEvent.setup();
  render(
    <I18nProvider>
      <ModalHarness />
    </I18nProvider>
  );

  const openButton = screen.getByRole('button', { name: 'Open modal' });
  await user.click(openButton);

  await new Promise((resolve) => setTimeout(resolve, 0));
  const primary = screen.getByRole('button', { name: 'Primary' });
  const secondary = screen.getByRole('button', { name: 'Secondary' });
  const closeButton = screen.getByRole('button', { name: 'Close modal' });

  expect(document.body.style.overflow).toBe('hidden');
  expect(primary).toHaveFocus();

  await user.tab();
  expect([primary, secondary, closeButton]).toContain(document.activeElement);

  await user.tab();
  expect([primary, secondary, closeButton]).toContain(document.activeElement);

  await user.tab({ shift: true });
  expect([primary, secondary, closeButton]).toContain(document.activeElement);

  await user.keyboard('{Escape}');
  expect(openButton).toHaveFocus();
  expect(document.body.style.overflow).toBe('');
});

it('closes on overlay click', async () => {
  const user = userEvent.setup();
  render(
    <I18nProvider>
      <ModalHarness />
    </I18nProvider>
  );

  await user.click(screen.getByRole('button', { name: 'Open modal' }));
  const dialog = screen.getByRole('dialog', { name: 'Test modal' });
  const overlay = dialog.parentElement;

  expect(overlay).not.toBeNull();
  if (!overlay) return;

  await user.click(overlay);
  expect(screen.queryByRole('dialog', { name: 'Test modal' })).toBeNull();
});
