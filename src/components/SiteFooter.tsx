import Link from "next/link";
import { content } from "@/data/content";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="t-label footer-brand">{content.footer.left}</span>
      <nav className="footer-links" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <Link href="/home" data-cursor="link">
          Monument
        </Link>
        <Link href="/dashboard" data-cursor="link">
          Dashboard
        </Link>
        <a href="/store.html" target="_blank" rel="noopener noreferrer" data-cursor="link">
          Customer Store ↗
        </a>
        <a href="/checkout.html" target="_blank" rel="noopener noreferrer" data-cursor="link">
          Checkout
        </a>
        <Link href="/" data-cursor="link">
          Sign In
        </Link>
      </nav>
    </footer>
  );
}
