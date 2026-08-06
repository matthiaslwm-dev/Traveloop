"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Icon, StarbucksLogo } from "./components/Icons";
import { partners } from "./data/partners";
import { passTiers as tierShowcase } from "./data/passes";
import { PassStack } from "./components/PassCard";
import { useVideoPlayer, VideoStage, VideoControls } from "./components/VideoPlayer";

const reviews = [
  {
    name: "Wei",
    mask: "*******",
    date: "2026-06-21 14:32:08",
    body: "The lion head was so much heavier than I expected! Our instructor was patient and let us try the drums too. Best cultural activity we did in KL, hands down.",
    img: "/lion-dance.webp",
    activity: "Chinese Lion Dance Experience in Kuala Lumpur",
  },
  {
    name: "Aisyah",
    mask: "****",
    date: "2026-06-09 09:47:52",
    body: "Loved the batik workshop! The artisan showed us the wax and dye technique step by step, and I got to take my canvas home. Great for a rainy afternoon.",
    img: "/batik.jpg",
    activity: "Batik Painting Workshop in Penang",
  },
  {
    name: "Rajan",
    mask: "**********",
    date: "2026-05-27 17:03:41",
    body: "Learning to draw kolam with rice flour was so calming, and the food tasting after was incredible. Our host made sure everyone in the group felt included.",
    img: "/kolam.png",
    activity: "Indian Heritage & Kolam Experience in Kuala Lumpur",
  },
];

const whyHighlights = [
  {
    img: "/privileges.png",
    icon: "coins",
    headline: "Save More",
    tag: "MYR 18,000+",
    title: "Worth of Travel Privileges",
    body:
      "Unlock exclusive savings on dining, shopping, attractions and experiences at over 1,000 partner locations across Malaysia.",
  },
  {
    img: "/local.png",
    icon: "handshake",
    headline: "Experience Malaysia",
    tag: "40+",
    title: "Trusted Local Partners",
    body:
      "Discover authentic cultural experiences and hidden local gems through carefully selected partners across Malaysia.",
  },
  {
    img: "/tokio.png",
    icon: "shield",
    headline: "Travel Worry-Free",
    tag: "Tokio Marine",
    title: "Travel Insurance Included",
    body:
      "Enjoy your trip with comprehensive travel protection included from arrival to departure.",
  },
];

/** Cheapest tier, so the "starting from" price and its strikethrough always belong together */
const cheapestTier = [...tierShowcase].sort((a, b) => a.priceCents - b.priceCents)[0];

const faqItems = [
  {
    question: "Is the pass refundable?",
    answer:
      "Unused passes can be refunded up to 7 days before your first booked session. Full terms will be confirmed before launch.",
  },
  {
    question: "How long is my pass valid?",
    answer:
      "Your pass is valid for 30 days from activation, giving you a full trip window to redeem every perk.",
  },
  {
    question: "What if a partner isn't available?",
    answer:
      "If a partner venue is temporarily unavailable, our support team will help you rebook or swap to an equivalent partner.",
  },
];

