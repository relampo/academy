import performance360LogoUrl from "../assets/360Performance.png";
import relampoLogoUrl from "../assets/relampo-sponsor-logo.png";
import sqaAdvisoryLogoUrl from "../assets/sqaadvisory.png";

type SponsorSectionProps = {
  compact?: boolean;
};

type Supporter = {
  name: string;
  logoUrl: string;
  // Entries without href render as a plain card: a credit, not a destination.
  href?: string;
};

// One list, one level. To add a company: drop the image in src/assets, import
// it above, and add a line here.
const supporters: Supporter[] = [
  { name: "Relampo", logoUrl: relampoLogoUrl, href: "https://relampo.com/" },
  { name: "SQAadvisory", logoUrl: sqaAdvisoryLogoUrl },
  { name: "Performance 360 LATAM", logoUrl: performance360LogoUrl },
];

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
        {supporters.map((supporter) => (
          <SupporterCard key={supporter.name} supporter={supporter} />
        ))}
      </div>

      <p className="sponsor-contact">
        ¿Interesado en sponsorizar? Escríbenos a{" "}
        <a href="mailto:info@relampo.com">info@relampo.com</a>
      </p>
    </section>
  );
}
