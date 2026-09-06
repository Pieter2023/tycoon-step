import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi, afterEach } from 'vitest';
import TellerPanel from '../components/town/TellerPanel';
import CartShiftPanel from '../components/town/CartShiftPanel';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
const state=()=>({...structuredClone(INITIAL_GAME_STATE),character:CHARACTERS[0],cash:8000});
afterEach(cleanup);
it('submits the visible teller amount and blocks empty withdrawals',async()=>{
  const onTransfer=vi.fn(),user=userEvent.setup();
  render(<TellerPanel state={state()} disabled={false} onTransfer={onTransfer} loans={[]} onLoans={vi.fn()} onReserve={vi.fn()} onBusiness={vi.fn()}/>);
  await user.click(screen.getByRole('button',{name:'Deposit to savings'}));expect(onTransfer).toHaveBeenCalledWith({direction:'deposit',amount:500});
  await user.click(screen.getByRole('button',{name:'Withdraw',exact:true}));expect(screen.getByRole('button',{name:'Withdraw to cash'})).toBeDisabled();
});
it('shows the actual loss for a stock plan and submits the selected price and stock',async()=>{
  const onRun=vi.fn(),user=userEvent.setup();
  render(<CartShiftPanel state={{...state(),month:3}} disabled={false} onRun={onRun}/>);
  await user.click(screen.getByRole('button',{name:'$3 per cup'}));await user.click(screen.getByRole('button',{name:'24 cups · $48'}));
  expect(screen.getByText(/14 sales, −\$24 loss/)).toBeVisible();
  await user.click(screen.getByRole('button',{name:'Open pop-up shift · commit $66'}));expect(onRun).toHaveBeenCalledWith({price:3,stock:24});
});
it('keeps a saved completed shift as a receipt rather than another payable action',()=>{
  render(<CartShiftPanel state={{...state(),month:3,townProgress:{lastShift:{month:3,price:3,stock:24,weather:'Rainy afternoon',sold:14,revenue:42,costs:66,profit:-24}}}} disabled={false} onRun={vi.fn()}/>);
  expect(screen.getByText('−$24')).toBeVisible();expect(screen.queryByRole('button',{name:/Open pop-up/})).not.toBeInTheDocument();
});
