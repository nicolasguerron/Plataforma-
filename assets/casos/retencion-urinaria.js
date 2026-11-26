/* =====================================================================
   CASO INTERACTIVO: PACIENTE QUE NO PUEDE ORINAR
   Módulo: Retención urinaria
   Autor del caso: Nicolás Guerrón Morales, Urología – Universidad del Valle / HUV.

   Estructura del archivo:
   1. Temas de la anamnesis (preguntas que reconoce el paciente)
   2. Hallazgos del examen físico
   3. Listas de verificación y mensajes de retroalimentación
   4. Flujo del caso por etapas (función `iniciar`)

   Para ajustar una respuesta, edite el texto `r` del tema.
   Para que el paciente reconozca otra forma de preguntar, agregue
   palabras a la expresión `p` (sin tildes y en minúsculas).
   ===================================================================== */
(function () {

  /* -------------------------------------------------------------------
     1. ANAMNESIS
     marca: temas de la lista de verificación que se cumplen al preguntar.
     general + fam: preguntas generales que se omiten si en el mismo
     mensaje hay una pregunta específica de la misma familia.
     ------------------------------------------------------------------- */
  const IPSS = [
    "Bueno, doctor, le cuento cómo me ha ido en el último mes:",
    "• Quedarme con la sensación de que no terminé de orinar: más de la mitad de las veces.",
    "• Tener que volver a orinar antes de dos horas: menos de la mitad de las veces.",
    "• Que el chorro se corte y vuelva a salir: más de la mitad de las veces.",
    "• Ganas que no puedo aguantar: menos de una vez de cada cinco.",
    "• Chorro débil: más de la mitad de las veces.",
    "• Tener que pujar para que salga: como la mitad de las veces.",
    "• Levantarme en la noche a orinar: unas tres veces.",
    "Y si me tocara quedarme así el resto de la vida… me sentiría muy mal."
  ].join("<br>");

  const ANAMNESIS = [
    // Generales
    { id: "saludo", general: true, fam: "*", p: /^(hola|buen(os|as)|buenas|mucho gusto|soy (el|la) (doctor|doctora|medico|medica|estudiante)|me llamo)/,
      r: "Buenas, doctor. Ayúdeme, por favor, que esto me duele mucho." },
    { id: "motivo", general: true, fam: "*", p: /que le pasa|que le (sucede|ocurre)|por que (viene|vino|consulta)|motivo de consulta|que (lo|le) trae|que siente|cuenteme|como se siente|en que le (puedo|podemos) ayudar|^que tiene$/,
      r: "Doctor, no puedo orinar. Tengo muchas ganas, pero no me sale nada. Me duele mucho aquí abajo." },
    { id: "nombre", p: /como se llama|su nombre|cual es su nombre/, no: /pastilla|medicament|remedio|droga|enfermedad/,
      r: "Jorge, doctor. Me llamo Jorge." },
    { id: "edad", p: /\bedad\b|cuantos anos tiene|que anos tiene/, r: "Tengo setenta años." },
    { id: "acompanante", p: /hijo|acompan|quien (lo )?trajo|con quien (vino|viene)/, no: /familia|cancer/,
      r: "Mi hijo me trajo, doctor." },

    // Enfermedad actual
    { id: "tiempo", p: /desde (que hora|cuando|hace cuanto)|hace cuanto|cuanto tiempo|cuantas horas|hace rato/,
      no: /presion|hipertens|fum|cigarr|losartan|pastilla|medicament|sintoma|orina(ndo)? mal|chorro|levant|noche|diabet|meses|anos|problema|molestia|no (se )?la toma/,
      r: "Hace como tres horas que no me sale nada.", marca: ["t_tiempo"] },
    { id: "ultima", p: /ultima vez que (orino|pudo orinar|logro orinar|fue al bano)|ultima miccion|orino (bien|normal)|cuando (fue que )?(orino|pudo orinar) (por ultima vez|bien|normal)/,
      r: "En la tarde, antes de salir para la fiesta.", marca: ["t_ultima"] },
    { id: "desencadenante", p: /que (estaba haciendo|hacia|paso|hizo)|antes de (esto|que (empezara|comenzara|le pasara))|desencaden|que lo (provoco|causo)|a que (lo )?atribuye|donde estaba|como (empezo|comenzo|arranco)|que (comio|bebio)|algo (raro|diferente|distinto)/,
      r: "Estaba en un cumpleaños. Antes de eso orinaba poquito, a gotas." },
    { id: "alcohol_evento", p: [/alcohol|cervez|trago|licor|aguardiente|\bron\b|whisky|guaro|emborrach|\bpola/, /tomo .*(fiesta|cumple)|(fiesta|cumple).*tomo/],
      y: /hoy|fiesta|cumple|evento|anoche|esta noche|cuant|bebio|tomo/,
      no: /habitual|normalmente|usualmente|frecuen|cada cuanto|semana|siempre|acostumbr|regular/,
      r: "Me tomé unas cervezas… como ocho, en unas cuatro horas.", marca: ["t_alcohol"] },
    { id: "alcohol_habito", p: /alcohol|cervez|trago|licor|aguardiente|\bron\b|whisky|guaro|emborrach|\bpola/,
      f: (t) => /habitual|normalmente|usualmente|frecuen|cada cuanto|semana|siempre|acostumbr|regular/.test(t) || !/hoy|fiesta|cumple|evento|anoche|esta noche|se tomo|bebio|cuant/.test(t),
      r: "Me tomo unas cervecitas los fines de semana, pero no tanto como hoy.", marca: ["t_alcohol"] },
    { id: "dolor", p: /dolor|duele|intensidad|del (1|uno) al (10|diez)|que tan fuerte|irradia|molestia/,
      no: /lumbar|espalda|costado|rinon|flanco|huesos|al orinar|para orinar|cuando orina|ardor|arde|cabeza|pecho|piernas|para el dolor|analgesic/,
      r: "Aquí abajo, encima del pubis. Como un 8 de 10. Es como una presión." },
    { id: "previos", p: /antes (orinaba|ha tenido|tenia)|problemas? (para|al|con|de) orinar|sintomas urinarios|sintomas (al|para) orinar|orina(ba|ndo)? mal|como (orina|orinaba|venia orinando|ha estado orinando)|dificultad(es)? (para|al) orinar|molestias? (para|al) orinar|venia orinando|cuanto tiempo (lleva|tiene) (con )?(problemas|sintomas|molestias|esto)|desde cuando (tiene|presenta) (problemas|sintomas|molestias)|sintomas previos|otros sintomas/,
      r: "Pues sí, ya llevo como seis meses orinando mal.", marca: ["t_previos"] },
    { id: "nicturia", p: /noche|nicturia|se levanta/, no: /esta noche|anoche|pastilla|losartan/,
      r: "Me levanto como tres o cuatro veces en la noche a orinar.", marca: ["t_llenado"] },
    { id: "tardanza", p: /demora|tarda|arranca|(empezar|iniciar|comenzar) a orinar|inicio de la (orina|miccion)|esperar (para|a) que (salga|empiece)|dificultad para (iniciar|empezar|comenzar)/,
      r: "Me demoro en arrancar, tengo que esperar un rato.", marca: ["t_vaciado"] },
    { id: "pujo", p: /puj|esfuerzo|fuerza para (orinar|que salga)|apretar|hacer fuerza/,
      r: "Sí, tengo que pujar para que salga.", marca: ["t_vaciado"] },
    { id: "chorro", p: /chorro|calibre|fuerza (del|de la) orina|sale (con|sin) fuerza|delgad/, no: /sangre|corta|interrump|intermiten/,
      r: "El chorro es delgadito, sin fuerza.", marca: ["t_vaciado"] },
    { id: "intermitencia", p: /se (le )?corta|intermiten|interrump|entrecortad|(para|corta) y (vuelve|sigue|arranca)|continuo/,
      r: "Sale, se corta y vuelve a salir.", marca: ["t_vaciado"] },
    { id: "vaciado", p: /vaci(a|o|ado|ar|amiento) (incompleto|completo|bien|completamente|del todo|toda)|queda(ndo)? con (ganas|algo|orina)|sensacion de (que )?(le )?qued|termina de orinar|quedo (algo|orina)|siente que (le )?queda/,
      r: "Siempre quedo con la sensación de que me quedó algo.", marca: ["t_vaciado"] },
    { id: "frecuencia", p: /frecuen|cada cuanto (orina|va al bano)|cuantas veces (orina|va al bano|al dia)|(de|en el) dia|seguido|muchas veces|mas veces/,
      no: /noche|levanta|cerveza|semana|trago|alcohol|pastilla|losartan|toma/,
      r: "De día voy al baño un poquito más que antes.", marca: ["t_llenado"] },
    { id: "urgencia", p: /urgencia|ganas (de repente|repentinas|muy fuertes)|de repente|no (alcanza|alcanzo) a llegar|aguantar las ganas|urgente|afan/,
      r: "A veces me dan ganas de repente, pero casi nunca.", marca: ["t_llenado"] },
    { id: "incontinencia", p: /incontinen|se (le )?(sale|escapa|moja)|escap|pierde orina|perdidas? de orina|panal|sin querer/,
      no: /heces|popo|materia fecal|deposicion|del cuerpo|gases|fecal|esfinter|anal|secrecion|pus/,
      r: "No, no se me sale.", marca: ["t_llenado"] },
    { id: "goteo", p: /goteo|gotea|gotic|gotas? (despues|al final|al terminar)|despues de orinar/,
      r: "Sí, después de orinar me quedan unas goticas.", marca: ["t_vaciado"] },
    { id: "consulta", p: /(ha|habia) (ido|consultado)|lo (ha|han) (visto|revisado|tratado)|ha consultado|algun tratamiento|tratamiento (para|por) (eso|esto|la prostata|orinar|los sintomas)|le (han|habian) (dado|formulado|mandado|recetado) (algo|medicamento|pastilla)|tamsulosina|finasterida|dutasterida/,
      r: "No, nunca he ido al médico por eso. Pensé que era normal de la edad." },
    { id: "psa", p: /\bpsa\b|antigeno/, r: "Nunca me lo han hecho." },
    { id: "prostata", p: /prostata/, no: /cirug|operac|operad|biopsia|procedimiento|reseccion|rtup|holep|psa|antigeno|cancer|tumor|tacto/,
      r: "Nunca me han revisado la próstata, doctor." },
    { id: "primera_vez", p: /(habia|ha) pasado (esto |algo asi )?(antes|otra vez|alguna vez)|primera vez|episodios? (previos?|anteriores?|similares?)|(alguna|otra) vez (le )?(habia|ha) pasado|le ha pasado (esto|algo asi)|ya le habia pasado|mismo (problema|episodio)/,
      r: "No, doctor, es la primera vez que me pasa." },
    { id: "hematuria", p: /sangre|hematuria|coagul|color (de la orina|rojo|oscuro)|\broj[ao]\b|coca cola/,
      no: /adelgaz|delgada|rala|presion|azucar|examen de sangre|anticoag/,
      r: "No, la orina siempre ha sido normal de color.", marca: ["t_hematuria"] },
    { id: "infeccion", p: /ardor|arde|disuria|fiebre|escalofr|calentura|infecci(on|ones) (urinaria|de (la )?orina|de vias|en la orina)|(duele|dolor|molesta) (al|cuando) orin|\bpus\b|mal olor|\bolor\b/,
      no: /transmision sexual|\bits\b|\bets\b|venere|gonorre/,
      r: "No, nada de eso.", marca: ["t_infeccion"] },
    { id: "lumbar", p: /lumbar|espalda|costado|rinon|flanco|cintura/, no: /calculo|piedra|litiasis|cirug|operac/, r: "No.", marca: ["t_lumbar"] },
    { id: "constitucional", p: /peso|bajado de peso|huesos|apetito|flaco/, r: "No, estoy igual." },
    { id: "intestinal", p: /estren|del cuerpo|deposicion|popo|intestin|defeca|heces/,
      no: /control|incontin|escap|se (le )?sale|aguant/,
      r: "Hago del cuerpo normal, todos los días. Hoy en la mañana fui." },

    // Antecedentes
    { id: "enf_general", general: true, fam: "enf", p: /enfermedad|antecedentes|sufre de|padece|problemas? de salud|condicion medica|enfermo|patologia/,
      no: /familia|papa|mama|padre|madre|herman|sexual/,
      r: "Solo la presión alta.", marca: ["t_hta"] },
    { id: "hta", fam: "enf", p: /presion|hipertens|tension/, no: /sangre|delgada/,
      r: "La presión alta, hace como diez años.", marca: ["t_hta"] },
    { id: "med_general", general: true, fam: "med", p: /medicament|medicina|pastilla|remedio|toma algo|farmac|tratamiento (actual|diario)/,
      r: "Solo la pastilla de la presión… cuando me acuerdo." },
    { id: "med_detalle", fam: "med",
      p: /losartan|cual (es (la|esa) )?(pastilla|medicamento|medicina|remedio)|que pastilla (es|toma para)|(pastilla|medicamento|medicina|remedio)s? (de|para) la presion|como se llama (la|el|esa|ese) (pastilla|medicamento|remedio)|nombre de(l| la) (pastilla|medicamento)|dosis|miligram|cada cuanto (se )?la toma|cuantas (veces|pastillas)|ultima (vez que (se )?(la )?tom|dosis)|olvid|adherencia|la toma (bien|todos los dias)|(pastilla|medicamento|medicina|losartan).{0,25}(todos los dias|diario|juicios|cumpl|regular)|cuando se acuerda|la tomo (hoy|ayer)|desde cuando no (se )?la toma/,
      seguimiento: { de: "med_general", p: /^(cual|cuales|y cual|que es|como se llama|cuanto|cada cuanto)|cual es|cual toma|como se llama/ },
      r: "Losartán, una pastilla de 50 en la mañana y otra en la noche. Pero se me olvida mucho; hace como una semana que no me la tomo.",
      marca: ["t_hta", "t_adherencia"] },
    { id: "ocupacion", p: /ocupacion|trabaj|a que se dedica|oficio|profesion|pension|jubil/, r: "Soy pensionado. Era conductor de bus." },
    { id: "tabaco", p: /fum|cigarr|tabac/, no: /marihuana/, r: "Fumé de joven, lo dejé hace como 30 años." },
    { id: "familiares", p: /familia|papa|padre|mama|madre|herman|heredit|abuel/,
      r: "Mi papá murió del corazón. Que yo sepa, nadie ha tenido cáncer.", marca: ["t_familiares"] },
    { id: "cancer", p: /cancer|tumor|neoplas/, no: /familia|papa|padre|mama|madre|herman|heredit|abuel/,
      r: "No, doctor, nunca me han dicho que tenga cáncer." },
    { id: "alergias", p: /alergi/, no: /antialerg/, r: "No, que yo sepa." },
    { id: "anticoag", fam: "med", p: /anticoag|antiagreg|aspirina|warfarina|clopidogrel|rivaroxaban|apixaban|dabigatran|adelgazar la sangre|sangre (delgada|rala)|\basa\b/,
      r: "No, solo el losartán.", marca: ["t_anticoag"] },

    // A. Estrechez uretral
    { id: "trauma", p: /golpe|trauma|caid|horcajad|ca(i|y)o sentado|bicicleta|caballo|patada|lesion (en|de) (la )?(uretra|pene|zona|perine)/,
      no: /columna|cabeza|medula|raquimedular/,
      r: "No, nunca me he golpeado ahí.", marca: ["t_trauma"] },
    { id: "pelvis", p: /fractur|pelvis|cadera|accidente/, no: /columna|cerebr/,
      r: "No.", marca: ["t_trauma"] },
    { id: "its", p: /transmision sexual|\bits\b|\bets\b|venere|gonorre|secrecion|uretritis|chancro|sifilis|clamidia|purgaci|enfermedad(es)? sexual/,
      r: "No, nunca.", marca: ["t_its"] },
    { id: "sondas", p: /sonda|cateter|sondaje/, y: /antes|previ|alguna vez|ha tenido|han (puesto|pasado|colocado)|le pusieron|le pasaron|habian/,
      r: "No, nunca me han puesto sonda.", marca: ["t_sondas"] },
    { id: "proc_uro", fam: "cx", p: /cirug|operac|operad|opera(ron|do)|procedimiento|intervenc|le han hecho|le hicieron/,
      y: /prostata|vejiga|urolog|uretra|via urinaria|rinon|pene/,
      r: "No, nunca me han hecho nada en la próstata ni en la vejiga.", marca: ["t_procedimientos"] },
    { id: "proc_esp", p: /cistoscop|biopsia|rtup|holep|reseccion|uretrotom|dilatacion (de la )?uretra|endoscop/,
      r: "No, nunca me han hecho nada en la próstata ni en la vejiga.", marca: ["t_procedimientos"] },
    { id: "radioterapia", p: /radioterap|radiacion|quimioterap|quimio\b/, r: "No.", marca: ["t_procedimientos"] },
    { id: "cx_abdomen", fam: "cx", p: /cirug|operac|operad|intervenc|quirurg|cicatri/, y: /abdom|barriga|estomago|vientre|hernia|apendic|vesicula|intestin/,
      r: "No, nunca me han operado de nada.", marca: ["t_cirugia"] },
    { id: "cx_general", general: true, fam: "cx", p: /cirug|operac|operad|intervenc|quirurg/,
      r: "No, doctor, nunca.", marca: ["t_cirugia"] },
    { id: "anestesia", p: /anestesi/, r: "No." },

    // B. Causas neurológicas
    { id: "diabetes", fam: "enf", p: /diabet|azucar|glucosa|glicemia|glucometr/,
      r: "No, el azúcar siempre me ha salido bien.", marca: ["t_diabetes"] },
    { id: "neuro", fam: "enf", p: /\bacv\b|derrame|trombosis|infarto cerebral|ataque cerebral|accidente cerebr|parkinson|esclerosis|demencia|alzheimer|neurolog|convulsi|epileps|temblor|memoria/,
      r: "No.", marca: ["t_neuro"] },
    { id: "columna", fam: "enf", p: /columna|raquimedular|medula|hernia (de )?disc|disco|vertebr/,
      r: "No.", marca: ["t_columna"] },
    { id: "cauda", p: /debilidad|hormigueo|adormec|entumec|sensibilidad|fuerza en las piernas|piernas|gluteo|nalga|silla de montar|cauda|paresia|parestesia|no siente/,
      r: "No.", marca: ["t_cauda"] },
    { id: "inc_fecal", p: /heces|popo|materia fecal|deposicion|del cuerpo|gases|fecal|esfinter|anal\b/,
      y: /control|escap|sale|incontin|aguant|retener|mancha|esfinter/,
      r: "No.", marca: ["t_cauda"] },

    // C. Medicamentos y sustancias
    { id: "antigripales", fam: "med", p: /gripa|gripe|antigrip|antihistamin|antialerg|descongestion|clorfenamina|fenilefrina|pseudoefedrina|resfriado|para la tos|jarabe|loratadina|dolex/,
      r: "No, no he tomado nada para la gripa.", marca: ["t_antigripales"] },
    { id: "anticolin", fam: "med", p: /anticolin|antiespasm|buscapina|hioscina|butilbromuro|oxibutinina|colico/,
      r: "No.", marca: ["t_anticolin"] },
    { id: "opioides", fam: "med", p: /opio|opiace|tramadol|codeina|morfina|analgesic|hidromorfona|oxicodona|para el dolor|calmante/,
      r: "No.", marca: ["t_opioides"] },
    { id: "psico", fam: "med", p: /antidepres|antipsic|dormir|nervios|ansiedad|depresion|amitriptilina|clonazepam|alprazolam|benzodiaz|tranquiliz|sedante|psiquiatr|quetiapina|haloperidol|fluoxetina|sertralina/,
      r: "No.", marca: ["t_psico"] },
    { id: "relajantes", fam: "med", p: /relajante|miorrelaj|metocarbamol|ciclobenzaprina|orfenadrina/, r: "No." },
    { id: "calcio", fam: "med", p: /calcioantag|amlodipin|verapamil|nifedipin|diltiazem|canales de calcio/, r: "No, solo el losartán." },
    { id: "sustancias", p: /droga|sustancia|marihuana|cocaina|psicoactiv|basuco|perico|consume algo/, r: "No, doctor." },

    // D. Otras
    { id: "litiasis", p: /calculo|piedra|litiasis/, r: "No, nunca he tenido cálculos." },
    { id: "prepucio_hist", p: /prepucio|fimosis|retraer|pellejo|capuchon|circuncid/, r: "No, eso está normal." },
    { id: "ipss", p: /ipss|escala de sintomas|puntaje (internacional )?de sintomas|cuestionario/,
      r: IPSS, marca: ["t_vaciado", "t_llenado"],
      tutor: "Calcula el puntaje total del IPSS y su interpretación." }
  ];

  /* -------------------------------------------------------------------
     2. EXAMEN FÍSICO
     ------------------------------------------------------------------- */
  const H = {
    general: ["Aspecto general", "Alerta, orientado, álgico, inquieto. Hidratado."],
    vitales: ["Signos vitales", "PA 162/94 mmHg · FC 98 lpm · FR 18 rpm · T 36,7 °C · SatO2 96 %."],
    cabeza: ["Cabeza y cuello", "Sin alteraciones."],
    cardiopulmonar: ["Cardiopulmonar", "Ruidos cardiacos rítmicos, sin soplos. Murmullo vesicular conservado, sin agregados."],
    abdomen: ["Abdomen: inspección y palpación", "<strong>Masa hipogástrica redondeada, de bordes lisos, que llega hasta unos dos traveses de dedo por debajo del ombligo. Dolorosa a la palpación; al palparla, el paciente siente más ganas de orinar.</strong> Resto del abdomen blando, sin otras masas ni signos de irritación peritoneal."],
    percusion: ["Abdomen: percusión", "<strong>Matidez en el hipogastrio, con límite superior convexo.</strong>"],
    puno: ["Puño percusión renal", "Negativa bilateral."],
    prepucio: ["Prepucio", "<strong>Retráctil sin dificultad, sin anillo fibrótico. No hay fimosis.</strong>"],
    liquen: ["Glande y prepucio: piel", "<strong>Coloración normal. Sin placas blanquecinas, esclerosis, fisuras ni cicatrices. Sin signos de liquen escleroso.</strong>"],
    meato: ["Meato uretral", "<strong>Ortotópico, de calibre normal, no puntiforme. Sin secreción ni sangre.</strong>"],
    testiculos: ["Testículos y escroto", "Ambos testículos en la bolsa escrotal, de tamaño y consistencia normales, no dolorosos."],
    perine: ["Periné", "Sin equimosis, hematomas ni cicatrices."],
    neuro: ["Neurológico", "Fuerza y sensibilidad conservadas en miembros inferiores. Sensibilidad perineal conservada."],
    extremidades: ["Extremidades", "Sin edema. Pulsos presentes."]
  };

  const EXAMEN = [
    { id: "general", p: /aspecto|estado general|apariencia|como (lo veo|se ve|luce)|inspeccion general|impresion general|conciencia|hidrata/ },
    { id: "vitales", p: /signos vitales|vitales|presion arterial|tension arterial|frecuencia (cardiaca|respiratoria)|\bpulso\b|temperatura|saturaci/ },
    { id: "cabeza", p: /cabeza|cuello|ojos|conjuntiv|mucosa|tiroides|orofaringe|boca/ },
    { id: "cardiopulmonar", p: /corazon|cardi|pulmon|torax|ausculta|respirat|ruidos|murmullo/, no: /abdom|intestin/ },
    { id: "abdomen", p: /abdom|barriga|vientre|panza|palp|hipogastr|suprapubic|vejiga|globo|masa|inspecc/,
      no: /puno|renal|rinon|lumbar|prostata|testic|escroto|pene|prepucio|meato|tacto/,
      f: (t) => !/percu/.test(t) || /palp|inspecc|toc(o|ar)|examin|explor|evalu|reviso/.test(t) },
    { id: "percusion", p: /percu|matidez|\bmate\b|timpan/, no: /puno|renal|rinon|lumbar/ },
    { id: "puno", p: /puno|renal|rinon|giordano|lumbar/ },
    { id: "prepucio", p: /prepucio|fimosis|retra(er|ctil|igo|cto|ccion)|capuchon|parafimosis/ },
    { id: "liquen", p: /liquen|glande|escleros|placa|piel del pene|lesion(es)? (en|del) (pene|glande)|blanquec|fisura/ },
    { id: "meato", p: /meato|uretra|secrecion|uretrorragia|puntiforme|orificio/ },
    { id: "testiculos", p: /testic|escroto|bolsa escrotal|gonada/ },
    { id: "perine", p: /perine|equimosis|hematoma/ },
    { id: "neuro", p: /neuro|fuerza|sensibilidad|reflej|bulbocavernoso|silla de montar/ },
    { id: "extremidades", p: /extremidad|miembros inferiores|edema|pulsos|piernas/, no: /fuerza|sensibilidad/ }
  ];
  const PENE = ["prepucio", "liquen", "meato"];

  /* -------------------------------------------------------------------
     Expresiones especiales
     ------------------------------------------------------------------- */
  const RE = {
    diagnostico: /diagnostic|cual es la causa|respuesta correcta|dime (la )?respuesta|que tiene el paciente|que enfermedad tiene|cual es (el|la) (problema|enfermedad)|que patologia/,
    urologia: /(llam|avis|consult|pedir|pido|solicit|interconsult|remit|traslad|valora).*(urolog|especialista)|\bremit|remision|traslad|interconsulta/,
    urologiaPasado: /ha ido|lo ha visto|lo han visto|ha consultado|alguna vez|habia/,
    paraclinicos: /hemograma|creatinin|\bbun\b|uroanalisis|parcial de orina|urocultivo|ecograf|\beco\b|\btac\b|tomograf|rayos x|radiograf|laboratorio|paraclinic|ionograma|electrolit|funcion renal|azoados|cuadro hematico|imagen|(pid|pedir|pido|solicit|orden|mand|tomar|toma de|tomamos) .{0,20}(examen|examenes|psa|prueba|muestra)/,
    accion: /\b(pasar|paso|pasamos|pasemos|pase|poner|pongo|ponemos|pongamos|colocar|coloco|colocamos|dejar|dejo|instalar)\b.{0,15}(sonda|cateter|foley|nelaton)|sondear|evacuar (la )?vejiga|drenar|vaciar (la )?vejiga|puncion|cistostom/,
    tacto: /tacto|rectal/,
    completo: /completo|completa|cefalocaudal|pies a cabeza|examino todo|todo el (cuerpo|paciente)|examen fisico general|examen general/,
    genitales: /genital|\bpene\b/,
    urinario: /orin|chorro|vejiga|\bpis\b|bano|miccion|prostata|noche|levanta|gota/,
    siNo: /\b(tiene|tenido|tenia|ha|han|sufre|padece|toma|tomado|alguna vez|le duele|siente|nota|presenta|usa|consume)\b/,
    sonda: /sonda|cateter|foley|nelaton|sondaje|cateterismo|drenaje vesical|evacuar|vaciar la vejiga|puncion|cistostom/,
    foley: /foley/,
    calibre: /\b(16|18)\s*(fr|f|french)?\b/,
    dosVias: /\b(2|dos) vias\b/,
    losartan: /losartan|reinici|antihipertensivo (habitual|de base)|medicacion (habitual|de base)/,
    antihipAgudo: /captopril|nifedipin|clonidin|labetalol|hidralazin|enalapril|nitroprus|antihipertensivo/
  };

  /* -------------------------------------------------------------------
     3. LISTAS DE VERIFICACIÓN Y MENSAJES
     ------------------------------------------------------------------- */
  const CHECK_ANAMNESIS = [
    { texto: "Tiempo de evolución de la retención y última micción",
      subs: { t_tiempo: "cuánto tiempo lleva sin orinar", t_ultima: "la última micción normal" },
      porque: "Define cuánto tiempo lleva la vejiga distendida y orienta la urgencia del drenaje." },
    { texto: "Desencadenante (alcohol)",
      subs: { t_alcohol: "el consumo de alcohol" },
      porque: "El alcohol precipita la retención: produce diuresis con sobredistensión vesical rápida en una vejiga que ya estaba obstruida." },
    { texto: "Síntomas urinarios previos de vaciado y llenado, y su tiempo de evolución",
      subs: { t_previos: "el tiempo de evolución de los síntomas", t_vaciado: "los síntomas de vaciado (chorro, pujo, tardanza, intermitencia, vaciado incompleto, goteo)", t_llenado: "los síntomas de llenado (nicturia, frecuencia, urgencia, incontinencia)" },
      porque: "Seis meses de síntomas de vaciado orientan a una obstrucción crónica de la salida vesical." },
    { texto: "Hematuria, síntomas infecciosos y dolor lumbar",
      subs: { t_hematuria: "la hematuria", t_infeccion: "los síntomas infecciosos (fiebre, ardor)", t_lumbar: "el dolor lumbar" },
      porque: "La hematuria cambia el tipo de sonda, y la fiebre o el dolor lumbar sugieren infección o compromiso del tracto urinario superior." },
    { texto: "Estrechez uretral: trauma, ITS / uretritis, sondas y procedimientos urológicos",
      subs: { t_trauma: "el trauma a horcajadas o pélvico", t_its: "las ITS o uretritis", t_sondas: "las sondas previas", t_procedimientos: "los procedimientos urológicos o la radioterapia" },
      porque: "Una estrechez uretral cambia la forma de drenar la vejiga." },
    { texto: "Causas neurológicas: diabetes, enfermedad neurológica, columna y signos de cauda equina",
      subs: { t_diabetes: "la diabetes", t_neuro: "la enfermedad neurológica (ACV, Parkinson, demencia)", t_columna: "el trauma o la cirugía de columna", t_cauda: "los signos de cauda equina" },
      porque: "Una vejiga neurogénica tiene otro enfoque y otro pronóstico." },
    { texto: "Medicamentos que causan retención",
      subs: { t_antigripales: "los antigripales o antihistamínicos", t_anticolin: "los anticolinérgicos o antiespasmódicos", t_opioides: "los opioides", t_psico: "los psicofármacos" },
      porque: "Son una causa frecuente y reversible de retención urinaria." },
    { texto: "Antecedentes personales (HTA y adherencia) y familiares",
      subs: { t_hta: "la hipertensión", t_adherencia: "el medicamento y la adherencia al losartán", t_familiares: "los antecedentes familiares" },
      porque: "La HTA mal controlada ayuda a interpretar la presión arterial, y el antecedente familiar orienta el riesgo de cáncer de próstata." }
  ];

  const MENSAJES_ANAMNESIS = [
    "«Solo la presión» no es una anamnesis completa: los antecedentes se preguntan de forma dirigida.",
    "Cada causa de retención tiene antecedentes que la sugieren. Buscarlos cambia la conducta. Por ejemplo, una estrechez uretral cambia la forma de drenar la vejiga.",
    "El alcohol precipita la retención: produce diuresis con sobredistensión vesical rápida en una vejiga que ya estaba obstruida.",
    "En urgencias, la anamnesis debe ser <strong>dirigida y rápida</strong>: el paciente tiene dolor."
  ];

  const ANALISIS_IDEAL = "Paciente de 70 años, hipertenso con regular adherencia al tratamiento, con cuadro de aproximadamente 6 meses de síntomas urinarios bajos de predominio de vaciamiento, que se exacerban desde hace 3 horas con retención urinaria. Al examen físico con globo vesical, sin otros hallazgos. Se indica paso de sonda uretral y se reevaluará posteriormente.";
  const PLAN_IDEAL = ["Observación en urgencias", "Dieta común", "Paso de sonda vesical: sonda Foley 16 Fr de 2 vías", "Reevaluación"];

  const CHECK_ANALISIS = [
    { id: "a1", texto: "Es una síntesis: no repite textualmente la enfermedad actual ni el resto de la historia" },
    { id: "a2", texto: "Incluye la edad y el antecedente de HTA" },
    { id: "a3", texto: "Incluye los síntomas urinarios de vaciado de 6 meses" },
    { id: "a4", texto: "Incluye la retención de 3 horas" },
    { id: "a5", texto: "Incluye el globo vesical y la ausencia de otros hallazgos" },
    { id: "a6", texto: "Termina con la conducta" },
    { id: "p1", texto: "Mi plan está escrito como órdenes médicas, en forma concisa" }
  ];

  const VIDEO_SONDA = "https://www.youtube.com/watch?v=0pCu6Y1-j2Q&t=262s";
  const VIDEO_PUNCION = "https://www.youtube.com/watch?v=k6DprE7nzGY";
  const enlace = (url, texto) => `<a href="${url}" target="_blank" rel="noopener">${texto}</a>`;

  const ul = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const fila = (estado, html) => `<li class="sim-${estado}"><span aria-hidden="true">${{ ok: "✅", parcial: "🟡", no: "❌", info: "ℹ️" }[estado]}</span><div>${html}</div></li>`;
  const checklist = (filas) => `<ul class="sim-check">${filas.join("")}</ul>`;

  /* -------------------------------------------------------------------
     4. FLUJO DEL CASO
     ------------------------------------------------------------------- */
  async function iniciar(sim) {
    const E = {
      marcas: new Set(),       // temas de anamnesis preguntados
      examen: new Set(),       // regiones examinadas
      penePedido: new Set(),   // elementos del pene pedidos de forma activa
      nPreguntas: 0,
      interrumpio: false,
      fallos: 0,
      ultimo: null,
      pendiente: null,
      tacto: 0,
      tactoInsistio: false,
      pidioParaclinicos: false,
      urologiaAntes: false,
      autoAnalisis: [],
      plan: { sonda: false, especifica: false, paraclinicos: false, primeraConParaclinicos: false },
      sondaCorrecta: null,
      tecnicaPrimera: null,
      puncionPrimera: null
    };

    /* ---------- Respuestas comunes ---------- */
    const reglaDiagnostico = () => sim.msg("tutor", "Eso lo tienes que descubrir tú. ¿Qué más le preguntarías al paciente?");
    const reglaUrologia = () => {
      E.urologiaAntes = true;
      sim.msg("tutor", "No hay urólogo disponible y el traslado tardaría varias horas. El paciente sigue con dolor. ¿Qué haces tú ahora?");
    };
    const reglaParaclinicos = () => {
      E.pidioParaclinicos = true;
      E.pendiente = "paraclinicos";
      sim.msg("tutor", "En este momento no están disponibles. ¿Alguno de ellos cambiaría lo que vas a hacer ahora con este paciente?");
    };
    const recordarParaclinicos = (extra = "") => {
      sim.msg("tutor", `Recuerda: estamos en una <strong>urgencia por retención urinaria</strong>. <strong>Ninguno de esos estudios cambia la conducta inicial.</strong> La prioridad es drenar la vejiga.${extra}`);
    };

    // Responde preguntas de anamnesis. Devuelve true si reconoció algo.
    function responderPaciente(texto) {
      const temas = sim.buscar(texto, ANAMNESIS, { ultimo: E.ultimo });
      if (!temas.length) return false;
      const respuestas = [...new Set(temas.map((t) => t.r))];
      temas.forEach((t) => (t.marca || []).forEach((m) => E.marcas.add(m)));
      E.ultimo = temas[temas.length - 1].id;
      sim.msg("paciente", respuestas.join("<br>"));
      temas.filter((t) => t.tutor).forEach((t) => sim.msg("tutor", t.tutor));
      return true;
    }

    // Pregunta no reconocida: responde como un paciente sano de 70 años
    // (sin hallazgos positivos) o pide reformular.
    function noReconocido(t) {
      if (!RE.urinario.test(t) && RE.siNo.test(t)) {
        sim.msg("paciente", "No, doctor.");
        return;
      }
      E.fallos++;
      sim.msg("paciente", "Mmm… no le entiendo bien, doctor. ¿Me lo puede preguntar de otra forma?");
      if (E.fallos % 2 === 0) {
        sim.msg("sistema", "💡 <strong>Pista:</strong> el paciente reconoce preguntas por palabras clave. Pregunta de forma concreta, por un síntoma o un antecedente a la vez (por ejemplo: «¿Ha tenido sangre en la orina?»).");
      }
    }

    /* =================================================================
       0. INICIO
       ================================================================= */
    sim.msg("sistema", `
      <p>👋 <strong>¡Bienvenido!</strong><br>
      Este es un <strong>caso de aprendizaje basado en problemas</strong>, diseñado para que practiques el enfoque de un paciente con <strong>retención urinaria</strong> en urgencias.</p>
      <p><strong>¿Cómo funciona?</strong></p>
      ${ul([
        "Vas a atender a un paciente simulado. En la conversación aparecerán el <strong>paciente</strong>, el <strong>tutor</strong> y, en algún momento, la <strong>enfermera</strong>.",
        "La información <strong>no se entrega sola</strong>: tendrás que preguntarla y examinarla tú, como en la vida real.",
        "Al final de cada etapa recibirás retroalimentación sobre lo que hiciste bien y lo que puedes mejorar."
      ])}
      <p><strong>Consejos</strong></p>
      ${ul([
        "Piensa como si el paciente estuviera frente a ti y tuviera dolor.",
        "Pregunta de forma dirigida y justifica tus decisiones.",
        "Escribe una pregunta concreta por mensaje, en lenguaje sencillo. El paciente reconoce tus preguntas por palabras clave."
      ])}
      <p>Cuando estés listo, presiona <strong>Iniciar caso</strong>.</p>`);
    await sim.botones([{ texto: "Iniciar caso" }]);

    /* =================================================================
       1. ANAMNESIS
       ================================================================= */
    sim.etapa(0);
    sim.msg("sistema", `
      <p><strong>Servicio de urgencias, 2:00 a. m.</strong><br>
      Don Jorge, de 70 años, llega acompañado de su hijo. Está inquieto, se toca el bajo vientre y camina de un lado a otro.</p>
      <p class="sim-vitales">Signos vitales de triage: PA 162/94 mmHg · FC 98 lpm · FR 18 rpm · T 36,7 °C · SatO2 96 % al aire ambiente.</p>`);
    sim.msg("paciente", "Doctor, no puedo orinar. Tengo muchas ganas, pero no me sale nada. Me duele mucho aquí abajo.");
    sim.msg("tutor", "Haz la anamnesis. Pregúntale al paciente lo que consideres necesario. Cuando termines, presiona <strong>Pasar al examen físico</strong>.");

    await sim.chat({
      placeholder: "Tu pregunta al paciente…",
      botones: [{ texto: "Pasar al examen físico →" }],
      alEnviar: (texto) => {
        const t = sim.normalizar(texto);
        E.nPreguntas++;
        if (E.pendiente === "paraclinicos") {
          E.pendiente = null;
          recordarParaclinicos(" Continúa con la anamnesis.");
        } else if (RE.diagnostico.test(t)) {
          reglaDiagnostico();
        } else if (RE.urologia.test(t) && !RE.urologiaPasado.test(t)) {
          reglaUrologia();
        } else if (RE.paraclinicos.test(t)) {
          reglaParaclinicos();
        } else if (RE.accion.test(t)) {
          sim.msg("tutor", "Antes de decidir la conducta, completa la anamnesis y el examen físico. Escribirás tu plan en la etapa 3.");
        } else if (!responderPaciente(texto)) {
          noReconocido(t);
        }
        if (E.nPreguntas > 15 && !E.interrumpio) {
          E.interrumpio = true;
          sim.msg("paciente", "Doctor, ¿me puede ayudar ya? No aguanto el dolor.");
        }
      }
    });

    // 1.7 Cierre de la anamnesis
    sim.msg("tutor", "Antes de examinar, escribe un resumen de la anamnesis, tus 3 principales hipótesis diagnósticas y los datos que apoyan o descartan cada una.");
    await sim.formulario([
      { id: "resumen", etiqueta: "Resumen de la anamnesis (3 o 4 líneas)", filas: 4 },
      { id: "hipotesis", etiqueta: "Tus 3 principales hipótesis, en orden de probabilidad", filas: 3, placeholder: "1.\n2.\n3." },
      { id: "datos", etiqueta: "Datos de la historia que apoyan o descartan cada hipótesis", filas: 4 }
    ], "Enviar");

    const filasAnamnesis = CHECK_ANAMNESIS.map((item) => {
      const ids = Object.keys(item.subs);
      const faltan = ids.filter((id) => !E.marcas.has(id));
      if (!faltan.length) return fila("ok", `<strong>${item.texto}</strong>`);
      const estado = faltan.length === ids.length ? "no" : "parcial";
      return fila(estado, `<strong>${item.texto}</strong><br><small>Te faltó preguntar por ${faltan.map((id) => item.subs[id]).join(", ")}. ${item.porque}</small>`);
    });
    E.anamnesisCompletos = filasAnamnesis.filter((f) => f.includes("sim-ok")).length;
    sim.msg("tutor", `<p><strong>Retroalimentación de la anamnesis</strong></p>${checklist(filasAnamnesis)}
      <p><strong>Mensajes clave</strong></p>${ul(MENSAJES_ANAMNESIS)}`);
    await sim.botones([{ texto: "Continuar al examen físico →" }]);

    /* =================================================================
       2. EXAMEN FÍSICO
       ================================================================= */
    sim.etapa(1);
    sim.msg("tutor", "Ahora examina al paciente. Dime qué vas a evaluar.");

    const entregar = (ids) => {
      ids.forEach((id) => {
        E.examen.add(id);
        if (id === "abdomen" || id === "percusion") E.examen.add("globo");
      });
      sim.msg("tutor", ids.map((id) => `<strong>${H[id][0]}:</strong> ${H[id][1]}`).join("<br>"));
    };

    function responderExamen(texto) {
      const t = sim.normalizar(texto);
      if (E.pendiente === "tacto") {
        E.pendiente = null;
        E.tacto = 2;
        sim.msg("tutor", `${ul([
          "El tacto rectal sirve <strong>fundamentalmente para enfocar la sospecha de cáncer de próstata</strong>: alteraciones en la consistencia, nódulos o compromiso de la glándula.",
          "Da una idea del tamaño de la próstata, pero <strong>en la evaluación inicial de la retención urinaria no cambia el manejo</strong>.",
          "<strong>No es el momento ideal</strong> para hacerlo. Puede quedar para una evaluación posterior."
        ])}`);
        return;
      }
      if (E.pendiente === "paraclinicos") { E.pendiente = null; recordarParaclinicos(" Continúa con el examen físico."); return; }
      if (RE.diagnostico.test(t)) return reglaDiagnostico();
      if (RE.urologia.test(t) && !RE.urologiaPasado.test(t)) return reglaUrologia();
      if (RE.paraclinicos.test(t)) return reglaParaclinicos();
      if (RE.accion.test(t)) return sim.msg("tutor", "Primero termina el examen físico. Escribirás tu análisis y tu plan en la siguiente etapa.");

      if (RE.tacto.test(t)) {
        if (E.tacto === 0) {
          E.tacto = 1;
          E.pendiente = "tacto";
          sim.msg("tutor", "¿Qué esperas encontrar y cómo cambiaría eso tu manejo en este momento?");
        } else if (E.tacto >= 2) {
          E.tactoInsistio = true;
          sim.msg("tutor", "<strong>Tacto rectal:</strong> próstata de aproximadamente 60 g, fibroelástica, sin nódulos, recesos laterales libres.");
        }
        return;
      }

      if (RE.completo.test(t)) {
        entregar(["general", "vitales", "cardiopulmonar", "abdomen", "percusion"]);
        sim.msg("tutor", "¿Qué vas a evaluar específicamente en los genitales y por qué?");
        return;
      }

      const hallados = sim.buscar(texto, EXAMEN).map((x) => x.id);
      hallados.filter((id) => PENE.includes(id)).forEach((id) => E.penePedido.add(id));
      if (hallados.length) entregar(hallados);

      const especificoGenital = hallados.some((id) => PENE.includes(id) || id === "testiculos" || id === "perine");
      if (RE.genitales.test(t) && !especificoGenital) {
        sim.msg("tutor", `¿Qué vas a evaluar específicamente en ${/\bpene\b/.test(t) ? "el pene" : "los genitales"} y por qué?`);
        return;
      }
      if (hallados.length) return;

      // 2.5 También puede seguir preguntando al paciente
      if (responderPaciente(texto)) return;
      sim.msg("tutor", "No entiendo qué quieres examinar. Sé específico: indica la región y la maniobra (por ejemplo, «palpo el hipogastrio»).");
    }

    await sim.chat({
      placeholder: "Escribe qué vas a examinar…",
      botones: [{ texto: "Terminar el examen físico" }],
      alEnviar: responderExamen
    });

    const peneFaltante = PENE.filter((id) => !E.penePedido.has(id));
    if (peneFaltante.length) {
      sim.msg("tutor", "Estos son los hallazgos del examen del pene. Búscalos siempre en un paciente con retención: la fimosis severa y el liquen escleroso con meato puntiforme se diagnostican solo con el examen físico.");
      entregar(peneFaltante);
    }
    sim.msg("tutor", "¿Tienes alguna duda o alguna pregunta adicional para el paciente?");
    await sim.chat({
      placeholder: "Escribe tu pregunta (opcional)…",
      botones: [{ texto: "No tengo más preguntas →" }],
      alEnviar: responderExamen
    });
    sim.msg("tutor", "En este momento <strong>no hay paraclínicos ni imágenes disponibles</strong>. Vas a decidir solo con los datos clínicos que tienes.<br>Escribe tu <strong>análisis</strong> y tu <strong>plan en forma de órdenes médicas</strong>.");

    /* =================================================================
       3. ANÁLISIS Y PLAN
       ================================================================= */
    sim.etapa(2);
    let { analisis, plan } = await sim.formulario([
      { id: "analisis", etiqueta: "Análisis", filas: 5 },
      { id: "plan", etiqueta: "Plan (órdenes médicas)", filas: 5, placeholder: "1.\n2.\n3." }
    ], "Enviar análisis y plan");

    let avisoUrologia = false, avisoParaclinicos = false;
    for (;;) {
      const p = sim.normalizar(plan);
      if (!avisoUrologia && RE.urologia.test(p) && !RE.sonda.test(p)) {
        avisoUrologia = true;
        reglaUrologia();
      } else if (!avisoParaclinicos && RE.paraclinicos.test(p)) {
        avisoParaclinicos = true;
        E.pidioParaclinicos = true;
        E.plan.primeraConParaclinicos = true;
        sim.msg("tutor", "En este momento no están disponibles. ¿Alguno de ellos cambiaría lo que vas a hacer ahora con este paciente?");
        await sim.formulario([{ id: "r", etiqueta: "Tu respuesta", filas: 2 }], "Responder");
        recordarParaclinicos(" Reescribe tu plan <strong>sin esperar resultados</strong>.");
      } else {
        break;
      }
      ({ plan } = await sim.formulario([{ id: "plan", etiqueta: "Plan (órdenes médicas)", filas: 5, valor: plan }], "Enviar plan"));
    }

    // 3.4 Retroalimentación
    const p = sim.normalizar(plan);
    E.plan.sonda = RE.sonda.test(p);
    E.plan.especifica = RE.foley.test(p) && RE.calibre.test(p) && RE.dosVias.test(p);
    E.plan.paraclinicos = RE.paraclinicos.test(p);
    const algoDeSonda = RE.foley.test(p) || RE.calibre.test(p) || RE.dosVias.test(p) || /nelaton/.test(p);

    const filasExamen = [
      E.examen.has("globo")
        ? fila("ok", "<strong>Identificaste el globo vesical</strong> (palpación o percusión del hipogastrio).")
        : fila("no", "<strong>No examinaste el abdomen.</strong><br><small>El globo vesical, por palpación y percusión, es el hallazgo que confirma la retención.</small>"),
      peneFaltante.length === 0
        ? fila("ok", "<strong>Evaluaste de forma activa el prepucio, la piel del glande y el meato.</strong>")
        : fila(peneFaltante.length === PENE.length ? "no" : "parcial", `<strong>Examen activo del pene</strong><br><small>No pediste: ${peneFaltante.map((id) => H[id][0].toLowerCase()).join(", ")}. La fimosis severa y el liquen escleroso con meato puntiforme son causas de retención que se diagnostican solo con el examen físico.</small>`)
    ];
    if (E.tacto > 0) {
      filasExamen.push(fila("info", `<strong>Pediste el tacto rectal.</strong><br><small>Recuerda que en la evaluación inicial de la retención no cambia el manejo; sirve sobre todo para enfocar la sospecha de cáncer de próstata.${E.tactoInsistio ? " Insististe en hacerlo: puede quedar para una evaluación posterior." : ""}</small>`));
    }

    const filasPlan = [
      E.plan.sonda
        ? fila("ok", "<strong>Indicaste el drenaje de la vejiga</strong> (paso de sonda vesical) como prioridad.")
        : fila("no", "<strong>No indicaste el paso de sonda vesical.</strong><br><small>Es la prioridad: el paciente está en retención y tiene dolor.</small>"),
      E.plan.especifica
        ? fila("ok", "<strong>Especificaste el tipo, el calibre y las vías de la sonda.</strong>")
        : fila(algoDeSonda ? "parcial" : "no", "<strong>Especifica el tipo, el calibre y las vías de la sonda.</strong><br><small>Lo trabajaremos en la siguiente etapa.</small>"),
      E.plan.paraclinicos
        ? fila("no", "<strong>Tu plan incluye paraclínicos o imágenes.</strong><br><small>Ninguno cambia la conducta inicial: primero se drena la vejiga.</small>")
        : E.plan.primeraConParaclinicos
          ? fila("parcial", "<strong>En tu primera versión del plan pediste paraclínicos.</strong><br><small>Bien por corregirlo: no condicionan la conducta inicial.</small>")
          : fila("ok", "<strong>No condicionaste la conducta a paraclínicos ni imágenes.</strong>")
    ];
    if (RE.losartan.test(p)) {
      filasPlan.push(fila("ok", "<strong>Consideraste reiniciar el losartán.</strong> ¡Acierto!"));
    } else if (RE.antihipAgudo.test(p)) {
      filasPlan.push(fila("no", "<strong>Indicaste un antihipertensivo agudo.</strong><br><small>Las cifras de hoy se explican por la retención y el dolor: primero se drena la vejiga.</small>"));
    }

    sim.msg("tutor", `<p><strong>Retroalimentación del examen físico</strong></p>${checklist(filasExamen)}
      <p><strong>Retroalimentación del plan</strong></p>${checklist(filasPlan)}`);

    sim.msg("tutor", "Ahora revisa tu análisis y tu plan, y marca lo que cumpliste.");
    E.autoAnalisis = await sim.autoevaluacion("Autoevaluación del análisis y del plan", CHECK_ANALISIS);
    sim.msg("sistema", `Autoevaluación: marcaste <strong>${E.autoAnalisis.length} de ${CHECK_ANALISIS.length}</strong> criterios.`);

    sim.msg("tutor", `<p><strong>Mensajes clave</strong></p>${ul([
      "La hipertensión es un antecedente relevante, pero <strong>las cifras elevadas de hoy se pueden explicar por la retención y el dolor</strong>. No se necesita un antihipertensivo agudo: primero se drena la vejiga. Lo ideal es <strong>reiniciar el losartán posteriormente</strong>.",
      "Un buen análisis convierte la historia clínica en un problema claro y una conducta."
    ])}
      <p><strong>Análisis ideal</strong></p><p>${ANALISIS_IDEAL}</p>
      <p><strong>Plan ideal</strong></p><ol>${PLAN_IDEAL.map((x) => `<li>${x}</li>`).join("")}</ol>`);
    await sim.botones([{ texto: "Continuar →" }]);

    /* =================================================================
       4. PASO DE LA SONDA VESICAL
       ================================================================= */
    sim.etapa(3);
    const orientacionSonda = `${ul([
      "<strong>Sonda Nelatón:</strong> recta, sin balón. Sirve para el <strong>cateterismo intermitente</strong>: se pasa, se evacúa la vejiga y se retira.",
      "<strong>Sonda Foley:</strong> tiene un <strong>balón</strong> que la mantiene dentro de la vejiga. Queda a permanencia. <strong>2 vías:</strong> una para el drenaje y otra para inflar el balón. <strong>3 vías:</strong> agrega una vía de irrigación; se usa cuando hay hematuria con coágulos.",
      "<strong>Calibre</strong> (en French, Fr): <strong>16–18 Fr</strong> si no hay hematuria; <strong>22–24 Fr</strong> si hay hematuria, para permitir el paso de los coágulos."
    ])}
      <p><strong>¿Por qué una Foley 16 Fr de 2 vías en este paciente?</strong></p>${ul([
      "Todavía no tenemos clara la causa de la retención. Probablemente sea HPB y necesite una intervención posterior para resolverla.",
      "Un cateterismo solo con Nelatón deja abierta la posibilidad de que el paciente <strong>vuelva a hacer retención</strong> y reconsulte.",
      "No ha tenido hematuria, por eso basta una sonda de 2 vías y de calibre pequeño."
    ])}`;

    if (E.plan.especifica) {
      E.sondaCorrecta = true;
      sim.msg("tutor", `✅ ¡Muy bien! Especificaste una <strong>sonda Foley de 2 vías, 16–18 Fr</strong>, que es la elección correcta.${orientacionSonda}`);
    } else {
      sim.msg("enfermera", "Doctor, soy nueva en el servicio y no conozco mucho de sondas. ¿Le paso una Nelatón o una Foley? ¿De qué calibre y de cuántas vías?");
      const sonda = await sim.eleccion([
        { texto: "Una sonda Nelatón", valor: "nelaton" },
        { texto: "Una Foley de 2 vías, 16–18 Fr", valor: "foley2" },
        { texto: "Una Foley de 2 vías, 22–24 Fr", valor: "foley2g" },
        { texto: "Una Foley de 3 vías, 22–24 Fr", valor: "foley3" }
      ]);
      E.sondaCorrecta = sonda === "foley2";
      const comentario = {
        nelaton: "❌ La Nelatón solo sirve para un cateterismo intermitente: el paciente podría volver a hacer retención.",
        foley2: "✅ Correcto.",
        foley2g: "❌ El calibre de 22–24 Fr se reserva para la hematuria con coágulos.",
        foley3: "❌ La sonda de 3 vías y gran calibre se usa cuando hay hematuria con coágulos, que este paciente no tiene."
      }[sonda];
      sim.msg("tutor", `<p>${comentario}</p>${orientacionSonda}`);
    }
    await sim.botones([{ texto: "Continuar →" }]);

    // 4.2 La sonda no pasa
    sim.msg("tutor", "La enfermera intenta pasar la sonda Foley 16 Fr, pero <strong>no pasa</strong>: encuentra resistencia y el paciente se queja. ¿Qué haces?");
    const opcionesSonda = [
      { texto: "Pedirle que empuje con más fuerza hasta que pase", valor: "forzar" },
      { texto: "Inflar el balón para que la sonda quede fija", valor: "balon" },
      { texto: "Revisar la técnica del paso de la sonda y volver a intentarlo", valor: "tecnica" },
      { texto: "Pedir otra sonda especial", valor: "otra" },
      { texto: "Llamar a urología o remitir al paciente", valor: "remitir" }
    ];
    for (let intento = 0; ; intento++) {
      const r = await sim.eleccion(opcionesSonda);
      if (r === "tecnica") { E.tecnicaPrimera = intento === 0; break; }
      sim.msg("tutor", {
        forzar: "⚠️ <strong>Nunca se fuerza una sonda.</strong> Hay riesgo de falsa vía, lesión uretral y uretrorragia. ¿Qué otra cosa harías?",
        balon: "⚠️ <strong>El balón se infla solo cuando sale orina.</strong> Inflarlo en la uretra produce lesión uretral y uretrorragia. ¿Qué otra cosa harías?",
        otra: "No hay otras sondas disponibles en el servicio. ¿Qué otra cosa harías?",
        remitir: "No hay urólogo disponible y el traslado tardaría varias horas. El paciente sigue con dolor. ¿Qué haces tú ahora?"
      }[r]);
    }
    sim.msg("tutor", "Bien. Describe los pasos de la técnica del paso de la sonda vesical.");
    await sim.formulario([{ id: "tecnica", etiqueta: "Pasos de la técnica", filas: 5, placeholder: "1.\n2.\n3." }], "Enviar");
    sim.msg("tutor", `<p>Revisa la técnica en este video: ${enlace(VIDEO_SONDA, "Técnica de paso de sonda vesical")}</p>
      <p><strong>Puntos clave de la técnica</strong></p>${ul([
      "Asepsia y antisepsia, con técnica estéril.",
      "Lubricación abundante de la uretra, idealmente con gel con lidocaína.",
      "Pene en tracción, perpendicular al cuerpo, para rectificar la uretra.",
      "Avanzar la sonda hasta el final, hasta la bifurcación.",
      "Inflar el balón <strong>solo cuando salga orina</strong>.",
      "Nunca forzar la sonda."
    ])}`);
    await sim.botones([{ texto: "Continuar →" }]);

    // 4.3 Segundo intento fallido
    sim.msg("tutor", "Con una técnica adecuada, un segundo intento <strong>tampoco logra pasar la sonda</strong>. El paciente sigue con dolor y el globo vesical persiste. ¿Qué haces ahora?");

    /* =================================================================
       5. PUNCIÓN SUPRAPÚBICA
       ================================================================= */
    sim.etapa(4);
    const opcionesPuncion = [
      { texto: "Intentarlo de nuevo con más fuerza", valor: "forzar" },
      { texto: "Esperar a que orine de forma espontánea", valor: "esperar" },
      { texto: "Hacer una punción suprapúbica evacuadora con aguja", valor: "puncion" },
      { texto: "Remitir al paciente y esperar el traslado", valor: "remitir" },
      { texto: "Pedir una ecografía antes de decidir", valor: "eco" }
    ];
    let guiado = false;
    for (let intento = 0; ; intento++) {
      const r = await sim.eleccion(opcionesPuncion);
      if (r === "puncion") { E.puncionPrimera = intento === 0; break; }
      const motivo = {
        forzar: "Nunca se fuerza una sonda: el riesgo de falsa vía y lesión uretral es alto.",
        esperar: "El paciente sigue con dolor y con el globo vesical. No va a orinar solo.",
        remitir: "El traslado tardaría varias horas y el paciente sigue con dolor.",
        eco: "No hay imágenes disponibles, y no cambiarían la conducta: hay que evacuar la vejiga."
      }[r];
      sim.msg("tutor", `${motivo}${guiado ? "" : " Piensa: <strong>¿qué riesgos tiene dejar al paciente así?</strong> y <strong>¿por qué otra vía se puede llegar a la vejiga?</strong>"}`);
      guiado = true;
    }
    sim.msg("tutor", `<p>✅ Correcto: una <strong>punción suprapúbica evacuadora</strong> como medida temporal.</p>${ul([
      "El paciente está en <strong>retención urinaria</strong>, tiene <strong>dolor</strong> y puede desarrollar <strong>falla renal</strong> por la obstrucción.",
      "<strong>Hay que evacuar la vejiga.</strong> Si no hay un equipo de urología cercano, la punción suprapúbica evacuadora es la medida temporal.",
      "Después de la punción, el paciente <strong>debe ser remitido a urología</strong> para realizar una <strong>derivación definitiva de la vía urinaria</strong>."
    ])}<p>Describe cómo harías la punción.</p>`);
    await sim.formulario([{ id: "puncion", etiqueta: "Técnica de la punción suprapúbica", filas: 5 }], "Enviar");

    const faltoCirugia = !E.marcas.has("t_cirugia");
    const faltoAnticoag = !E.marcas.has("t_anticoag");
    const notaAnamnesis = faltoCirugia || faltoAnticoag
      ? ` En tu anamnesis no preguntaste por ${[faltoCirugia && "las cirugías previas", faltoAnticoag && "los anticoagulantes o antiagregantes"].filter(Boolean).join(" ni por ")}.`
      : " Los preguntaste en la anamnesis: ¡bien!";
    sim.msg("tutor", `<p>Revisa la técnica en este video: ${enlace(VIDEO_PUNCION, "Técnica de punción suprapúbica")}</p>
      <p><strong>Puntos clave</strong></p>${ul([
      "Confirmar que el <strong>globo vesical es claramente palpable</strong>.",
      "Paciente en decúbito supino. Asepsia y antisepsia. Anestesia local.",
      "Punción en la <strong>línea media, unos 2 cm (dos traveses de dedo) por encima de la sínfisis púbica</strong>, aspirando mientras se avanza la aguja hasta obtener orina.",
      `Antes de puncionar importa saber si el paciente tiene <strong>cirugías abdominales previas</strong> (posibles adherencias de asas intestinales) o toma <strong>anticoagulantes o antiagregantes</strong>. En este paciente, ambos antecedentes fueron negativos.${notaAnamnesis}`
    ])}`);
    await sim.botones([{ texto: "Continuar →" }]);

    sim.msg("tutor", "La punción se realiza sin complicaciones. Se evacúa la vejiga y el dolor del paciente cede.<br>El paciente se <strong>remite a urología</strong> para realizar una <strong>derivación definitiva de la vía urinaria</strong>.<br><strong>Has finalizado el manejo inicial de la retención urinaria.</strong>");
    await sim.botones([{ texto: "Ver cierre del caso →" }]);

    /* =================================================================
       6. CIERRE Y RETROALIMENTACIÓN FINAL
       ================================================================= */
    sim.etapa(5);
    const fortalezas = [];
    const mejoras = [];
    const completo = (i) => Object.keys(CHECK_ANAMNESIS[i].subs).every((id) => E.marcas.has(id));

    if (E.anamnesisCompletos >= 6) fortalezas.push(`Hiciste una anamnesis dirigida: cubriste por completo ${E.anamnesisCompletos} de los 8 puntos clave.`);
    if (completo(4)) fortalezas.push("Buscaste de forma dirigida las causas de estrechez uretral.");
    if (completo(6)) fortalezas.push("Preguntaste por los medicamentos que pueden causar retención.");
    if (E.examen.has("globo")) fortalezas.push("Identificaste el globo vesical en el examen físico.");
    if (!peneFaltante.length) fortalezas.push("Examinaste de forma activa el pene en busca de fimosis, liquen escleroso y meato puntiforme.");
    if (E.plan.sonda && !E.pidioParaclinicos) fortalezas.push("Priorizaste el drenaje de la vejiga sin esperar paraclínicos.");
    if (E.sondaCorrecta) fortalezas.push("Elegiste la sonda adecuada: Foley de 2 vías, 16–18 Fr.");
    if (E.tecnicaPrimera) fortalezas.push("Cuando la sonda no pasó, revisaste la técnica en lugar de forzarla.");
    if (E.puncionPrimera) fortalezas.push("Planteaste de inmediato la punción suprapúbica como medida temporal.");

    const incompletos = CHECK_ANAMNESIS.map((item, i) => ({ item, i })).filter(({ i }) => !completo(i));
    if (incompletos.length) {
      const { item } = incompletos[0];
      const faltan = Object.keys(item.subs).filter((id) => !E.marcas.has(id)).map((id) => item.subs[id]);
      mejoras.push(`Completa la anamnesis dirigida. Por ejemplo, en este caso no preguntaste por ${faltan.join(", ")}. ${item.porque}`);
    }
    if (peneFaltante.length) mejoras.push("Examina siempre el pene de forma activa: en este caso no pediste " + peneFaltante.map((id) => H[id][0].toLowerCase()).join(", ") + ". La fimosis severa y el meato puntiforme solo se diagnostican al examinar.");
    if (!E.examen.has("globo")) mejoras.push("Examina el abdomen: el globo vesical palpable y mate a la percusión confirma la retención.");
    if (E.pidioParaclinicos) mejoras.push("En este caso pediste paraclínicos o imágenes. En una retención urinaria no cambian la conducta inicial: primero se drena la vejiga.");
    if (E.urologiaAntes) mejoras.push("Propusiste llamar a urología o remitir antes de evacuar la vejiga. Sin un urólogo cercano, el drenaje es tu responsabilidad.");
    if (E.sondaCorrecta === false) mejoras.push("Repasa la elección de la sonda: sin hematuria, Foley de 2 vías y 16–18 Fr.");
    if (E.tecnicaPrimera === false) mejoras.push("Cuando la sonda no pasa, revisa la técnica y nunca la fuerces ni infles el balón sin ver salir orina.");
    if (E.nPreguntas > 15) mejoras.push(`Hiciste ${E.nPreguntas} preguntas en la anamnesis. En urgencias debe ser dirigida y rápida: el paciente tenía dolor.`);
    if (!fortalezas.length) fortalezas.push("Completaste todas las etapas del caso y tomaste decisiones en cada una.");
    if (!mejoras.length) mejoras.push("¡Excelente trabajo! Sigue practicando con otros casos para afianzar tu enfoque.");

    sim.msg("tutor", `<p><strong>Retroalimentación final</strong></p>
      <p><strong>Fortalezas</strong></p>${ul(fortalezas.slice(0, 3))}
      <p><strong>Aspectos por mejorar</strong></p>${ul(mejoras.slice(0, 3))}`);

    sim.msg("tutor", `<p><strong>Mensajes clave del caso</strong></p><ol>${[
      "La <strong>anamnesis dirigida</strong> busca las causas de la retención: obstrucción prostática, estrechez uretral, causa neurogénica y medicamentos.",
      "En el examen físico, el <strong>globo vesical</strong> confirma la retención, y el <strong>examen del pene</strong> descarta fimosis severa y meato puntiforme.",
      "La retención urinaria es una <strong>urgencia</strong>: primero se drena la vejiga. Los paraclínicos no cambian la conducta inicial.",
      "Sin hematuria: <strong>sonda Foley de 2 vías, 16–18 Fr</strong>.",
      "Si la sonda no pasa: <strong>revisar la técnica</strong> y nunca forzar.",
      "Si falla con técnica adecuada y no hay urología cercana: <strong>punción suprapúbica evacuadora</strong> como medida temporal, y <strong>remisión a urología</strong> para una derivación definitiva de la vía urinaria."
    ].map((x) => `<li>${x}</li>`).join("")}</ol>`);

    sim.msg("tutor", "🎉 <strong>¡Lo lograste!</strong> Hoy atendiste a un paciente con retención urinaria aguda de principio a fin: hiciste una anamnesis dirigida, examinaste lo que importa, priorizaste el drenaje de la vejiga, elegiste la sonda correcta y resolviste cuando la sonda no pasó. Ya tienes las herramientas para enfrentar este escenario en la vida real. ¡Sigue así!");
    sim.completar();
    await sim.botones([{ texto: "Reiniciar caso", secundario: true }]);
    window.Simulador.montar(sim.raiz || document.getElementById("simulador"), window.CASOS["retencion-urinaria"]);
  }

  window.CASOS = window.CASOS || {};
  window.CASOS["retencion-urinaria"] = {
    titulo: "Paciente que no puede orinar",
    autor: "Caso elaborado por Nicolás Guerrón Morales · Urología, Universidad del Valle / HUV",
    etapas: ["Anamnesis", "Examen físico", "Análisis y plan", "Sonda vesical", "Punción suprapúbica", "Cierre"],
    iniciar
  };
})();
