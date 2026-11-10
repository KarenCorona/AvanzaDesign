/* ==========================================================================
   PEGALO — Lógica de la herramienta de pedido
   ========================================================================== */

/* ========================================================================
   ⚠️ CONFIGURACIÓN — EDITA ESTOS VALORES ⚠️
   ======================================================================== */

// Número de WhatsApp que recibe los pedidos (con código de país, sin + ni espacios)
// TODO: confirmar código de país correcto (se está usando 52 = México por defecto)
const WHATSAPP_NUMBER = "523411116853";

// Mensaje prellenado para quien NO tiene diseño y quiere pedir ayuda al servicio
// de diseño gráfico de AvanzaDesign (botón "No tengo un diseño" en la landing)
const DESIGN_HELP_MESSAGE = "¡Hola! Quiero pedir un sticker/etiqueta con Pegalo pero no tengo un diseño listo. ¿Me pueden ayudar con el diseño gráfico?";

/*
  Tabla de precios — BASE tomada de Sticker Mule México (etiquetas-personalizadas,
  producto "Etiquetas transparentes", tamaño 50mm x 50mm = 5cm x 5cm = 25 cm²)
  con un 30% de descuento aplicado sobre todos sus precios, para posicionar a
  Pegalo por debajo de ese precio de referencia.
  Fuente: stickermule.com/mx/etiquetas-personalizadas (precios originales x 0.7).

  Cómo se usa:
  1. Se interpola/extrapola esta curva para obtener un "precio base"
     para CUALQUIER cantidad (no solo las que aparecen en la tabla).
  2. Ese precio base se escala según el ÁREA real del sticker/etiqueta
     (proporcional a los 25 cm² de referencia).
  3. Se ajusta con el multiplicador del MATERIAL elegido (transparente = 1.0,
     calibrado directo sobre el dato real; el resto son estimados — ver abajo).
  4. Se ajusta con el multiplicador del FORMATO/producto elegido.

  ⚠️ Sticker Mule solo publica una tabla de precios por tamaño para
  "transparente"; no desglosa precio por forma (redondo, cuadrado, etc.),
  así que estamos usando esta misma curva como referencia para todos los
  formatos y ajustándolos con PRODUCTO_MULTIPLIER. Si más adelante quieres
  afinar esto por forma específica, lo ajustamos.
*/
const REFERENCE_AREA_CM2 = 25; // 5cm x 5cm (50mm x 50mm)
const DESCUENTO_VS_STICKERMULE = 0.30; // 30% menos que Sticker Mule MX

// Precios originales de Sticker Mule MX (etiquetas transparentes, 50x50mm)
const STICKERMULE_PRICES_MXN = [
    { qty: 50, price: 1098 },
    { qty: 100, price: 1302 },
    { qty: 200, price: 1655 },
    { qty: 300, price: 1970 },
    { qty: 500, price: 2540 },
    { qty: 1000, price: 3791 },
    { qty: 2000, price: 5955 },
    { qty: 3000, price: 7891 },
    { qty: 5000, price: 11416 },
    { qty: 10000, price: 19172 }
];

// Curva de Pegalo = precios de Sticker Mule MX con 30% de descuento
const BASE_PRICE_CURVE = STICKERMULE_PRICES_MXN.map(tier => ({
    qty: tier.qty,
    price: Math.round(tier.price * (1 - DESCUENTO_VS_STICKERMULE))
}));

const PRICING = {
    // Multiplicador por material. 1.0 = mismo precio que la curva base (transparente, dato real)
    MATERIAL_MULTIPLIER: {
        transparente: 1.0,           // ✅ dato real
        vinil_blanco: 0.85,          // ⚠️ estimado
        holografico: 1.6,            // ⚠️ estimado
        vinil_estatico: 1.0,         // ⚠️ estimado (cling, sin adhesivo permanente)
        vinil_cristal: 1.1,          // ⚠️ estimado (window cling)
        transferible: 1.1,           // ⚠️ estimado (vinil transferible)
        texto_vinil: 0.8             // ⚠️ estimado (solo texto recortado, sin fondo)
    },
    // Multiplicador por formato/corte
    PRODUCTO_MULTIPLIER: {
        redondo: 1.0,
        cuadrado: 1.0,
        rectangular: 1.0,
        ovalado: 1.0,
        esquinas_redondeadas: 1.0,
        bumper: 1.0,
        semitroquelado: 1.05,        // ⚠️ estimado (corte parcial, un poco más de trabajo)
        hoja: 0.85                   // ⚠️ estimado (varios diseños por plancha, más eficiente)
    },
    PRECIO_MINIMO: 80 // MXN, precio mínimo de pedido
};

