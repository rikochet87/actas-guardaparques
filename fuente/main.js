"use strict";
/* ============ Catálogos ============ */
const AREAS=[["Parque Nacional Aconquija","ACQ"],["Parque Nacional Baritú","BAR"],["Parque Nacional Bosques Petrificados de Jaramillo","BPJ"],["Parque Nacional Calilegua","CAL"],["Parque Nacional Campos del Tuyú","CTU"],["Parque Nacional Chaco","CHA"],["Parque Nacional Ciervo de los Pantanos","CDP"],["Parque Nacional Copo","COP"],["Parque Nacional El Impenetrable","EIM"],["Parque Nacional El Leoncito","ELE"],["Parque Nacional El Palmar","EPA"],["Parque Nacional El Rey","ERE"],["Parque Nacional Iberá","IBE"],["Parque Nacional Iguazú","IGU"],["Parque Nacional Islas de Santa Fe","ISF"],["Parque Nacional Lago Puelo","LPU"],["Parque Nacional Laguna Blanca","LBL"],["Parque Nacional Lanín","LAN"],["Parque Nacional Lihué Calel","LCA"],["Parque Nacional Los Alerces","LAL"],["Parque Nacional Los Arrayanes","LAR"],["Parque Nacional Los Cardones","LCR"],["Parque Nacional Los Glaciares","LGL"],["Parque Nacional Monte León","MLE"],["Parque Nacional Mburucuyá","MBU"],["Parque Nacional Nahuel Huapi","NHU"],["Parque Nacional Patagonia","PAT"],["Parque Nacional Perito Moreno","PMO"],["Parque Nacional Predelta","PRE"],["Parque Nacional Quebrada del Condorito","QCO"],["Parque Nacional Río Pilcomayo","RPI"],["Parque Nacional San Guillermo","SGU"],["Parque Nacional Sierra de las Quijadas","SQU"],["Parque Nacional Talampaya","TAL"],["Parque Nacional Tierra del Fuego","TDF"],["Parque Nacional Traslasierra","TRA"],["Monumento Natural Bosques Petrificados","MBP"],["Reserva Natural Otamendi","OTA"],["Otra área protegida (escribir)","OTR"]];
const PROVINCIAS=["Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes","Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones","Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe","Santiago del Estero","Tierra del Fuego","Tucumán","Extranjero"];
const CALIDADES=["Propietario/a","Poseedor/a","Ocupante","Encargado/a","Responsable","Representante legal","Empleado/a","Denunciante","Visitante","Prestador/a de servicios"];
const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ============ Almacenamiento (IndexedDB con respaldo en memoria) ============ */
const mem={actas:new Map(),kv:new Map()};
let dbp=null;
function openDB(){ if(dbp) return dbp; dbp=new Promise(res=>{ try{ const r=indexedDB.open("actas-apn",1); r.onupgradeneeded=()=>{const d=r.result; d.createObjectStore("actas",{keyPath:"id"}); d.createObjectStore("kv");}; r.onsuccess=()=>res(r.result); r.onerror=()=>res(null); r.onblocked=()=>res(null);}catch(e){res(null)} }); return dbp; }
async function tx(st,mode,fn){ const d=await openDB(); if(!d) return fn(null); return new Promise(res=>{ try{ const t=d.transaction(st,mode); const s=t.objectStore(st); const out=fn(s); t.oncomplete=()=>res((typeof IDBRequest!=="undefined"&&out instanceof IDBRequest)?out.result:out); t.onerror=()=>res(null);}catch(e){res(fn(null))} }); }
const store={
  all:()=>tx("actas","readonly",s=>s?s.getAll():[...mem.actas.values()]),
  put:a=>tx("actas","readwrite",s=>{ mem.actas.set(a.id,a); return s?s.put(a):null; }),
  del:id=>tx("actas","readwrite",s=>{ mem.actas.delete(id); return s?s.delete(id):null; }),
  get:k=>tx("kv","readonly",s=>s?s.get(k):mem.kv.get(k)),
  set:(k,v)=>tx("kv","readwrite",s=>{ mem.kv.set(k,v); return s?s.put(v,k):null; })
};

/* ============ Utilidades ============ */
const S={actas:[],perfil:null,view:"inicio",filtro:"todas",cur:null,step:0,busca:""};
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const pad=(n,l=2)=>String(n).padStart(l,"0");
const norm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
function nowParts(){const d=new Date();return{fecha:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,hora:`${pad(d.getHours())}:${pad(d.getMinutes())}`}}
function getPath(o,p){return p.split(".").reduce((a,k)=>a==null?a:a[k],o)}
function setPath(o,p,v){const ks=p.split(".");let a=o;ks.slice(0,-1).forEach(k=>{if(a[k]==null)a[k]={};a=a[k]});a[ks.at(-1)]=v}
function areaNombre(a){return a.area&&a.area.startsWith("Otra")?a.areaOtra:a.area}
function areaCat(a){const n=areaNombre(a)||""; return /^Parque/i.test(n)?"PN":/^Monumento/i.test(n)?"MN":/^Reserva Natural Estricta/i.test(n)?"RNE":/^Reserva/i.test(n)?"RN":""}
function fechaNum(f){return f?f.split("-").reverse().join("/"):"__/__/____"}
function nombreInfr(a){const i=a.infractor||{}; if(i.esEmpresa) return i.razonSocial||"Sin identificar"; const n=[i.apellido,i.nombre].filter(Boolean).join(", "); return n||"Sin identificar";}
function nombrePersona(p){return [p.apellido,p.nombre].filter(Boolean).join(", ")}
const isInfr=a=>a.tipo==="infraccion";
const num=v=>parseFloat(String(v??"").replace(",","."));
function coordsOk(a){const la=num(a.lat),lo=num(a.lon);return isFinite(la)&&isFinite(lo)&&Math.abs(la)<=90&&Math.abs(lo)<=180&&!(la===0&&lo===0)}
function mapsUrl(a){return `https://www.google.com/maps?q=${num(a.lat).toFixed(5)},${num(a.lon).toFixed(5)}`}
function qrSrc(text){try{if(typeof qrcode==="undefined")return null;const q=qrcode(0,"M");q.addData(text);q.make();return q.createDataURL(6,2)}catch(e){return null}}

function nuevaActa(tipo){
  const p=S.perfil||{}; const n=nowParts();
  return {id:uid(),v:2,tipo,estado:"borrador",numero:"",creada:Date.now(),editada:Date.now(),
    area:p.area||"",areaOtra:p.areaOtra||"",lugarActa:p.lugarActa||p.seccional||"",paraje:"",fecha:n.fecha,hora:n.hora,lat:"",lon:"",prec:"",
    infractor:{docTipo:"DNI",acredita:"documento",provincia:""},vehiculo:{},personas:[],rubros:[],hechos:"",normativa:"",normativaManual:false,
    ganado:{},secuestros:[],fotos:[],testigos:[{},{}],observaciones:"",firmas:{},negoFirma:false,motivoNoFirma:"",
    guardaparque:{nombre:p.nombre||"",legajo:p.legajo||"",cargo:p.cargo||"Guardaparque Nacional"}};
}

/* ============ Ejemplos ============ */
function ejemplos(){
  const a=nuevaActa("infraccion");
  Object.assign(a,{id:"ej3",ejemplo:true,estado:"cerrada",numero:"2026-041",area:"Parque Nacional Nahuel Huapi",lugarActa:"Seccional Lago Gutiérrez",paraje:"Playa norte del lago Gutiérrez",fecha:"2026-11-02",hora:"16:40",lat:"-41.16752",lon:"-71.40981",prec:"8",
    infractor:{apellido:"EJEMPLO",nombre:"Juan Pedro",acredita:"documento",docTipo:"DNI",docNum:"30.000.000",cuit:"20-30000000-1",calle:"Calle Falsa 123",localidad:"San Carlos de Bariloche",provincia:"Río Negro",domConstituido:"Calle Falsa 123, San Carlos de Bariloche",tadCuit:"20-30000000-1"},
    rubros:["for1"],hechos:"fuego encendido en un sitio no habilitado, sobre la costa del lago, con leña recolectada en el lugar; se procedió a su extinción con agua",
    normativa:"el Art. 89° de la Res. HD N° 11/1994 (Reglamento Forestal para los MN, PN y RN de la Región Andino-Patagónica)",secuestros:[{desc:"Parrilla metálica portátil",cant:"1"}],
    testigos:[{nombre:"EJEMPLO, María Laura",doc:"DNI 31.000.000"},{}],
    guardaparque:{nombre:"EJEMPLO, Guardaparque",legajo:"0000",cargo:"Guardaparque Nacional"},cerrada:Date.parse("2026-11-02T17:05:00-03:00"),hash:"ejemplo-sin-validez"});
  const b=nuevaActa("constatacion");
  Object.assign(b,{id:"ej4",ejemplo:true,estado:"borrador",area:"Parque Nacional Copo",lugarActa:"Picada perimetral norte, km 4",paraje:"Picada perimetral norte, km 4",fecha:"2026-11-04",hora:"09:15",
    personas:[{apellido:"EJEMPLO",nombre:"Ramón",docTipo:"DNI",docNum:"25.000.000",calidad:"Encargado/a"}],
    rubros:["gan0"],hechos:"se observan siete (7) cabezas de ganado bovino pastando dentro de la jurisdicción del área protegida, conforme el cuadro de hacienda que se adjunta, y un tramo de seis (6) metros de alambrado perimetral cortado.",
    ganado:{cant:"7",clase:"Mayor (bovino)",machos:"2",hembras:"5",adultos:"6",menores:"1",raza:"Criolla",color:"Colorado y overo",caravanas:"Sí, 3 animales",marca:"Marca a fuego visible en paleta izquierda"},
    guardaparque:{nombre:"EJEMPLO, Guardaparque",legajo:"0000",cargo:"Guardaparque Nacional"}});
  return [a,b];
}

