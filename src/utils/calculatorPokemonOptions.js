import { pokemonMeta } from '../data/pokemonMeta.js'
import { deoxysForms } from '../data/deoxysForms.js'
export const calculatorPokemonOptions=Object.entries(pokemonMeta)
 .filter(([,meta])=>meta.dex>=1 && meta.dex<=386 && meta.generation<=3)
 .flatMap(([id,meta])=>meta.dex===386
   ? Object.entries(deoxysForms).map(([form,entry])=>({value:`${id}:${form}`,label:`Deoxys (${entry.name})`}))
   : [{value:id,label:meta.name}])
 .sort((a,b)=>a.label.localeCompare(b.label))
