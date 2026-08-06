import Image from "next/image";

interface ProfileWidgetProps {
  /** Ruta de la imagen del avatar (relativa a /public) */
  avatarSrc?: string;
  /** Texto alternativo del avatar */
  avatarAlt?: string;
  /** Nombre o alias del perfil */
  name?: string;
  /** Breve descripción / bio */
  bio?: string;
  /** Título del widget */
  title?: string;
}

/**
 * ProfileWidget — Tarjeta de perfil con avatar, nombre y bio.
 * Se usa en la parte superior de la barra lateral izquierda.
 */
export default function ProfileWidget({
  avatarSrc = "/icons/android-chrome-192x192.png",
  avatarAlt = "Logo del blog / Avatar de Ariri",
  name = "aRIRI",
  bio = "Estudiante de programación ✦ Lectora de Manga GL/Yuri ✦ Anarquista Ⓐ",
  title = "Sobre mí",
}: ProfileWidgetProps) {
  return (
    <section aria-label="Perfil">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">{title}</span>
        </div>
        <div className="retro-box__body">
          <div className="profile-section">
            <Image
              src={avatarSrc}
              alt={avatarAlt}
              className="profile-avatar"
              width={96}
              height={96}
              style={{ width: "auto", height: "auto" }}
            />
            <h2 className="profile-name">{name}</h2>
            <p className="profile-bio">{bio}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
