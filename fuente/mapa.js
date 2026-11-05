/* ============ Mapa de ubicación (Leaflet) ============ */
let MAP=null;
const CAPAS={
  sat:{n:"Satélite",u:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",a:"Imágenes © Esri"},
  calle:{n:"Calles",u:"https://tile.openstreetmap.org/{z}/{x}/{y}.png",a:"© colaboradores de OpenStreetMap"}
};
function pinIcon(){return L.divIcon({className:"pin",html:"<span></span>",iconSize:[30,30],iconAnchor:[15,29]})}
function mapaNota(el,t){ if(!el||el.querySelector(".mapnote")) return; const d=document.createElement("div"); d.className="mapnote"; d.textContent=t; el.appendChild(d); }
function mapaDestroy(){ if(MAP){ try{MAP.m.remove()}catch(e){} MAP=null; } }
function mapaInit(id,a,edit){
  mapaDestroy(); const el=document.getElementById(id); if(!el) return;
  if(typeof L==="undefined"){ mapaNota(el,"El mapa no está disponible en este dispositivo."); return; }
  const has=coordsOk(a);
  const m=L.map(el,{zoomControl:true,attributionControl:true}).setView(has?[num(a.lat),num(a.lon)]:[-35,-64],has?16:4);
  m.attributionControl.setPrefix(false);
  let pref="sat"; try{pref=localStorage.getItem("capaMapa")||"sat"}catch(e){}
  const capas={}; Object.entries(CAPAS).forEach(([k,c])=>{capas[c.n]=L.tileLayer(c.u,{maxZoom:19,attribution:c.a,crossOrigin:false})});
  (capas[CAPAS[pref]?CAPAS[pref].n:"Satélite"]).addTo(m);
  L.control.layers(capas,null,{position:"topright"}).addTo(m);
  m.on("baselayerchange",e=>{try{localStorage.setItem("capaMapa",e.name==="Calles"?"calle":"sat")}catch(x){}});
  let errs=0; Object.values(capas).forEach(l=>l.on("tileerror",()=>{ if(++errs===3) mapaNota(el,window.self!==window.top?"La vista previa no puede cargar el mapa. Se ve en la app publicada.":"Sin conexión: el mapa se ve en las zonas que ya miraste con señal. La ubicación se guarda igual."); }));
  MAP={m,a,edit,mk:null,circ:null};
  if(edit) m.on("click",e=>mapaMover(e.latlng));
  mapaSync(a);
  setTimeout(()=>{ try{m.invalidateSize()}catch(e){} },80);
}
function mapaMover(ll){
  const a=MAP&&MAP.a; if(!a) return;
  a.lat=ll.lat.toFixed(5); a.lon=ll.lng.toFixed(5); a.prec=""; a.ajusteMapa=true;
  if(S.gpsBusy===a.id){ gpsStop(); S.gpsBusy=null; }
  save(); paintCoords(a);
}
function mapaSync(a){
  if(!MAP||MAP.a!==a) return; const m=MAP.m;
  if(!coordsOk(a)){ if(MAP.mk){m.removeLayer(MAP.mk);MAP.mk=null} if(MAP.circ){m.removeLayer(MAP.circ);MAP.circ=null} return; }
  const ll=[num(a.lat),num(a.lon)];
  if(!MAP.mk){ MAP.mk=L.marker(ll,{icon:pinIcon(),draggable:MAP.edit,keyboard:false,autoPan:true}).addTo(m);
    if(MAP.edit) MAP.mk.on("dragend",e=>mapaMover(e.target.getLatLng()));
    m.setView(ll,Math.max(m.getZoom(),16)); }
  else { MAP.mk.setLatLng(ll); if(!m.getBounds().pad(-.25).contains(ll)) m.panTo(ll); }
  const p=Number(a.prec);
  if(p>0){ if(!MAP.circ) MAP.circ=L.circle(ll,{radius:p,color:"#E08A3C",weight:1.5,fillColor:"#E08A3C",fillOpacity:.15,interactive:false}).addTo(m); else {MAP.circ.setLatLng(ll); MAP.circ.setRadius(p);} }
  else if(MAP.circ){ m.removeLayer(MAP.circ); MAP.circ=null; }
}