/* ============ Instalación ============ */
let installEvt=null;
const standalone=()=>{try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(e){return false}};
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const puedeInstalar=()=>!standalone()&&window.self===window.top;
function installHidden(){try{return Number(localStorage.getItem("instalarOculto")||0)>Date.now()}catch(e){return false}}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;if(S.view==="inicio"||S.view==="perfil")render(true)});
window.addEventListener("appinstalled",()=>{installEvt=null;toast("App instalada. Abrila desde la pantalla de inicio del teléfono.");render(true)});
function installCard(force){
  if(!puedeInstalar()||(!force&&installHidden())) return "";
  return `<div class="install"><svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="9" fill="currentColor" opacity=".14"/><path d="M20 7v17m0 0-6-6m6 6 6-6M11 30h18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
   <div class="grow"><b>Instalá la app en el teléfono</b><span>Queda en la pantalla de inicio y funciona sin señal en el campo.</span></div>
   <div class="row"><button class="btn primary sm" type="button" data-act="instalar">Instalar app</button>${force?"":`<button class="btn ghost sm" type="button" data-act="instalarNo">Ahora no</button>`}</div></div>`;
}
async function instalar(){
  if(installEvt){ try{ installEvt.prompt(); const r=await installEvt.userChoice; installEvt=null; if(r&&r.outcome==="accepted") toast("Instalando…"); render(true);}catch(e){} return; }
  const pasos=isIOS()?["Tocá el botón <b>Compartir</b> de Safari (el cuadrado con la flecha hacia arriba).","Deslizá y elegí <b>Agregar a inicio</b>.","Tocá <b>Agregar</b>. El ícono aparece en la pantalla de inicio."]
   :/android/i.test(navigator.userAgent)?["Abrí el menú <b>⋮</b> de Chrome, arriba a la derecha.","Elegí <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.","Confirmá con <b>Instalar</b>."]
   :["Abrí este enlace en el celular con <b>Chrome</b> (Android) o <b>Safari</b> (iPhone).","En la computadora, Chrome y Edge muestran un ícono de instalar en la barra de direcciones."];
  modal(`<h3>Instalar la app</h3>${isIOS()&&!/safari/i.test(navigator.userAgent)?`<p class="notice">En iPhone la instalación funciona desde <b>Safari</b>. Copiá el enlace y abrilo ahí.</p>`:""}<ol class="pasos">${pasos.map(p=>`<li>${p}</li>`).join("")}</ol><button class="btn primary" type="button" data-act="modalno">Entendido</button>`);
}

/* ============ Render principal ============ */
function render(keep){
  const y=window.scrollY; const v=$("#view"); mapaDestroy();
  if(S.view==="inicio") v.innerHTML=vInicio(), bar(null);
  else if(S.view==="perfil") v.innerHTML=vPerfil(), bar("perfil"), afterPerfil();
  else if(S.view==="editor") v.innerHTML=vEditor(), bar("editor"), afterEditor();
  else if(S.view==="ver") v.innerHTML=vVer(), bar("ver"), mapaInit("mapaVer",S.cur,false);
  $("#topBtn").textContent=S.view==="inicio"?"Mis datos":"Inicio";
  const sub=S.cur?(isInfr(S.cur)?"Acta de infracción":"Acta de constatación"):"Administración de Parques Nacionales";
  $("#topTitle").firstChild.nodeValue=S.view==="editor"||S.view==="ver"?(S.cur.numero?"Acta N° "+S.cur.numero:"Borrador"):S.view==="perfil"?"Mis datos":"Actas Guardaparques";
  $("#topSub").textContent=S.view==="perfil"?"Guardaparque actuante":sub;
  window.scrollTo(0,keep?y:0);
}
function go(view){ if(view!=="editor"&&view!=="ver") S.cur=null; S.view=view; render(); }

function vInicio(){
  const p=S.perfil; let h=`<div class="stack">${installCard()}`;
  if(!p||!p.nombre||!p.area) h+=`<div class="notice"><b>Completá tus datos antes de labrar actas.</b> Nombre, legajo y área protegida se cargan solos en cada acta nueva. <button class="btn sm" type="button" data-act="perfil" style="margin-top:8px">Cargar mis datos</button></div>`;
  h+=`<div class="newbar">
   <button class="newcard infr" type="button" data-new="infraccion"><strong>Acta de infracción</strong><span>Hay un presunto infractor identificado. Se lo notifica en el acto y puede firmar.</span></button>
   <button class="newcard const" type="button" data-new="constatacion"><strong>Acta de constatación</strong><span>Dejar constancia de un hecho: daño, ganado, hallazgo, con o sin personas presentes.</span></button></div>`;
  const L=S.actas.slice().sort((a,b)=>b.editada-a.editada);
  const f=S.filtro; const vis=L.filter(a=>f==="todas"||a.estado===f);
  h+=`<div class="sectionhead"><h2>Mis actas</h2><div class="filters">${[["todas","Todas"],["borrador","Borradores"],["cerrada","Cerradas"]].map(([k,t])=>`<button type="button" class="chip" data-filtro="${k}" aria-pressed="${f===k}">${t}</button>`).join("")}</div></div>`;
  h+=`<div class="tally"><span><b>${L.filter(a=>a.estado==="borrador").length}</b> en borrador</span><span><b>${L.filter(a=>a.estado==="cerrada").length}</b> cerradas</span><span><b>${L.filter(isInfr).length}</b> de infracción</span></div>`;
  if(!vis.length) h+=`<div class="empty">No hay actas en esta vista. Empezá una con los botones de arriba.</div>`;
  else h+=`<div class="list">${vis.map(a=>`<button type="button" class="item ${isInfr(a)?"infr":""}" data-open="${a.id}">
     <span class="stripe"></span>
     <span class="body"><span class="who">${esc(isInfr(a)?nombreInfr(a):(a.paraje||"Sin lugar"))}</span><span class="what">${esc(a.rubros.map(r=>ITEMS[r]?.t).filter(Boolean).join(" · ")||a.hechos||"Sin hechos cargados")}</span><span class="num">${esc(a.numero?"N° "+a.numero:"sin número")} · ${esc(fechaNum(a.fecha))} ${esc(a.hora)}</span></span>
     <span class="meta"><span class="pill ${isInfr(a)?"infr":"const"}">${isInfr(a)?"Infracción":"Constatación"}</span>${a.ejemplo?`<span class="pill ejemplo">Ejemplo</span>`:`<span class="pill ${a.estado}">${a.estado==="cerrada"?"Cerrada":"Borrador"}</span>`}</span></button>`).join("")}</div>`;
  if(L.some(a=>a.ejemplo)) h+=`<button class="btn ghost sm" type="button" data-act="borrarEjemplos" style="align-self:flex-start">Quitar actas de ejemplo</button>`;
  h+=`<p class="hint">Las actas se guardan en este dispositivo y funcionan sin señal. Exportá las cerradas para elevarlas a la Intendencia.</p></div>`;
  return h;
}

function opts(list,val,empty){return (empty!==undefined?`<option value="">${empty}</option>`:"")+list.map(x=>`<option ${x===val?"selected":""}>${esc(x)}</option>`).join("")}
function fld(path,label,o={}){
  const src=o.src||S.cur; const v=getPath(src,path)??""; const id=(o.pre||"")+path.replace(/\./g,"_");
  const type=o.type||"text"; const ph=o.ph?`placeholder="${esc(o.ph)}"`:"";
  const input=type==="textarea"?`<textarea id="${id}" data-f="${path}" ${ph}>${esc(v)}</textarea>`
   :type==="select"?`<select id="${id}" data-f="${path}">${opts(o.opts,v,o.empty)}</select>`
   :`<input id="${id}" type="${type}" data-f="${path}" value="${esc(v)}" ${ph} ${o.im?`inputmode="${o.im}"`:""} ${o.list?`list="${o.list}"`:""} autocomplete="off">`;
  return `<div class="field"><label for="${id}" class="${o.req?"req":""}">${label}</label>${input}${o.hint?`<span class="hint">${o.hint}</span>`:""}</div>`;
}

