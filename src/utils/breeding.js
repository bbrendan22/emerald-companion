import { eggGroups } from '../data/breedingResources.js'
import { speciesInfo } from '../data/emeraldData.js'
export const eggGroupNames={MONSTER:'Monster',WATER_1:'Water 1',WATER_2:'Water 2',WATER_3:'Water 3',BUG:'Bug',FLYING:'Flying',FIELD:'Field',FAIRY:'Fairy',GRASS:'Grass',HUMAN_LIKE:'Human-Like',MINERAL:'Mineral',AMORPHOUS:'Amorphous',DITTO:'Ditto',DRAGON:'Dragon',NO_EGGS_DISCOVERED:'Undiscovered'}
export function speciesGenders(id){const ratio=speciesInfo[id]?.genderRatio;return ratio===255?['Genderless']:ratio===254?['Female']:ratio===0?['Male']:['Female','Male']}
export function partnerGenders(parentId,parentGender,partnerId){
 const first=eggGroups[parentId],second=eggGroups[partnerId]
 if(!first||!second||!speciesGenders(parentId).includes(parentGender)||first.includes('NO_EGGS_DISCOVERED')||second.includes('NO_EGGS_DISCOVERED'))return []
 if(first.includes('DITTO')&&second.includes('DITTO'))return []
 if(first.includes('DITTO'))return speciesGenders(partnerId)
 if(second.includes('DITTO'))return ['Genderless']
 if(parentGender==='Genderless'||!first.some(group=>second.includes(group)))return []
 return speciesGenders(partnerId).filter(g=>g!=='Genderless'&&g!==parentGender)
}
