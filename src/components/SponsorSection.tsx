import relampoLogoUrl from "../assets/relampo-sponsor-logo.png";

type SponsorSectionProps = {
  compact?: boolean;
};

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
        <a
          className="sponsor-card"
          href="https://relampo.com/"
          rel="noreferrer"
          target="_blank"
        >
          <img className="sponsor-logo" src={relampoLogoUrl} alt="Relampo" />
          <div>
            <strong>Relampo</strong>
            <span>Web oficial</span>
          </div>
        </a>
      </div>
    </section>
  );
}
