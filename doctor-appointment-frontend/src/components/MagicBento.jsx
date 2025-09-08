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
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
      border: "1px solid rgba(255,255,255,.08)",
      backdropFilter: "blur(8px)"
    }}>
      {children}
    </div>
  );
}
