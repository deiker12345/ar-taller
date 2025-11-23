Coloca aquí tus marcadores .patt generados con AR.js Marker Training:

Generador: https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html

Ejemplo de uso en Supabase (tabla ar_targets):
{
  id: "mi-marcador",
  mode: "marker",
  src: "/assets/icon/favicon.png",
  patternUrl: "/assets/markers/mi-marcador.patt",
  width: 3,
  height: 3
}

Si usas preset "hiro", no necesitas .patt: deja patternUrl vacío y usa markerPreset: "hiro".