function vPerfil(){
  const p=S.perfil; const o={src:p,pre:"p_"};
  return `<div class="stack"><div class="panel"><h2>Funcionario actuante</h2><p class="lead">Estos datos se copian en cada acta nueva. Podés cambiarlos acta por acta.</p>
   <div class="grid2">${fld("nombre","Apellido y nombre",{...o,req:true})}${fld("legajo","Legajo N°",{...o,req:true,im:"numeric"})}</div>
   ${fld("cargo","Cargo / jerarquía",{...o,ph:"Guardaparque Nacional"})}
   ${fld("area","Área protegida",{...o,type:"select",opts:AREAS.map(x=>x[0]),empty:"Elegir…",req:true})}
   ${p.area&&p.area.startsWith("Otra")?fld("areaOtra","Nombre del área",o):""}
   ${fld("lugarActa","Lugar habitual de confección",{...o,ph:"Ej.: Seccional Yacaré, Pampa del Indio",hint:"Va en «en … a los __/__/____» del acta de infracción."})}</div>
  <div class="panel"><h2>Numeración</h2><p class="lead">Formato del talonario: año y correlativo, por ejemplo <span class="mono">2026-002</span>. Cada tipo de acta lleva su propia serie.</p>
   <div class="grid3">${fld("proxInf","Próxima de infracción",{...o,type:"number",im:"numeric"})}${fld("proxConst","Próxima de constatación",{...o,type:"number",im:"numeric"})}${fld("prefijo","Prefijo (opcional)",{...o,ph:"Ej.: COP"})}</div></div>
  <div class="panel"><h2>Encabezado del acta</h2><p class="lead">Cargá los logos oficiales tal como figuran en el talonario impreso. Quedan guardados en este dispositivo.</p>
   ${fld("organismo","Línea superior del encabezado (opcional)",{...o,ph:"Ministerio del que depende la APN",hint:"Aparece en el acta de constatación sobre «Administración de Parques Nacionales»."})}
   <div class="grid2">${logoField("logoApn","Logo de la APN")}${logoField("logoArea","Sello del área protegida")}</div></div>${installCard(true)}</div>`;
}
function logoField(k,label){const v=S.perfil[k];return `<div class="field"><span class="lbl">${label}</span><div class="logoprev">${v?`<img src="${v}" alt="">`:`<span class="hint">Sin imagen</span>`}</div><div class="row"><label class="btn sm" for="in_${k}">${v?"Cambiar":"Cargar imagen"}</label><input id="in_${k}" type="file" accept="image/*" data-logo="${k}" hidden>${v?`<button class="btn sm ghost" type="button" data-dellogo="${k}">Quitar</button>`:""}</div></div>`}
function afterPerfil(){document.querySelectorAll("[data-logo]").forEach(el=>el.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{S.perfil[el.dataset.logo]=await shrink(f,360,.9,"image/png");save();render(true)}catch(x){toast("No se pudo leer la imagen.")}})}

/* ============ Editor ============ */
function pasos(a){ return isInfr(a)?["Lugar y fecha","Infractor","Hechos","Secuestro y fotos","Testigos","Firmas"]:["Lugar y fecha","Presentes","Se constata","Fotos","Testigos","Firmas"]; }
function stepOk(a,i){ const inf=isInfr(a), I=a.infractor;
  return [()=>!!(a.area&&a.paraje&&a.fecha&&a.hora&&(!inf||a.lugarActa)&&coordsOk(a)),
          ()=>!inf||!!((I.esEmpresa?I.razonSocial:I.apellido)&&(I.docNum||I.cuit)),
          ()=>a.hechos.trim().length>10&&(!inf||!!a.normativa.trim()),
          ()=>true,()=>true,
          ()=>!!a.firmaPapel||(!!a.firmas.guardaparque&&(!inf||!!(a.firmas.infractor||a.negoFirma)))][i](); }
