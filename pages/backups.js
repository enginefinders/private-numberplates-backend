import Head from "next/head";
import { useEffect, useState } from "react";

const PAGE_SIZE = 6;

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

  const shell = (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style jsx>{`
        .record-list .record-card:not(:last-child) {
          margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
          .record-list {
            gap: 0 !important;
          }
          .record-list .record-card {
            border: none !important;
            border-radius: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-bottom: 0 !important;
          }
          .record-list .record-card:not(:last-child) {
            border-bottom: 1px solid #e5e5e5 !important;
            padding-bottom: 1rem !important;
            margin-bottom: 1rem !important;
          }
        }
      `}</style>
    </>
  );

  if (loading) {
    return (
      <>
        {shell}
        <main style={styles.main}>
          <Tabs activeTab={activeTab} onChange={switchTab} />
          <p>Loading…</p>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        {shell}
        <main style={styles.main}>
          <Tabs activeTab={activeTab} onChange={switchTab} />
          <p style={{ color: "#b91c1c" }}>Error: {error}</p>
        </main>
      </>
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
    <>
      {shell}
      <main style={styles.main}>
        <Tabs activeTab={activeTab} onChange={switchTab} />
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.meta}>
          Showing {start}–{end} of {total} (newest first)
        </p>

        {records.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <div style={styles.list} className="record-list">
            {records.map((item) => (
              <RecordCard
                key={item._id}
                item={item}
                isBackup={isBackups}
              />
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
    </>
  );
}

function RecordCard({ item, isBackup }) {
  const c = item.customer || {};
  const p = item.plate_config || {};
  const kit = p.freeKit || {};

  return (
    <article style={styles.card} className="record-card">
      <h2 style={styles.cardTitle}>
        {c.firstName} {c.lastName}
      </h2>
      <dl style={styles.dl}>
        <SectionLabel text="Order" />
        <Row label="Product ID" value={item.product_id} />
        <Row label="Quantity" value={item.quantity} />
        {isBackup && <Row label="Payment method" value={item.paymentMethod} />}

        <SectionLabel text="Customer" />
        <Row label="First name" value={c.firstName} />
        <Row label="Last name" value={c.lastName} />
        <Row label="Email" value={c.email} />
        <Row label="Phone" value={c.phone} />
        <Row label="Address 1" value={c.address1} />
        <Row label="Address 2" value={c.address2} />
        <Row label="City" value={c.city} />
        <Row label="Postcode" value={c.postcode} />
        <Row label="Country" value={c.country} />

        <SectionLabel text="Plate" />
        <Row label="Plate type" value={p.plate_type} />
        <Row label="Reg text" value={p.text} />
        <Row label="Plate size" value={p.plate_size} />
        <Row label="Sides" value={p.sides} />
        <Row label="Hex plate" value={formatBool(p.hexPlate)} />
        <Row label="Badge" value={p.badge} />
        <Row label="Free kit — pads" value={formatBool(kit.pads)} />
        <Row label="Free kit — screws" value={formatBool(kit.screws)} />
        <Row
          label="Total"
          value={p.total != null ? `£${p.total}` : undefined}
        />

        <SectionLabel text="Record" />
        <Row label="Has preview" value={item.hasPreview ? "Yes" : "No"} />
        <Row
          label="Created"
          value={
            item.createdAt
              ? new Date(item.createdAt).toLocaleString()
              : undefined
          }
        />
        <Row
          label="Updated"
          value={
            item.updatedAt
              ? new Date(item.updatedAt).toLocaleString()
              : undefined
          }
        />
      </dl>
    </article>
  );
}

function SectionLabel({ text }) {
  return (
    <>
      <dt style={styles.sectionDt}>{text}</dt>
      <dd style={styles.sectionDd} />
    </>
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
      <dd style={styles.dd}>{formatDisplay(value)}</dd>
    </>
  );
}

function formatBool(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return undefined;
}

function formatDisplay(value) {
  if (value === null || value === undefined || value === "") return "—";
  return value;
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
    gridTemplateColumns: "140px 1fr",
    gap: "0.35rem 0.75rem",
    margin: 0,
  },
  sectionDt: {
    gridColumn: "1 / -1",
    fontWeight: 700,
    color: "#222",
    marginTop: "0.5rem",
    fontSize: "0.9rem",
  },
  sectionDd: { display: "none", margin: 0 },
  dt: { fontWeight: 600, color: "#444" },
  dd: { margin: 0, wordBreak: "break-word" },
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
