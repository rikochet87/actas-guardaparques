/* ============ Impresión en el lugar ============ */
const BLE_SERVICES=["000018f0-0000-1000-8000-00805f9b34fb","e7810a71-73ae-499d-8c15-faa9aef0c3f2","0000ff00-0000-1000-8000-00805f9b34fb","0000ffe0-0000-1000-8000-00805f9b34fb","0000fff0-0000-1000-8000-00805f9b34fb","0000ae30-0000-1000-8000-00805f9b34fb"];
const PR={ancho:"58",copias:"ambas",anexo:true,fotos:false,canvas:null,ble:null,busy:false};
const enIframe=()=>window.self!==window.top;
function copiasDe(a){ const inf=isInfr(a); return PR.copias==="original"?["ORIGINAL"]:PR.copias==="copia"?[inf?"COPIA PARA EL INFRACTOR":"COPIA"]:["ORIGINAL",inf?"COPIA PARA EL INFRACTOR":"COPIA"]; }

function openPrint(){
  const p=S.perfil||{}; PR.ancho=p.impAncho||"58"; PR.canvas=null; PR.busy=false;
  renderPrint();
}
function renderPrint(){
  const a=S.cur, inf=isInfr(a), term=PR.ancho!=="A4";
  const bt=!!navigator.bluetooth, shareImg=!!(navigator.canShare&&window.File);
  modal(`<div class="prhead"><h3>Imprimir acta N° ${esc(a.numero)}</h3><button class="btn sm ghost" type="button" data-act="modalno">Cerrar</button></div>
   <div class="field"><span class="lbl">Impresora</span><div class="seg seg3" role="radiogroup">
    ${[["58","Térmica 58 mm"],["80","Térmica 80 mm"],["A4","Hoja A4 / carta"]].map(([v,t])=>`<label><input type="radio" name="prAncho" value="${v}" ${PR.ancho===v?"checked":""}><span>${t}</span></label>`).join("")}</div></div>
   <div class="grid2"><div class="field"><label for="prCopias">Ejemplares</label><select id="prCopias">
     <option value="ambas" ${PR.copias==="ambas"?"selected":""}>Original + ${inf?"copia para el infractor":"copia"}</option>
     <option value="original" ${PR.copias==="original"?"selected":""}>Solo original</option>
     <option value="copia" ${PR.copias==="copia"?"selected":""}>Solo ${inf?"copia para el infractor":"copia"}</option></select></div>
    <div class="field"><span class="lbl">Contenido</span><label class="check tight"><input type="checkbox" id="prAnexo" ${PR.anexo?"checked":""}><span>Anexo digital</span></label><label class="check tight"><input type="checkbox" id="prFotos" ${PR.fotos?"checked":""}><span>Fotos</span></label></div></div>
   ${term?`<div class="prprev" id="prPrev"><span class="hint">Preparando vista del ticket…</span></div>`:`<p class="hint">Se abre el diálogo de impresión del teléfono. Elegí la impresora (Wi‑Fi, Bluetooth o USB) o «Guardar como PDF». Cada ejemplar sale en hoja aparte.</p>`}
   <div class="prstatus" id="prStatus" role="status"></div>
   <div class="stack tightstack">
   ${term?`${bt?`<button class="btn primary" type="button" id="prBT">Imprimir por Bluetooth</button>`:""}
     ${shareImg?`<button class="btn ${bt?"":"primary"}" type="button" id="prShare">Enviar a app de impresión</button>`:""}
     ${!bt?`<p class="hint">${enIframe()?"La vista previa no puede usar Bluetooth. Instalá la app en el celular (Chrome en Android) para imprimir directo.":"Este navegador no permite Bluetooth (iPhone o navegador sin soporte). Usá «Enviar a app de impresión» con la app de tu impresora."}</p>`:`<p class="hint">Encendé la impresora y emparejala la primera vez desde la lista que aparece. Funciona con impresoras térmicas BLE (ESC/POS) en Chrome para Android.</p>`}`
   :enIframe()?`<p class="notice">La vista previa no puede abrir el diálogo de impresión. Funciona en la app instalada.</p>`:`<button class="btn primary" type="button" id="prA4">Imprimir</button>`}
   </div>`);
  document.querySelectorAll('input[name=prAncho]').forEach(r=>r.onchange=()=>{PR.ancho=r.value; S.perfil=S.perfil||{}; S.perfil.impAncho=r.value; store.set("perfil",S.perfil); renderPrint();});
  $("#prCopias").onchange=e=>{PR.copias=e.target.value; refreshPrev();};
  $("#prAnexo").onchange=e=>{PR.anexo=e.target.checked; refreshPrev();};
  $("#prFotos").onchange=e=>{PR.fotos=e.target.checked; refreshPrev();};
  const bBT=$("#prBT"), bSh=$("#prShare"), bA4=$("#prA4");
  if(bBT) bBT.onclick=printBT; if(bSh) bSh.onclick=printShare; if(bA4) bA4.onclick=printA4;
  refreshPrev();
}
async function refreshPrev(){
  if(PR.ancho==="A4") return;
  const box=$("#prPrev"); if(!box) return;
  try{ PR.canvas=await ticketCanvas(S.cur,Number(PR.ancho)===80?576:384); box.innerHTML=""; const img=new Image(); img.src=PR.canvas.toDataURL("image/png"); img.alt="Vista del ticket"; box.appendChild(img);
    const mm=Math.round(PR.canvas.height/8); box.insertAdjacentHTML("beforeend",`<span class="hint">Largo aproximado: ${mm>=1000?(mm/1000).toFixed(1)+" m":Math.round(mm/10)+" cm"} de papel</span>`);
  }catch(e){ box.innerHTML=`<span class="hint">No se pudo generar la vista: ${esc(e.message||e)}</span>`; }
}
function status(m,pct){ const s=$("#prStatus"); if(!s) return; s.innerHTML=m?`${esc(m)}${pct!=null?`<span class="bar"><i style="width:${pct}%"></i></span>`:""}`:""; }

