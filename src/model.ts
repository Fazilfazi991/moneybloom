export type TxType = 'income' | 'expense' | 'repayment' | 'transfer'
export type Tx = { id:string; type:TxType; amount:number; date:string; category:string; account:'Bank'|'Cash'; toAccount?:'Bank'|'Cash'; description:string; person?:string; notes?:string; debtId?:string; opportunityId?:string }
export type Debt = { id:string; name:string; lender:string; original:number; borrowed:number; dueDate?:string; installment?:number; interest?:string; notes?:string }
export type Opportunity = { id:string; name:string; expected:number; stage:'Idea'|'Exploring'|'In Progress'|'Payment Pending'|'Paid'; expectedDate?:string; nextAction?:string; notes?:string; contact?:string }
export type Goal = { target:number; startDate:string; deadline?:string }
export type AppData = { transactions:Tx[]; debts:Debt[]; opportunities:Opportunity[]; sources:string[]; expenseCategories:string[]; goal:Goal; displayName:string; theme:'light'|'dark'; isDemo:boolean; currency:string; remindersEnabled:boolean; openingBalances:{Bank:number;Cash:number} }

export const expenseDefaults = ['Food','Travel','Rent','Shopping','Subscriptions','Family','Utilities','Entertainment','Health','Miscellaneous']
export const sourceDefaults = ['Website Projects','CRM Projects','Marketing','Consulting','Affiliate','Other income']
const today='2026-10-26'
const tx=(id:string,type:TxType,amount:number,date:string,category:string,account:'Bank'|'Cash',description:string,extra:Partial<Tx>={}):Tx=>({id,type,amount,date,category,account,description,...extra})

export function demoData():AppData {
 const debts:Debt[]=[
  {id:'d-loan',name:'Personal Loan',lender:'Bank',original:55000,borrowed:0,dueDate:'2026-11-03',installment:5000,interest:'12% p.a.'},
  {id:'d-card',name:'Credit Card',lender:'HDFC Bank',original:22000,borrowed:0,dueDate:'2026-10-29',installment:4000},
  {id:'d-friend',name:'Friend',lender:'Rohan',original:18500,borrowed:0,dueDate:'2026-11-10',installment:2500},
 ]
 return {isDemo:true,displayName:'Alex',theme:'light',currency:'INR',remindersEnabled:true,openingBalances:{Bank:0,Cash:0},goal:{target:500000,startDate:'2026-01-01'},sources:[...sourceDefaults],expenseCategories:[...expenseDefaults],debts,
  opportunities:[
   {id:'o-site',name:'Portfolio website refresh',expected:35000,stage:'In Progress',expectedDate:'2026-11-12',nextAction:'Send the first design draft',contact:'Maya · referral'},
   {id:'o-crm',name:'CRM setup for a local studio',expected:48000,stage:'Exploring',expectedDate:'2026-11-20',nextAction:'Book a discovery call',contact:'Studio North'},
   {id:'o-aff',name:'Affiliate campaign',expected:12000,stage:'Idea',nextAction:'Compare two partner programs'},
   {id:'o-consult',name:'Growth strategy session',expected:18000,stage:'Payment Pending',expectedDate:'2026-10-30',nextAction:'Send a friendly payment reminder',contact:'Noura'},
  ],transactions:[
   tx('i-web','income',62000,'2026-10-03','Website Projects','Bank','Website project · landing page'),
   tx('i-crm','income',48000,'2026-10-07','CRM Projects','Bank','CRM implementation'),
   tx('i-market','income',20000,'2026-10-12','Marketing','Bank','Campaign strategy'),
   tx('i-consult','income',10000,'2026-10-17','Consulting','Bank','Consulting session'),
   tx('i-aff','income',5000,'2026-10-23','Affiliate','Bank','Partner referral'),
   tx('e-rent','expense',12000,'2026-10-02','Rent','Bank','October rent'),
   tx('e-grocery','expense',9000,'2026-10-06','Food','Bank','Groceries'),
   tx('e-travel-bank','expense',1500,'2026-10-10','Travel','Bank','Metro and rides'),
   tx('e-travel-cash','expense',2500,'2026-10-13','Travel','Cash','Local transport'),
   tx('e-subs','expense',3000,'2026-10-15','Subscriptions','Bank','Monthly subscriptions'),
   tx('e-shop','expense',5500,'2026-10-19','Shopping','Bank','Home essentials'),
   tx('e-misc','expense',5000,'2026-10-21','Miscellaneous','Bank','Personal purchases'),
   tx('r-loan','repayment',15000,'2026-10-08','Personal Loan','Bank','Loan payment',{debtId:'d-loan'}),
   tx('r-card','repayment',8000,'2026-10-16','Credit Card','Bank','Card payment',{debtId:'d-card'}),
   tx('r-friend','repayment',6500,'2026-10-22','Friend','Bank','Repayment to Rohan',{debtId:'d-friend'}),
   tx('t-bank-cash','transfer',12500,'2026-10-24','Transfer','Bank','Cash withdrawal',{toAccount:'Cash'}),
  ]}
}

