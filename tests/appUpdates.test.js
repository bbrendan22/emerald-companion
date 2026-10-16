import test from 'node:test'
import assert from 'node:assert/strict'
import {startAppUpdates} from '../src/utils/appUpdates.js'

function environment(controlled=true) {
 let reloads=0,editing=false,retry
 const worker=Object.assign(new EventTarget(),{
  controller:controlled?{}:null,
  register:async()=>({update:async()=>{}}),
 })
 const win=Object.assign(new EventTarget(),{
  location:{reload(){reloads++}},
  setInterval(){return 1},clearInterval(){},
  setTimeout(callback){retry=callback;return 2},clearTimeout(){},
 })
 const doc=Object.assign(new EventTarget(),{
  visibilityState:'visible',
  activeElement:{matches:()=>editing},
  querySelector:()=>null,
 })
 const nav={serviceWorker:worker,onLine:true}
 return {win,doc,nav,worker,get reloads(){return reloads},edit(value){editing=value},retry(){retry?.()}}
}
function start(env){return startAppUpdates({baseUrl:'/emerald-companion/',window:env.win,document:env.doc,navigator:env.nav})}

test('an activated update reloads once, without a reload loop',()=>{
 const env=environment();const stop=start(env)
 env.worker.dispatchEvent(new Event('controllerchange'))
 env.worker.dispatchEvent(new Event('controllerchange'))
 assert.equal(env.reloads,1);stop()
})
test('first worker installation does not reload but a later update does',()=>{
 const env=environment(false);const stop=start(env)
 env.worker.dispatchEvent(new Event('controllerchange'))
 assert.equal(env.reloads,0)
 env.worker.dispatchEvent(new Event('controllerchange'))
 assert.equal(env.reloads,1);stop()
})
test('an update waits until editing is finished',()=>{
 const env=environment();env.edit(true);const stop=start(env)
 env.worker.dispatchEvent(new Event('controllerchange'))
 assert.equal(env.reloads,0)
 env.edit(false);env.retry();assert.equal(env.reloads,1);stop()
})
test('a hidden app waits until it returns to the foreground',()=>{
 const env=environment();env.doc.visibilityState='hidden';const stop=start(env)
 env.worker.dispatchEvent(new Event('controllerchange'))
 assert.equal(env.reloads,0)
 env.doc.visibilityState='visible';env.doc.dispatchEvent(new Event('visibilitychange'))
 assert.equal(env.reloads,1);stop()
})
