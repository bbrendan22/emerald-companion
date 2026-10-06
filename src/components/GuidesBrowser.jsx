import { useState } from 'react'
import BreedingRules from './BreedingRules'
import EggMovesGuide from './EggMovesGuide'
import BreedingGuide from './BreedingGuide'
import MoveTutors from './MoveTutors'
import EVGuide from './EVGuide'
export default function GuidesBrowser({ onBack, onPokemon, onLocation, initialStat, initialEgg, onEggMove, onEggPokemon, initialParent, onBreedingPokemon, initialTutor, onTutorPokemon, onTutorMove, initialGuide=null, onTrainers, onLegacyLocations }){
 const [guide,setGuide]=useState(initialEgg?'eggs':initialParent?'breeding':initialTutor?'tutors':initialStat?'ev':initialGuide)
 return <div className="resources-page"><button className="resources-back" onClick={guide && !initialGuide ? ()=>setGuide(null) : onBack}>← Back</button>{guide==='rules'?<BreedingRules/>:guide==='eggs'?<EggMovesGuide initialEgg={initialEgg} onMove={onEggMove} onPokemon={onEggPokemon}/>:guide==='breeding'?<BreedingGuide initialParent={initialParent} onPokemon={onBreedingPokemon}/>:guide==='tutors'?<MoveTutors initialTutor={initialTutor} onPokemon={onTutorPokemon} onMove={onTutorMove}/>:guide?<EVGuide initialStat={initialStat} onPokemon={onPokemon} onLocation={onLocation}/>:<><div className="resource-list-heading"><h2>Guides</h2></div><nav className="resource-home-menu" aria-label="Guides"><button onClick={()=>setGuide('ev')}>EV Training</button><button onClick={()=>setGuide('tutors')}>Move Tutors</button><button onClick={()=>setGuide('breeding')}>Breeding Partners</button><button onClick={()=>setGuide('eggs')}>Egg Moves</button><button onClick={()=>setGuide('rules')}>Inheritance & Hatching</button><button onClick={onTrainers}>Trainers</button><button onClick={onLegacyLocations}>Explore Hoenn</button></nav><p className="resource-note">Battle Frontier guides will follow.</p></>}</div>
}
