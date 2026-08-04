import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Blog</p>
        <h1>Ariri Blog</h1>
        <p className={styles.subtitle}>
          Espacio para ser libre
        </p>
      </header>

      <main className={styles.main}>
        <article className={styles.card}>
          <h2>Inicio</h2>
          <p>Este es un punto de partida muy simple para tu blog.</p>
        </article>
      </main>

      <footer className={styles.footer}>
        <p>© 2026</p>
      </footer>
    </div>
  );
}
