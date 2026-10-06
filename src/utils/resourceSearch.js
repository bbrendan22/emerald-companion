import { moveNames, abilityNames } from '../data/emeraldData'
import { moveResources } from '../data/moveResources'
import { abilityResources } from '../data/abilityResources'
const physicalTypes = new Set(['NORMAL','FIGHTING','FLYING','POISON','GROUND','ROCK','BUG','GHOST','STEEL'])
const category = move => move.power === 0 ? 'Status' : physicalTypes.has(move.type) ? 'Physical' : 'Special'
const moves = Object.entries(moveResources).map(([id, move]) => ({id, name:moveNames[id], ...move})).sort((a,b) => a.name.localeCompare(b.name))
const abilities = Object.entries(abilityResources).map(([id, data]) => ({id, name:abilityNames[id], ...data})).sort((a,b) => a.name.localeCompare(b.name))
export const matchingMoves = ({search, type, kind}) => moves.filter(move => move.name.toLowerCase().startsWith(search.trim().toLowerCase()) && (!type || type === 'all' || move.type === type) && (!kind || kind === 'all' || category(move) === kind))
export const matchingAbilities = ({search}) => abilities.filter(ability => ability.name.toLowerCase().startsWith(search.trim().toLowerCase()))
export { moves, abilities }