export default function Home() {
  const tasteVideoId = "Jg0PRB5Aebo";
  // TODO: swap these placeholder video IDs for the real Batik / Indian Heritage footage.
  const lion = useVideoPlayer();
  const batik = useVideoPlayer();
  const indian = useVideoPlayer();
  const taste = useVideoPlayer();
  const film = useVideoPlayer();
  const lionCopyRef = useRef<HTMLDivElement>(null);
  const batikCopyRef = useRef<HTMLDivElement>(null);
  const indianCopyRef = useRef<HTMLDivElement>(null);
  const tasteCopyRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(faqItems[0].question);
  const loaderRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const filmModalRef = useRef<HTMLDialogElement>(null);
  const filmVideoId = "8V7czbc0kxg";
  const destinationVideos: Record<string, { id: string; title: string }> = {
    "Kuala Lumpur": { id: "cvT7CyFJ76I", title: "Kuala Lumpur — Traveloop" },
    Langkawi: { id: "l1YiY-OaS9I", title: "Langkawi — Traveloop" },
    Penang: { id: "4GUPqwMWDUY", title: "Penang — Traveloop" },
    "Cameron Highlands": { id: "bjFpApWzs4k", title: "Cameron Highlands — Traveloop" },
  };

  function playFilm(videoId: string, title: string) {
    filmModalRef.current?.showModal();
    film.start(videoId, title);
  }

  useEffect(() => {
    lionCopyRef.current?.classList.toggle("is-hidden", lion.playing);
  }, [lion.playing]);

  useEffect(() => {
    batikCopyRef.current?.classList.toggle("is-hidden", batik.playing);
  }, [batik.playing]);

  useEffect(() => {
    indianCopyRef.current?.classList.toggle("is-hidden", indian.playing);
  }, [indian.playing]);

  useEffect(() => {
    tasteCopyRef.current?.classList.toggle("is-hidden", taste.playing);
  }, [taste.playing]);

  useEffect(() => {
    const onLoad = () =>
      setTimeout(() => loaderRef.current?.classList.add("hidden"), 450);
    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    function onScroll() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.width = `${Math.min(100, (y / max) * 100)}%`;
      }
      if (heroBgRef.current && y < window.innerHeight * 1.2) {
        heroBgRef.current.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(1.04)`;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.14 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    const filmModal = filmModalRef.current;
    const onFilmBackdropClick = (e: MouseEvent) => {
      if (e.target === filmModal) filmModal?.close();
    };
    const onFilmClose = () => {
      film.stop();
    };
    filmModal?.addEventListener("click", onFilmBackdropClick);
    filmModal?.addEventListener("close", onFilmClose);

    return () => {
      window.removeEventListener("load", onLoad);
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      filmModal?.removeEventListener("click", onFilmBackdropClick);
      filmModal?.removeEventListener("close", onFilmClose);
    };
    // film.stop only closes over stable refs/setters from useVideoPlayer, so it's
    // safe to omit `film` here — including it would re-run this mount-only effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="progress" aria-hidden="true">
        <span ref={progressRef}></span>
      </div>

      <div className="loader" id="loader" ref={loaderRef}>
        <div className="loader-plane">✈</div>
        <p>Your Malaysian story begins…</p>
      </div>

      <Navbar />

      <main id="top">
        <section className="hero section-dark" data-nav="dark">
          <div className="hero-bg" ref={heroBgRef} aria-hidden="true"></div>
          <div className="hero-overlay" aria-hidden="true"></div>
          <div className="hero-cloud cloud-a" aria-hidden="true"></div>
          <div className="hero-cloud cloud-b" aria-hidden="true"></div>
          <div className="flight-path" aria-hidden="true">
            <span className="plane">✈</span>
          </div>

          <div className="hero-content reveal">
            <p className="eyebrow light">The Premier Tourist Pass for Malaysia</p>
            <h1>
              Experience Malaysia,
              <br />
              <em>with Traveloop.</em>
            </h1>
            <p className="hero-copy">
              Discover authentic culture, exclusive local deals, immersive
              experiences, and seamless travel. All with one Traveloop Pass.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#discover">
                Begin your journey
              </a>
              <button
                className="button ghost"
                onClick={() => playFilm(filmVideoId, "Traveloop — Experience Malaysia")}
              >
                Watch the story <span>▶</span>
              </button>
            </div>
          </div>

          <a href="#discover" className="scroll-cue" aria-label="Scroll to discover">
            <span>Scroll to travel</span>
            <i></i>
          </a>
        </section>

        <section className="arrival section-light" id="discover" data-nav="light">
          <div className="section-heading centered reveal">
            <h2>Discover the many faces of Malaysia.</h2>
            <p>
              From iconic landmarks and vibrant cities to authentic cultural
              experiences and local flavours, discover the stories,
              traditions, and moments that make Malaysia truly unforgettable.
            </p>
            <p className="discover-hint">
              <span>▶</span> Tap a card to watch it come to life
            </p>
          </div>

          <div className="discover-grid">
            <button
              type="button"
              className="discover-tile tile-city reveal"
              onClick={() =>
                playFilm(destinationVideos["Kuala Lumpur"].id, destinationVideos["Kuala Lumpur"].title)
              }
              aria-label="Watch a video of Kuala Lumpur"
            >
              <span className="discover-play">▶</span>
              <span className="discover-tag">City Lights</span>
              <span className="discover-place">Kuala Lumpur</span>
            </button>
            <button
              type="button"
              className="discover-tile tile-island reveal delay-1"
              onClick={() => playFilm(destinationVideos.Langkawi.id, destinationVideos.Langkawi.title)}
              aria-label="Watch a video of Langkawi"
            >
              <span className="discover-play">▶</span>
              <span className="discover-tag">Island Shores</span>
              <span className="discover-place">Langkawi</span>
            </button>
            <button
              type="button"
              className="discover-tile tile-heritage reveal delay-2"
              onClick={() => playFilm(destinationVideos.Penang.id, destinationVideos.Penang.title)}
              aria-label="Watch a video of Penang"
            >
              <span className="discover-play">▶</span>
              <span className="discover-tag">Heritage Streets</span>
              <span className="discover-place">Penang</span>
            </button>
            <button
              type="button"
              className="discover-tile tile-hilltop reveal delay-3"
              onClick={() =>
                playFilm(
                  destinationVideos["Cameron Highlands"].id,
                  destinationVideos["Cameron Highlands"].title
                )
              }
              aria-label="Watch a video of Cameron Highlands"
            >
              <span className="discover-play">▶</span>
              <span className="discover-tag">Hilltop Escapes</span>
              <span className="discover-place">Cameron Highlands</span>
            </button>
          </div>

        </section>

        <section className="experience-intro section-blue" id="experiences" data-nav="dark">
          <div className="section-heading split reveal">
            <div>
              <p className="eyebrow">The heart of the journey</p>
              <h2>
                Experience Malaysia
                <br />
                <em>through its culture</em>
              </h2>
            </div>
            <p>
              Every experience is thoughtfully curated to connect you with the
              people, traditions, and culture that define the true spirit of
              Malaysia.
            </p>
          </div>
        </section>

        <section className="experience-panel lion section-dark" data-nav="dark">
          <div className="experience-bg" aria-hidden="true"></div>
          {lion.playing && (
            <div className="experience-video" aria-hidden="true">
              <VideoStage player={lion} />
            </div>
          )}
          <div className="experience-shade" aria-hidden="true"></div>
          <div className="experience-copy reveal" ref={lionCopyRef}>
            <p className="experience-number">01 / 03</p>
            <h2>
              Feel the rhythm
              <br />
              of <em>lion dance.</em>
            </h2>
            <p>
              Step into the world of Chinese Lion Dance with a hands-on
              experience where you&apos;ll learn traditional movements, play
              authentic instruments, perform with a lion head, and discover
              the rich cultural heritage behind this iconic art.
            </p>
            <button
              type="button"
              className="play-video-btn"
              onClick={() => lion.start("qLRp1pvOLr4", "Chinese Lion Dance Experience")}
              aria-label="Play lion dance video"
            >
              <span className="play-video-icon">▶</span>
              Play Video
            </button>
          </div>
          {lion.playing && <VideoControls player={lion} />}
        </section>

        <section className="experience-panel batik section-dark" data-nav="dark">
          <div className="experience-bg" aria-hidden="true"></div>
          {batik.playing && (
            <div className="experience-video" aria-hidden="true">
              <VideoStage player={batik} />
            </div>
          )}
          <div className="experience-shade" aria-hidden="true"></div>
          <div className="experience-copy reveal" ref={batikCopyRef}>
            <p className="experience-number">02 / 03</p>
            <h2>
              Batik Painting
              <br />
              <em>Experience.</em>
            </h2>
            <p>
              Immerse yourself in the rich heritage of Malaysian Batik through
              a hands-on painting workshop led by experienced local artisans.
              Discover the beauty of this traditional art form as you create
              your own Batik masterpiece and take home a unique handmade
              souvenir to remember your Malaysian journey.
            </p>
            <button
              type="button"
              className="play-video-btn"
              onClick={() => batik.start("qLRp1pvOLr4", "Batik Painting Experience")}
              aria-label="Play batik painting video"
            >
              <span className="play-video-icon">▶</span>
              Play Video
            </button>
          </div>
          {batik.playing && <VideoControls player={batik} />}
          <div className="batik-orbit" aria-hidden="true"></div>
        </section>

        <section className="experience-panel indian section-dark" data-nav="dark">
          <div className="experience-bg" aria-hidden="true"></div>
          {indian.playing && (
            <div className="experience-video" aria-hidden="true">
              <VideoStage player={indian} />
            </div>
          )}
          <div className="experience-shade" aria-hidden="true"></div>
          <div className="experience-copy reveal" ref={indianCopyRef}>
            <p className="experience-number">03 / 03</p>
            <h2>
              Experience Malaysia&apos;s
              <br />
              <em>Indian Heritage.</em>
            </h2>
            <p>
              Step into a vibrant celebration of tradition through the
              intricate art of Kolam, authentic Indian cuisine, and warm local
              hospitality. Create, taste, and connect with one of
              Malaysia&apos;s richest cultural communities.
            </p>
            <button
              type="button"
              className="play-video-btn"
              onClick={() => indian.start("qLRp1pvOLr4", "Indian Heritage & Kolam Experience")}
              aria-label="Play Indian heritage video"
            >
              <span className="play-video-icon">▶</span>
              Play Video
            </button>
          </div>
          {indian.playing && <VideoControls player={indian} />}
        </section>

        <section className={`taste section-light${taste.playing ? " is-playing" : ""}`} id="taste" data-nav="light">
          {taste.playing && (
            <div className="taste-bg-video" aria-hidden="true">
              <VideoStage player={taste} />
              <div className="taste-video-mask top" />
              <div className="taste-video-mask bottom" />
            </div>
          )}
          <div className="section-heading centered reveal" ref={tasteCopyRef}>
            <p className="eyebrow">The Taste of Malaysia</p>
            <h2>
              Discover Malaysia
              <br />
              <em>Through Its Flavours.</em>
            </h2>
            <p>
              Taste your way through Malaysia with handpicked local
              favourites, hidden cafés, and iconic eateries. All with
              exclusive Traveloop dining privileges.
            </p>
            <button
              type="button"
              className="play-video-btn on-light"
              onClick={() => taste.start(tasteVideoId, "The Taste of Malaysia")}
              aria-label="Play a taste of Malaysia video"
            >
              <span className="play-video-icon">▶</span>
              Play Video
            </button>
          </div>
          {taste.playing && <VideoControls player={taste} />}
        </section>

        <section className="why section-light" id="why" data-nav="light">
          <div className="why-hero reveal">
            <div className="why-hero-copy">
              <p className="eyebrow">Why Choose Traveloop</p>
              <h2>
                Experience More.
                <br />
                <em>Plan Less.</em>
              </h2>
              <p>
                Handpicked cultural experiences, exclusive dining and shopping
                privileges, trusted local partners, complimentary travel
                protection, and unforgettable moments—
                <span className="gradient-highlight">
                  all included in one simple pass
                </span>
                .
              </p>
              <a className="button primary taste-cta" href="/partners">
                View Exclusive Deals
              </a>
            </div>
          </div>

          <div className="why-cards reveal">
            {whyHighlights.map((h, i) => (
              <article className={`why-card delay-${i + 1}`} key={h.title}>
                <div
                  className="why-card-bg"
                  style={{ backgroundImage: `url('${h.img}')` }}
                />
                <div className="why-card-overlay" />
                <div className="why-card-content">
                  <span className="why-card-icon">
                    <Icon name={h.icon} />
                  </span>
                  <span className="why-card-headline">{h.headline}</span>
                  <div className="why-card-stat-group">
                    <strong className="why-card-stat">{h.tag}</strong>
                    <span className="why-card-title">{h.title}</span>
                  </div>
                  <p>{h.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="reviews reveal">
            <h3 className="reviews-label">Stories from Fellow Travellers</h3>
            <div className="reviews-grid">
              {reviews.map((r) => (
                <article className="review-card" key={r.name}>
                  <div className="review-head">
                    <div>
                      <strong className="review-name">
                        {r.name} <span className="review-mask">{r.mask}</span>
                      </strong>
                      <span className="review-date">{r.date}</span>
                    </div>
                    <span className="review-rating">
                      Fantastic <span className="review-rating-badge">5.0</span>
                    </span>
                  </div>
                  <p className="review-body">{r.body}</p>
                  <a className="review-activity" href="#experiences">
                    <span
                      className="review-activity-img"
                      style={{ backgroundImage: `url('${r.img}')` }}
                    />
                    {r.activity}
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="partners reveal">
            <h3 className="partners-label">Our Trusted Partners</h3>
            <div className="partners-marquee">
              <div className="partners-track">
                {[...partners, ...partners].map((p, i) => (
                  <div className="partner-card-mini" key={`${p.name}-${i}`}>
                    <span className="partner-card-mini-icon">
                      {p.logo === "starbucks" ? (
                        <StarbucksLogo />
                      ) : (
                        <Icon name={p.icon!} />
                      )}
                    </span>
                    <span className="partner-card-mini-name">{p.name}</span>
                    <span className="partner-card-mini-deal">{p.deal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="what section-cream" id="what" data-nav="light">
          <div className="section-heading centered reveal">
            <p className="eyebrow">Experience Malaysia with Traveloop</p>
            <h2>
              One pass.
              <br />
              <em>Everything included.</em>
            </h2>
            <p>
              Everything has been carefully curated, from authentic cultural
              experiences to exclusive local deals,{" "}
              <span className="gradient-highlight">
                so all you have to do is enjoy
              </span>
              .
            </p>
          </div>

          <div className="what-passes reveal">
            <PassStack className="pass-stack-light" />
          </div>

          <div className="what-cta reveal">
            <p className="what-cta-label">Three tiers starting from</p>
            <div className="what-cta-price">
              <s>
                <small>MYR</small>
                {cheapestTier.originalPrice}
              </s>
              <strong>
                <small>MYR</small>
                {cheapestTier.price}
              </strong>
            </div>
            <span className="tier-discount-badge">
              Exclusive 50% launch discount applied!
            </span>
            <Link className="button primary tier-purchase-cta" href="/passes">
              Purchase Pass
            </Link>
          </div>
        </section>

        <section className="faq-section section-red" id="faq" data-nav="dark">
          <div className="faq-facets" aria-hidden="true">
            <span className="facet facet-a"></span>
            <span className="facet facet-b"></span>
            <span className="facet facet-c"></span>
          </div>
          <div className="faq-header reveal">
            <h2>
              Frequently Asked <span className="accent">Questions</span>
            </h2>
            <p>
              Everything you need to know before you start exploring Malaysia
              with your Traveloop Pass.
            </p>
          </div>

          <div className="accordion faq-accordion reveal">
            {faqItems.map((item) => {
              const isOpen = openFaq === item.question;
              return (
                <div
                  className={`accordion-row${isOpen ? " open" : ""}`}
                  key={item.question}
                >
                  <button
                    type="button"
                    className="accordion-head"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : item.question)}
                  >
                    <span className="accordion-title">{item.question}</span>
                    <span className="accordion-chevron">⌄</span>
                  </button>
                  {isOpen && <p className="accordion-body">{item.answer}</p>}
                </div>
              );
            })}
          </div>

          <p className="faq-quiz-link">
            Still have questions?{" "}
            <Link className="text-link-button" href="/contact">
              Contact Us →
            </Link>
          </p>
        </section>

        <section className="closing section-dark" data-nav="dark">
          <div className="closing-bg" aria-hidden="true"></div>
          <div className="closing-overlay" aria-hidden="true"></div>
          <div className="closing-content reveal">
            <h2>Your Journey Starts Here.</h2>
            <p className="closing-copy">
              Come for Malaysia. Leave with unforgettable stories, authentic
              experiences, exclusive privileges, and memories that last long
              after your trip ends.
            </p>
            <a className="button primary" href="#what">
              Choose your Traveloop Pass
            </a>
          </div>
        </section>
      </main>

      <Footer />

      <dialog className="modal" ref={filmModalRef} aria-label="Video player">
        <button
          type="button"
          className="modal-close"
          aria-label="Close video"
          onClick={() => filmModalRef.current?.close()}
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className="film-video">
          <VideoStage player={film} />
        </div>
        {film.playing && <VideoControls player={film} />}
      </dialog>
    </>
  );
}
