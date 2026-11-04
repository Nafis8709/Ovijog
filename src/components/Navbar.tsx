import Link from "next/link";
import BuildathonSticker from "./BuildathonSticker";

// Two parts:
// 1. A slim strip with the buildathon sticker (required to be visible near the top).
// 2. The main bar: logo on the left, "My cases" and "Start a case" on the right,
//    on one row even on small phones.
export default function Navbar() {
  return (
    <header className="no-print border-b-2 border-ink bg-paper">
      <div className="border-b border-paper-line bg-white">
        <div className="mx-auto flex max-w-5xl justify-center px-4 py-1.5 sm:justify-end">
          <BuildathonSticker />
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-1 px-3 py-2.5 sm:gap-2 sm:px-4">
        <Link href="/" className="flex min-h-11 items-center gap-2" aria-label="Ovijog home">
          <span className="display text-xl text-green min-[360px]:text-2xl">অভিযোগ</span>
          <span className="hidden text-lg font-semibold text-ink min-[400px]:inline">Ovijog</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/cases"
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-2 underline-offset-4 hover:underline sm:px-3"
          >
            My cases
          </Link>
          <Link href="/new" className="btn btn-primary whitespace-nowrap px-3 py-2 sm:px-4">
            <span className="sm:hidden">New case</span>
            <span className="hidden sm:inline">Start a case</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
