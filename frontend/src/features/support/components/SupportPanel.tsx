import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { useMyProfile, useSubmitSupport } from "../../profile/hooks/useProfileHooks";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";

function SupportPanel() {
  const { user, isAuthenticated } = useCurrentUser();
  const { data: profile } = useMyProfile(isAuthenticated);
  const submitSupport = useSubmitSupport();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const email = user?.email ?? "—";
  const phone = profile?.phoneNumber?.trim() || "Not saved on profile";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    submitSupport.mutate(
      { message: trimmed },
      {
        onSuccess: () => {
          setMessage("");
          setSubmitted(true);
        },
      },
    );
  };

  return (
    <div
      className="rounded-2xl border p-6 shadow-sm"
      style={{
        backgroundColor: "var(--palette-card-bg)",
        borderColor: "var(--palette-border)",
      }}
    >
      <div className="mb-6 flex items-start gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--palette-chip-bg)", color: "#8b64c8" }}
        >
          <LifeBuoy size={20} />
        </span>
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--palette-deep)" }}
          >
            Ask support
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--palette-muted)" }}>
            Send a message to the RoomMatch team. We receive your account email
            and phone number from your profile when available.
          </p>
        </div>
      </div>

      <dl
        className="mb-6 grid gap-3 rounded-xl border px-4 py-3 text-sm sm:grid-cols-2"
        style={{
          borderColor: "var(--palette-border)",
          backgroundColor: "var(--palette-section-bg)",
        }}
      >
        <div>
          <dt style={{ color: "var(--palette-muted)" }}>Email</dt>
          <dd className="font-medium" style={{ color: "var(--palette-deep)" }}>
            {email}
          </dd>
        </div>
        <div>
          <dt style={{ color: "var(--palette-muted)" }}>Phone</dt>
          <dd className="font-medium" style={{ color: "var(--palette-deep)" }}>
            {phone}
          </dd>
        </div>
      </dl>

      {submitted && !submitSupport.isPending && (
        <p
          className="mb-4 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "#bbf7d0",
            backgroundColor: "#f0fdf4",
            color: "#166534",
          }}
        >
          Your message was sent. An admin will review it soon.
        </p>
      )}

      {submitSupport.isError && (
        <p
          className="mb-4 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "#fecaca",
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {submitSupport.error.message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--palette-deep)" }}
          >
            Message
          </span>
          <textarea
            value={message}
            onChange={(e) => {
              setSubmitted(false);
              setMessage(e.target.value);
            }}
            rows={6}
            maxLength={4000}
            required
            placeholder="Describe your issue or question…"
            className="w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
            style={{
              borderColor: "var(--palette-border)",
              backgroundColor: "var(--palette-page-bg)",
              color: "var(--palette-deep)",
            }}
          />
        </label>
        <button
          type="submit"
          disabled={submitSupport.isPending || !message.trim()}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "#8b64c8" }}
        >
          {submitSupport.isPending ? "Sending…" : "Send to support"}
        </button>
      </form>
    </div>
  );
}

export default SupportPanel;
