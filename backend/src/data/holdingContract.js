// public.portfolios: INTEGER shares, NUMERIC(10,2) average cost in KES.
// No Engine calculations or stored values are changed by this input contract.
export function costMinorUnits(value){
 if(typeof value!=='number'&&typeof value!=='string')return null;
 const text=String(value);if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(text))return null;
 const [whole,fraction='']=text.split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
}
export function holdingInputError(row,partial=false){
 if(!row||typeof row!=='object')return 'A holding is required';
 const sharesPresent=row.shares!==undefined,costPresent=row.avg_cost!==undefined;
 if(!partial&&(!sharesPresent||!costPresent))return 'Shares and average cost are required';
 if(sharesPresent&&(!Number.isInteger(Number(row.shares))||Number(row.shares)<1||Number(row.shares)>2147483647||!/^\d+$/.test(String(row.shares))))return 'Shares must be a whole number from 1 to 2147483647';
 const cost=costPresent?costMinorUnits(row.avg_cost):null;
 if(costPresent&&(cost===null||cost<=0n))return 'Average cost must be positive KES with at most two decimal places';
 if(sharesPresent&&costPresent&&BigInt(row.shares)*cost>BigInt(Number.MAX_SAFE_INTEGER))return 'Total cost exceeds the supported exact minor-unit range';
 return null;
}
export function combinedAverageCost(oldShares,oldCost,addedShares,addedCost){
 if(holdingInputError({shares:oldShares,avg_cost:oldCost})||holdingInputError({shares:addedShares,avg_cost:addedCost}))return null;
 const shares=BigInt(oldShares)+BigInt(addedShares);
 if(shares>2147483647n)return null;
 const total=BigInt(oldShares)*costMinorUnits(oldCost)+BigInt(addedShares)*costMinorUnits(addedCost);
 if(total>BigInt(Number.MAX_SAFE_INTEGER))return null;
 // Positive NUMERIC(10,2) round-half-up, once at the stored average-cost boundary.
 const cents=(2n*total+shares)/(2n*shares);
 return Number(cents)/100;
}
