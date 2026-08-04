// 1. IMPORTACIÓN DE TIPOS:
// Le pedimos a Next.js que nos preste la "plantilla de reglas" (TypeScript) 
// para asegurarnos de que no nos falte ningún dato obligatorio en el sitemap.
import type { MetadataRoute } from 'next';

// 2. FUNCIÓN PRINCIPAL:
// Next.js busca por defecto una función llamada 'sitemap' que esté exportada (export default).
// El ": MetadataRoute.Sitemap" le dice a TypeScript: "Oye, esta función va a devolver 
// una lista de enlaces estructurada exactamente como Google y el estándar XML lo exigen".
export default function sitemap(): MetadataRoute.Sitemap {

  // 3. VARIABLE BASE:
  // Guardamos tu dominio en una variable para no tener que escribir "https://ariri.app" 
  // a mano en cada enlace. Si el día de mañana cambias de dominio, solo lo editas aquí.
  const baseUrl = 'https://ariri.app';

  // 4. EL RETORNO (LA LISTA DE PÁGINAS):
  // La función devuelve un arreglo (un listado entre corchetes [ ]) con cada página de tu blog.
  return [
    // --- PÁGINA 1: La portada de tu blog (https://ariri.app) ---
    {
      // 'url': La dirección completa a la que entrará el bot de Google.
      url: baseUrl,

      // 'lastModified': Indica cuándo fue la última vez que editaste esta página.
      // Usamos "new Date()" para que ponga en automático la fecha exacta de cuando haces el 'build'.
      lastModified: new Date(),

      // 'changeFrequency': Le da una pista a Google de cada cuánto tiempo debería volver 
      // a revisar esta página para buscar contenido nuevo.
      // Opciones válidas: 'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'.
      changeFrequency: 'weekly',

      // 'priority': Es una escala del 0.0 al 1.0 para decirle a Google cuál página 
      // es más relevante dentro de TU propio sitio web. 
      // La portada casi siempre lleva 1.0 (la máxima prioridad).
      priority: 1.0,
    },

    // --- PÁGINA 2: Ejemplo de una sección secundaria ---
    {
      // Usamos las comillas invertidas (template string) para pegar la base + la ruta.
      // Esto equivale a escribir: 'https://ariri.app/about'
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly', // Cambia menos seguido que la portada
      priority: 0.8,              // Un poco menos prioritaria que el inicio
    },

    // 💡 NOTA PARA EL FUTURO:
    // Conforme crees más páginas estáticas (o leas tus posts en Markdown), 
    // irás agregando más objetos { url: ..., lastModified: ... } dentro de este arreglo.
  ];
}