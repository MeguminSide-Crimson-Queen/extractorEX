// === función principal ===
async function procesarURL() {
    const input = document.getElementById("steamUrl");
    const output = document.getElementById("resultado");
    const url = input.value.trim();

    if (!url) {
        output.value = "⚠️ Ingresa una URL de Steam.";
        return;
    }

    output.value = "⏳ Extrayendo datos desde Steam...";

    try {
        // GitHub Pages NO permite fetch directo a Steam (CORS)
        // pero sí podemos usar api.allorigins.win como proxy gratuito
        const proxied = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

        const response = await fetch(proxied);
        const data = await response.json();
        const html = data.contents;

        // --------------------------------------------------------------------
        // 📌 EXTRAER DATOS DE STEAM
        // --------------------------------------------------------------------

        // Título
        const titulo = (html.match(/<div class="apphub_AppName">([^<]+)<\/div>/)?.[1] || "Sin título").trim();

        // Descripción corta
        const descripcion = (html.match(/<meta name="description" content="([^"]+)"/)?.[1] || "Sin descripción").trim();

        // Rating aproximado
        const rating = (html.match(/"user_reviews_summary_bar".*?data-store-tooltip="([^"]+)"/s)?.[1] || "Sin rating").trim();

        // Géneros
        const generos = [...html.matchAll(/<a href="https:\/\/store\.steampowered\.com\/genre\/[^"]+"[^>]*>([^<]+)<\/a>/g)]
                        .map(m => m[1])
                        .slice(0, 6);

        // Funciones (single-player, cloud, mando, etc.)
        const funciones = [...html.matchAll(/<a class="app_tag"[^>]*>([^<]+)<\/a>/g)]
                          .map(m => m[1])
                          .slice(0, 6);

        // Logo
        const logo = html.match(/"header_image"\s*:\s*"([^"]+)"/)?.[1] || "";

        // Fecha
        const fecha = html.match(/<div class="date">([^<]+)<\/div>/)?.[1] || "Fecha desconocida";

        // Dev y Publisher
        const dev = html.match(/Developer:<\/div>\s*<div[^>]*>\s*<a[^>]*>([^<]+)/)?.[1] || "Desconocido";
        const pub = html.match(/Publisher:<\/div>\s*<div[^>]*>\s*<a[^>]*>([^<]+)/)?.[1] || "Desconocido";

        // Precio
        const precio =
              html.match(/"final_formatted"\s*:\s*"([^"]+)"/)?.[1] ||
              html.match(/<div class="game_purchase_price price">([^<]+)/)?.[1] ||
              "Gratis";

        // Screenshots (máximo 8)
        const imgs = [...html.matchAll(/<img src="([^"]+)" class="highlight_screenshot"/g)]
                     .map(m => m[1].replace(".116x65", ""))
                     .slice(0, 8);

        // --------------------------------------------------------------------
        // 📌 Cargar el archivo html-EX.html
        // --------------------------------------------------------------------
        const exBase = await fetch("html-EX.html");
        let exHtml = await exBase.text();

        // --------------------------------------------------------------------
        // 📌 REEMPLAZAR DATOS EN EL ARCHIVO BASE
        // --------------------------------------------------------------------

        // 1) reemplazar el título del documento <title>
        exHtml = exHtml.replace(/<title>.*?<\/title>/, `<title>${titulo}</title>`);

        // 2) reemplazar el objeto "juego"
        exHtml = exHtml.replace(
`const juego = {`,
`const juego = {
  titulo: "${titulo}",
  rating: "${rating}",
  descripcion: "${descripcion}",
  generos: ${JSON.stringify(generos)},
  funciones: ${JSON.stringify(funciones)},
  precio: "${precio}",
  logo: "${logo}",
  info: \`
    <strong>Desarrolladora:</strong> ${dev}<br>
    <strong>Editora:</strong> ${pub}<br>
    <strong>Fecha de lanzamiento:</strong> ${fecha}<br>
    <strong>Plataforma:</strong> Windows<br>
    <strong>Sitio Extraido:</strong> Steam<br>
  \`,
  requisitos: {
    minimos: {},
    recomendados: {}
  },
  imagenes: [
    ${imgs
      .map(i => `{
      page: "${i}",
      thumbnail: "${i}"
    }`)
      .join(",\n    ")}
  ]
};`
        );

        output.value = exHtml;
    }

    catch (e) {
        console.error(e);
        output.value = "❌ Error: No se pudo obtener o procesar la página de Steam.";
    }
}
