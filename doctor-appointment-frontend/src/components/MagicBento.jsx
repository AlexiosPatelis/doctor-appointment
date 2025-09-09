export default function MagicBento({ children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gridAutoRows: "140px",
      gap: 16
    }}>
      {children}
    </div>
  );
}

export function BentoCard({ col = 2, row = 2, children }) {
  return (
    <div style={{
      gridColumn: `span ${col}`,
      gridRow: `span ${row}`,
      borderRadius: 16,
      padding: 16,
      background: "#ffffff",
      border: "1px solid var(--card-border)",
      boxShadow: "0 1px 2px rgba(0,0,0,.06)"
    }}>
      {children}
    </div>
  );
}
