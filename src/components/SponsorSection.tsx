import relampoLogoUrl from "../assets/relampo-sponsor-logo.png";

type SponsorSectionProps = {
  compact?: boolean;
};

type Supporter = {
  name: string;
  logoUrl: string;
  // Sponsors link out; supporting companies are shown as a credit only, so an
  // entry without href renders as a plain card with no link behaviour.
  href?: string;
};

const sponsors: Supporter[] = [
  { name: "Relampo", logoUrl: relampoLogoUrl, href: "https://relampo.com/" },
];

// Companies backing the academy, credited without a link. To add one: drop the
// image in src/assets, import it at the top, and add a line here.
const supporters: Supporter[] = [];

function SupporterCard({ supporter }: { supporter: Supporter }) {
  const logo = (
    <span className="sponsor-logo-frame">
      <img className="sponsor-logo" src={supporter.logoUrl} alt={supporter.name} />
    </span>
  );

  if (!supporter.href) {
    return <div className="sponsor-card is-static">{logo}</div>;
  }

  return (
    <a
      className="sponsor-card"
      href={supporter.href}
      rel="noreferrer"
      target="_blank"
    >
      {logo}
    </a>
  );
}

export function SponsorSection({ compact = false }: SponsorSectionProps) {
  return (
    <section
      className={`sponsor-section${compact ? " sponsor-section-compact" : ""}`}
      aria-labelledby="sponsor-section-title"
    >
      <div className="sponsor-section-header">
        <p className="eyebrow">Sponsor</p>
        <h2 id="sponsor-section-title">Apoyado por</h2>
      </div>

      <div className="sponsor-list">
        {sponsors.map((sponsor) => (
          <SupporterCard key={sponsor.name} supporter={sponsor} />
        ))}
      </div>

      {supporters.length > 0 ? (
        <>
          <div className="sponsor-section-header sponsor-subheader">
            <h3>Con el apoyo de</h3>
          </div>
          <div className="sponsor-list sponsor-list-supporters">
            {supporters.map((supporter) => (
              <SupporterCard key={supporter.name} supporter={supporter} />
            ))}
          </div>
        </>
      ) : null}

      <p className="sponsor-contact">
        ¿Interesado en sponsorizar? Escríbenos a{" "}
        <a href="mailto:info@relampo.com">info@relampo.com</a>
      </p>
    </section>
  );
}