function vEditor(){
  const a=S.cur, P=pasos(a);
  return `<div class="stack"><nav class="steps" aria-label="Pasos del acta">${P.map((t,i)=>`<button type="button" class="step ${i!==S.step&&stepOk(a,i)?"done":""}" data-step="${i}" ${i===S.step?'aria-current="step"':""}><i>${i+1}</i>${t}</button>`).join("")}</nav>
  ${[sLugar,isInfr(a)?sInfractor:sPresentes,sHechos,sSecuestro,sTestigos,sFirmas][S.step](a)}</div>`;
}
function sLugar(a){
  const inf=isInfr(a);
  return `<section class="panel"><h2>Lugar y fecha</h2><p class="lead">${inf?"«En … a los __/__/____ … en el paraje conocido como … jurisdicción del/la PN, RN, MN, RNE …»":"«A los … días del mes de … siendo las … horas, en … del …»"}</p>
  ${fld("area","Área protegida (jurisdicción)",{type:"select",opts:AREAS.map(x=>x[0]),empty:"Elegir…",req:true})}
  ${a.area.startsWith("Otra")?fld("areaOtra","Nombre del área",{req:true}):""}
  ${inf?fld("lugarActa","Lugar de confección del acta",{req:true,ph:"Ej.: Seccional Yacaré"}):""}
  ${fld("paraje",inf?"Paraje conocido como":"Lugar donde se constituye",{req:true,type:"textarea",ph:"Ej.: Picada al Carpincho, km 2, a 300 m del puesto de control"})}
  <div class="field"><span class="lbl req">Ubicación GPS</span><div class="gps ${coordsOk(a)?"ok":""}" id="gpsBox">${coordsHTML(a)}<button class="btn sm" type="button" data-act="gps">${coordsOk(a)?"Volver a tomar":"Tomar ubicación"}</button></div></div>
  <div class="mapa" id="mapaEdit" role="region" aria-label="Mapa de la ubicación del acta"></div>
  <p class="hint">Si el punto no coincide, arrastrá el marcador o tocá el mapa en el lugar correcto.</p>
  <div class="grid2">${fld("lat","Latitud",{im:"decimal",ph:"-27.06000"})}${fld("lon","Longitud",{im:"decimal",ph:"-60.52000"})}</div>
  <p class="hint">Se toma sola al abrir el acta y es obligatoria para cerrarla. Sin GPS, escribí las coordenadas a mano. En el acta impresa van al pie, con un código QR que abre el lugar en el mapa.</p>
  <div class="grid2">${fld("fecha","Fecha",{type:"date",req:true})}${fld("hora","Hora",{type:"time",req:true})}</div></section>`;
}
function coordsHTML(a){
  if(S.gpsBusy===a.id) return `<span class="coords" id="coords"><span class="pulse"></span>Buscando señal GPS…${a.prec?` <span class="hint">mejor lectura ± ${esc(a.prec)} m</span>`:""}</span>`;
  if(!coordsOk(a)) return `<span class="coords" id="coords">Sin coordenadas</span>`;
  const p=Number(a.prec); const flojo=p>50;
  return `<span class="coords" id="coords">${esc(a.lat)}, ${esc(a.lon)}${a.prec?` <span class="hint ${flojo?"warn":""}">± ${esc(a.prec)} m${flojo?" · precisión baja, conviene volver a tomarla a cielo abierto":""}</span>`:` <span class="hint">${a.ajusteMapa?"ubicada en el mapa":"cargada a mano"}</span>`}</span>`;
}
function sInfractor(a){
  const i=a.infractor;
  return `<section class="panel"><h2>Persona infractora</h2><p class="lead">«…por parte de …, quien acredita su identidad mediante / dice ser titular de CUIT / CUIL N° …, con domicilio real en…»</p>
  <label class="check"><input type="checkbox" id="esEmpresa" data-f="infractor.esEmpresa" ${i.esEmpresa?"checked":""}><span>Es una persona jurídica (empresa, prestador, estancia)</span></label>
  ${i.esEmpresa?`<div class="grid2">${fld("infractor.razonSocial","Razón social",{req:true})}${fld("infractor.cuitEmpresa","CUIT de la empresa",{im:"numeric"})}</div><p class="hint">Abajo, los datos de quien la representa en el acto.</p>`:""}
  <div class="grid2">${fld("infractor.apellido","Apellido",{req:!i.esEmpresa})}${fld("infractor.nombre","Nombres")}</div>
  <div class="field"><span class="lbl">Identidad</span><div class="seg" role="radiogroup">
   <label><input type="radio" name="acredita" data-f="infractor.acredita" value="documento" ${i.acredita!=="dice"?"checked":""}><span>Acredita con documento</span></label>
   <label><input type="radio" name="acredita" data-f="infractor.acredita" value="dice" ${i.acredita==="dice"?"checked":""}><span>No lo presenta, dice ser titular</span></label></div></div>
  <div class="grid3">${fld("infractor.docTipo","Documento",{type:"select",opts:["DNI","Pasaporte","Cédula","LE/LC","Otro"]})}${fld("infractor.docNum","Número",{req:true,im:"numeric"})}${fld("infractor.cuit","CUIT / CUIL N°",{im:"numeric",ph:"20-12345678-3"})}</div>
  <div class="subpanel"><h3>Domicilio real</h3>${fld("infractor.calle","Calle y número")}<div class="grid2">${fld("infractor.localidad","Localidad")}${fld("infractor.provincia","Provincia",{type:"select",opts:PROVINCIAS,empty:"Elegir…"})}</div></div>
  <div class="subpanel"><h3>Domicilio constituido</h3><p class="hint">Donde se tendrán por válidas las notificaciones (Ley N° 19.549, Dto. N° 1759/1972).</p>
   <div class="row"><button class="btn sm ghost" type="button" data-act="copiarDom">Igual al domicilio real</button></div>
   ${fld("infractor.domConstituido","Constituye domicilio en")}${fld("infractor.tadCuit","Trámites a Distancia (TAD): CUIT/CUIL",{im:"numeric",hint:"Si tiene cuenta en TAD, para recibir notificaciones electrónicas."})}</div>
  <div class="grid2">${fld("infractor.telefono","Teléfono",{type:"tel"})}${fld("infractor.email","Correo electrónico",{type:"email"})}</div>
  <div class="subpanel"><h3>Vehículo (si corresponde)</h3><div class="grid2">${fld("vehiculo.dominio","Dominio / matrícula")}${fld("vehiculo.tipo","Tipo",{ph:"Auto, camioneta, lancha…"})}</div><div class="grid2">${fld("vehiculo.marca","Marca y modelo")}${fld("vehiculo.color","Color")}</div></div></section>`;
}
function sPresentes(a){
  return `<section class="panel"><h2>Personas presentes</h2><p class="lead">«Se encuentra/n presente/s en el acto el/los señor/es … quien/es acredita/n identidad mediante presentación de … N°/s … en calidad de …»</p>
  <datalist id="calidades">${CALIDADES.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>
  ${a.personas.length?a.personas.map((p,k)=>`<div class="subpanel"><div class="row"><h3 class="grow">Persona ${k+1}</h3><button class="btn sm danger" type="button" data-delper="${k}">Quitar</button></div>
   <div class="grid2">${fld(`personas.${k}.apellido`,"Apellido")}${fld(`personas.${k}.nombre`,"Nombres")}</div>
   <div class="grid3">${fld(`personas.${k}.docTipo`,"Documento",{type:"select",opts:["DNI","Pasaporte","Cédula","LE/LC","Otro"]})}${fld(`personas.${k}.docNum`,"Número",{im:"numeric"})}${fld(`personas.${k}.calidad`,"En calidad de",{list:"calidades"})}</div></div>`).join("")
   :`<p class="hint">Sin personas presentes. El acta dirá que no se encuentran personas en el acto.</p>`}
  <button class="btn sm" type="button" data-act="addper" style="align-self:flex-start">Agregar persona presente</button></section>`;
}
function sHechos(a){
  const inf=isInfr(a); const g=a.rubros.includes("gan0");
  return `<section class="panel"><h2>${inf?"Hechos comprobados":"Se CONSTATA que"}</h2>
  <p class="lead">${inf?"Elegí la conducta del listado oficial: la normativa infringida se arma sola con reglamento y artículo.":"Si el hecho encuadra en un reglamento, marcalo para dejar referencia. Es opcional."}</p>
  ${a.rubros.length?`<div class="selitems">${a.rubros.map(id=>ITEMS[id]?`<button type="button" class="selitem" data-rubro="${id}" aria-label="Quitar"><b>${esc(ITEMS[id].art||"—")}</b> ${esc(ITEMS[id].t)} <span aria-hidden="true">×</span></button>`:"").join("")}</div>`:""}
  <div class="field"><label for="buscaInf">Buscar en el listado de infracciones frecuentes</label><input id="buscaInf" type="search" value="${esc(S.busca)}" placeholder="Ej.: fuego, perro, dron, pesca, áridos" autocomplete="off"></div>
  <div id="catalogo" class="cat">${catalogo(a)}</div>
  ${fld("hechos",inf?"En virtud de haber comprobado:":"Se CONSTATA que:",{type:"textarea",req:true,hint:inf?"Completá la oración: qué hizo, con qué elementos, cantidades y estado. Al elegir una conducta se agrega como punto de partida.":"Describí lo observado en orden: situación, elementos, cantidades, daños, medidas tomadas."})}
  ${g?`<div class="subpanel"><h3>Cuadro de hacienda</h3><p class="hint">Datos que pide la Res. APN 467/2017. Van al pie del acta.</p>
    <div class="grid3">${fld("ganado.cant","Cantidad total",{im:"numeric"})}${fld("ganado.clase","Clase",{type:"select",opts:["","Mayor (bovino)","Mayor (equino)","Menor (caprino)","Menor (ovino)","Menor (porcino)","Mixto"]})}${fld("ganado.raza","Raza o biotipo")}</div>
    <div class="grid3">${fld("ganado.machos","Machos",{im:"numeric"})}${fld("ganado.hembras","Hembras",{im:"numeric"})}${fld("ganado.color","Pelaje / color")}</div>
    <div class="grid3">${fld("ganado.adultos","Adultos",{im:"numeric"})}${fld("ganado.menores","Menores",{im:"numeric"})}${fld("ganado.caravanas","Caravanas")}</div>
    ${fld("ganado.marca","Marca o señal (describirla; si podés, fotografiala)")}</div>`:""}
  ${inf?fld("normativa","Contraviniendo lo prescripto en:",{type:"textarea",req:true,hint:"Se completa sola con las conductas elegidas. Podés editarla."}):""}
  ${fld("observaciones",inf?"Manifestación del infractor u observaciones (opcional)":"Observaciones (opcional)",{type:"textarea",hint:"Van en el anexo, fuera del texto oficial."})}
  </section>`;
}
function catalogo(a){
  const q=norm(S.busca).trim(); let out="";
  REGS.forEach(g=>{
    const its=g.it.map((x,k)=>ITEMS[g.id+k]).filter(it=>!q||norm(it.t+" "+it.art+" "+g.n+" "+g.r).includes(q));
    if(!its.length) return;
    const nSel=its.filter(it=>a.rubros.includes(it.id)).length;
    out+=`<details ${q||nSel?"open":""}><summary><span class="grow"><b>${esc(g.n)}</b><span class="res">${esc(g.r)}${g.nota?" · "+esc(g.nota):""}</span></span>${nSel?`<span class="pill cerrada">${nSel}</span>`:""}</summary>
     <div class="catitems">${its.map(it=>`<button type="button" class="catitem" data-rubro="${it.id}" aria-pressed="${a.rubros.includes(it.id)}"><span>${esc(it.t)}</span><span class="art">${esc(it.art||"s/art.")}</span></button>`).join("")}</div></details>`;
  });
  return out||`<p class="hint">Nada coincide con «${esc(S.busca)}». Describí la conducta y la normativa a mano.</p>`;
}
function sSecuestro(a){
  const inf=isInfr(a);
  return `<section class="panel"><h2>${inf?"Secuestro y fotos":"Fotografías"}</h2><p class="lead">${inf?"«Se procede al secuestro de los elementos utilizados en la infracción, y/o sus frutos, consistentes en…»":"Registro fotográfico del lugar y de lo constatado. Va como anexo."}</p>
  ${inf?`<div class="subpanel"><h3>Elementos secuestrados</h3><div class="lines">${a.secuestros.length?a.secuestros.map((s,k)=>`<div class="line">${fld(`secuestros.${k}.desc`,"Descripción",{ph:"Ej.: caña de pescar con reel"})}${fld(`secuestros.${k}.cant`,"Cant.",{im:"numeric"})}<button class="btn sm danger" type="button" data-delsec="${k}">Quitar</button></div>`).join(""):`<p class="hint">Sin elementos secuestrados.</p>`}</div>
  <button class="btn sm" type="button" data-act="addsec" style="align-self:flex-start">Agregar elemento</button></div>`:""}
  <div class="subpanel"><h3>Fotografías</h3>
   ${a.fotos.length?`<div class="photos">${a.fotos.map((f,k)=>`<figure class="photo" style="margin:0"><img src="${f.src}" alt="Foto ${k+1}"><input type="text" id="foto_${k}" data-f="fotos.${k}.nota" value="${esc(f.nota||"")}" placeholder="Foto ${k+1}: qué muestra"><button type="button" data-delfoto="${k}" aria-label="Quitar foto">×</button></figure>`).join("")}</div>`:`<p class="hint">Todavía no hay fotos.</p>`}
   <div class="row"><label class="btn sm" for="camIn">Sacar foto</label><input id="camIn" type="file" accept="image/*" capture="environment" hidden><label class="btn sm ghost" for="galIn">Elegir de la galería</label><input id="galIn" type="file" accept="image/*" multiple hidden></div></div></section>`;
}
function sTestigos(a){
  return `<section class="panel"><h2>Testigos</h2><p class="lead">El modelo prevé firma, aclaración y documento del testigo. Recomendado siempre, y en especial si el infractor no firma.</p>
  ${[0,1].map(k=>`<div class="subpanel"><h3>Testigo ${k+1}${k?" (opcional)":""}</h3><div class="grid2">${fld(`testigos.${k}.nombre`,"Aclaración (apellido y nombre)")}${fld(`testigos.${k}.doc`,"Doc. Ident. N°",{im:"numeric"})}</div></div>`).join("")}</section>`;
}
function sFirmas(a){
  const inf=isInfr(a); const T=a.testigos.map((t,k)=>({t,k})).filter(x=>x.t.nombre);
  const chk=[["Lugar, fecha y ubicación GPS",stepOk(a,0)],...(inf?[["Datos del infractor",stepOk(a,1)]]:[]),[inf?"Hechos y normativa":"Lo constatado",stepOk(a,2)],...(a.firmaPapel?[["Firmas sobre el papel impreso",true]]:[["Firma del funcionario actuante",!!a.firmas.guardaparque],...(inf?[["Firma del infractor o constancia de negativa",!!(a.firmas.infractor||a.negoFirma)]]:[])])];
  return `<section class="panel"><h2>Lectura y firmas</h2><p class="lead">Mostrá el acta en pantalla o leela en voz alta antes de pedir firmas.</p>
  <button class="btn" type="button" data-act="preview">Ver acta completa</button>
  ${fld("guardaparque.nombre","Funcionario actuante",{req:true})}
  <div class="grid2">${fld("guardaparque.legajo","Leg. N°")}${fld("guardaparque.cargo","Cargo")}</div>
  <label class="check"><input type="checkbox" id="firmaPapel" data-f="firmaPapel" ${a.firmaPapel?"checked":""}><span><b>Las firmas se toman sobre el acta impresa.</b> El acta se cierra sin firmas en pantalla y se imprime con los espacios en blanco.</span></label>
  ${a.firmaPapel?"":sigBox("guardaparque","Firma del funcionario actuante")}
  ${a.firmaPapel?"":inf?`<label class="check"><input type="checkbox" id="negoFirma" data-f="negoFirma" ${a.negoFirma?"checked":""}><span><b>La persona infractora se niega a firmar.</b> Queda constancia en el acta y corresponde sumario contravencional (art. 6°, Dto. 300/2022).</span></label>
   ${a.negoFirma?fld("motivoNoFirma","Motivo expresado o circunstancias",{type:"textarea"}):sigBox("infractor","Firma de la persona infractora")}`:""}
  ${a.firmaPapel?"":T.length?T.map(({t,k})=>sigBox("testigo"+k,"Firma del testigo: "+t.nombre)).join(""):`<p class="hint">Sin testigos cargados. Podés agregarlos en el paso 5.</p>`}
  <div class="subpanel"><h3>Antes de cerrar</h3><ul class="checklist">${chk.map(([t,ok])=>`<li class="${ok?"ok":""}">${t}</li>`).join("")}</ul>
  <p class="hint">Al cerrar, el acta recibe el número del talonario digital y un código de integridad. Ya no se puede modificar.</p></div></section>`;
}
function sigBox(key,label){const v=S.cur.firmas[key];return `<div class="sig"><span class="lbl">${esc(label)}</span><div class="sigbox ${v?"signed":""}" data-sig="${key}"><canvas></canvas><span class="base"></span><span class="ph">${v?"Firmado":"Firmar aquí"}</span></div><div class="row"><button type="button" class="btn sm ghost" data-clearsig="${key}">Borrar firma</button></div></div>`}
function afterEditor(){
  document.querySelectorAll(".sigbox").forEach(initSig);
  ["camIn","galIn"].forEach(id=>{const el=document.getElementById(id); if(el) el.onchange=e=>addFotos(e.target.files);});
  if(S.step===0) mapaInit("mapaEdit",S.cur,true);
  const b=$("#buscaInf"); if(b) b.oninput=()=>{S.busca=b.value; $("#catalogo").innerHTML=catalogo(S.cur);};
}

