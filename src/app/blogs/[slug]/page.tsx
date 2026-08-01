import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Icon } from "../../components/Icons";
import { blogPosts, getPostBySlug, type BlogBlock, type BlogPost } from "../../data/blog";

export function generateStaticParams() {
  return blogPosts.filter((p) => p.body).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/blogs/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post?.body) return { title: "Article not found — Traveloop" };

  return {
    title: `${post.title} — Traveloop`,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      images: [post.img],
    },
  };
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "lead":
      return <p className="article-lead">{block.text}</p>;
    case "para":
      return <p>{block.text}</p>;
    case "heading":
      return <h2>{block.text}</h2>;
    case "subheading":
      return <h3>{block.text}</h3>;
    case "image":
      // eslint-disable-next-line @next/next/no-img-element
      return <img className="article-image" src={block.src} alt={block.alt} loading="lazy" />;
    case "list":
      return (
        <ul className="article-list">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "phrases":
      return (
        <ol className="phrase-list">
          {block.items.map((phrase) => (
            <li className="phrase-card" key={phrase.malay}>
              <p className="phrase-malay">{phrase.malay}</p>
              <p className="phrase-english">{phrase.english}</p>
              <p className="phrase-note">{phrase.note}</p>
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <aside className="article-callout">
          <p>{block.text}</p>
          {block.cta && (
            <Link className="button primary" href={block.cta.href}>
              {block.cta.label}
            </Link>
          )}
        </aside>
      );
  }
}

function RelatedCard({ post }: { post: BlogPost }) {
  const inner = (
    <>
      <div className="blog-card-image" style={{ backgroundImage: `url('${post.img}')` }} />
      <div className="blog-card-body">
        <span className="blog-tag">{post.category}</span>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="blog-card-footer">
          <div className="blog-meta">
            <span>{post.date}</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>
    </>
  );

  return post.body ? (
    <Link className="blog-card blog-card-link" href={`/blogs/${post.slug}`}>
      {inner}
    </Link>
  ) : (
    <article className="blog-card">{inner}</article>
  );
}

export default async function BlogPostPage(props: PageProps<"/blogs/[slug]">) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post?.body) notFound();

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <Navbar forceScrolled />
      <main>
        <article>
          <header className="article-hero">
            <div className="article-hero-inner">
              <Link className="article-back" href="/blogs">
                <span className="article-back-arrow">
                  <Icon name="arrowRight" />
                </span>
                All articles
              </Link>
              <span className="blog-tag">{post.category}</span>
              <h1>{post.title}</h1>
              <p className="article-hero-excerpt">{post.excerpt}</p>
              <div className="article-byline">
                <span className="blog-author">
                  <span className={`blog-avatar avatar-${post.author.accent}`}>
                    {post.author.initials}
                  </span>
                  <span>
                    <span className="blog-author-name">{post.author.name}</span>
                    <span className="article-byline-role">{post.author.role}</span>
                  </span>
                </span>
                <div className="blog-meta">
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          </header>

          <div
            className="article-cover"
            style={{ backgroundImage: `url('${post.img}')` }}
            role="img"
            aria-label={post.title}
          />

          <div className="article-body">
            {post.body.map((block, i) => (
              <Block block={block} key={i} />
            ))}
          </div>
        </article>

        {related.length > 0 && (
          <section className="section-light blog-listing article-related">
            <div className="blog-section-head">
              <h3>Keep reading</h3>
              <Link className="article-related-all" href="/blogs">
                View all articles
              </Link>
            </div>
            <div className="blog-grid">
              {related.map((p) => (
                <RelatedCard post={p} key={p.slug} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
