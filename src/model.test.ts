import { describe, expect, it } from 'vitest'
import { calculate, demoData } from './model'

describe('Money Bloom financial calculations',()=>{
 it('reconciles the demo balances, income goal, expenses and liabilities',()=>{
  const d=demoData(), c=calculate(d)
  expect(c.income).toBe(145000); expect(c.goalPercent).toBe(29); expect(c.remainingGoal).toBe(355000)
  expect(c.expenses).toBe(38500); expect(c.repayments).toBe(29500)
  expect(c.bank).toBe(67000); expect(c.cash).toBe(10000); expect(c.available).toBe(77000)
  expect(c.remainingDebt).toBe(66000)
 })
 it('keeps transfers out of income, spending and total available balance',()=>{
  const d=demoData(), before=calculate(d); d.transactions.push({...d.transactions[0],id:'extra-transfer',type:'transfer',amount:1000,account:'Bank',toAccount:'Cash'})
  const after=calculate(d); expect(after.income).toBe(before.income); expect(after.expenses).toBe(before.expenses); expect(after.available).toBe(before.available)
 })
 it('does not treat forecasts as received income',()=>{
  const d=demoData(), before=calculate(d); d.opportunities[0].expected=1000000
  expect(calculate(d).income).toBe(before.income)
 })
})
