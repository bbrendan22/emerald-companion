import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const root=process.argv[2]
assert(root,'Usage: node tools/buildTypeChart.mjs /path/to/pokeemerald')
const text=await fs.readFile(`${root}/src/battle_main.c`,'utf8')
const block=text.match(/const u8 gTypeEffectiveness\[\d+\]\s*=\s*\{([\s\S]*?)\};/)[1]
const values={NOT_EFFECTIVE:0.5,SUPER_EFFECTIVE:2,NO_EFFECT:0}
const chart={}
for(const m of block.matchAll(/TYPE_(\w+),\s*TYPE_(\w+),\s*TYPE_MUL_(\w+)/g)){
 if(['FORESIGHT','ENDTABLE'].includes(m[1]))continue
 ;(chart[m[1]]??={})[m[2]]=values[m[3]]
}
assert.equal(chart.DARK.STEEL,0.5)
assert.equal(chart.GHOST.STEEL,0.5)
assert.equal(chart.NORMAL.GHOST,0)
await fs.writeFile(new URL('../src/data/typeChart.js',import.meta.url),`// Generated from pret/pokeemerald gTypeEffectiveness. Unlisted matchups are neutral.\nexport const emeraldTypeChart = ${JSON.stringify(chart)}\n`)
