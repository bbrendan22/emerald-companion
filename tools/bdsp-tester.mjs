import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat, readFile } from 'node:fs/promises'
import { homedir, networkInterfaces } from 'node:os'
import { join } from 'node:path'
import { pokemonMeta } from '../src/data/pokemonMeta.js'

const assets = join(homedir(), 'Downloads', 'bdsp-assets')
const names = Object.values(pokemonMeta).filter(p => p.dex <= 386)
const port = Number(process.env.BDSP_TEST_PORT || 4174)
const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname
    res.setHeader('Cache-Control', 'no-store')
    if (path === '/pokemon.json') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(names))
      return
    }
    if (path === '/' || path === '/index.html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(await readFile(new URL('./bdsp-tester/index.html', import.meta.url)))
      return
    }
    const match = path.match(/^\/(assets|optimized|light|still|png|balanced20|smooth256|smooth320)\/(front|back|front_shiny|back_shiny)\/([1-9]\d{0,2})\.(webp|png)$/)
    if (!match || Number(match[3]) > 386) {
      res.writeHead(404).end('Not found')
      return
    }
    const profile = match[1]
    const extension = match[4]
    if ((profile === 'png') !== (extension === 'png')) { res.writeHead(404).end('Not found'); return }
    const root = profile === 'assets' ? assets : new URL(
      profile === 'still' ? './bdsp-tester/stills/webp/' : profile === 'png' ? './bdsp-tester/stills/png/' : `./bdsp-tester/${profile}/`, import.meta.url).pathname
    const file = join(root, match[2], `${match[3]}.${extension}`)
    const info = await stat(file)
    res.setHeader('Content-Type', extension === 'png' ? 'image/png' : 'image/webp')
    res.setHeader('Content-Length', info.size)
    if (req.method === 'HEAD') { res.end(); return }
    createReadStream(file).on('error', () => res.destroy()).pipe(res)
  } catch {
    res.writeHead(404).end('Asset unavailable')
  }
})
server.listen(port, '0.0.0.0', () => {
  console.log(`Desktop: http://localhost:${port}/`)
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) console.log(`Phone (same Wi-Fi): http://${address.address}:${port}/`)
    }
  }
})
