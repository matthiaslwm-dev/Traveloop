import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Icon } from "../components/Icons";

const values = [
  {
    icon: "landmark",
    title: "Authenticity",
    body: "Genuine cultural experiences shaped by local communities.",
  },
  {
    icon: "handshake",
    title: "Trust",
    body: "Every partner is vetted, trusted, and personally chosen.",
  },
  {
    icon: "ticket",
    title: "Simplicity",
    body: "One pass unlocks everything a traveller could need.",
  },
  {
    icon: "camera",
    title: "Memories",
    body: "Journeys crafted to become stories worth telling.",
  },
];

const team = [
  {
    name: "Full Name",
    role: "Co-Founder & CEO",
    bio: "Placeholder bio — add a short line about this person's background.",
  },
  {
    name: "Full Name",
    role: "Co-Founder & COO",
    bio: "Placeholder bio — add a short line about this person's background.",
  },
  {
    name: "Full Name",
    role: "Head of Partnerships",
    bio: "Placeholder bio — add a short line about this person's background.",
  },
  {
    name: "Full Name",
    role: "Head of Experience",
    bio: "Placeholder bio — add a short line about this person's background.",
  },
  {
    name: "Full Name",
    role: "Lead Developer",
    bio: "Placeholder bio — add a short line about this person's background.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AboutPage() {
  return (
    <>
      <Navbar forceScrolled />
      <main>
        <section className="arrival section-light page-hero about-hero">
          <div className="section-heading centered">
            <p className="eyebrow">About Traveloop</p>
            <h2>
              Every Journey Begins
              <br />
              <em>with a Local Story.</em>
            </h2>
            <p>
              The heart of Malaysia isn&apos;t found on a map—it&apos;s found
              in its people, neighbourhoods, traditions, and flavours.
              Traveloop connects travellers with authentic experiences and
              trusted local partners, making every journey richer, easier,
              and more meaningful.
            </p>
          </div>
        </section>

        <section className="section-light">
          <div className="about-story about-story-solo">
            <div className="about-story-copy">
              <p className="eyebrow">Why we started</p>
              <h2>
                Because Every Trip
                <br />
                <em>Deserves a Story</em>
              </h2>
              <p>
                The best memories aren&apos;t made from checking places off a
                list—they come from meaningful moments, unexpected
                discoveries, and genuine local connections.
              </p>
              <p>
                Traveloop was created to make those moments effortless. Every
                experience, partner, and privilege is carefully selected so
                you can spend less time planning and more time experiencing
                the real Malaysia.
              </p>
            </div>
          </div>
        </section>

        <section className="section-cream about-values">
          <div className="section-heading centered">
            <p className="eyebrow">Our Values</p>
            <h2>
              Built around
              <br />
              <em>what matters.</em>
            </h2>
          </div>
          <div className="value-grid">
            {values.map((v) => (
              <article className="value-card" key={v.title}>
                <span className="value-card-icon">
                  <Icon name={v.icon} />
                </span>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-light team-section">
          <div className="section-heading centered">
            <h2>Meet the Team</h2>
            <p>The people behind Traveloop.</p>
            <p className="eyebrow team-founded">Founded in 2026</p>
          </div>
          <div className="team-grid">
            {team.map((m) => (
              <article className="team-card" key={m.name}>
                <span className="team-avatar">{initials(m.name)}</span>
                <h3>{m.name}</h3>
                <p className="team-role">{m.role}</p>
                <p className="team-bio">{m.bio}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="closing section-dark">
          <div
            className="closing-bg"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1664797092984-c817193dfa0f?auto=format&fit=crop&w=2200&q=88')",
            }}
          />
          <div className="closing-overlay" />
          <div className="closing-content">
            <h2>Come experience it with us.</h2>
            <p className="closing-copy">
              Every pass we sell funds another local partnership, another
              artisan supported, another traveller connected to the real
              Malaysia.
            </p>
            <Link className="button primary" href="/#what">
              Choose your Traveloop Pass
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
