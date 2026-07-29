export function UnauthorizedPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Control de acceso</p>
          <h1>No autorizado</h1>
        </div>
      </div>

      <section className="content-panel compact">
        <p>
          Tu rol actual en la academia no incluye acceso a este espacio.
        </p>
        <a className="text-link" href="#/">
          Volver al inicio
        </a>
      </section>
    </section>
  );
}
