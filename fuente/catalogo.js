/* Listado de infracciones frecuentes a reglamentos y normativas de la APN (transcripto de la planilla de referencia) */
const REGS=[
 {id:"fau",n:"Reglamento para la Protección y Manejo de la Fauna Silvestre en jurisdicción de la APN",r:"Res. HD N° 157/1991",it:[
  ["Art. 6° inc. a)","Cazar, pescar, hostigar, herir, capturar o apresar fauna, o actuar sobre su hábitat o nidos"],
  ["Art. 6° inc. b)","Introducción de especies, embriones o huevos"],
  ["Art. 6° inc. d)","Tenencia o portación de armas"],
  ["Art. 6° inc. e)","Tenencia y/o uso de trampas, redes, cebaderos, etc."],
  ["Art. 6° inc. f)","Tenencia o uso de venenos o tóxicos"],
  ["Art. 6° inc. g)","Tenencia de ejemplares vivos o traslado de productos y/o subproductos de fauna silvestre"],
  ["Art. 6° inc. h)","Introducción y/o tenencia de animales domésticos (incluye ganado)"],
  ["Art. 28°","Transporte de individuos, productos o subproductos de fauna silvestre de origen APN sin remito"]]},
 {id:"for",n:"Reglamento Forestal para los MN, PN y RN de la Región Andino-Patagónica",r:"Res. HD N° 11/1994",it:[
  ["Art. 13°","Volteo o remoción de productos forestales sin autorización"],
  ["Art. 89°","Fuego en sitios no habilitados"],
  ["Art. 132°","Daños al bosque o aprovechamientos no autorizados"]]},
 {id:"mas",n:"Reglamento para la Tenencia de Perros, Gatos y otras Mascotas en la APN",r:"Res. HD N° 59/2013",it:[
  ["Art. 2°","Presencia de perros sin autorización expresa de la APN"],
  ["Art. 6°","Ingreso con mascotas"]]},
 {id:"pes",n:"Reglamento General para la Pesca Deportiva Continental Patagónica",r:"Res. HD N° 384/2021",nota:"Se aprueba cada temporada por resolución específica",it:[
  ["Art. 2°","Pesca sin permiso"],
  ["Arts. 6° y 7°","Pesca fuera de horario (luz diurna) o fuera de temporada"],
  ["Art. 10°","Pesca de especies nativas prohibidas"]]},
 {id:"cul",n:"Reglamento para la Conservación del Patrimonio Cultural en jurisdicción de la APN",r:"Res. INT N° 115/2001",it:[
  ["Art. 1°","Acciones contra recursos culturales arqueológicos, históricos o antropológicos (excavar, remover, inscribir, desplazar, retirar material, encender fuego u otra acción que altere el recurso o su ubicación)"]]},
 {id:"gen",n:"Reglamento de Infracciones Generales",r:"Res. N° 871/1976",it:[
  ["Art. 1° inc. d)","Violar un dispositivo de seguridad (acampe en sitios no habilitados)"],
  ["Art. 1° inc. c)","Desobedecer las órdenes del personal de Guardaparques"],
  ["Art. 1° inc. k)","Dar a sabiendas avisos falsos que motiven la intervención del personal de Guardaparques"]]},
 {id:"tur",n:"Reglamento para el Otorgamiento de Permisos de Servicios Turísticos",r:"Res. HD N° 68/2008 (T.O. Res. 240/2011)",it:[
  ["Art. 4°","Excursiones terrestres, trekking, escalada, cabalgatas o buceo sin permiso"],
  ["Art. 5° inc. 5.7)","Vehículo de transporte no habilitado"],
  ["Art. 6°","Excursión sin guía habilitado"]]},
 {id:"gui",n:"Reglamento de Guías en Áreas Protegidas Nacionales",r:"Res. HD N° 113/2019",it:[
  ["Art. 5°","Guiar sin habilitación (guías de turismo, de sitio o especializados)"],
  ["Art. 38°","Incumplimiento de obligaciones del guía (cumplir normativas, portar credencial, acompañar al grupo, chofer-guía hasta 15 pax)"]]},
 {id:"car",n:"Reglamento de Prohibición de Cartelería, Afiches o Elementos Publicitarios",r:"Res. N° 2008/1974",it:[
  ["Art. 1°","Cartelería o cualquier elemento publicitario sin autorización de la APN"]]},
 {id:"eve",n:"Reglamento para la Realización de Eventos Especiales en jurisdicción de la APN",r:"Res. HD N° 66/2013",it:[
  ["Art. 14°","Realización de evento sin autorización de la APN"],
  ["Art. 16°","Incumplimiento de las obligaciones del organizador"]]},
 {id:"fot",n:"Reglamento de Fotógrafos y Video Operadores Profesionales en Áreas Protegidas Nacionales",r:"Res. HD N° 231/2011",it:[
  ["Art. 12°","Contravención a las obligaciones generales de conservación y de servicio"],
  ["Art. 16°","Ejercer la actividad de fotógrafo o video operador sin estar habilitado"]]},
 {id:"dro",n:"Reglamento para el Uso de Vehículos Aéreos No Tripulados en Áreas Protegidas de la APN",r:"Res. HD N° 9/2021",it:[
  ["Art. 4°","Uso de drones (VANT) en RNE, RNS y ZI, uso deportivo y/o recreativo, o drones con combustible"],
  ["Art. 7°","Uso científico, en filmaciones o eventos sin autorización"],
  ["Arts. 22°, 23° y 24°","Incumplimiento de recaudos generales y/o particulares de uso"]]},
 {id:"agu",n:"Prohibición de Motos de Agua y Esquí Acuático",r:"Res. HD N° 143/2005",it:[
  ["Art. 2°","Uso de motos de agua o similares"],
  ["Art. 3°","Práctica de esquí acuático o actividades similares"]]},
 {id:"veh",n:"Prohibición de Tránsito Vehicular por Caminos, Sendas o Huellas No Autorizados",r:"Res. HD N° 509/2017",it:[
  ["Art. 2°","Tránsito de vehículos o motos de nieve fuera de caminos, huellas o sitios habilitados"]]},
 {id:"eia",n:"Reglamento para la Evaluación de Impacto Ambiental en la APN",r:"Res. HD N° 203/2016",it:[
  ["Art. 2°","Obras, instalaciones, prestaciones de servicios o aprovechamiento de recursos naturales sin Evaluación de Impacto Ambiental"]]},
 {id:"can",n:"Reglamento para la Explotación de Canteras y Remoción de Suelos en la APN",r:"Res. HD N° 128/1997",it:[
  ["Art. 5°","Extracción de áridos, cateos o movimiento de suelos sin autorización de la APN"],
  ["Art. 6°","Extracción sin ajuste a las condiciones autorizadas"]]},
 {id:"con",n:"Reglamento de Construcciones",r:"Res. HD N° 241/2007",it:[
  ["Art. 2°","Construcciones sin autorización de la APN"]]},
 {id:"mue",n:"Reglamento para la Construcción y Uso de Rampas y Muelles en los Espejos de Agua de la APN",r:"Res. HD N° 179/2021",it:[
  ["","Construcción o instalación de muelle sin autorización de la APN"],
  ["","Marinas, boyas o muertos de amarre sin autorización de la APN"]]},
 {id:"ley",n:"Ley N° 22.351 — Prohibiciones generales",r:"Ley N° 22.351",it:[
  ["Art. 5°","En Parque Nacional: minería, industrias, explotación agropecuaria o forestal, pesca comercial, introducción de exóticas, modificación del paisaje o equilibrio biológico, sobrevuelo de aeronaves sin límite de altura"]]},
 {id:"pla",n:"Reglamento para la Reducción Progresiva y Prohibición Específica de los Plásticos en jurisdicción de la APN",r:"Res. HD N° 19/2020",it:[
  ["Art. 3°","Ofrecimiento, entrega, distribución o comercialización de productos plásticos de un solo uso"]]},
 {id:"inv",n:"Reglamento de Investigación Científica en la APN",r:"Res. HD N° ___/2016",it:[
  ["Art. 51 inc. 1","Investigación sin la autorización correspondiente"],
  ["Art. 51 inc. 2","Falsedad en los datos consignados al solicitar autorización"],
  ["Art. 51 inc. 3","Falta de informes parciales y/o final, publicaciones o constancia de depósito del material"],
  ["Art. 51 inc. 4","Participación de investigadores asistentes no autorizados"],
  ["Art. 51 inc. 5","Trabajo en condiciones, horario y/o sitios no autorizados"],
  ["Art. 51 inc. 6","Apertura de picadas sin autorización de la APN"],
  ["Art. 51 inc. 7","Recolección de material no autorizado"],
  ["Art. 51 inc. 8","Metodología distinta a la descripta en la autorización"],
  ["Art. 51 inc. 9","Falta de notificación de muerte accidental del ejemplar de fauna investigado"],
  ["Art. 51 inc. 10","Falta de notificación de hallazgos paleontológicos y/o culturales"],
  ["Art. 51 inc. 11","Depósito o cambio de lugar del material recolectado sin autorización"],
  ["Art. 51 inc. 12","Utilización de material recolectado para fines no autorizados"],
  ["Art. 51 inc. 13","Pérdida, sustracción, contaminación o destrucción de recursos durante la investigación"],
  ["Art. 51 inc. 14","Extravío, destrucción, daño o sustracción de documentos históricos resguardados por la APN"]]},
 {id:"res",n:"Reglamento para la Eliminación de Residuos y Desperdicios",r:"Res. N° 664/1976",it:[
  ["Art. 1°","Arrojar objetos de cualquier tipo dentro de las áreas de jurisdicción de la APN"]]},
 {id:"gan",n:"Procedimiento para la erradicación del ganado exótico no autorizado",r:"Res. APN N° 467/2017",it:[
  ["","Ganado no autorizado dentro del área protegida (habilita el cuadro de hacienda)"]]}
];
const ITEMS={}; REGS.forEach(g=>g.it.forEach((x,k)=>{ITEMS[g.id+k]={id:g.id+k,g,art:x[0],t:x[1]}}));
