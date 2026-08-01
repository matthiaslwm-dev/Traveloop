"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CNFlag, USFlag } from "./Flags";

const languages = [
  { code: "en", label: "English", Flag: USFlag },
  { code: "zh", label: "中文", Flag: CNFlag },
] as const;

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/partners", label: "Partners" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact" },
] as const;

export default function Navbar({ forceScrolled = false }: { forceScrolled?: boolean }) {
  const navRef = useRef<HTMLElement>(null);
  const langWrapRef = useRef<HTMLDivElement>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState<(typeof languages)[number]["code"]>("en");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      navRef.current?.classList.toggle("scrolled", forceScrolled || window.scrollY > 70);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [forceScrolled]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (langWrapRef.current && !langWrapRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const current = languages.find((l) => l.code === lang) ?? languages[0];

  return (
    <header className="nav" ref={navRef}>
      <Link className="brand" href="/" aria-label="Traveloop home">
        <img src="/traveloop-logo.webp" alt="Traveloop" />
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/partners">Partners</Link>
        <Link href="/blogs">Blogs</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div
        className={`nav-lang${langOpen ? " open" : ""}`}
        ref={langWrapRef}
      >
        <button
          type="button"
          className="nav-lang-btn"
          aria-haspopup="listbox"
          aria-expanded={langOpen}
          onClick={() => setLangOpen((v) => !v)}
        >
          <current.Flag className="nav-lang-flag" />
          <span className="nav-lang-chevron">⌄</span>
        </button>
        {langOpen && (
          <div className="nav-lang-menu" role="listbox">
            {languages.map((l) => (
              <button
                type="button"
                key={l.code}
                role="option"
                aria-selected={l.code === lang}
                className={`nav-lang-option${l.code === lang ? " active" : ""}`}
                onClick={() => {
                  setLang(l.code);
                  setLangOpen(false);
                }}
              >
                <l.Flag className="nav-lang-flag" />
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <a
        className="nav-whatsapp"
        href="https://wa.me/60123456789"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
      <Link className="nav-cta" href="/passes">
        Purchase Pass
      </Link>
      <button
        type="button"
        className={`nav-burger${menuOpen ? " open" : ""}`}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <div
        id="mobile-menu"
        className={`nav-mobile-overlay${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(false)}
      >
        <nav
          className="nav-mobile-menu"
          aria-label="Mobile navigation"
          onClick={(e) => e.stopPropagation()}
        >
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link
            className="nav-mobile-cta"
            href="/passes"
            onClick={() => setMenuOpen(false)}
          >
            Purchase Pass
          </Link>
        </nav>
      </div>
    </header>
  );
}
