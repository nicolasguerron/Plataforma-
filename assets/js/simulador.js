/* =====================================================================
   SIMULADOR DE CASOS INTERACTIVOS (sin inteligencia artificial)
   ---------------------------------------------------------------------
   Motor reutilizable para los casos de los módulos. Ofrece:
   - Un registro de conversación con mensajes de Paciente, Tutor,
     Enfermera, Sistema y Estudiante.
   - Acciones interactivas: chat libre, botones, opciones y formularios.
   - Un buscador de temas por palabras clave para responder preguntas
     abiertas del estudiante.

   Cada caso se define en assets/casos/<id>.js y se registra en
   window.CASOS[<id>] = { titulo, autor, etapas, iniciar(sim) }.
   ===================================================================== */
(function () {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Minúsculas, sin tildes ni signos: "¿Desde cuándo?" -> "desde cuando"
  const normalizar = (t) => String(t)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const ETIQUETAS = { paciente: "Paciente", tutor: "Tutor", enfermera: "Enfermera", estudiante: "Tú", sistema: "" };

  /* Un tema coincide si:
     - alguna expresión de `p` coincide (o, si el tema anterior fue `seguimiento.de`, la de `seguimiento.p`),
     - y, si existe, también coincide `y`,
     - y no coincide `no`,
     - y, si existe, la función `f` devuelve true. */
  function coincide(t, tema, ctx) {
    let ok = [].concat(tema.p).some((r) => r.test(t));
    let porSeguimiento = false;
    if (!ok && tema.seguimiento && ctx && ctx.ultimo === tema.seguimiento.de) {
      ok = tema.seguimiento.p.test(t);
      porSeguimiento = ok;
    }
    if (!ok) return false;
    if (tema.y && !porSeguimiento && !tema.y.test(t)) return false;
    if (tema.no && tema.no.test(t)) return false;
    if (tema.f && !tema.f(t)) return false;
    return true;
  }

  // Devuelve los temas que coinciden. Las preguntas generales se descartan
  // si en el mismo mensaje hay una pregunta específica de su misma familia.
  function buscar(texto, temas, ctx) {
    const t = normalizar(texto);
    let hallados = temas.filter((tema) => coincide(t, tema, ctx));
    const especificos = hallados.filter((x) => !x.general);
    const familias = new Set(especificos.map((x) => x.fam).filter(Boolean));
    hallados = hallados.filter((x) => !x.general || !(x.fam === "*" ? especificos.length : familias.has(x.fam)));
    return hallados;
  }

  function montar(raiz, caso) {
    raiz.innerHTML = `
      <div class="sim-head">
        <strong>${esc(caso.titulo)}</strong>
        <button type="button" class="btn btn-ghost btn-sm" data-reiniciar>Reiniciar caso</button>
      </div>
      <ol class="sim-etapas">${caso.etapas.map((e, i) => `<li><span>${i + 1}</span>${esc(e)}</li>`).join("")}</ol>
      <div class="sim-log" aria-live="polite"></div>
      <div class="sim-acciones"></div>`;

    const log = raiz.querySelector(".sim-log");
    const acciones = raiz.querySelector(".sim-acciones");
    const etapas = [...raiz.querySelectorAll(".sim-etapas li")];

    raiz.querySelector("[data-reiniciar]").addEventListener("click", () => {
      if (confirm("¿Reiniciar el caso desde el principio?")) montar(raiz, caso);
    });

    const bajar = () => { log.scrollTop = log.scrollHeight; };

    const sim = {
      esc, normalizar, buscar, raiz,

      etapa(n) {
        etapas.forEach((li, i) => {
          li.classList.toggle("hecha", i < n);
          li.classList.toggle("activa", i === n);
        });
      },
      completar() { etapas.forEach((li) => { li.classList.add("hecha"); li.classList.remove("activa"); }); },

      // Agrega un mensaje. `html` es contenido del caso (confiable).
      msg(quien, html) {
        const d = document.createElement("div");
        d.className = `sim-msg sim-${quien}`;
        d.innerHTML = (ETIQUETAS[quien] ? `<span class="sim-quien">${ETIQUETAS[quien]}</span>` : "") + `<div class="sim-texto">${html}</div>`;
        log.appendChild(d);
        bajar();
      },
      // Mensaje escrito por el estudiante (se escapa).
      yo(texto) { sim.msg("estudiante", esc(texto).replace(/\n/g, "<br>")); },

      limpiar() { acciones.innerHTML = ""; },

      esperar(ms) { return new Promise((r) => setTimeout(r, ms)); },

      // Botones de avance. Devuelve el valor del botón pulsado.
      botones(lista) {
        return new Promise((resolve) => {
          acciones.innerHTML = `<div class="sim-botones">${lista.map((b, i) =>
            `<button type="button" class="btn ${b.secundario ? "btn-ghost" : "btn-primary"} btn-sm" data-i="${i}">${esc(b.texto)}</button>`).join("")}</div>`;
          acciones.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => {
            const b = lista[Number(btn.dataset.i)];
            sim.limpiar();
            resolve(b.valor ?? b.texto);
          }));
        });
      },

      // Opción múltiple. La opción elegida aparece como mensaje del estudiante.
      eleccion(opciones) {
        return new Promise((resolve) => {
          acciones.innerHTML = `<div class="sim-opciones">${opciones.map((o, i) =>
            `<button type="button" class="sim-opcion" data-i="${i}">${esc(o.texto)}</button>`).join("")}</div>`;
          acciones.querySelectorAll(".sim-opcion").forEach((btn) => btn.addEventListener("click", () => {
            const o = opciones[Number(btn.dataset.i)];
            sim.limpiar();
            sim.yo(o.texto);
            resolve(o.valor ?? o.texto);
          }));
        });
      },

      // Formulario de texto libre. Devuelve { id: valor }.
      formulario(campos, textoBoton = "Enviar") {
        return new Promise((resolve) => {
          acciones.innerHTML = `
            <form class="sim-form" novalidate>
              ${campos.map((c) => `
                <label>${esc(c.etiqueta)}
                  <textarea name="${c.id}" rows="${c.filas || 3}" placeholder="${esc(c.placeholder || "")}">${esc(c.valor || "")}</textarea>
                </label>`).join("")}
              <p class="hint sim-aviso" hidden>Completa todos los campos para continuar.</p>
              <div class="sim-botones"><button type="submit" class="btn btn-primary btn-sm">${esc(textoBoton)}</button></div>
            </form>`;
          const form = acciones.querySelector("form");
          form.querySelector("textarea").focus({ preventScroll: true });
          form.addEventListener("submit", (e) => {
            e.preventDefault();
            const valores = {};
            campos.forEach((c) => { valores[c.id] = form.elements[c.id].value.trim(); });
            if (campos.some((c) => !valores[c.id])) { form.querySelector(".sim-aviso").hidden = false; return; }
            sim.limpiar();
            sim.msg("estudiante", campos.map((c) =>
              `<strong>${esc(c.etiqueta)}</strong><br>${esc(valores[c.id]).replace(/\n/g, "<br>")}`).join("<br><br>"));
            resolve(valores);
          });
        });
      },

      // Lista para autoevaluarse. Devuelve los id marcados.
      autoevaluacion(titulo, items, textoBoton = "Continuar") {
        return new Promise((resolve) => {
          acciones.innerHTML = `
            <div class="sim-autoeval">
              <p><strong>${esc(titulo)}</strong></p>
              ${items.map((it) => `<label><input type="checkbox" value="${it.id}"> ${esc(it.texto)}</label>`).join("")}
              <div class="sim-botones"><button type="button" class="btn btn-primary btn-sm">${esc(textoBoton)}</button></div>
            </div>`;
          acciones.querySelector("button").addEventListener("click", () => {
            const marcados = [...acciones.querySelectorAll("input:checked")].map((x) => x.value);
            sim.limpiar();
            resolve(marcados);
          });
        });
      },

      // Chat libre. `alEnviar(texto)` responde cada mensaje.
      // Termina cuando se pulsa uno de los `botones`; devuelve su valor.
      chat({ placeholder = "Escribe aquí…", alEnviar, botones = [] }) {
        return new Promise((resolve) => {
          acciones.innerHTML = `
            <form class="sim-chat">
              <textarea rows="1" placeholder="${esc(placeholder)}" aria-label="Tu mensaje"></textarea>
              <button type="submit" class="btn btn-primary btn-sm">Enviar</button>
            </form>
            <div class="sim-botones">${botones.map((b, i) =>
              `<button type="button" class="btn btn-ghost btn-sm" data-i="${i}">${esc(b.texto)}</button>`).join("")}</div>`;
          const form = acciones.querySelector("form");
          const ta = form.querySelector("textarea");
          let ocupado = false;
          ta.focus({ preventScroll: true });
          ta.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
          });
          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const texto = ta.value.trim();
            if (!texto || ocupado) return;
            ocupado = true;
            ta.value = "";
            sim.yo(texto);
            await sim.esperar(250);
            await alEnviar(texto);
            ocupado = false;
            ta.focus({ preventScroll: true });
          });
          acciones.querySelectorAll(".sim-botones button").forEach((btn) => btn.addEventListener("click", () => {
            const b = botones[Number(btn.dataset.i)];
            sim.limpiar();
            resolve(b.valor ?? b.texto);
          }));
        });
      }
    };

    sim.etapa(0);
    caso.iniciar(sim);
  }

  window.Simulador = { montar, normalizar, buscar };
})();
