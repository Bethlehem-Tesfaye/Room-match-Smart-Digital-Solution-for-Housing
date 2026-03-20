import { Mail, Phone, Upload } from "lucide-react";
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

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
};

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
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setFullName(profile.fullName ?? "");
    setPhoneNumber(profile.phoneNumber ?? "");
    setPreviewUrl(profile.profilePictureUrl ?? null);
  }, [profile]);

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

  const onSelectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      const encoded = await fileToBase64(selectedFile);
      setImageBase64(encoded);
      setPreviewUrl(encoded);
      setRemoveProfilePicture(false);
    } catch (fileError) {
      const message =
        fileError instanceof Error ? fileError.message : "Image upload failed";
      toast.error(message);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    updateProfileMutation.mutate(
      {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || "",
        ...(imageBase64 ? { imageBase64 } : {}),
        ...(removeProfilePicture ? { removeProfilePicture: true } : {}),
      },
      {
        onSuccess: (response) => {
          toast.success(response.message || "Profile updated successfully");
          setImageBase64(undefined);
        },
        onError: (mutationError) => {
          toast.error(mutationError.message || "Failed to update profile");
        },
      },
    );
  };

  const onRemovePhoto = () => {
    setImageBase64(undefined);
    setPreviewUrl(null);
    setRemoveProfilePicture(true);
  };

  if (isSessionPending || isLoading) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="skeleton h-20 rounded" />
          <div className="skeleton h-12 rounded" />
          <div className="skeleton h-12 rounded" />
          <div className="skeleton h-28 rounded" />
          <div className="skeleton h-12 rounded" />
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 text-center shadow-sm md:p-8">
        <h2 className="text-xl font-bold" style={{ color: palette.deep }}>
          Please log in to manage your profile
        </h2>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 text-center shadow-sm md:p-8">
        <h2 className="text-xl font-bold" style={{ color: palette.deep }}>
          Failed to load profile
        </h2>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl">
      <h1 className="text-3xl font-bold" style={{ color: palette.deep }}>
        Profile
      </h1>
      <p className="mt-1 text-lg" style={{ color: palette.purple }}>
        Manage your account information
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl border bg-white p-6 shadow-sm md:p-8"
        style={{ borderColor: palette.lightPurple }}
      >
        <div
          className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between"
          style={{ borderColor: palette.lightPurple }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={fullName || "Profile"}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div
                  className="inline-flex h-24 w-24 items-center justify-center rounded-full text-4xl font-semibold"
                  style={{ backgroundColor: palette.purple, color: "#FFFFFF" }}
                >
                  {initials}
                </div>
              )}
              <label
                htmlFor="profile-image"
                className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
                style={{ backgroundColor: palette.purple, color: "#FFFFFF" }}
              >
                <Upload size={16} />
              </label>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onSelectImage}
              />
            </div>

            <div>
              <h2
                className="text-3xl font-bold"
                style={{ color: palette.deep }}
              >
                {fullName || "My Profile"}
              </h2>
              <p className="text-xl" style={{ color: palette.purple }}>
                {profileEmail || "No email available"}
              </p>
            </div>
          </div>

          {previewUrl ? (
            <button
              type="button"
              onClick={onRemovePhoto}
              className="self-start cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold md:self-center"
              style={{
                borderColor: palette.lightPurple,
                color: palette.purple,
              }}
            >
              Remove Photo
            </button>
          ) : null}
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-lg font-semibold"
              style={{ color: palette.deep }}
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-base outline-none transition"
              style={{ borderColor: palette.lightPurple, color: palette.deep }}
              placeholder="Enter your full name"
              maxLength={200}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-lg font-semibold"
              style={{ color: palette.deep }}
            >
              Email
            </label>
            <div
              className="flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-base"
              style={{
                borderColor: palette.lightPurple,
                color: palette.purple,
              }}
            >
              <Mail size={18} />
              <input
                id="email"
                type="email"
                className="w-full bg-transparent outline-none"
                value={profileEmail}
                readOnly
              />
            </div>
            <p className="mt-1 text-sm" style={{ color: palette.purple }}>
              Email cannot be changed
            </p>
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="mb-2 block text-lg font-semibold"
              style={{ color: palette.deep }}
            >
              Phone Number
            </label>
            <div
              className="flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-base"
              style={{ borderColor: palette.lightPurple, color: palette.deep }}
            >
              <Phone size={18} style={{ color: palette.softPurple }} />
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="w-full bg-transparent outline-none"
                placeholder="+1 (555) 000-0000"
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="bio"
              className="mb-2 block text-lg font-semibold"
              style={{ color: palette.deep }}
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="h-24 w-full rounded-lg border px-4 py-3 text-base outline-none transition"
              style={{ borderColor: palette.lightPurple, color: palette.deep }}
              placeholder="Tell others about yourself..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="mt-6 w-full cursor-pointer rounded-lg py-3 text-center text-lg font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            background: `linear-gradient(90deg, ${palette.softPurple} 0%, ${palette.purple} 100%)`,
          }}
        >
          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </section>
  );
}

export default UpdateProfileForm;
