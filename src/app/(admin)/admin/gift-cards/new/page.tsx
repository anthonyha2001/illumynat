import { IssueGiftCardForm } from "./IssueGiftCardForm";

export const metadata = { title: "Issue Gift Card — LUMYNAT Admin" };

export default function AdminIssueGiftCardPage() {
  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Finance</p>
        <h1 className="font-display text-4xl font-light italic text-text">Issue Gift Card</h1>
      </div>
      <IssueGiftCardForm />
    </div>
  );
}