const PRODUCTO_LABELS = {
    redondo: "Sticker redondo",
    cuadrado: "Sticker cuadrado",
    rectangular: "Sticker rectangular",
    ovalado: "Sticker ovalado",
    esquinas_redondeadas: "Sticker con esquinas redondeadas",
    bumper: "Sticker para parachoques (bumper)",
    semitroquelado: "Sticker semi-troquelado",
    hoja: "Hoja de stickers (varios diseños)"
};

const MATERIAL_LABELS = {
    transparente: "Transparente",
    vinil_blanco: "Vinil blanco (estándar)",
    holografico: "Holográfico",
    vinil_estatico: "Vinil estático (cling)",
    vinil_cristal: "Vinil para cristal",
    transferible: "Vinil transferible",
    texto_vinil: "Texto en vinilo"
};

/**
 * Interpola (o extrapola) el precio base real para cualquier cantidad,
 * usando la curva BASE_PRICE_CURVE como referencia.
 */
function interpolarPrecioBase(qty) {
    const curve = BASE_PRICE_CURVE;

    if (qty <= curve[0].qty) {
        // Por debajo del mínimo conocido: mismo precio unitario que el primer tramo
        return (qty / curve[0].qty) * curve[0].price;
    }

    if (qty >= curve[curve.length - 1].qty) {
        // Por encima del máximo conocido: extendemos con la pendiente del último tramo
        const a = curve[curve.length - 2];
        const b = curve[curve.length - 1];
        const slope = (b.price - a.price) / (b.qty - a.qty);
        return b.price + slope * (qty - b.qty);
    }

    for (let i = 0; i < curve.length - 1; i++) {
        const a = curve[i];
        const b = curve[i + 1];
        if (qty >= a.qty && qty <= b.qty) {
            const t = (qty - a.qty) / (b.qty - a.qty);
            return a.price + t * (b.price - a.price);
        }
    }
    return curve[curve.length - 1].price;
}

/* ========================================================================
   ESTADO
   ======================================================================== */

let state = {
    designChoice: null, // 'yes' | 'no'
    file: null,
    lastPrice: 0
};

/* ========================================================================
   INIT
   ======================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    // Si llegan desde el botón "No tengo un diseño" de la landing
    const params = new URLSearchParams(window.location.search);
    if (params.get("diseno") === "no") {
        setDesignChoice("no");
    }

    const uploadZone = document.getElementById("upload-zone");
    const fileInput = document.getElementById("file-input");

    uploadZone.addEventListener("click", () => fileInput.click());

    uploadZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadZone.classList.add("dragover");
    });
    uploadZone.addEventListener("dragleave", () => {
        uploadZone.classList.remove("dragover");
    });
    uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadZone.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    calcularPrecio();
});

/* ========================================================================
   PASO 1 — Diseño
   ======================================================================== */

function setDesignChoice(choice) {
    state.designChoice = choice;
    document.getElementById("card-tengo-diseno").classList.toggle("selected", choice === "yes");
    document.getElementById("card-no-diseno").classList.toggle("selected", choice === "no");
    document.getElementById("upload-section").style.display = choice === "yes" ? "block" : "none";
    document.getElementById("no-design-section").style.display = choice === "no" ? "block" : "none";
}

function handleFile(file) {
    state.file = file;
    const preview = document.getElementById("upload-preview");
    const thumb = document.getElementById("file-thumb");
    const genericIcon = document.getElementById("file-icon-generic");

    document.getElementById("file-name").textContent = file.name;
    document.getElementById("file-size").textContent = formatBytes(file.size);

    if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
            thumb.src = e.target.result;
            thumb.style.display = "block";
            genericIcon.style.display = "none";
        };
        reader.readAsDataURL(file);
    } else {
        thumb.style.display = "none";
        genericIcon.style.display = "flex";
    }

    preview.classList.add("show");
}

