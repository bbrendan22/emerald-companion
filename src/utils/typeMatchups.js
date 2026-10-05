import { emeraldTypeChart } from '../data/typeChart.js'
export const emeraldTypes=['NORMAL','FIGHTING','FLYING','POISON','GROUND','ROCK','BUG','GHOST','STEEL','FIRE','WATER','GRASS','ELECTRIC','PSYCHIC','ICE','DRAGON','DARK']
export function typeMultiplier(attack,defenders){
 return [...new Set(defenders.filter(Boolean))].reduce((value,type)=>value*(emeraldTypeChart[attack]?.[type]??1),1)
}