export const blankData=():AppData=>({...demoData(),isDemo:false,transactions:[],debts:[],opportunities:[],goal:{target:500000,startDate:today},sources:[...sourceDefaults],expenseCategories:[...expenseDefaults]})
let displayCurrency='INR'
export const setDisplayCurrency=(currency:string)=>{displayCurrency=currency||'INR'}
export const money=(value:number,currency=displayCurrency)=>new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:0}).format(value||0)
export const shortMoney=(value:number)=>{const symbol=new Intl.NumberFormat('en-IN',{style:'currency',currency:displayCurrency,maximumFractionDigits:0}).formatToParts(0).find(x=>x.type==='currency')?.value||'₹';return value>=100000?`${symbol}${(value/100000).toFixed(value%100000===0?0:1)}L`:value>=1000?`${symbol}${(value/1000).toFixed(value%1000===0?0:1)}k`:money(value)}
export function calculate(data:Pick<AppData,'transactions'|'debts'|'goal'> & Partial<Pick<AppData,'openingBalances'>>){
 const txs=data.transactions, sum=(type:TxType)=>txs.filter(t=>t.type===type).reduce((n,t)=>n+t.amount,0)
 const income=sum('income'), expenses=sum('expense'), repayments=sum('repayment')
 const bank=(data.openingBalances?.Bank||0)+txs.reduce((n,t)=>n+((t.type==='transfer'||t.type==='expense'||t.type==='repayment')&&t.account==='Bank'?-t.amount:t.type==='income'&&t.account==='Bank'?t.amount:t.type==='transfer'&&t.toAccount==='Bank'?t.amount:0),0)
 const cash=(data.openingBalances?.Cash||0)+txs.reduce((n,t)=>n+((t.type==='transfer'||t.type==='expense'||t.type==='repayment')&&t.account==='Cash'?-t.amount:t.type==='income'&&t.account==='Cash'?t.amount:t.type==='transfer'&&t.toAccount==='Cash'?t.amount:0),0)
 const debtRepaid=(debtId:string)=>txs.filter(t=>t.type==='repayment'&&t.debtId===debtId).reduce((n,t)=>n+t.amount,0)
 const debtRemaining=(d:Debt)=>Math.max(0,d.original+d.borrowed-debtRepaid(d.id))
 const remainingDebt=data.debts.reduce((n,d)=>n+debtRemaining(d),0)
 return {income,expenses,repayments,bank,cash,available:bank+cash,remainingGoal:Math.max(0,data.goal.target-income),goalPercent:data.goal.target?Math.round(Math.min(100,income/data.goal.target*100)*100)/100:0,remainingDebt,debtRepaid,debtRemaining}
}
export const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`
