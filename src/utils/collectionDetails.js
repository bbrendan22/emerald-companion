export const collectionRibbonCatalog = [
  ...['Cool','Beauty','Cute','Smart','Tough'].flatMap(category => ['Normal','Super','Hyper','Master'].map((rank,index) => ({
    name:`${category} ${rank} Ribbon`, category, rank:index+1,
    sprite:`${category.toLowerCase()}-ribbon-${index === 0 ? '' : `${rank.toLowerCase()}-`}hoenn`,
  }))),
  ...['Champion','Winning','Victory','Artist','Effort','Marine','Land','Sky','Country','National','Earth','World'].map(name => ({name:`${name} Ribbon`,sprite:`${name.toLowerCase()}-ribbon`})),
]

export function expForLevel(level, growthRate) {
  if (level <= 1) return 0
  const n = level
  switch (growthRate) {
    case 'GROWTH_ERRATIC':
      if (n <= 50) return Math.floor(n ** 3 * (100 - n) / 50)
      if (n <= 68) return Math.floor(n ** 3 * (150 - n) / 100)
      if (n <= 98) return Math.floor(n ** 3 * Math.floor((1911 - 10 * n) / 3) / 500)
      return Math.floor(n ** 3 * (160 - n) / 100)
    case 'GROWTH_FAST':
      return Math.floor(4 * n ** 3 / 5)
    case 'GROWTH_MEDIUM_SLOW':
      return Math.floor(6 * n ** 3 / 5 - 15 * n ** 2 + 100 * n - 140)
    case 'GROWTH_SLOW':
      return Math.floor(5 * n ** 3 / 4)
    case 'GROWTH_FLUCTUATING':
      if (n <= 15) return Math.floor(n ** 3 * (Math.floor((n + 1) / 3) + 24) / 50)
      if (n <= 36) return Math.floor(n ** 3 * (n + 14) / 50)
      return Math.floor(n ** 3 * (Math.floor(n / 2) + 32) / 50)
    default:
      return n ** 3
  }
}

export function levelFromExperience(experience, growthRate) {
  if (experience == null) return null
  const exp = Number(experience)
  let level = 1
  for (let candidate = 2; candidate <= 100; candidate++) {
    if (exp >= expForLevel(candidate, growthRate)) level = candidate
    else break
  }
  return level
}

// Emerald's Verdanturf friendship rater ranges.
// https://bulbapedia.bulbagarden.net/wiki/Friendship_rating
export const friendshipAssessments = [
  {id:'0',min:0,max:0,label:'Detests you'},
  {id:'1',min:1,max:49,label:'Very wary'},
  {id:'50',min:50,max:99,label:'Not used to you'},
  {id:'100',min:100,max:149,label:'Getting used to you'},
  {id:'150',min:150,max:199,label:'Likes you'},
  {id:'200',min:200,max:254,label:'Very happy'},
  {id:'255',min:255,max:255,label:'Adores you'},
]
export function friendshipDisplay(pokemon) {
  if(pokemon.friendship != null) {
    const assessment=friendshipAssessments.find(a=>pokemon.friendship>=a.min && pokemon.friendship<=a.max)
    return `${pokemon.friendship}${assessment ? ` · ${assessment.label}` : ''}`
  }
  const assessment=friendshipAssessments.find(a=>a.id===pokemon.friendshipAssessment)
  return assessment ? `${assessment.label} · ${assessment.min === assessment.max ? assessment.min : `${assessment.min}–${assessment.max}`} (estimated)` : 'Unknown'
}
export function pokerusDisplay(pokemon) {
  if(pokemon?.pokerusStatus) return pokemon.pokerusStatus
  if(pokemon?.pokerus == null) return 'Unknown'
  return !pokemon.pokerus ? 'Never infected' : (pokemon.pokerus & 15) > 0 ? 'Currently infected' : 'Previously infected'
}
export function ribbonEarned(ribbons,ribbon) {
  return (ribbons ?? []).includes(ribbon.name) || Boolean(ribbon.category && (ribbons ?? []).some(name => {
    const match=name.match(new RegExp(`^${ribbon.category} Rank (\\d+)$`))
    return match && Number(match[1]) >= ribbon.rank
  }))
}
export function toggleRibbon(ribbons,ribbon,earned) {
  const names=new Set(collectionRibbonCatalog.filter(r=>ribbonEarned(ribbons,r)).map(r=>r.name))
  if(ribbon.category) for(const r of collectionRibbonCatalog.filter(r=>r.category===ribbon.category)) {
    if(earned && r.rank<=ribbon.rank) names.add(r.name)
    if(!earned && r.rank>=ribbon.rank) names.delete(r.name)
  } else if(earned) names.add(ribbon.name)
  else names.delete(ribbon.name)
  return [...names]
}