function removeFile() {
    state.file = null;
    document.getElementById("file-input").value = "";
    document.getElementById("upload-preview").classList.remove("show");
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ========================================================================
   PASO 2 — Medidas
   ======================================================================== */

function setSizeChip(w, h, el) {
    document.querySelectorAll("#size-chips .size-chip").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    if (w && h) {
        document.getElementById("ancho").value = w;
        document.getElementById("alto").value = h;
    }
    calcularPrecio();
}

/* ========================================================================
   PASO 3 — Cantidad
   ======================================================================== */

function setQtyTier(qty, el) {
    document.querySelectorAll("#qty-tiers .qty-tier").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    document.getElementById("cantidad").value = qty;
    calcularPrecio();
}

function calcularPrecioDesdeInput() {
    document.querySelectorAll("#qty-tiers .qty-tier").forEach(c => c.classList.remove("active"));
    calcularPrecio();
}

/* ========================================================================
   CALCULADORA DE PRECIO
   ======================================================================== */

function calcularPrecio() {
    const ancho = parseFloat(document.getElementById("ancho").value) || 0;
    const alto = parseFloat(document.getElementById("alto").value) || 0;
    const cantidad = parseInt(document.getElementById("cantidad").value) || 0;
    const producto = document.getElementById("producto").value;
    const material = document.getElementById("material").value;

    const area = ancho * alto;

    let total = 0;
    if (area > 0 && cantidad > 0) {
        const precioBase = interpolarPrecioBase(cantidad); // curva real (25 cm², transparente)
        const factorArea = area / REFERENCE_AREA_CM2;

        total = precioBase
            * factorArea
            * PRICING.MATERIAL_MULTIPLIER[material]
            * PRICING.PRODUCTO_MULTIPLIER[producto];

        if (total < PRICING.PRECIO_MINIMO) {
            total = PRICING.PRECIO_MINIMO;
        }
    }

    total = Math.round(total);
    state.lastPrice = total;

    const unitPrice = cantidad > 0 ? (total / cantidad) : 0;

    document.getElementById("precio-total").textContent = "$" + total.toLocaleString("es-MX") + " MXN";
    document.getElementById("precio-desglose").textContent =
        cantidad > 0 ? `≈ $${unitPrice.toFixed(2)} MXN c/u` : "";
}

/* ========================================================================
   VALIDACIÓN Y ENVÍO
   ======================================================================== */

function validarCampos() {
    let valid = true;

    const nombre = document.getElementById("nombre");
    const telefono = document.getElementById("telefono");

    if (!nombre.value.trim()) {
        nombre.classList.add("field-error");
        document.getElementById("error-nombre").classList.add("show");
        valid = false;
    } else {
        nombre.classList.remove("field-error");
        document.getElementById("error-nombre").classList.remove("show");
    }

    if (!telefono.value.trim()) {
        telefono.classList.add("field-error");
        document.getElementById("error-telefono").classList.add("show");
        valid = false;
    } else {
        telefono.classList.remove("field-error");
        document.getElementById("error-telefono").classList.remove("show");
    }

    const ancho = parseFloat(document.getElementById("ancho").value);
    const alto = parseFloat(document.getElementById("alto").value);
    const cantidad = parseInt(document.getElementById("cantidad").value);

    if (!ancho || ancho <= 0 || !alto || alto <= 0) {
        alert("Por favor indica medidas válidas para tu sticker o etiqueta.");
        valid = false;
    }
    if (!cantidad || cantidad <= 0) {
        alert("Por favor indica una cantidad válida.");
        valid = false;
    }
    if (!state.designChoice) {
        alert("Por favor indícanos si ya tienes tu diseño o si necesitas ayuda para crearlo.");
        valid = false;
    }

    return valid;
}

function enviarPedido() {
    if (!validarCampos()) return;

    const producto = document.getElementById("producto").value;
    const material = document.getElementById("material").value;
    const ancho = document.getElementById("ancho").value;
    const alto = document.getElementById("alto").value;
    const cantidad = document.getElementById("cantidad").value;
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const notas = document.getElementById("notas").value.trim();

    let lineasDiseno;
    if (state.designChoice === "yes") {
        lineasDiseno = state.file
            ? `📎 Diseño: ${state.file.name} (lo adjunto en este chat)`
            : "📎 Diseño: lo adjunto en este chat";
    } else {
        lineasDiseno = "🎨 Diseño: NO tengo diseño — necesito apoyo del equipo de diseño gráfico";
    }

    let mensaje = "¡Hola Pegalo! 👋 Quiero hacer un pedido:\n\n";
    mensaje += `📦 Producto: ${PRODUCTO_LABELS[producto]}\n`;
    mensaje += `📏 Medida: ${ancho} x ${alto} cm\n`;
    mensaje += `🧵 Material: ${MATERIAL_LABELS[material]}\n`;
    mensaje += `🔢 Cantidad: ${cantidad} piezas\n`;
    mensaje += `${lineasDiseno}\n`;
    mensaje += `💰 Precio estimado: $${state.lastPrice.toLocaleString("es-MX")} MXN\n`;
    if (notas) mensaje += `📝 Notas: ${notas}\n`;
    mensaje += `\n👤 Nombre: ${nombre}\n`;
    mensaje += `📞 Teléfono: ${telefono}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
}
