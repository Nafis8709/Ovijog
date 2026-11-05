import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="display text-4xl">Page not found</h1>
      <p className="mt-3 text-ink-soft">This page does not exist. Your cases are still saved in My cases.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary">
          Go to the home page
        </Link>
        <Link href="/cases" className="btn btn-quiet">
          My cases
        </Link>
      </div>
    </div>
  );
}
