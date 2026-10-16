import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import {createReadStream} from 'node:fs'
import {stat} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'

// Local design review serves the exported stills without adding 92 MB to deployments.
const bdspPreviewAssets={
  name:'bdsp-preview-stills',
  apply:'serve',
  configureServer(server){
    server.middlewares.use(async(req,res,next)=>{
      const path=new URL(req.url,'http://localhost').pathname
      if(path.endsWith('/__bdsp-sizing.json')){
        try{const {readFile}=await import('node:fs/promises');res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(await readFile(new URL('./tools/bdsp-tester/stills/balanced/report.json',import.meta.url)))}catch{res.statusCode=404;res.end('Sizing report unavailable')}
        return
      }
      const match=path.match(/^(?:\/emerald-companion)?\/__bdsp-(stills|normalized|balanced)\/(front|back|front_shiny|back_shiny)\/([1-9]\d{0,2})\.webp$/)
      if(!match||Number(match[3])>386)return next()
      const file=fileURLToPath(new URL(`./tools/bdsp-tester/stills/${match[1]==='stills'?'webp':match[1]}/${match[2]}/${match[3]}.webp`,import.meta.url))
      try{
        const info=await stat(file)
        res.setHeader('Content-Type','image/webp')
        res.setHeader('Content-Length',info.size)
        res.setHeader('Cache-Control','no-store')
        if(req.method==='HEAD')return res.end()
        createReadStream(file).on('error',()=>res.destroy()).pipe(res)
      }catch{res.statusCode=404;res.end('Still image unavailable')}
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  base: '/emerald-companion/',
  plugins: [react(),bdspPreviewAssets],
})
