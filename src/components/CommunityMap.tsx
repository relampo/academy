import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import worldMap from "@svg-maps/world";

export type CountryCount = {
  code: string;
  name: string;
  count: number;
  flag?: string;
};

type SvgMapLocation = {
  id: string;
  name: string;
  path: string;
};

type CommunityMapProps = {
  countries: CountryCount[];
  className?: string;
  title?: string;
  eyebrow?: string;
  totalLabel?: string;
  listLimit?: number;
  showExpand?: boolean;
  showCredit?: boolean;
  showList?: boolean;
  showTotal?: boolean;
  variant?: "panel" | "hero";
};

export function CommunityMap({
  countries,
  className = "",
  title = "Estudiantes por país",
  eyebrow = "Comunidad LATAM",
  totalLabel = "Inscritos en la Comunidad",
  listLimit = 6,
  showExpand = true,
  showCredit = false,
  showList = true,
  showTotal = true,
  variant = "panel",
}: CommunityMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapTooltip, setMapTooltip] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const activeCountries = countries.filter((country) => country.count > 0);
  const countByCode = new Map(
    activeCountries.map((country) => [country.code.toLowerCase(), country]),
  );
  const totalStudents = activeCountries.reduce(
    (total, country) => total + country.count,
    0,
  );

  const updateTooltipPosition = (
    event: MouseEvent<SVGPathElement>,
    label: string,
  ) => {
    const mapElement = event.currentTarget.closest(".world-map");

    if (!mapElement) {
      setMapTooltip({ label, x: 16, y: 16 });
      return;
    }

    const rect = mapElement.getBoundingClientRect();
    setMapTooltip({
      label,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const renderMap = (isModal = false) => (
    <div
      className={`world-map${isModal ? " world-map-expanded" : ""}`}
      aria-label="Mapa de estudiantes por país"
    >
      <svg viewBox={worldMap.viewBox} role="img" aria-label={worldMap.label}>
        {worldMap.locations.map((location: SvgMapLocation) => {
          const country = countByCode.get(location.id);
          const studentCount = country?.count ?? 0;
          const label = `${country?.flag ? `${country.flag} ` : ""}${country?.name ?? location.name}: ${studentCount} ${
            studentCount === 1 ? "miembro" : "miembros"
          }`;

          return (
            <path
              key={location.id}
              className={studentCount > 0 ? "map-country is-active" : "map-country"}
              d={location.path}
              tabIndex={0}
              aria-label={label}
              onMouseEnter={(event) => updateTooltipPosition(event, label)}
              onMouseMove={(event) => updateTooltipPosition(event, label)}
              onMouseLeave={() => setMapTooltip(null)}
              onFocus={() => setMapTooltip({ label, x: 16, y: 16 })}
              onBlur={() => setMapTooltip(null)}
            />
          );
        })}
      </svg>
      {mapTooltip ? (
        <span
          className="map-tooltip is-visible"
          style={{
            left: `${mapTooltip.x}px`,
            top: `${mapTooltip.y}px`,
          }}
        >
          {mapTooltip.label}
        </span>
      ) : (
        <span className="map-tooltip map-tooltip-hint">
          Pasa por encima de un país
        </span>
      )}
    </div>
  );

  return (
    <section className={`content-panel community-panel community-panel-${variant} ${className}`}>
      <div className="page-header compact-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {showTotal ? (
          <strong>
            {totalStudents}
            <span>{totalLabel}</span>
          </strong>
        ) : null}
      </div>

      {renderMap()}

      {showExpand ? (
        <button
          className="map-expand-action"
          type="button"
          onClick={() => setIsExpanded(true)}
        >
          Ampliar mapa
        </button>
      ) : null}

      {showList && activeCountries.length === 0 ? (
        <p className="community-empty">Aún no hay países registrados.</p>
      ) : null}

      {showList && activeCountries.length > 0 ? (
        <div className="country-count-list">
          {activeCountries.slice(0, listLimit).map((country) => (
            <span key={country.code}>
              {country.flag ? `${country.flag} ` : ""}
              {country.name} <strong>{country.count}</strong>
            </span>
          ))}
        </div>
      ) : null}

      {showCredit ? (
        <p className="map-credit">Mapa base: @svg-maps/world, CC BY 4.0.</p>
      ) : null}

      {isExpanded
        ? createPortal(
            <div className="map-modal" role="dialog" aria-modal="true" aria-labelledby="map-modal-title">
              <div className="map-modal-panel">
                <div className="page-header compact-header">
                  <div>
                    <p className="eyebrow">{eyebrow}</p>
                    <h2 id="map-modal-title">{title}</h2>
                  </div>
                  <button type="button" onClick={() => setIsExpanded(false)}>
                    Cerrar
                  </button>
                </div>
                {renderMap(true)}
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
