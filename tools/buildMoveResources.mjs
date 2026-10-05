import fs from 'node:fs/promises'
const base = 'https://raw.githubusercontent.com/pret/pokeemerald/master/'
const [constants, battle, descriptions] = await Promise.all(['include/constants/moves.h','src/data/battle_moves.h','src/data/text/move_descriptions.h'].map(async path => { const response = await fetch(base+path); if (!response.ok) throw new Error(path); return response.text() }))
const ids = Object.fromEntries([...constants.matchAll(/#define MOVE_(\w+)\s+(\d+)/g)].map(m=>[m[1],Number(m[2])]))
const text = Object.fromEntries([...descriptions.matchAll(/static const u8 (\w+)\[\] = _\(([\s\S]*?)\);/g)].map(m=>[m[1],[...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(q=>JSON.parse('"'+q[1]+'"')).join('').replace(/\n/g,' ')]))
const descMap = Object.fromEntries([...descriptions.matchAll(/\[MOVE_(\w+)\s*-\s*1\]\s*=\s*(\w+)/g)].map(m=>[m[1],text[m[2]]]))
const moves = {}
for (const m of battle.matchAll(/\[MOVE_(\w+)\]\s*=\s*\{([\s\S]*?)\n\s*\}/g)) {
 const id=ids[m[1]]; if (!id) continue
 const field = key => m[2].match(new RegExp('\\.'+key+'\\s*=\\s*([\\w-]+)'))?.[1]
 moves[id]={type:field('type')?.replace('TYPE_',''),power:Number(field('power')),accuracy:Number(field('accuracy')),pp:Number(field('pp')),priority:Number(field('priority')),effect:field('effect')?.replace('EFFECT_',''),effectChance:Number(field('secondaryEffectChance')),description:descMap[m[1]]}
}
if(Object.keys(moves).length!==354 || Object.values(moves).some(m=>!m.description||!m.type||!Number.isFinite(m.power)))throw new Error('Incomplete move data')
await fs.writeFile('src/data/moveResources.js','// Generated from pret/pokeemerald. Run node tools/buildMoveResources.mjs\nexport const moveResources = '+JSON.stringify(moves,null,2)+'\n')
console.log('Generated 354 Emerald moves with descriptions and battle data.')
