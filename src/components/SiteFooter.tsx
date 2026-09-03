import Link from "next/link";
import { content } from "@/data/content";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="t-label footer-brand">{content.footer.left}</span>
      <nav className="footer-links">
        <Link href="/home" data-cursor="link">
          Home
        </Link>
      </nav>
    </footer>
  );
}
