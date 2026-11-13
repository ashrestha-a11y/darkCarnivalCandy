export const CANDIES = ['Green', 'Peppermint', 'Purple', 'Blue', 'Spring'];
export const INITIAL = [0,2,9,0,3];
export const DEFAULT_REQUIREMENTS = [1,5,4,2,2];
export const BASE_RECIPES = [
  {id:'builtin-0',name:'Exchange A',cost:[1,2,1,0,0],gain:[0,0,0,2,2]},
  {id:'builtin-1',name:'Exchange B',cost:[1,1,0,1,0],gain:[0,0,1,0,2]},
  {id:'builtin-2',name:'Exchange C',cost:[0,0,2,0,1],gain:[2,2,0,0,0]},
  {id:'builtin-3',name:'Exchange D',cost:[0,2,1,0,0],gain:[3,0,0,1,0]}
];
export const defaultState = () => ({ inventory:[...INITIAL],requirements:[...DEFAULT_REQUIREMENTS],recipes:BASE_RECIPES.map(r=>({...r,cost:[...r.cost],gain:[...r.gain]})),activeIds:BASE_RECIPES.map(r=>r.id),history:[] });
export const iconUrl = index => `/candy/${CANDIES[index].toLowerCase()}.png`;
export const total = vector => vector.reduce((a,b)=>a+b,0);
export const canPay = (inventory,cost) => cost.every((v,i)=>inventory[i]>=v);
export const applyRecipe = (inventory,recipe) => inventory.map((v,i)=>v-recipe.cost[i]+recipe.gain[i]);
export const meets = (inventory,requirements) => requirements.every((n,i)=>inventory[i]>=n);
export const signature = r=>JSON.stringify([r.cost,r.gain]);
export const customRecipe = (from,to)=>({id:`custom-${from}-${to}`,name:`Custom ${CANDIES[from]} → ${CANDIES[to]}`,cost:CANDIES.map((_,i)=>i===from?3:0),gain:CANDIES.map((_,i)=>i===to?1:0)});
export const customRecipes = CANDIES.flatMap((_,from)=>CANDIES.flatMap((_,to)=>from===to?[]:[customRecipe(from,to)]));
const validVector = (arr,max=999) => Array.isArray(arr)&&arr.length===5&&arr.every(n=>Number.isInteger(n)&&n>=0&&n<=max);
export const validRecipe = r=>r && typeof r.id==='string'&&r.id.length<=100&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=60&&validVector(r.cost,30)&&validVector(r.gain,30)&&total(r.cost)>0&&total(r.gain)>0;
export function normalizeState(raw){
 const fallback=defaultState(); if(!raw||typeof raw!=='object')return fallback;
 const recipes=[],signatures=new Map(),names=new Set(),redirect=new Map();
 for(const candidate of (Array.isArray(raw.recipes)?raw.recipes:[]).slice(0,500)){
  if(!validRecipe(candidate))continue;
  const sig=signature(candidate);
  if(signatures.has(sig)){redirect.set(candidate.id,signatures.get(sig));continue;}
  if(recipes.some(r=>r.id===candidate.id))continue;
  const r={id:candidate.id,name:candidate.name.trim(),cost:[...candidate.cost],gain:[...candidate.gain]};
  const base=r.name; let n=2;
  while(names.has(r.name.toLowerCase())){const suf=` (${n++})`;r.name=base.slice(0,60-suf.length)+suf;}
  names.add(r.name.toLowerCase()); signatures.set(sig,r.id);recipes.push(r);
 }
 const activeIds=[...new Set((Array.isArray(raw.activeIds)?raw.activeIds:[]).map(id=>redirect.get(id)||id))].filter(id=>recipes.some(r=>r.id===id));
 const history=Array.isArray(raw.history)?raw.history.filter(h=>h&&typeof h.name==='string'&&h.name.length<=100&&validVector(h.before)&&validVector(h.after)).slice(-100):[];
 return {inventory:validVector(raw.inventory)?[...raw.inventory]:fallback.inventory,requirements:validVector(raw.requirements)?[...raw.requirements]:fallback.requirements,recipes:recipes.length?recipes:fallback.recipes,activeIds:recipes.length?activeIds:fallback.activeIds,history};
}
export const updateVector = (arr,index,value) => arr.map((n,i)=>i===index?Math.max(0,Math.min(999,Math.trunc(Number(value)||0))):n);
