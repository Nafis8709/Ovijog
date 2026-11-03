import Link from "next/link";
import BuildathonSticker from "./BuildathonSticker";

export default function Navbar() {
  return (
    <header className="no-print border-b-2 border-ink bg-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="display text-2xl text-green">অভিযোগ</span>
          <span className="text-lg font-semibold text-ink">Ovijog</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-base">
          <Link href="/cases" className="whitespace-nowrap underline-offset-4 hover:underline">
            My cases
          </Link>
          <Link href="/new" className="btn btn-primary whitespace-nowrap py-2">
            Start a case
          </Link>
          <BuildathonSticker />
        </nav>
      </div>
    </header>
  );
}
