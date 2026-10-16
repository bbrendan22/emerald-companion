// Apply activated service-worker updates without discarding an open editor.
export function startAppUpdates({baseUrl, window:win=window, document:doc=document, navigator:nav=navigator}) {
  if (!('serviceWorker' in nav)) return () => {}
  let registration, timer, pending=false, reloading=false, stopped=false
  let wasControlled=Boolean(nav.serviceWorker.controller)
  const reloadWhenSafe=()=>{
    if (!pending||reloading||doc.visibilityState!=='visible'||nav.onLine===false) return
    if (doc.activeElement?.matches('input,textarea,select,[contenteditable="true"]') || doc.querySelector('dialog[open],[role="dialog"]')) {
      win.clearTimeout(timer)
      timer=win.setTimeout(reloadWhenSafe,1000)
      return
    }
    reloading=true
    win.location.reload()
  }
  const changed=()=>{
    // First installation needs no reload; only an update of an existing client.
    if (!wasControlled) {wasControlled=true;return}
    pending=true
    reloadWhenSafe()
  }
  const check=()=>{
    if (doc.visibilityState!=='visible'||nav.onLine===false) return
    registration?.update().catch(()=>{})
    reloadWhenSafe()
  }
  nav.serviceWorker.addEventListener('controllerchange',changed)
  win.addEventListener('focus',check)
  win.addEventListener('pageshow',check)
  win.addEventListener('online',check)
  doc.addEventListener('visibilitychange',check)
  nav.serviceWorker.register(`${baseUrl}sw.js`,{updateViaCache:'none'}).then(result=>{
    if (stopped) return
    registration=result
    check()
  }).catch(()=>{}) // Offline startup remains usable with the installed worker.
  const interval=win.setInterval(check,5*60*1000)
  return ()=>{
    stopped=true
    win.clearInterval(interval)
    win.clearTimeout(timer)
    nav.serviceWorker.removeEventListener('controllerchange',changed)
    win.removeEventListener('focus',check)
    win.removeEventListener('pageshow',check)
    win.removeEventListener('online',check)
    doc.removeEventListener('visibilitychange',check)
  }
}
