export default function Home() {
  return (
    <div className="blog-shell">
      <header className="blog-header">
        <div className="blog-title-group">
          <p className="blog-kicker">Blog</p>
          <h1 className="blog-title">Ariri Blog</h1>
        </div>
      </header>

      <main className="blog-layout">
        <aside
          className="blog-sidebar blog-sidebar-left"
          aria-label="Barra lateral izquierda"
        >
          <section className="blog-box">
            <h2>Menú</h2>
            <ul>
              <li>Inicio</li>
              <li>Archivo</li>
              <li>Contacto</li>
            </ul>
          </section>

          <section className="blog-box">
            <h2>Archivo</h2>
            <ul>
              <li>2026</li>
              <li>2025</li>
              <li>2024</li>
            </ul>
          </section>
        </aside>

        <section className="blog-content" aria-label="Contenido principal">
          <article className="blog-box blog-post">
            <h2>Entrada</h2>
            <p>Espacio principal para entradas, notas o artículos.</p>
            <p>
              Esta es una plantilla base sin contenido real, pensada para que
              puedas probar la estructura y el build.
            </p>
          </article>

          <article className="blog-box blog-post">
            <h2>Otra entrada</h2>
            <p>Segundo bloque de contenido para simular un listado de posts.</p>
          </article>
        </section>

        <aside
          className="blog-sidebar blog-sidebar-right"
          aria-label="Barra lateral derecha"
        >
          <section className="blog-box">
            <h2>Enlaces</h2>
            <ul>
              <li>Red 1</li>
              <li>Red 2</li>
              <li>Red 3</li>
            </ul>
          </section>

          <section className="blog-box">
            <h2>Notas</h2>
            <p>Área secundaria para widgets simples.</p>
          </section>
        </aside>
      </main>

      <footer className="blog-footer">© 2026</footer>
    </div>
  );
}