/* ============ Firma ============ */
function initSig(box){
  const key=box.dataset.sig, c=box.querySelector("canvas"), dpr=Math.max(1,window.devicePixelRatio||1);
  const r=box.getBoundingClientRect(); c.width=r.width*dpr; c.height=r.height*dpr; const x=c.getContext("2d");
  x.scale(dpr,dpr); x.lineWidth=2.4; x.lineCap="round"; x.lineJoin="round"; x.strokeStyle="#10203A";
  const prev=S.cur.firmas[key]; if(prev){const im=new Image(); im.onload=()=>x.drawImage(im,0,0,r.width,r.height); im.src=prev;}
  let dn=false,last=null,drawn=false;
  const pt=e=>{const b=c.getBoundingClientRect();return[e.clientX-b.left,e.clientY-b.top]};
  c.onpointerdown=e=>{dn=true;last=pt(e);c.setPointerCapture(e.pointerId);e.preventDefault()};
  c.onpointermove=e=>{if(!dn)return;const p=pt(e);x.beginPath();x.moveTo(...last);x.lineTo(...p);x.stroke();last=p;drawn=true};
  const up=()=>{if(!dn)return;dn=false;if(drawn){S.cur.firmas[key]=c.toDataURL("image/png");save();render(true)}};
  c.onpointerup=up;c.onpointercancel=up;c.onpointerleave=up;
}

/* ============ Fotos e imágenes ============ */
async function addFotos(files){
  for(const f of [...files]){ try{ const src=await shrink(f,1280,.72); S.cur.fotos.push({id:uid(),src,nota:"",t:new Date().toISOString()}); }catch(e){toast("No se pudo leer una de las imágenes.")} }
  save(); render(true);
}
function shrink(file,max,q,type="image/jpeg"){return new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=rej;fr.onload=()=>{const im=new Image();im.onerror=rej;im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement("canvas");c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL(type,q))};im.src=fr.result};fr.readAsDataURL(file)})}

/* ============ Conductas y normativa ============ */
function normDesde(a){
  const by=new Map(); a.rubros.filter(id=>ITEMS[id]).sort((x,y)=>Object.keys(ITEMS).indexOf(x)-Object.keys(ITEMS).indexOf(y)).forEach(id=>{const it=ITEMS[id]; if(!it) return; if(!by.has(it.g.id)) by.set(it.g.id,{g:it.g,arts:[]}); if(it.art) by.get(it.g.id).arts.push(it.art);});
  return [...by.values()].map(({g,arts})=>{ const ar=arts.length?(arts.length>1?arts.slice(0,-1).join(", ")+" y "+arts.at(-1):arts[0]):""; return g.r.startsWith("Ley")?`${ar?"el "+ar+" de la ":"la "}${g.r}`:`${ar?"el "+ar+" de la ":"la "}${g.r} (${g.n})`; }).join("; ");
}
function toggleRubro(id){
  const a=S.cur, on=a.rubros.includes(id), it=ITEMS[id];
  if(on) a.rubros=a.rubros.filter(x=>x!==id);
  else { a.rubros.push(id); const seed=it.t.charAt(0).toLowerCase()+it.t.slice(1).replace(/\s*\(.*\)$/,""); if(!a.hechos.includes(seed)) a.hechos=a.hechos.trim()?a.hechos.trim().replace(/[.;,]$/,"")+"; "+seed:seed; }
  if(!a.normativaManual) a.normativa=normDesde(a);
  save(); render(true);
}

