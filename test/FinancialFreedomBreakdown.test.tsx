import React from 'react';
import { render } from '@testing-library/react';
import FinancialFreedomBreakdown from '../components/FinancialFreedomBreakdown';
import { I18nProvider } from '../i18n';

it('renders a financial freedom breakdown snapshot', () => {
  const { container } = render(
    <I18nProvider>
      <FinancialFreedomBreakdown
        passive={1200}
        expenses={1000}
        goalPercent={110}
        lastPassive={1100}
        lastExpenses={950}
      />
    </I18nProvider>
  );

  expect(container).toMatchSnapshot();
});

it('renders a first-month breakdown snapshot', () => {
  const { container } = render(
    <I18nProvider>
      <FinancialFreedomBreakdown
        passive={800}
        expenses={950}
        goalPercent={110}
        lastPassive={null}
        lastExpenses={null}
      />
    </I18nProvider>
  );

  expect(container).toMatchSnapshot();
});
