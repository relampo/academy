export function AssignmentsPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Instructor</p>
          <h1>Assignments</h1>
        </div>
      </div>

      <section className="content-panel">
        <h2>Review workflow</h2>
        <div className="task-list">
          <div>
            <strong>Pending submissions</strong>
            <span>Manual review and script validation queues will appear here.</span>
          </div>
          <div>
            <strong>Attempt management</strong>
            <span>Grant extra attempts with audit history.</span>
          </div>
        </div>
      </section>
    </section>
  );
}
