import {canPay,applyRecipe,meets,customRecipes} from './model.js';
export async function findTradePlan(inventory,requirements,fixed,{signal,onProgress,maxStates=170000,maxDepth=13}={}){
 if(meets(inventory,requirements))return {sequence:[],visited:1};
 const recipes=[...fixed,...customRecipes];
 const nodes=[{inventory:[...inventory],parent:-1,action:-1,depth:0}],visited=new Set([inventory.join(',')]);
 let head=0;
 while(head<nodes.length&&nodes.length<maxStates){
  if(signal?.aborted)throw new DOMException('Search cancelled','AbortError');
  const deadline=performance.now()+14;
  while(head<nodes.length&&performance.now()<deadline&&nodes.length<maxStates){
   const idx=head++,node=nodes[idx];if(node.depth>=maxDepth)continue;
   for(let j=0;j<recipes.length;j++){
    const recipe=recipes[j];if(!canPay(node.inventory,recipe.cost))continue;
    const next=applyRecipe(node.inventory,recipe);if(next.some(n=>n>60))continue;
    const key=next.join(',');if(visited.has(key))continue;visited.add(key);
    const nextIndex=nodes.push({inventory:next,parent:idx,action:j,depth:node.depth+1})-1;
    if(meets(next,requirements)){
     const sequence=[];for(let p=nextIndex;nodes[p].parent!==-1;p=nodes[p].parent)sequence.unshift(recipes[nodes[p].action]);
     return {sequence,visited:visited.size};
    }
    if(nodes.length>=maxStates)break;
   }
  }
  onProgress?.(visited.size);
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 return {sequence:null,visited:visited.size,limited:nodes.length>=maxStates};
}
