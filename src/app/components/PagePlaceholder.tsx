import Navbar from "./Navbar";

export default function PagePlaceholder({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <>
      <Navbar />
      <main>
        <section className="arrival section-light" style={{ minHeight: "70svh" }}>
          <div className="section-heading centered">
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
        </section>
      </main>
    </>
  );
}
