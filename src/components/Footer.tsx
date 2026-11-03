import { PROCEDURE } from "@/lib/law";

export default function Footer() {
  return (
    <footer className="no-print mt-16 border-t border-paper-line">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-sm text-ink-soft">
        <p>
          Ovijog is not a law firm and does not give legal advice. It helps you organise your facts and draft
          messages under the Consumers&apos; Right Protection Act, 2009. Check the official text at
          bdlaws.minlaw.gov.bd before you file.
        </p>
        <p>
          Consumer rights hotline: {PROCEDURE.hotline}. Email: {PROCEDURE.email}. Your cases are saved only in
          this browser.
        </p>
      </div>
    </footer>
  );
}
