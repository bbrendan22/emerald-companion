// Emerald stat stages use the 2-based ratio table; paralysis quarters Speed.
export function stageStat(value,stage=0){
 const n=Math.max(-6,Math.min(6,Math.trunc(Number(stage)||0)))
 return Math.floor(value*(n>=0?2+n:2)/(n>=0?2:2-n))
}
export const possibleAbilities=mon=>String(mon?.ability??'Unknown').split(/\s*\/\s*/)
export function battleWeather(weather='none',...abilities){return abilities.some(ability=>['Cloud Nine','Air Lock'].includes(ability))?'none':weather}
export function weatherMove(move,weather){
 if(move.effect!=='WEATHER_BALL'||weather==='none')return move
 return {...move,type:{sun:'FIRE',rain:'WATER',sand:'ROCK',hail:'ICE'}[weather]??move.type,power:100}
}
export function battleSpeed(mon,ability=mon.ability,weather=mon.weather??'none'){
 const active=battleWeather(weather,ability)
 const boost=ability==='Swift Swim'&&active==='rain'||ability==='Chlorophyll'&&active==='sun'?2:1
 let speed=stageStat(mon.stats.speed*boost,mon.stages?.speed)
 if(String(mon.item).toLowerCase()==='macho brace')speed=Math.floor(speed/2)
 if(mon.status==='paralysis')speed=Math.floor(speed/4)
 return speed
}
export function battleSpeedValues(mon,other){return [...new Set(possibleAbilities(mon).flatMap(ability=>possibleAbilities(other).map(otherAbility=>battleSpeed(mon,ability,battleWeather(mon.weather??'none',ability,otherAbility)))))].sort((a,b)=>a-b)}
export function displayedBattleStat(mon,key){return key==='speed'?battleSpeed(mon):key==='hp'?mon.stats.hp:stageStat(mon.stats[key],mon.stages?.[key])}
