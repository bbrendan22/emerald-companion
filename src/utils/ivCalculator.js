export const ivStats = [['hp','HP'],['attack','Attack'],['defense','Defense'],['spAttack','Sp. Attack'],['spDefense','Sp. Defense'],['speed','Speed']]
export const ivNatures = ['Hardy','Lonely','Brave','Adamant','Naughty','Bold','Docile','Relaxed','Impish','Lax','Timid','Hasty','Serious','Jolly','Naive','Modest','Mild','Quiet','Bashful','Rash','Calm','Gentle','Sassy','Careful','Quirky']
const natureOrder=['attack','defense','speed','spAttack','spDefense']
export function emeraldStat(base,key,iv,ev,level,nature,shedinja=false){
 if(key==='hp'&&shedinja)return 1
 const value=Math.floor((2*base+iv+Math.floor(ev/4))*level/100)
 if(key==='hp')return value+level+10
 const n=ivNatures.indexOf(nature),up=Math.floor(n/5),down=n%5
 const multiplier=up===down?100:natureOrder[up]===key?110:natureOrder[down]===key?90:100
 return Math.floor((value+5)*multiplier/100)
}
const whole=(v,min,max)=>v!==''&&v!=null&&Number.isInteger(Number(v))&&Number(v)>=min&&Number(v)<=max
export function calculateIVRanges(base,nature,readings,shedinja=false){
 if(!base||!ivNatures.includes(nature))return {error:'Choose a species and nature.'}
 for(const reading of readings){
  if(!whole(reading.level,1,100))return {error:'Each reading needs a level from 1 to 100.'}
  if(ivStats.some(([key])=>!whole(reading.evs[key],0,255)))return {error:'Each EV must be a whole number from 0 to 255.'}
  if(ivStats.reduce((sum,[key])=>sum+Number(reading.evs[key]),0)>510)return {error:'Total EVs cannot exceed 510 in any reading.'}
  if(ivStats.some(([key])=>reading.stats[key]!==''&&!whole(reading.stats[key],1,999)))return {error:'Stats must be whole numbers from 1 to 999, or left blank.'}
 }
 const ranges=Object.fromEntries(ivStats.map(([key])=>{
  const observations=readings.filter(r=>r.stats[key]!=='')
  if(!observations.length)return [key,null]
  return [key,Array.from({length:32},(_,iv)=>iv).filter(iv=>observations.every(r=>emeraldStat(base[key],key,iv,Number(r.evs[key]),Number(r.level),nature,shedinja)===Number(r.stats[key])))]
 }))
 return {ranges}
}
