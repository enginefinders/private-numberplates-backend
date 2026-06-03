import { useEffect, useState } from "react";

const PAGE_SIZE = 10;

export default function BackupsPage() {
  const [activeTab, setActiveTab] = useState("backups");
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function switchTab(tab) {
    setActiveTab(tab);
    setPage(1);
  }

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true);
      setError(null);
      try {
        const endpoint =
          activeTab === "backups" ? "/api/backups" : "/api/leads";
        const res = await fetch(`${endpoint}?page=${page}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error ||
              `Failed to load ${activeTab === "backups" ? "backups" : "leads"}`,
          );
        }
        const items =
          activeTab === "backups" ? data.backups : data.leads;
        setRecords(items || []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, [page, activeTab]);

  if (loading) {
    return (
      <main style={styles.main}>
        <Tabs activeTab={activeTab} onChange={switchTab} />
        <p>Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.main}>
        <Tabs activeTab={activeTab} onChange={switchTab} />
        <p style={{ color: "#b91c1c" }}>Error: {error}</p>
      </main>
    );
  }

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const isBackups = activeTab === "backups";
  const title = isBackups ? "Backup orders" : "Leads";
  const emptyMessage = isBackups
    ? "No backup records found."
    : "No lead records found.";

  return (
    <main style={styles.main}>
      <Tabs activeTab={activeTab} onChange={switchTab} />
      <h1 style={styles.title}>{title}</h1>
      <p style={styles.meta}>
        Showing {start}–{end} of {total} (newest first)
      </p>

      {records.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <div style={styles.list}>
          {records.map((item) => (
            <article key={item._id} style={styles.card}>
              <h2 style={styles.cardTitle}>
                {item.customer?.firstName} {item.customer?.lastName}
              </h2>
              <dl style={styles.dl}>
                <Row label="Email" value={item.customer?.email} />
                <Row label="Phone" value={item.customer?.phone} />
                <Row label="City" value={item.customer?.city} />
                <Row label="Postcode" value={item.customer?.postcode} />
                <Row label="Reg text" value={item.plate_config?.text} />
                <Row label="Plate type" value={item.plate_config?.plate_type} />
                <Row label="Sides" value={item.plate_config?.sides} />
                <Row
                  label="Total"
                  value={
                    item.plate_config?.total != null
                      ? `£${item.plate_config.total}`
                      : "—"
                  }
                />
                <Row label="Payment" value={item.paymentMethod} />
                <Row label="Quantity" value={item.quantity} />
                <Row
                  label="Created"
                  value={
                    item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "—"
                  }
                />
              </dl>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav style={styles.pagination} aria-label="Pagination">
          <button
            type="button"
            style={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            style={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}

function Tabs({ activeTab, onChange }) {
  return (
    <div style={styles.tabs} role="tablist" aria-label="Data type">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "backups"}
        style={{
          ...styles.tabBtn,
          ...(activeTab === "backups" ? styles.tabBtnActive : {}),
        }}
        onClick={() => onChange("backups")}
      >
        Backups
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "leads"}
        style={{
          ...styles.tabBtn,
          ...(activeTab === "leads" ? styles.tabBtnActive : {}),
        }}
        onClick={() => onChange("leads")}
      >
        Leads
      </button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <>
      <dt style={styles.dt}>{label}</dt>
      <dd style={styles.dd}>{value ?? "—"}</dd>
    </>
  );
}

const styles = {
  main: {
    fontFamily: "system-ui, sans-serif",
    maxWidth: 720,
    margin: "0 auto",
    padding: "1px",
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.25rem",
  },
  tabBtn: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
    border: "1px solid #ccc",
    borderRadius: 6,
    background: "#fff",
  },
  tabBtnActive: {
    background: "#f4f4f4",
    fontWeight: 600,
  },
  title: { fontSize: "1.5rem", marginBottom: "0.25rem" },
  meta: { color: "#666", marginBottom: "1.5rem" },
  list: { display: "flex", flexDirection: "column", gap: "1rem" },
  card: {
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    padding: "1rem 1.25rem",
  },
  cardTitle: { fontSize: "1.1rem", margin: "0 0 0.75rem" },
  dl: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "0.35rem 0.75rem",
    margin: 0,
  },
  dt: { fontWeight: 600, color: "#444" },
  dd: { margin: 0 },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    marginTop: "2rem",
  },
  pageBtn: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
    border: "1px solid #ccc",
    borderRadius: 6,
    background: "#fff",
  },
  pageInfo: { color: "#444", minWidth: 100, textAlign: "center" },
};