/* ============ Documento (texto de los modelos oficiales) ============ */
const V=(x,fb="……………")=>`<span class="v">${x?esc(x):fb}</span>`;
function encabezado(a){
  const p=S.perfil||{}; const inf=isInfr(a);
  const L=inf?p.logoApn:p.logoArea, R=inf?p.logoArea:p.logoApn;
  const lg=(src,alt)=>src?`<img src="${src}" alt="${alt}">`:`<span class="logoph">${alt}</span>`;
  return `<div class="dlogos">${lg(L,inf?"Logo APN":"Sello del área")}<div class="dinst">${inf?"":`${p.organismo?`<i>${esc(p.organismo)}</i><br>`:""}<i>Administración de Parques Nacionales</i><br>Ley N° 22.351`}</div>${lg(R,inf?"Sello del área":"Logo APN")}</div>`;
}
function docHTML(a,copia="ORIGINAL",opt={anexo:true,fotos:true}){
  const inf=isInfr(a); const ar=areaNombre(a)||"";
  let h=`<article class="doc">${a.ejemplo?`<span class="ejemplo">EJEMPLO · SIN VALIDEZ</span>`:""}${encabezado(a)}`;
  if(inf){
    const i=a.infractor, sec=a.secuestros.filter(s=>s.desc);
    const quien=i.esEmpresa?`${esc(i.razonSocial||"……")}${i.cuitEmpresa?`, CUIT N° ${esc(i.cuitEmpresa)}`:""}, representada en el acto por ${V(nombrePersona(i))}`:V(nombrePersona(i));
    const ident=`${i.acredita==="dice"?"quien dice ser titular de":"quien acredita su identidad mediante"} ${esc(i.docTipo||"DNI")} N° ${V(i.docNum)}${i.cuit?`, CUIT / CUIL N° ${V(i.cuit)}`:""}`;
    h+=`<div class="dorig"><span>${esc(copia)}</span><span>Acta N° ${esc(a.numero||"BORRADOR")}</span></div>
    <h3 class="dtitle">ACTA DE INFRACCIÓN</h3>
    <p>En los términos del <b>Decreto N° 300/2022</b> del Poder Ejecutivo Nacional reglamentario de la <b>Ley N° 22.351</b>, en ${V(a.lugarActa)} a los ${V(fechaNum(a.fecha))}, procedo a la confección de la presente ACTA DE INFRACCIÓN en virtud de haber comprobado: ${V(a.hechos)} en el paraje conocido como ${V(a.paraje)}, jurisdicción ${/^(Reserva|Otra)/i.test(ar)?"de la":"del"} ${V(ar,"PN, RN, MN, RNE ……………")}, contraviniendo lo prescripto en ${V(a.normativa)}, por parte de ${quien}, ${ident}, con domicilio real en la calle ${V(i.calle)} de la localidad de ${V(i.localidad)}, provincia de ${V(i.provincia)}.</p>
    <p>En este acto también se procede al secuestro de los elementos utilizados en la infracción, y/o sus frutos, consistentes en: ${sec.length?V(sec.map(s=>`${s.cant||1} ${s.desc}`).join("; ")):V("","no se secuestran elementos")} que permanecerán en tal condición hasta que se cumplimente el pago de la multa, cuando se procederá a su devolución, siempre que no corresponda hacer efectiva la sanción de decomiso, conforme el Artículo 29 de la Ley N° 22.351 de Parques Nacionales.---</p>
    <p>La persona infractora ${V(nombreInfr(a))} constituye domicilio en ${V(i.domConstituido)} y/o en la plataforma electrónica de “TRÁMITES A DISTANCIA” CUIT/CUIL ${V(i.tadCuit)} a todos los efectos de las actuaciones que se originen con motivo de la presente y donde se tendrán por válidas todas las notificaciones legalmente realizadas (cfr. Ley N° 19.549, Decreto N° 1759/1972 y concordantes). ---</p>
    <p>Se hace saber que podrá presentar descargo en el término de CINCO (5) días hábiles y que la infracción es pasible de ser sancionada de acuerdo a los Artículos 28 y 29 de la Ley N° 22.351, mediante acto administrativo.----</p>
    <div class="firmas f3">
     ${firma(a.firmas.infractor,"INFRACTOR",nombreInfr(a),a.negoFirma?"Se negó a firmar":null)}
     ${firma(a.firmas.testigo0,"TESTIGO",a.testigos[0]?.nombre?`${a.testigos[0].nombre}${a.testigos[0].doc?" · Doc. "+a.testigos[0].doc:""}`:"")}
     ${firma(a.firmas.guardaparque,"FUNCIONARIO ACTUANTE",`${a.guardaparque.nombre||""}${a.guardaparque.legajo?" · Leg. N° "+a.guardaparque.legajo:""}`)}
    </div>${a.testigos[1]?.nombre?`<div class="firmas f3">${firma(a.firmas.testigo1,"TESTIGO",`${a.testigos[1].nombre}${a.testigos[1].doc?" · Doc. "+a.testigos[1].doc:""}`)}</div>`:""}`;
  } else {
    const [y,m,d]=(a.fecha||"--").split("-");
    const P=a.personas.filter(p=>nombrePersona(p));
    const pres=P.length?`Se encuentra${P.length>1?"n presentes":" presente"} en el acto ${P.length>1?"los señores":"el/la señor/a"} ${V(P.map(nombrePersona).join("; "))} quien${P.length>1?"es acreditan":" acredita"} identidad mediante presentación de ${V([...new Set(P.map(p=>p.docTipo||"DNI"))].join("/"))} N°/s ${V(P.map(p=>p.docNum).filter(Boolean).join("; "))} en calidad de ${V(P.map(p=>p.calidad).filter(Boolean).join("; "))}.`
      :`No se encuentran personas presentes en el acto.`;
    h+=`<div class="dorig"><span>${esc(copia)}</span></div><div class="dorig dconst"><h3 class="dtitle u">ACTA DE CONSTATACIÓN</h3><span>N°: ${V(a.numero,"______")}</span></div>
    <p>A los ${V(d?String(Number(d)):"")} días del mes de ${V(m?MESES[Number(m)-1]:"")} del año ${V(y)} siendo las ${V(a.hora)} horas, en ${V(a.paraje)} del ${V(ar)}, se constituye el funcionario que suscribe ${V(a.guardaparque.nombre)} Leg. N° ${V(a.guardaparque.legajo)} con el objeto de proceder a constatar los hechos que más abajo se detallan.-</p>
    <p class="ind">${pres}</p>
    <p class="ind">Se CONSTATA que: ${V(a.hechos)}</p>
    <p class="ind">En el lugar y fecha indicados al comienzo, se firma la presente en DOS (2) ejemplares constituidos por el original para el funcionario actuante y UNA (1) copia, en caso de ser necesario para los testigos.</p>
    <div class="firmas f2">
     ${a.testigos.map((t,k)=>t.nombre?firma(a.firmas["testigo"+k],"TESTIGO",`Aclaración: ${t.nombre}<br>Doc. Ident. N° ${t.doc||"……"}`,null,true):"").join("")||firma(null,"TESTIGO","Aclaración: ……<br>Doc. Ident. N° ……",null,true)}
     ${firma(a.firmas.guardaparque,"FUNCIONARIO ACTUANTE",`${a.guardaparque.nombre||""}${a.guardaparque.legajo?" · Leg. N° "+a.guardaparque.legajo:""}`)}
    </div>`;
  }
  if(coordsOk(a)){ const u=mapsUrl(a), q=qrSrc(u); h+=`<div class="dqr">${q?`<img src="${q}" alt="Código QR de la ubicación">`:""}<div><b>Ubicación del ${isInfr(a)?"hecho":"lugar constatado"}</b><span>${esc(num(a.lat).toFixed(5))}, ${esc(num(a.lon).toFixed(5))} (WGS84)${a.prec?` · ± ${esc(a.prec)} m`:""}</span><span>${q?"Escaneá el código para abrir el lugar en el mapa.":esc(u)}</span></div></div>`; }
  if(opt.anexo) h+=anexo(a,opt);
  h+=a.estado==="cerrada"?`<div class="integridad">Cerrada el ${new Date(a.cerrada).toLocaleString("es-AR")} · Código de integridad SHA-256: ${esc(a.hash)}</div>`:`<div class="integridad">BORRADOR · sin número ni código de integridad</div>`;
  return h+`</article>`;
}
function anexo(a,opt={fotos:true}){
  const inf=isInfr(a), G=a.ganado||{}, v=a.vehiculo||{}, i=a.infractor||{};
  const rows=[];
  rows.push(["Hora",a.hora?a.hora+" h":""]);
  if(coordsOk(a)) rows.push(["Ubicación en el mapa",mapsUrl(a)]);
  if(inf&&(i.telefono||i.email)) rows.push(["Contacto del infractor",[i.telefono,i.email].filter(Boolean).join(" · ")]);
  if(v.dominio||v.marca||v.tipo) rows.push(["Vehículo",[v.tipo,v.marca,v.color,v.dominio&&"dominio "+v.dominio].filter(Boolean).join(", ")]);
  if(a.rubros.length) rows.push(["Conductas (listado APN)",a.rubros.map(id=>ITEMS[id]?`${ITEMS[id].art} ${ITEMS[id].g.r}: ${ITEMS[id].t}`:"").filter(Boolean).join(" | ")]);
  if(!inf&&a.normativa) rows.push(["Normativa relacionada",a.normativa]);
  if(a.ajusteMapa) rows.push(["Origen de la ubicación","Marcada sobre el mapa por el funcionario actuante."]);
  if(a.firmaPapel) rows.push(["Firmas","Tomadas de puño y letra sobre el acta impresa."]);
  if(inf&&a.negoFirma&&!a.firmaPapel) rows.push(["Negativa a firmar",`La persona infractora se negó a suscribir la presente${a.motivoNoFirma?`. Manifestó: «${a.motivoNoFirma}»`:""}. Corresponde sumario contravencional (art. 6°, Dto. 300/2022).`]);
  if(a.observaciones) rows.push([inf?"Manifestación / observaciones":"Observaciones",a.observaciones]);
  const gan=a.rubros.includes("gan0")?`<table><tr><th>Cantidad</th><th>Clase</th><th>Machos / hembras</th><th>Adultos / menores</th><th>Raza</th><th>Pelaje</th><th>Caravanas</th></tr><tr><td>${esc(G.cant)}</td><td>${esc(G.clase)}</td><td>${esc(G.machos||"-")} / ${esc(G.hembras||"-")}</td><td>${esc(G.adultos||"-")} / ${esc(G.menores||"-")}</td><td>${esc(G.raza)}</td><td>${esc(G.color)}</td><td>${esc(G.caravanas)}</td></tr></table>${G.marca?`<p>Marca o señal: ${esc(G.marca)}.</p>`:""}`:"";
  return `<section class="danexo"><h4>Anexo digital del acta${a.numero?" N° "+esc(a.numero):""}</h4><p class="hint2">Datos registrados en el procedimiento que complementan el texto del modelo oficial.</p>
   <table>${rows.filter(r=>r[1]).map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</table>
   ${gan?`<h5>Cuadro de hacienda (Res. APN 467/2017)</h5>${gan}`:""}
   ${a.fotos.length&&!opt.fotos?`<p>Registro fotográfico: ${a.fotos.length} foto/s en el acta digital.</p>`:""}${a.fotos.length&&opt.fotos?`<h5>Registro fotográfico</h5><div class="dphotos">${a.fotos.map((f,k)=>`<figure><img src="${f.src}" alt=""><figcaption>${k+1}. ${esc(f.nota||"")}</figcaption></figure>`).join("")}</div>`:""}</section>`;
}
function firma(src,rol,acl,no,below){return `<div class="firma">${no?`<div class="nofirma">${no}</div>`:src?`<img src="${src}" alt="Firma">`:`<div class="nofirma muted">&nbsp;</div>`}<div class="l">${below?`<b>${rol}</b><span class="acl">${acl}</span>`:`<span class="acl">${esc(acl||"")}</span><b>${rol}</b>`}</div></div>`}
function vVer(){
  const a=S.cur;
  return `<div class="stack">${a.estado==="cerrada"?"":`<div class="notice noprint"><b>Vista previa.</b> El acta sigue abierta. Volvé a editar para cerrarla.</div>`}${coordsOk(a)?`<div class="mapcard noprint"><div class="mapa" id="mapaVer" role="region" aria-label="Mapa de la ubicación del acta"></div><div class="row"><span class="grow mono">${esc(num(a.lat).toFixed(5))}, ${esc(num(a.lon).toFixed(5))}${a.prec?` · ± ${esc(a.prec)} m`:""}</span><a class="btn sm" href="${esc(mapsUrl(a))}" target="_blank" rel="noopener">Abrir en Google Maps</a></div></div>`:""}<div class="docwrap">${docHTML(a)}</div></div>`;
}

