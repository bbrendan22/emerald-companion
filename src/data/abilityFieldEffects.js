// Generation III field mechanics, checked against pret/pokeemerald,
// pret/pokeruby and pret/pokefirered. Kept separate from generated summaries.
const emerald = description => ({ games: 'Emerald', description })
const hatching = emerald('In the party, roughly halves egg-hatching time.')
export const abilityFieldEffects = {
  1: { games: '', description: 'Leading the party halves wild encounters. In Emerald’s Battle Pyramid, the reduction is 25% instead.' },
  8: emerald('Leading the party halves wild encounters during sandstorms.'),
  9: emerald('Leading the party gives a 50% chance of Electric-type encounters, where available.'),
  14: emerald('Leading the party raises wild held-item chances from 50%/5% to 60%/20%.'),
  21: emerald('Leading the party increases fishing bites.'),
  22: emerald('Leading the party gives a 50% chance to skip encounters at least five levels lower.'),
  28: emerald('Leading the party gives a 50% chance of wild Pokémon matching its nature.'),
  31: emerald('Leading the party doubles Match Call chances.'),
  35: { games: '', description: 'Leading the party doubles wild encounters.' },
  40: hatching,
  42: emerald('Leading the party gives a 50% chance of Steel-type encounters, where available.'),
  46: emerald('Leading the party gives a 50% chance of the highest encounter-slot level.'),
  49: hatching,
  51: emerald('Leading the party gives a 50% chance to skip encounters at least five levels lower.'),
  52: emerald('Cut clears a 5 × 5 grass area instead of 3 × 3.'),
  53: { games: '', description: 'With no held item, has a 10% chance to find an item after battle. Items vary by game and, in Emerald, level.' },
  55: emerald('Leading the party gives a 50% chance of the highest encounter-slot level.'),
  56: emerald('Leading the party gives a ⅔ chance of opposite-gender encounters, where possible.'),
  60: emerald('Leading the party increases fishing bites.'),
  68: emerald('Leading the party doubles the frequency of wild Pokémon cries.'),
  71: emerald('Leading the party doubles wild encounters.'),
  72: emerald('Leading the party gives a 50% chance of the highest encounter-slot level.'),
  73: emerald('Leading the party halves wild encounters.'),
}
