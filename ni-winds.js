/* SINOTTICA — directional 10m wind streamlines; NOAA GFS model, not station observations. */
(function(){
'use strict';
const canvas=document.createElement('canvas');
canvas.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:465;width:100%;height:100%';
document.getElementById('map').appendChild(canvas);
const ctx=canvas.getContext('2d');
const toggle=document.getElementById('surfaceWinds');
const status=document.getElementById('windStatus');
let particles=[],key='',last=0;
function sample(w,lat,lon){
 const a=w.lat,b=w.lon;if(!a?.length||!b?.length||a.length<2||b.length<2)return null;
 const dy=a[1]-a[0],dx=b[1]-b[0],y=(lat-a[0])/dy,x=(lon-b[0])/dx;
 const i=Math.floor(y),j=Math.floor(x),fy=y-i,fx=x-j;
 if(i<0||j<0||i+1>=a.length||j+1>=b.length)return null;
 const interp=z=>{
  const q=[z[i]?.[j],z[i]?.[j+1],z[i+1]?.[j],z[i+1]?.[j+1]];
  return q.every(Number.isFinite)?(q[0]*(1-fx)+q[1]*fx)*(1-fy)+(q[2]*(1-fx)+q[3]*fx)*fy:null;
 };
 const u=interp(w.u),v=interp(w.v);
 return u===null||v===null?null:[u,v];
}
function seed(p,w,h){p.x=Math.random()*w;p.y=Math.random()*h;p.age=Math.random()*85}
function reset(){
 const s=map.getSize(),ratio=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(s.x*ratio);canvas.height=Math.round(s.y*ratio);
 canvas.style.width=s.x+'px';canvas.style.height=s.y+'px';
 ctx.setTransform(ratio,0,0,ratio,0,0);
 particles=Array.from({length:Math.min(1600,Math.floor(s.x*s.y/320))},()=>{let p={};seed(p,s.x,s.y);return p});
}
function draw(t){
 requestAnimationFrame(draw);
 if(t-last<35)return;last=t;
 const s=map.getSize(),f=frames[index],w=f?.surface_wind_vectors;
 const active=toggle.checked&&w&&map.hasLayer(groups.surfaceWinds);
 if(!active){ctx.clearRect(0,0,s.x,s.y);if(toggle.checked)status.textContent='Venti 10 m · dati U/V non presenti nel GFS pubblicato';return}
 const k=f.valid_utc+'|'+map.getZoom()+'|'+map.getCenter().toString()+'|'+s.x+'|'+s.y;
 if(k!==key){reset();key=k}
 ctx.fillStyle='rgba(0,0,0,.09)';ctx.globalCompositeOperation='destination-out';ctx.fillRect(0,0,s.x,s.y);ctx.globalCompositeOperation='source-over';
 ctx.strokeStyle='rgba(160,35,245,.95)';ctx.lineWidth=2.1;ctx.lineCap='round';
 ctx.beginPath();
 for(const p of particles){
  const ll=map.containerPointToLatLng([p.x,p.y]),uv=sample(w,ll.lat,ll.lng);
  if(!uv||Math.hypot(...uv)<.15||p.age++>85){seed(p,s.x,s.y);continue}
  // Constant visual displacement: wind magnitude never encoded in animation speed.
  const len=Math.hypot(...uv),scale=3.3/len;
  const x=p.x+uv[0]*scale,y=p.y-uv[1]*scale;
  if(x<0||x>s.x||y<0||y>s.y){seed(p,s.x,s.y);continue}
  ctx.moveTo(p.x,p.y);ctx.lineTo(x,y);p.x=x;p.y=y;
 }
 ctx.stroke();
 status.textContent='Venti 10 m · NOAA GFS · direzione modellistica';
}
map.on('moveend zoomend resize',()=>{key=''});
toggle.addEventListener('change',()=>{key='';if(toggle.checked)groups.surfaceWinds.addTo(map);else {map.removeLayer(groups.surfaceWinds);ctx.clearRect(0,0,canvas.width,canvas.height)}});
requestAnimationFrame(draw);
})();