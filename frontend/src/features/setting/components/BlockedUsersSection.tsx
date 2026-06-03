import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  useBlockedUsers,
  useUnblockUser,
} from "../../reports/hooks/useReportHooks";

function BlockedUsersSection() {
  const { data: blockedUsers = [], isLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();

  const deep = "var(--palette-deep)";
  const muted = "var(--palette-soft-purple)";
  const border = "var(--palette-border)";
  const cardBg = "var(--palette-card-bg)";
  const mutedBg = "var(--palette-card-muted-alt-bg)";

  const handleUnblock = async (userId: string, name: string) => {
    const confirmed = window.confirm(`Unblock ${name}?`);
    if (!confirmed) return;

    try {
      await unblockUser.mutateAsync({ userId });
      toast.success(`${name} unblocked.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unblock user",
      );
    }
  };

  return (
    <article
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: border, backgroundColor: cardBg }}
    >
      <div
        className="border-b px-6 py-4"
        style={{ borderColor: border, backgroundColor: mutedBg }}
      >
        <h2 className="text-sm font-semibold" style={{ color: deep }}>
          Blocked users
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: muted }}>
          People you blocked cannot message you until you unblock them.
        </p>
      </div>

      <div className="px-6 py-5">
        {isLoading ? (
          <p className="text-sm" style={{ color: muted }}>
            Loading blocked users…
          </p>
        ) : blockedUsers.length === 0 ? (
          <p className="text-sm" style={{ color: muted }}>
            You have not blocked anyone.
          </p>
        ) : (
          <ul className="space-y-2">
            {blockedUsers.map((blockedUser) => (
              <li
                key={blockedUser.userId}
                className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                style={{ borderColor: border, backgroundColor: mutedBg }}
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: deep }}
                  >
                    {blockedUser.name}
                  </p>
                  {blockedUser.email ? (
                    <p className="truncate text-xs" style={{ color: muted }}>
                      {blockedUser.email}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void handleUnblock(blockedUser.userId, blockedUser.name)
                  }
                  disabled={unblockUser.isPending}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  style={{
                    borderColor: "#bbf7d0",
                    color: "#166534",
                    backgroundColor: "#ecfdf5",
                  }}
                >
                  <UserCheck size={13} />
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default BlockedUsersSection;
