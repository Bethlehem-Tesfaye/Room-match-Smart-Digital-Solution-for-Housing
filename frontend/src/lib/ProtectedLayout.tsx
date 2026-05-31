import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";
import { useMyProfile, useRequestUnblock } from "../features/profile/hooks/useProfileHooks";
import { useThemePreference } from "../features/setting/hooks/useSettingHooks";

export function ProtectedLayout() {
  const { user, isPending } = useCurrentUser();
  const location = useLocation();
  const [requestReason, setRequestReason] = useState("");

  const profileQuery = useMyProfile(!!user);
  const unblockMutation = useRequestUnblock();
  const { theme, setTheme } = useThemePreference();
  const profileError = profileQuery.error as Error | undefined;

  const isAuthenticationLoading = isPending || (user && profileQuery.isLoading);
  const isBlockedAccount =
    profileQuery.isError &&
    profileQuery.error instanceof Error &&
    /blocked/i.test(profileQuery.error.message);

  if (isAuthenticationLoading) {
    return <div className="min-h-screen flex items-center justify-center"></div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  if (isBlockedAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
        <div className="w-full max-w-2xl rounded-3xl border border-base-300 bg-white p-8 shadow-lg dark:bg-slate-900 dark:text-slate-100">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold mb-3">Account Blocked</h1>
              <p className="mb-2 text-slate-700 dark:text-slate-300">
                {profileError?.message ?? "Your account has been blocked."}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                If you believe this block was applied in error, submit a request below and our admin team will review it.
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm w-full sm:w-auto"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            </button>
          </div>

          <label className="block mb-2 font-medium text-slate-900 dark:text-slate-100">Request Unblock Reason (optional)</label>
          <textarea
            rows={4}
            className="w-full rounded-2xl border border-base-300 bg-base-100 p-3 text-slate-900 outline-none focus:border-primary focus:outline-none dark:bg-slate-800 dark:text-slate-100"
            value={requestReason}
            onChange={(event) => setRequestReason(event.target.value)}
            placeholder="Optional note to the admin explaining why you need access restored"
          />

          {unblockMutation.isError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
              {unblockMutation.error?.message}
            </div>
          )}

          {unblockMutation.isSuccess && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/40 dark:text-green-200">
              {unblockMutation.data?.message ?? "Your unblock request has been submitted."}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="btn btn-primary w-full sm:w-auto"
              disabled={unblockMutation.status === "pending"}
              onClick={() => unblockMutation.mutate({ reason: requestReason.trim() || undefined })}
            >
              {unblockMutation.status === "pending" ? "Sending request..." : "Request Unblock"}
            </button>
            <button
              className="btn btn-ghost w-full sm:w-auto"
              onClick={() => setRequestReason("")}
            >
              Reset reason
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border border-base-300 bg-white p-8 shadow-lg dark:bg-slate-900">
          <h1 className="text-2xl font-semibold mb-3">Unable to load account</h1>
          <p className="text-base-content/80">{profileError?.message ?? "Unable to load profile."}</p>
        </div>
      </div>
    );
  }

  if (isBlockedAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
        <div className="w-full max-w-2xl rounded-3xl border border-base-300 bg-white p-8 shadow-lg dark:bg-slate-900 dark:text-slate-100">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold mb-3">Account Blocked</h1>
              <p className="mb-2 text-slate-700 dark:text-slate-300">
                {profileError?.message ?? "Your account has been blocked."}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                If you believe this block was applied in error, submit a request below and our admin team will review it.
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm w-full sm:w-auto"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            </button>
          </div>

          <label className="block mb-2 font-medium text-slate-900 dark:text-slate-100">Request Unblock Reason (optional)</label>
          <textarea
            rows={4}
            className="w-full rounded-2xl border border-base-300 bg-base-100 p-3 text-slate-900 outline-none focus:border-primary focus:outline-none dark:bg-slate-800 dark:text-slate-100"
            value={requestReason}
            onChange={(event) => setRequestReason(event.target.value)}
            placeholder="Optional note to the admin explaining why you need access restored"
          />

          {unblockMutation.isError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
              {unblockMutation.error?.message}
            </div>
          )}

          {unblockMutation.isSuccess && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/40 dark:text-green-200">
              {unblockMutation.data?.message ?? "Your unblock request has been submitted."}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="btn btn-primary w-full sm:w-auto"
              disabled={unblockMutation.status === "pending"}
              onClick={() => unblockMutation.mutate({ reason: requestReason.trim() || undefined })}
            >
              {unblockMutation.status === "pending" ? "Sending request..." : "Request Unblock"}
            </button>
            <button
              className="btn btn-ghost w-full sm:w-auto"
              onClick={() => setRequestReason("")}
            >
              Reset reason
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border border-base-300 bg-white p-8 shadow-lg dark:bg-slate-900">
          <h1 className="text-2xl font-semibold mb-3">Unable to load account</h1>
          <p className="text-base-content/80">{profileError?.message ?? "Unable to load profile."}</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedLayout;