/* ============ Barra de acciones ============ */
function bar(mode){
  const ab=$("#actionbar"), ac=$("#actions"); if(!mode){ab.hidden=true;return} ab.hidden=false;
  if(mode==="perfil") ac.innerHTML=`<span class="saved">Se guarda solo.</span><button class="btn primary" type="button" data-act="inicio">Listo</button>`;
  if(mode==="editor"){ const last=S.step===pasos(S.cur).length-1;
    ac.innerHTML=`<button class="btn" type="button" data-act="prev" ${S.step===0?"disabled":""}>Atrás</button><span class="saved" id="savedLbl">Borrador guardado</span>${last?`<button class="btn primary" type="button" data-act="cerrar">Cerrar acta</button>`:`<button class="btn primary" type="button" data-act="next">Siguiente</button>`}`; }
  if(mode==="ver"){ const cerr=S.cur.estado==="cerrada"; const iframe=window.self!==window.top;
    ac.innerHTML=cerr?`<button class="btn" type="button" data-act="share">Compartir</button>${iframe?"":`<button class="btn" type="button" data-act="export">Exportar</button>`}<button class="btn primary grow" type="button" data-act="print">Imprimir</button>`
      :`<button class="btn" type="button" data-act="volver">Seguir editando</button><span class="saved"></span>${S.cur.ejemplo?"":`<button class="btn danger" type="button" data-act="borrar">Descartar</button>`}`; }
}

/* ============ Guardado ============ */
let saveT=null;
function save(){
  if(S.view==="perfil"){ clearTimeout(saveT); saveT=setTimeout(()=>store.set("perfil",S.perfil),250); return; }
  if(!S.cur) return; S.cur.editada=Date.now();
  if(!S.actas.includes(S.cur)) S.actas.push(S.cur);
  const l=$("#savedLbl"); if(l) l.textContent="Guardando…";
  clearTimeout(saveT); saveT=setTimeout(async()=>{ await store.put(JSON.parse(JSON.stringify(S.cur))); const l2=$("#savedLbl"); if(l2) l2.textContent="Borrador guardado "+new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}); },300);
}
async function sha256(t){ try{ const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join(""); }catch(e){ let h=0; for(const c of t) h=(h*31+c.charCodeAt(0))|0; return "simple-"+(h>>>0).toString(16); } }
function proxNumero(a){ const p=S.perfil||{}; const k=isInfr(a)?"proxInf":"proxConst"; const n=Number(p[k])||1; return {k,n,num:`${p.prefijo?p.prefijo.toUpperCase()+"-":""}${a.fecha.slice(0,4)}-${pad(n,3)}`}; }
function cerrar(){
  const a=S.cur; const bad=pasos(a).map((t,i)=>[i===0&&!coordsOk(a)?(a.paraje&&a.area?"la ubicación GPS":"Lugar, fecha y ubicación GPS"):t,stepOk(a,i)]).filter(x=>!x[1]);
  if(bad.length){ toast("Falta completar: "+bad.map(x=>x[0]).join(", ")+"."); return; }
  modal(`<h3>¿Cerrar el acta N° ${esc(proxNumero(a).num)}?</h3><p>Se le asigna ese número y ya no se puede modificar. Revisá que los datos estén bien.</p><div class="row"><button class="btn grow" type="button" data-act="modalno">Revisar</button><button class="btn primary grow" type="button" data-act="cerrarok">Cerrar y numerar</button></div>`);
}
async function cerrarOk(){
  closeModal(); const a=S.cur; const {k,n,num}=proxNumero(a);
  a.numero=num; a.estado="cerrada"; a.cerrada=Date.now();
  const {hash,...rest}=a; a.hash=await sha256(JSON.stringify(rest));
  S.perfil={...(S.perfil||{}),[k]:n+1}; await store.set("perfil",S.perfil);
  await store.put(JSON.parse(JSON.stringify(a))); S.view="ver"; render(); openPrint();
}

