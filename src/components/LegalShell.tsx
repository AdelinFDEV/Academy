import Link from "next/link";
import Footer from "@/components/Footer";

interface Props {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalShell({ title, lastUpdated, children }: Props) {
  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">
          adelin<span>btc</span>
        </Link>
        <div className="blog-nav-links">
          <Link href="/" className="btn-nav-link">← Volver al inicio</Link>
        </div>
      </nav>

      <main className="blog-main">
        <div className="legal-page">
          <div className="legal-header">
            <p className="legal-label">AdelinBTC Academy</p>
            <h1 className="legal-title">{title}</h1>
            <p className="legal-updated">Última actualización: {lastUpdated}</p>
          </div>
          <div className="legal-body">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
