import {defaultState,normalizeState} from './model.js';
const KEY='darkCarnivalReactStateV1',WORKSPACE='darkCarnivalWorkspaceIdV1';
export function workspaceId(){let id=localStorage.getItem(WORKSPACE);if(!id){id=crypto.randomUUID();localStorage.setItem(WORKSPACE,id)}return id;}
export const getCached=()=>{try{return normalizeState(JSON.parse(localStorage.getItem(KEY)))}catch{return defaultState()}};
export const saveCached=(s)=>localStorage.setItem(KEY,JSON.stringify(s));
export async function loadRemote(){const response=await fetch('/api/state',{headers:{'x-workspace-id':workspaceId()}});if(!response.ok)throw new Error((await response.json().catch(()=>({}))).error||`Server returned ${response.status}`);return (await response.json()).state;}
export async function saveRemote(state){const response=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json','x-workspace-id':workspaceId()},body:JSON.stringify(state)});if(!response.ok)throw new Error((await response.json().catch(()=>({}))).error||`Server returned ${response.status}`);}
