export default function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        margin: 0,
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        background: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <section style={{ maxWidth: "42rem", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem, 6vw, 4rem)" }}>BizUno</h1>
        <p style={{ margin: "1rem 0 0", fontSize: "1.125rem", lineHeight: 1.6, color: "#475569" }}>
          Your React application is running.
        </p>
      </section>
    </main>
  );
}