/* ---- A4 por diálogo del sistema ---- */
function printA4(){
  const a=S.cur; let pa=$("#printArea"); if(!pa){pa=document.createElement("div");pa.id="printArea";document.body.appendChild(pa)}
  pa.innerHTML=copiasDe(a).map(c=>docHTML(a,c,{anexo:PR.anexo,fotos:PR.fotos})).join("");
  document.body.classList.add("printing");
  const done=()=>{document.body.classList.remove("printing"); window.removeEventListener("afterprint",done)};
  window.addEventListener("afterprint",done);
  setTimeout(()=>{ window.print(); setTimeout(done,1500); },150);
}

/* ---- Ticket térmico: se dibuja el mismo documento en un canvas monocromo ---- */
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}
function segsDe(node,bold=false,out=[]){
  node.childNodes.forEach(n=>{
    if(n.nodeType===3){ if(n.nodeValue) out.push({s:n.nodeValue.replace(/\s+/g," "),b:bold}); }
    else if(n.nodeType===1){ if(n.tagName==="BR") out.push({s:"\n",b:bold}); else segsDe(n,bold||n.tagName==="B"||n.classList.contains("v"),out); }
  }); return out;
}
async function bloques(a,copia){
  const tmp=document.createElement("div"); tmp.innerHTML=docHTML(a,copia,{anexo:PR.anexo,fotos:PR.fotos});
  const art=tmp.firstElementChild, B=[];
  for(const el of art.children){
    const c=el.classList;
    if(c.contains("ejemplo")) B.push({t:"p",al:"c",segs:[{s:el.textContent,b:true}]});
    else if(c.contains("dlogos")){ const imgs=[...el.querySelectorAll("img")]; if(imgs.length) B.push({t:"logos",srcs:imgs.map(i=>i.src)}); const ins=el.querySelector(".dinst"); if(ins&&ins.textContent.trim()) B.push({t:"p",al:"c",sz:.9,segs:segsDe(ins)}); B.push({t:"p",al:"c",b:true,sz:.85,segs:[{s:"ADMINISTRACIÓN DE PARQUES NACIONALES",b:true}],only:isInfr(a)}); }
    else if(c.contains("dorig")){ const h=el.querySelector("h3"); el.querySelectorAll(":scope > span").forEach(s=>B.push({t:"p",al:"r",sz:.9,segs:segsDe(s)})); if(h) B.push({t:"title",s:h.textContent}); }
    else if(el.tagName==="H3") B.push({t:"title",s:el.textContent});
    else if(el.tagName==="P") B.push({t:"p",segs:segsDe(el),ind:c.contains("ind")});
    else if(c.contains("firmas")){ for(const f of el.querySelectorAll(".firma")){ const im=f.querySelector("img"); const no=f.querySelector(".nofirma"); B.push({t:"sig",src:im?im.src:null,no:no&&no.textContent.trim()&&!no.classList.contains("muted")?no.textContent.trim():null,lines:[...f.querySelector(".l").children].flatMap(ch=>ch.innerHTML.split(/<br\s*\/?>/i)).map(h=>{const d=document.createElement("div");d.innerHTML=h;return d.textContent.trim()}).filter(Boolean)}); } }
    else if(c.contains("danexo")){ B.push({t:"rule"}); for(const n of el.children){
        if(n.tagName==="H4"||n.tagName==="H5") B.push({t:"p",al:"c",segs:[{s:n.textContent,b:true}]});
        else if(n.tagName==="TABLE"){ const rows=[...n.rows]; if(rows[0]&&rows[0].cells[0].tagName==="TH"&&rows[0].cells.length>2){ const hd=[...rows[0].cells].map(x=>x.textContent), vl=rows[1]?[...rows[1].cells].map(x=>x.textContent):[]; hd.forEach((h,k)=>B.push({t:"p",sz:.9,segs:[{s:h+": ",b:true},{s:vl[k]||"-",b:false}]})); }
          else rows.forEach(r=>B.push({t:"p",sz:.9,segs:[{s:r.cells[0].textContent+": ",b:true},{s:r.cells[1]?.textContent||"",b:false}]})); }
        else if(n.classList.contains("dphotos")){ for(const fg of n.querySelectorAll("figure")) B.push({t:"photo",src:fg.querySelector("img").src,cap:fg.querySelector("figcaption").textContent}); }
        else if(n.tagName==="P"&&!n.classList.contains("hint2")) B.push({t:"p",sz:.9,segs:segsDe(n)});
      } }
    else if(c.contains("integridad")) { B.push({t:"rule"}); B.push({t:"p",sz:.75,segs:[{s:el.textContent,b:false}]}); }
  }
  return B.filter(b=>b.only!==false);
}
async function ticketCanvas(a,W){
  const base=W>400?24:19, M=6, LH=1.32, cw=W-2*M;
  const cps=copiasDe(a); const all=[];
  for(let k=0;k<cps.length;k++){ all.push(...await bloques(a,cps[k])); if(k<cps.length-1) all.push({t:"cut"}); }
  const imgs=new Map(); for(const b of all){ for(const s of [b.src,...(b.srcs||[])]) if(s&&!imgs.has(s)) imgs.set(s,await loadImg(s)); }
  const cv=document.createElement("canvas"); const x=cv.getContext("2d");
  const font=(sz,b)=>`${b?"700":"400"} ${Math.round(base*(sz||1))}px Arial, Helvetica, sans-serif`;
  function wrap(segs,sz,firstInd){ const words=[]; segs.forEach(sg=>sg.s.split(/(\s+|\n)/).forEach(w=>{ if(w==="") return; words.push({w,b:sg.b}); }));
    const lines=[]; let line=[], lw=firstInd||0;
    for(const t of words){ if(t.w==="\n"){ lines.push(line); line=[]; lw=0; continue; } x.font=font(sz,t.b); const isSp=/^\s+$/.test(t.w); const ww=x.measureText(isSp?" ":t.w).width;
      if(!isSp&&lw+ww>cw&&line.length){ while(line.length&&/^\s+$/.test(line.at(-1).w)) line.pop(); lines.push(line); line=[]; lw=0; }
      if(isSp&&!line.length) continue;
      if(!isSp&&ww>cw){ let chunk=""; for(const ch of t.w){ if(x.measureText(chunk+ch).width+lw>cw){ line.push({w:chunk,b:t.b,ww:x.measureText(chunk).width}); lines.push(line); line=[]; lw=0; chunk=""; } chunk+=ch; } x.font=font(sz,t.b); line.push({w:chunk,b:t.b,ww:x.measureText(chunk).width}); lw+=x.measureText(chunk).width; continue; }
      line.push({w:isSp?" ":t.w,b:t.b,ww}); lw+=ww; }
    if(line.length) lines.push(line); return lines; }
  // pasada 1: medir; pasada 2: dibujar
  function run(draw){
    let y=M+4;
    for(const b of all){
      if(b.t==="title"){ const sz=W>400?1.35:1.3; x.font=font(sz,true); const ls=wrap([{s:b.s,b:true}],sz); for(const l of ls){ const lw=l.reduce((s,t)=>s+t.ww,0); y+=base*sz*LH; if(draw){x.font=font(sz,true); let xx=M+(cw-lw)/2; l.forEach(t=>{x.fillText(t.w,xx,y-base*sz*.3); xx+=t.ww;});} } y+=6; }
      else if(b.t==="p"){ const sz=b.sz||1; const ind=b.ind?base*1.6:0; const ls=wrap(b.segs,sz,ind); ls.forEach((l,li)=>{ y+=base*sz*LH; if(!draw) return; const lw=l.reduce((s,t)=>s+t.ww,0); let xx=b.al==="c"?M+(cw-lw)/2:b.al==="r"?W-M-lw:M+(li===0?ind:0); for(const t of l){ x.font=font(sz,t.b); x.fillText(t.w,xx,y-base*sz*.3); if(t.b&&b.al!=="c"&&b.al!=="r"&&t.w.trim()){ x.fillRect(xx,y-base*sz*.12,t.ww,1);} xx+=t.ww; } }); y+=base*.45; }
      else if(b.t==="logos"){ const h=W>400?110:84; const n=b.srcs.length; const slot=cw/n; b.srcs.forEach((s,k)=>{ const im=imgs.get(s); if(!im||!draw) return; const sc=Math.min(h/im.height,(slot-8)/im.width); const w=im.width*sc,hh=im.height*sc; x.drawImage(im,M+slot*k+(slot-w)/2,y+(h-hh)/2,w,hh); }); y+=h+8; }
      else if(b.t==="sig"){ const h=W>400?110:90; y+=8; const im=b.src&&imgs.get(b.src);
        if(draw){ if(im){ const sc=Math.min(h/im.height,cw*.8/im.width); x.drawImage(im,M+(cw-im.width*sc)/2,y,im.width*sc,im.height*sc);} else if(b.no){ x.font=font(.9,true); const tw=x.measureText(b.no).width; x.fillText(b.no,M+(cw-tw)/2,y+h/2);} x.fillRect(M+cw*.08,y+h+2,cw*.84,2);} y+=h+6;
        for(const ln of b.lines){ const sz=.85; const ls=wrap([{s:ln,b:/^(INFRACTOR|TESTIGO|FUNCIONARIO)/.test(ln)}],sz); for(const l of ls){ y+=base*sz*LH; if(draw){ const lw=l.reduce((s,t)=>s+t.ww,0); let xx=M+(cw-lw)/2; l.forEach(t=>{x.font=font(sz,t.b); x.fillText(t.w,xx,y-base*sz*.3); xx+=t.ww;}); } } } y+=6; }
      else if(b.t==="photo"){ const im=imgs.get(b.src); if(im){ const sc=cw/im.width; const h=Math.min(im.height*sc,cw); if(draw) x.drawImage(im,M,y+4,cw,h); y+=h+8; } const ls=wrap([{s:b.cap,b:false}],.8); ls.forEach(l=>{ y+=base*.8*LH; if(draw){ let xx=M; l.forEach(t=>{x.font=font(.8,false); x.fillText(t.w,xx,y-base*.25); xx+=t.ww;}); } }); y+=6; }
      else if(b.t==="rule"){ y+=8; if(draw) x.fillRect(M,y,cw,2); y+=8; }
      else if(b.t==="cut"){ y+=26; if(draw){ x.font=font(.8,false); const s="- - - - - - cortar aquí - - - - - -"; const tw=x.measureText(s).width; x.fillText(s,M+(cw-tw)/2,y);} y+=40; }
    }
    return y+M+24;
  }
  cv.width=W; cv.height=10; const H=Math.ceil(run(false)); cv.height=H;
  x.fillStyle="#fff"; x.fillRect(0,0,W,H); x.fillStyle="#000"; x.textBaseline="alphabetic"; run(true);
  // monocromo: umbral para texto y firmas, tramado para fotos y logos
  const d=x.getImageData(0,0,W,H), p=d.data, L=new Float32Array(W*H);
  for(let i=0;i<W*H;i++) L[i]=.299*p[i*4]+.587*p[i*4+1]+.114*p[i*4+2];
  for(let yy=0;yy<H;yy++) for(let xx=0;xx<W;xx++){ const i=yy*W+xx, o=L[i], n=o<150?0:255, e=o-n; L[i]=n;
    if(o>40&&o<215){ if(xx+1<W) L[i+1]+=e*7/16; if(yy+1<H){ if(xx>0) L[i+W-1]+=e*3/16; L[i+W]+=e*5/16; if(xx+1<W) L[i+W+1]+=e/16; } } }
  for(let i=0;i<W*H;i++){ const v=L[i]<128?0:255; p[i*4]=p[i*4+1]=p[i*4+2]=v; p[i*4+3]=255; }
  x.putImageData(d,0,0); return cv;
}
function escpos(cv){
  const W=cv.width, H=cv.height, bw=W/8, px=cv.getContext("2d").getImageData(0,0,W,H).data;
  const parts=[new Uint8Array([0x1B,0x40])];
  for(let y0=0;y0<H;y0+=200){ const h=Math.min(200,H-y0); const band=new Uint8Array(8+bw*h); band.set([0x1D,0x76,0x30,0x00,bw&255,bw>>8,h&255,h>>8]);
    for(let yy=0;yy<h;yy++) for(let xb=0;xb<bw;xb++){ let byte=0; for(let bit=0;bit<8;bit++){ const i=((y0+yy)*W+xb*8+bit)*4; if(px[i]<128) byte|=0x80>>bit; } band[8+yy*bw+xb]=byte; }
    parts.push(band); }
  parts.push(new Uint8Array([0x1B,0x64,0x05,0x1D,0x56,0x42,0x00]));
  const len=parts.reduce((s,a)=>s+a.length,0), out=new Uint8Array(len); let o=0; parts.forEach(a=>{out.set(a,o);o+=a.length}); return out;
}
async function bleChar(){
  if(PR.ble&&PR.ble.dev.gatt.connected) return PR.ble.ch;
  let dev=PR.ble&&PR.ble.dev;
  if(!dev) dev=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:BLE_SERVICES});
  status("Conectando con "+(dev.name||"la impresora")+"…");
  const srv=await dev.gatt.connect(); let ch=null;
  for(const s of await srv.getPrimaryServices()){ for(const c of await s.getCharacteristics()){ if(c.properties.writeWithoutResponse||c.properties.write){ ch=c; break; } } if(ch) break; }
  if(!ch) throw new Error("La impresora no ofrece un canal de escritura compatible.");
  PR.ble={dev,ch}; return ch;
}
async function printBT(){
  if(PR.busy) return; PR.busy=true;
  try{
    if(!PR.canvas) await refreshPrev();
    const ch=await bleChar(); const data=escpos(PR.canvas);
    const nr=ch.properties.writeWithoutResponse, CH=nr?180:100;
    for(let o=0;o<data.length;o+=CH){
      const part=data.slice(o,o+CH);
      if(nr&&ch.writeValueWithoutResponse){ await ch.writeValueWithoutResponse(part); await new Promise(r=>setTimeout(r,10)); } else await ch.writeValue(part);
      if((o/CH)%20===0) status("Imprimiendo…",Math.round(o/data.length*100));
    }
    status("Listo. Cortá el papel por la línea si salieron dos ejemplares.",100); toast("Acta enviada a la impresora.");
  }catch(e){
    const m=e&&e.name==="NotFoundError"?"No se eligió ninguna impresora.":e&&e.name==="SecurityError"?"El navegador bloqueó el Bluetooth en esta pantalla.":"No se pudo imprimir: "+(e.message||e)+". Revisá que la impresora esté encendida y cerca.";
    status(m); if(PR.ble&&PR.ble.dev&&!PR.ble.dev.gatt.connected) PR.ble=null;
  } finally { PR.busy=false; }
}
async function printShare(){
  try{ if(!PR.canvas) await refreshPrev();
    const blob=await new Promise(r=>PR.canvas.toBlob(r,"image/png")); const f=new File([blob],`acta-${S.cur.numero}.png`,{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f],title:"Acta N° "+S.cur.numero}); status("Elegí la app de tu impresora (por ejemplo RawBT o la del fabricante)."); }
    else status("Este navegador no puede compartir la imagen. Instalá la app en el celular.");
  }catch(e){ if(e&&e.name!=="AbortError") status("No se pudo compartir la imagen."); }
}
