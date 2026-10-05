import fs from 'node:fs/promises'
const base='https://raw.githubusercontent.com/pret/pokeemerald/master/'
const [constants,source]=await Promise.all(['include/constants/abilities.h','src/data/text/abilities.h'].map(async path=>{const response=await fetch(base+path);if(!response.ok)throw new Error(path);return response.text()}))
const ids=Object.fromEntries([...constants.matchAll(/#define ABILITY_(\w+)\s+(\d+)/g)].map(m=>[m[1],Number(m[2])]))
const descriptions=Object.fromEntries([...source.matchAll(/static const u8 (\w+)\[\] = _\("((?:[^"\\]|\\.)*)"\);/g)].map(m=>[m[1],JSON.parse('"'+m[2]+'"')]))
const abilities={}
for(const m of source.matchAll(/\[ABILITY_(\w+)\]\s*=\s*(s\w+Description)/g)){const id=ids[m[1]];if(id)abilities[id]={description:descriptions[m[2]],unused:m[1]==='CACOPHONY'}}
if(Object.keys(abilities).length!==77||Object.values(abilities).some(a=>!a.description))throw new Error('Incomplete ability data')
await fs.writeFile('src/data/abilityResources.js','// Generated from pret/pokeemerald. Run node tools/buildAbilityResources.mjs\nexport const abilityResources = '+JSON.stringify(abilities,null,2)+'\n')
console.log('Generated 77 ability definitions (including unused Cacophony).')