/* ============ Exportar / compartir ============ */
function resumen(a){ const inf=isInfr(a); return `${inf?"ACTA DE INFRACCIÓN":"ACTA DE CONSTATACIÓN"} N° ${a.numero}\n${areaNombre(a)}\n${fechaNum(a.fecha)} ${a.hora} · ${a.paraje}\n${inf?"Persona infractora: "+nombreInfr(a)+" ("+(a.infractor.docTipo||"")+" "+(a.infractor.docNum||"")+")\nContraviniendo: "+a.normativa+"\n":""}${inf?"Hechos":"Se constata que"}: ${a.hechos}\n${inf?"\nPodrá presentar descargo en el término de CINCO (5) días hábiles (Dto. 300/2022).\n":""}${coordsOk(a)?"\nUbicación: "+mapsUrl(a):""}\nCódigo de integridad: ${a.hash}`; }
async function compartir(){
  const a=S.cur, txt=resumen(a);
  try{ if(navigator.share){ await navigator.share({title:"Acta N° "+a.numero,text:txt}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(txt); toast("Resumen copiado. Pegalo en un correo o mensaje."); }
  catch(e){ modal(`<h3>Resumen del acta</h3><textarea id="resumenTxt" readonly style="min-height:240px">${esc(txt)}</textarea><button class="btn" type="button" data-act="modalno">Cerrar</button>`); const t=$("#resumenTxt"); t.focus(); t.select(); }
}
function exportar(){
  try{ const blob=new Blob([JSON.stringify(S.cur,null,1)],{type:"application/json"}); const f=new File([blob],`acta-${S.cur.numero}.json`,{type:"application/json"});
    if(navigator.canShare&&navigator.canShare({files:[f]})){ navigator.share({files:[f],title:"Acta N° "+S.cur.numero}).catch(()=>{}); return; }
    const u=URL.createObjectURL(blob), l=document.createElement("a"); l.href=u; l.download=f.name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000);
    toast("Archivo del acta generado.");
  }catch(e){ toast("No se pudo exportar en este navegador."); }
}

/* ============ GPS ============ */
let gpsWatch=null, gpsT=null;
function paintCoords(a){ if(S.cur!==a||S.view!=="editor"||S.step!==0) return; const box=$("#gpsBox"); if(!box) return;
  box.classList.toggle("ok",coordsOk(a)&&S.gpsBusy!==a.id); box.querySelector(".coords").outerHTML=coordsHTML(a);
  const b=box.querySelector("button"); if(b){b.textContent=S.gpsBusy===a.id?"Detener":coordsOk(a)?"Volver a tomar":"Tomar ubicación";}
  ["lat","lon"].forEach(k=>{const el=$("#"+k); if(el&&document.activeElement!==el) el.value=a[k]||"";});
  mapaSync(a);
  document.querySelectorAll('.step[data-step="0"]').forEach(s=>s.classList.toggle("done",S.step!==0&&stepOk(a,0))); }
function gpsStop(){ if(gpsWatch!=null&&navigator.geolocation) navigator.geolocation.clearWatch(gpsWatch); gpsWatch=null; clearTimeout(gpsT); }
function gps(auto){
  const a=S.cur; if(!a||(auto&&window.self!==window.top)) return;
  if(S.gpsBusy===a.id&&!auto){ gpsStop(); S.gpsBusy=null; paintCoords(a); return; }
  if(!navigator.geolocation){ if(!auto) toast("Este dispositivo no ofrece ubicación. Cargá las coordenadas a mano."); return; }
  gpsStop(); S.gpsBusy=a.id; let best=null; paintCoords(a);
  const fin=(msg)=>{ gpsStop(); if(S.gpsBusy===a.id) S.gpsBusy=null; paintCoords(a); if(msg) toast(msg); };
  gpsWatch=navigator.geolocation.watchPosition(p=>{
      if(S.cur!==a) return fin();
      if(!best||p.coords.accuracy<best.coords.accuracy){ best=p; a.lat=p.coords.latitude.toFixed(5); a.lon=p.coords.longitude.toFixed(5); a.prec=String(Math.round(p.coords.accuracy)); a.ajusteMapa=false; a.gpsHora=new Date().toISOString(); save(); paintCoords(a); }
      if(p.coords.accuracy<=15) fin("Ubicación tomada (± "+a.prec+" m).");
    },e=>{ if(best) return fin("Ubicación tomada (± "+a.prec+" m)."); fin(e.code===1?"Permiso de ubicación denegado. Habilitalo en el teléfono o cargá las coordenadas a mano.":"No se obtuvo señal GPS. Probá a cielo abierto o cargalas a mano."); },
    {enableHighAccuracy:true,maximumAge:0,timeout:30000});
  gpsT=setTimeout(()=>fin(best?"Ubicación tomada (± "+a.prec+" m).":"No se obtuvo señal GPS en 30 s. Probá a cielo abierto o cargalas a mano."),30000);
}

/* ============ UI auxiliar ============ */
let toastT; function toast(m){ let t=$(".toast"); if(!t){t=document.createElement("div");t.className="toast";t.setAttribute("role","status");document.body.appendChild(t)} t.textContent=m; clearTimeout(toastT); toastT=setTimeout(()=>t.remove(),3800); }
function modal(h){ $("#modalRoot").innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="box">${h}</div></div>`; }
function closeModal(){ $("#modalRoot").innerHTML=""; }

/* ============ Eventos ============ */
const RERENDER=new Set(["area","infractor.esEmpresa","negoFirma","firmaPapel"]);
document.addEventListener("input",e=>{
  const p=e.target.dataset.f; if(!p) return;
  const tgt=S.view==="perfil"?S.perfil:S.cur; if(!tgt) return;
  setPath(tgt,p,e.target.type==="checkbox"?e.target.checked:e.target.value);
  if(p==="normativa") S.cur.normativaManual=true;
  if(p==="lat"||p==="lon"){ S.cur.prec=""; S.cur.ajusteMapa=false; if(S.gpsBusy===S.cur.id){gpsStop();S.gpsBusy=null;} paintCoords(S.cur); }
  save();
  if(RERENDER.has(p)) render(true);
});
document.addEventListener("click",async e=>{
  const b=e.target.closest("button"); if(!b) return; const d=b.dataset;
  if(b.id==="topBtn"){ S.perfil=S.perfil||{}; return go(S.view==="inicio"?"perfil":"inicio"); }
  if(d.new){ S.cur=nuevaActa(d.new); S.step=0; S.busca=""; S.view="editor"; render(); gps(true); return; }
  if(d.open){ S.cur=S.actas.find(a=>a.id===d.open); S.step=0; S.busca=""; S.view=S.cur.estado==="cerrada"?"ver":"editor"; render(); if(S.view==="editor"&&!coordsOk(S.cur)&&!S.cur.ejemplo) gps(true); return; }
  if(d.filtro){ S.filtro=d.filtro; render(); return; }
  if(d.step){ S.step=Number(d.step); render(); return; }
  if(d.rubro) return toggleRubro(d.rubro);
  if(d.delsec){ S.cur.secuestros.splice(Number(d.delsec),1); save(); return render(true); }
  if(d.delper){ S.cur.personas.splice(Number(d.delper),1); save(); return render(true); }
  if(d.delfoto){ S.cur.fotos.splice(Number(d.delfoto),1); save(); return render(true); }
  if(d.clearsig){ delete S.cur.firmas[d.clearsig]; save(); return render(true); }
  if(d.dellogo){ delete S.perfil[d.dellogo]; save(); return render(true); }
  switch(d.act){
    case "perfil": S.perfil=S.perfil||{}; return go("perfil");
    case "instalar": return instalar();
    case "instalarNo": try{localStorage.setItem("instalarOculto",String(Date.now()+7*864e5))}catch(e){} return render(true);
    case "inicio": return go("inicio");
    case "next": S.step=Math.min(S.step+1,pasos(S.cur).length-1); return render();
    case "prev": S.step=Math.max(S.step-1,0); return render();
    case "gps": return gps();
    case "addsec": S.cur.secuestros.push({desc:"",cant:"1"}); save(); return render(true);
    case "addper": S.cur.personas.push({docTipo:"DNI"}); save(); return render(true);
    case "copiarDom": { const i=S.cur.infractor; i.domConstituido=[i.calle,i.localidad,i.provincia].filter(Boolean).join(", "); save(); return render(true); }
    case "preview": S.view="ver"; return render();
    case "volver": S.view="editor"; return render();
    case "cerrar": return cerrar();
    case "cerrarok": return cerrarOk();
    case "modalno": return closeModal();
    case "print": return openPrint();
    case "share": return compartir();
    case "export": return exportar();
    case "borrar": return modal(`<h3>¿Descartar este borrador?</h3><p>Se elimina del dispositivo y no se puede recuperar.</p><div class="row"><button class="btn grow" type="button" data-act="modalno">Conservar</button><button class="btn danger grow" type="button" data-act="borrarok">Descartar</button></div>`);
    case "borrarok": closeModal(); await store.del(S.cur.id); S.actas=S.actas.filter(a=>a!==S.cur); go("inicio"); return toast("Borrador descartado.");
    case "borrarEjemplos": for(const a of S.actas.filter(x=>x.ejemplo)) await store.del(a.id); S.actas=S.actas.filter(a=>!a.ejemplo); await store.set("ejemplosQuitados",true); return render();
  }
});

/* ============ Arranque ============ */
function migrar(a){ // borradores de la versión 0.1
  if(a.v===2) return a;
  a.v=2; a.paraje=a.paraje||a.lugar||""; a.lugarActa=a.lugarActa||a.seccional||""; a.personas=a.personas||[];
  a.observaciones=a.observaciones||a.manifestacion||""; a.rubros=(a.rubros||[]).filter(r=>ITEMS[r]);
  const i=a.infractor=a.infractor||{}; i.calle=i.calle||i.domicilio||""; i.acredita=i.acredita||"documento";
  return a;
}
(async function boot(){
  S.perfil=(await store.get("perfil"))||null;
  let L=((await store.all())||[]);
  for(const a of L.filter(x=>x.id==="ej1"||x.id==="ej2")) await store.del(a.id);
  L=L.filter(x=>x.id!=="ej1"&&x.id!=="ej2").map(migrar);
  if(!L.some(a=>a.ejemplo) && !(await store.get("ejemplosQuitados"))){ const E=ejemplos(); for(const a of E) await store.put(a); L=L.concat(E); }
  S.actas=L; render();
  if("serviceWorker" in navigator && window.self===window.top && location.protocol!=="file:"){ navigator.serviceWorker.register("sw.js").catch(()=>{}); }
})();
