import { useState } from 'react'

// Temporary, on-device measurements for the iOS installed-app footer issue.
export default function NavigationDiagnostics({ children }) {
  const [report, setReport] = useState('')
  const inspect = () => {
    const nav = document.querySelector('.bottom-nav')
    if (!nav) return
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;visibility:hidden;height:100lvh;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);box-sizing:content-box'
    document.body.append(probe)
    const safe = getComputedStyle(probe)
    const styles = getComputedStyle(nav)
    const rect = nav.getBoundingClientRect()
    const viewport = window.visualViewport
    const lines = [
      'Layout check 2 · cache v36',
      `Installed: ${Boolean(navigator.standalone || matchMedia('(display-mode: standalone)').matches)}`,
      `Screen: ${screen.width} × ${screen.height}`,
      `Inner: ${innerWidth} × ${innerHeight}`,
      `Document: ${document.documentElement.clientHeight}`,
      `Visual: ${viewport?.height.toFixed(1)} · offset ${viewport?.offsetTop.toFixed(1)}`,
      `100lvh: ${safe.height}`,
      `Safe top/bottom: ${safe.paddingTop} / ${safe.paddingBottom}`,
      `Nav top/bottom: ${rect.top.toFixed(1)} / ${rect.bottom.toFixed(1)}`,
      `Nav height: ${rect.height.toFixed(1)}`,
      `CSS top/bottom: ${styles.top} / ${styles.bottom}`,
      `Transform: ${styles.transform}`,
      `Nav padding: ${styles.paddingBottom}`,
      `Scroll Y: ${scrollY}`,
    ]
    probe.remove()
    setReport(lines.join('\n'))
  }
  return <div style={{display:'contents'}}>
    <button type="button" onClick={inspect} style={{position:'fixed',top:'calc(env(safe-area-inset-top, 0px) + 4px)',right:8,zIndex:2001,padding:'5px 8px',fontSize:11,lineHeight:'16px',border:'1px solid #8eb5cf',borderRadius:4,background:'#101b26',color:'#fff'}}>Layout check</button>
    {children}
    {report && <div role="dialog" aria-label="Navigation layout check" style={{position:'fixed',top:'max(80px, env(safe-area-inset-top))',left:12,right:12,zIndex:2000,padding:14,border:'1px solid #8eb5cf',borderRadius:8,background:'#101b26',color:'#fff',boxShadow:'0 4px 20px #0008'}}>
      <pre style={{fontSize:12,lineHeight:1.6,whiteSpace:'pre-wrap',margin:'0 0 10px'}}>{report}</pre>
      <button type="button" onClick={() => setReport('')} style={{padding:'5px 12px',color:'#fff',background:'#30495d',border:'1px solid #8eb5cf',borderRadius:4}}>Close</button>
    </div>}
  </div>
}
