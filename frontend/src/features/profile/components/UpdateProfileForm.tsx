import { Mail, Phone, Upload, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useMyProfile, useUpdateMyProfile } from "../hooks/useProfileHooks";
import { palette } from "../../../theme/palette";

function UpdateProfileForm() {
  const {
    user,
    isAuthenticated,
    isPending: isSessionPending,
  } = useCurrentUser();
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useMyProfile(isAuthenticated);
  const updateProfileMutation = useUpdateMyProfile();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | undefined>(
    undefined,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhoneNumber(profile.phoneNumber ?? "");
    setPreviewUrl(profile.profilePictureUrl ?? null);
  }, [profile]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:"))
        URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const profileEmail = user?.email ?? "";
  const initials = useMemo(() => {
    const source =
      fullName.trim() || profile?.fullName?.trim() || user?.email || "U";
    return source.charAt(0).toUpperCase();
  }, [fullName, profile?.fullName, user?.email]);

  const isSubmitDisabled =
    updateProfileMutation.isPending ||
    isLoading ||
    isSessionPending ||
    !isAuthenticated;

  const onSelectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    if (previewUrl && previewUrl.startsWith("blob:"))
      URL.revokeObjectURL(previewUrl);
    setSelectedImageFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setRemoveProfilePicture(false);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = new FormData();
    payload.append("fullName", fullName.trim());
    payload.append("phoneNumber", phoneNumber.trim() || "");
    if (selectedImageFile) payload.append("profilePicture", selectedImageFile);
    if (removeProfilePicture) payload.append("removeProfilePicture", "true");
    updateProfileMutation.mutate(payload, {
      onSuccess: (response) => {
        toast.success(response.message || "Profile updated successfully");
        setSelectedImageFile(undefined);
      },
      onError: (mutationError) => {
        toast.error(mutationError.message || "Failed to update profile");
      },
    });
  };

  const onRemovePhoto = () => {
    if (previewUrl && previewUrl.startsWith("blob:"))
      URL.revokeObjectURL(previewUrl);
    setSelectedImageFile(undefined);
    setPreviewUrl(null);
    setRemoveProfilePicture(true);
  };

  // ── Style tokens ────────────────────────────────────────────────────────
  const deep = "var(--palette-deep)";
  const muted = "var(--palette-soft-purple)";
  const border = "var(--palette-border)";
  const cardBg = "var(--palette-card-bg)";
  const mutedBg = "var(--palette-card-muted-alt-bg)";
  const chipBg = "var(--palette-chip-bg)";
  const accent = "#8b64c8";

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (isSessionPending || isLoading) {
    return (
      <section
        className="mx-auto w-full max-w-2xl rounded-2xl border p-6 md:p-8"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        <div className="space-y-4">
          <div className="skeleton h-6 w-32 rounded-lg" />
          <div className="flex items-center gap-4">
            <div className="skeleton h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-40 rounded-lg" />
              <div className="skeleton h-4 w-28 rounded-lg" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="skeleton h-3.5 w-20 rounded" />
              <div className="skeleton h-11 w-full rounded-xl" />
            </div>
          ))}
          <div className="skeleton h-11 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section
        className="mx-auto w-full max-w-2xl rounded-2xl border p-8 text-center"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        <p className="text-sm font-medium" style={{ color: deep }}>
          Please log in to manage your profile
        </p>
      </section>
    );
  }

  if (isError) {
    return (
      <section
        className="mx-auto w-full max-w-2xl rounded-2xl border p-8 text-center"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        <p className="text-sm font-medium" style={{ color: deep }}>
          Failed to load profile
        </p>
        <p className="mt-1 text-xs text-red-500">{error.message}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      {/* Page header */}
      <div className="mb-6">
        <p
          className="mb-1 text-xs uppercase tracking-widest"
          style={{ color: muted }}
        >
          Account
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: deep }}>
          Profile
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: muted }}>
          Manage your account information
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        {/* ── Avatar section ── */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-5"
          style={{ borderColor: border, backgroundColor: mutedBg }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={fullName || "Profile"}
                  className="h-16 w-16 rounded-full object-cover"
                  style={{ border: `2px solid ${border}` }}
                />
              ) : (
                <div
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {initials}
                </div>
              )}

              {/* Upload trigger */}
              <label
                htmlFor="profile-image"
                className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent }}
                title="Change photo"
              >
                <Upload size={11} />
              </label>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onSelectImage}
              />
            </div>

            {/* Name + email */}
            <div className="min-w-0">
              <p
                className="truncate text-base font-semibold"
                style={{ color: deep }}
              >
                {fullName || "My Profile"}
              </p>
              <p className="mt-0.5 truncate text-sm" style={{ color: muted }}>
                {profileEmail || "No email available"}
              </p>
            </div>
          </div>

          {/* Remove photo */}
          {previewUrl && (
            <button
              type="button"
              onClick={onRemovePhoto}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-75"
              style={{
                borderColor: border,
                color: muted,
                backgroundColor: cardBg,
              }}
            >
              <X size={12} />
              Remove photo
            </button>
          )}
        </div>

        {/* ── Form fields ── */}
        <div className="space-y-5 px-6 py-6">
          {/* Full name */}
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
              style={{ color: muted }}
            >
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
              style={{
                borderColor: border,
                color: deep,
                backgroundColor: "var(--palette-input-bg)",
              }}
              placeholder="Enter your full name"
              maxLength={200}
            />
          </div>

          {/* Email — read only */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
              style={{ color: muted }}
            >
              Email
            </label>
            <div
              className="flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm"
              style={{
                borderColor: border,
                backgroundColor: mutedBg,
                color: muted,
              }}
            >
              <Mail size={14} style={{ color: muted, flexShrink: 0 }} />
              <input
                id="email"
                type="email"
                className="w-full bg-transparent outline-none"
                style={{ color: muted }}
                value={profileEmail}
                readOnly
              />
            </div>
            <p className="mt-1 text-xs" style={{ color: muted }}>
              Email cannot be changed
            </p>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phoneNumber"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
              style={{ color: muted }}
            >
              Phone number
            </label>
            <div
              className="flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm"
              style={{
                borderColor: border,
                color: deep,
                backgroundColor: "var(--palette-input-bg)",
              }}
            >
              <Phone size={14} style={{ color: muted, flexShrink: 0 }} />
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-transparent outline-none"
                style={{ color: deep }}
                placeholder="+251 911 000 000"
                maxLength={50}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
              style={{ color: muted }}
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition"
              style={{
                borderColor: border,
                color: deep,
                backgroundColor: "var(--palette-input-bg)",
              }}
              placeholder="Tell others a bit about yourself…"
            />
          </div>
        </div>

        {/* ── Footer / submit ── */}
        <div
          className="flex items-center justify-between border-t px-6 py-4"
          style={{ borderColor: border, backgroundColor: mutedBg }}
        >
          <p className="text-xs" style={{ color: muted }}>
            Changes are saved to your account
          </p>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {updateProfileMutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Account info card */}
      <div
        className="mt-4 rounded-2xl border px-5 py-4"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        <p
          className="mb-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: muted }}
        >
          Account info
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Role", value: profile?.role ?? "Tenant" },
            {
              label: "Member since",
              value: profile?.createdAt
                ? new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    year: "numeric",
                  }).format(new Date(profile.createdAt))
                : "—",
            },
            { label: "Status", value: "Active" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border px-4 py-3"
              style={{ borderColor: border, backgroundColor: chipBg }}
            >
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: muted }}
              >
                {item.label}
              </p>
              <p
                className="mt-1 text-sm font-semibold capitalize"
                style={{ color: deep }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UpdateProfileForm;
