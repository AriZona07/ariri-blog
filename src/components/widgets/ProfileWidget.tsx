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
}

/**
 * ProfileWidget — Tarjeta de perfil con avatar, nombre y bio.
 * Se usa en la parte superior de la barra lateral izquierda.
 */
export default function ProfileWidget({
  avatarSrc = "/android-chrome-192x192.png",
  avatarAlt = "Logo del blog / Avatar de Ariri",
  name = "aRIRI",
  bio = "Estudiante de programación · Lectora de manga GL · Anarquista Ⓐ",
}: ProfileWidgetProps) {
  return (
    <section className="profile-section" aria-label="Perfil">
      <Image
        src={avatarSrc}
        alt={avatarAlt}
        className="profile-avatar"
        width={90}
        height={90}
      />
      <h2 className="profile-name">{name}</h2>
      <p className="profile-bio">{bio}</p>
    </section>
  );
}
