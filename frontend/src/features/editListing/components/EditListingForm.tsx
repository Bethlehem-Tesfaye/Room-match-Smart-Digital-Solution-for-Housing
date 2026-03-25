import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  MapPin,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { palette } from "../../../theme/palette";
import { useAmenities } from "../../property/hooks/usePropertyHooks";
import type { Property } from "../../property/types/type";
import {
  useEditListingProperty,
  useUpdateEditListingProperty,
} from "../hooks/useEditListingHooks";
import type {
  EditListingDraft,
  EditListingSectionKey,
  EditListingValidationErrors,
} from "../types/types";

const sectionItems: Array<{
  key: EditListingSectionKey;
  label: string;
  icon: typeof Building2;
}> = [
  { key: "details", label: "Property Details", icon: Building2 },
  { key: "location", label: "Location", icon: MapPin },
  { key: "photos", label: "Photos", icon: ImageIcon },
  { key: "amenities", label: "Amenities & Final", icon: Sparkles },
];

const propertyTypeOptions = [
  "Apartment",
  "House",
  "Condo",
  "Studio",
  "SharedRoom",
] as const;

const currencyOptions = ["ETB", "USD", "EUR"];

const createDraftFromProperty = (property: Property): EditListingDraft => ({
  title: property.title ?? "",
  description: property.description ?? "",
  propertyType: property.propertyType,
  price: String(property.price ?? ""),
  currency: property.currency || "ETB",
  deposit: String(property.deposit ?? 0),
  numberOfBedrooms: String(property.numberOfBedrooms ?? 0),
  numberOfBathrooms: String(property.numberOfBathrooms ?? 0),
  floorNumber:
    property.floorNumber === null || property.floorNumber === undefined
      ? ""
      : String(property.floorNumber),
  totalFloors:
    property.totalFloors === null || property.totalFloors === undefined
      ? ""
      : String(property.totalFloors),
  areaSqFt:
    property.areaSqFt === null || property.areaSqFt === undefined
      ? ""
      : String(property.areaSqFt),
  address: property.address ?? "",
  city: property.city ?? "",
  images: (property.images ?? []).map((image) => ({
    id: image._id,
    imageUrl: image.imageUrl,
    previewUrl: image.imageUrl,
    isPrimary: image.isPrimary,
  })),
  amenityIds: property.amenityIds ?? [],
  availableFrom: property.availableFrom
    ? String(property.availableFrom).slice(0, 10)
    : "",
  isFurnished: !!property.isFurnished,
});

interface EditListingFormProps {
  propertyId: string;
}

function EditListingForm({ propertyId }: EditListingFormProps) {
  const navigate = useNavigate();
  const {
    data: property,
    isLoading,
    isError,
    error,
  } = useEditListingProperty(propertyId);
  const { data: amenities = [] } = useAmenities();
  const updateMutation = useUpdateEditListingProperty();

  const [activeSection, setActiveSection] =
    useState<EditListingSectionKey>("details");
  const [draft, setDraft] = useState<EditListingDraft | null>(null);
  const [attemptedSave, setAttemptedSave] = useState(false);

  useEffect(() => {
    if (!property) return;
    setDraft(createDraftFromProperty(property));
  }, [property]);

  useEffect(() => {
    return () => {
      if (!draft) return;
      draft.images.forEach((image) => {
        if (image.file && image.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    };
  }, [draft]);

  const errors = useMemo<EditListingValidationErrors>(() => {
    if (!draft) return {};

    const nextErrors: EditListingValidationErrors = {};

    const trimmedTitle = draft.title.trim();
    if (!trimmedTitle) {
      nextErrors.title = "Title is required.";
    } else if (trimmedTitle.length < 3) {
      nextErrors.title = "Title must be at least 3 characters.";
    }

    if (!draft.price || Number(draft.price) <= 0) {
      nextErrors.price = "Monthly rent is required.";
    }

    if (!draft.address.trim()) {
      nextErrors.address = "Address is required.";
    }

    if (!draft.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!draft.images.length) {
      nextErrors.images = "At least one property photo is required.";
    }

    return nextErrors;
  }, [draft]);

  const setField = <K extends keyof EditListingDraft>(
    key: K,
    value: EditListingDraft[K],
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const uploadPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setDraft((prev) => {
      if (!prev) return prev;

      const nextImages = [...prev.images];
      const remainingSlots = Math.max(0, 10 - nextImages.length);

      files.slice(0, remainingSlots).forEach((file, index) => {
        nextImages.push({
          id: `${file.name}-${Date.now()}-${index}`,
          file,
          previewUrl: URL.createObjectURL(file),
          isPrimary: false,
        });
      });

      if (!nextImages.some((image) => image.isPrimary) && nextImages[0]) {
        nextImages[0] = { ...nextImages[0], isPrimary: true };
      }

      return {
        ...prev,
        images: nextImages,
      };
    });

    event.target.value = "";
  };

  const setPrimaryImage = (id: string) => {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        images: prev.images.map((image) => ({
          ...image,
          isPrimary: image.id === id,
        })),
      };
    });
  };

  const removeImage = (id: string) => {
    setDraft((prev) => {
      if (!prev) return prev;

      const imageToRemove = prev.images.find((image) => image.id === id);
      if (imageToRemove?.file && imageToRemove.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      const nextImages = prev.images.filter((image) => image.id !== id);

      if (!nextImages.some((image) => image.isPrimary) && nextImages[0]) {
        nextImages[0] = { ...nextImages[0], isPrimary: true };
      }

      return {
        ...prev,
        images: nextImages,
      };
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const exists = prev.amenityIds.includes(amenityId);

      return {
        ...prev,
        amenityIds: exists
          ? prev.amenityIds.filter((id) => id !== amenityId)
          : [...prev.amenityIds, amenityId],
      };
    });
  };

  const submitUpdate = async () => {
    if (!draft) return;

    setAttemptedSave(true);

    if (Object.keys(errors).length > 0) {
      if (errors.title || errors.price) setActiveSection("details");
      else if (errors.address || errors.city) setActiveSection("location");
      else if (errors.images) setActiveSection("photos");
      return;
    }

    const payload = new FormData();

    payload.append("title", draft.title.trim());
    payload.append("description", draft.description.trim());
    payload.append("propertyType", draft.propertyType);
    payload.append("price", String(Number(draft.price || 0)));
    payload.append("currency", draft.currency);
    payload.append("deposit", String(Number(draft.deposit || 0)));
    payload.append("address", draft.address.trim());
    payload.append("city", draft.city.trim());
    payload.append(
      "numberOfBedrooms",
      String(Number(draft.numberOfBedrooms || 0)),
    );
    payload.append(
      "numberOfBathrooms",
      String(Number(draft.numberOfBathrooms || 0)),
    );
    payload.append(
      "floorNumber",
      draft.floorNumber ? String(Number(draft.floorNumber)) : "",
    );
    payload.append(
      "totalFloors",
      draft.totalFloors ? String(Number(draft.totalFloors)) : "",
    );
    payload.append(
      "areaSqFt",
      draft.areaSqFt ? String(Number(draft.areaSqFt)) : "",
    );
    payload.append("availableFrom", draft.availableFrom || "");
    payload.append("isFurnished", String(draft.isFurnished));
    payload.append("amenityIds", JSON.stringify(draft.amenityIds));

    const existingImageUrls = draft.images
      .filter((image) => !image.file && image.imageUrl)
      .map((image) => image.imageUrl as string);

    payload.append("existingImageUrls", JSON.stringify(existingImageUrls));

    draft.images
      .filter((image) => image.file)
      .forEach((image) => {
        payload.append("images", image.file as File);
      });

    const primaryImageIndex = draft.images.findIndex(
      (image) => image.isPrimary,
    );
    payload.append(
      "primaryImageIndex",
      String(primaryImageIndex >= 0 ? primaryImageIndex : 0),
    );

    try {
      await updateMutation.mutateAsync({ propertyId, payload });
      toast.success("Listing updated successfully.");
      // navigate("/dashboard/my-properties");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to update listing";
      toast.error(message);
    }
  };

  if (isLoading || !draft) {
    return (
      <section className="mx-auto max-w-5xl py-10 pt-24 ">
        <div className="mb-6 space-y-2">
          <div className="skeleton h-10 w-64 rounded" />
          <div className="skeleton h-6 w-96 rounded" />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <div className="skeleton h-10 w-40 rounded-lg" />
          <div className="skeleton h-10 w-32 rounded-lg" />
          <div className="skeleton h-10 w-28 rounded-lg" />
          <div className="skeleton h-10 w-44 rounded-lg" />
        </div>

        <div
          className="rounded-2xl border p-6 md:p-8 shadow-sm"
          style={{ borderColor: palette.border }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <div className="skeleton h-4 w-36 rounded" />
              <div className="skeleton h-11 rounded-lg" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="skeleton h-4 w-28 rounded" />
              <div className="skeleton h-28 rounded-lg" />
            </div>

            <div className="space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-11 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-28 rounded" />
              <div className="skeleton h-11 rounded-lg" />
            </div>

            <div className="space-y-2">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-11 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-11 rounded-lg" />
            </div>

            <div className="space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-11 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-11 rounded-lg" />
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="skeleton h-36 rounded-xl" />
            <div className="skeleton h-36 rounded-xl" />
            <div className="skeleton h-36 rounded-xl" />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="skeleton h-10 w-28 rounded-lg" />
            <div className="skeleton h-10 w-36 rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-2xl border p-6 text-sm"
        style={{ borderColor: palette.border, color: palette.purple }}
      >
        {error.message || "Failed to load listing"}
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-24">
      <Link
        to="/dashboard/my-properties"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: palette.deep }}
      >
        <ArrowLeft size={16} />
        Back to Listings
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: palette.deep }}>
          Edit Listing
        </h1>
        <p className="mt-2 text-lg" style={{ color: palette.softPurple }}>
          Jump to any section and update your property details quickly.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {sectionItems.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: isActive ? palette.purple : palette.border,
                color: isActive ? palette.purple : palette.deep,
                backgroundColor: isActive ? palette.chipBg : palette.cardBg,
              }}
            >
              <Icon size={15} />
              {section.label}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-2xl border p-6 md:p-8 shadow-sm"
        style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}
      >
        {activeSection === "details" ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Listing Title *
                </label>
                <input
                  value={draft.title}
                  onChange={(event) => setField("title", event.target.value)}
                  className="w-full rounded-lg border px-4 py-2 outline-none"
                  style={{
                    borderColor:
                      attemptedSave && errors.title
                        ? "rgb(220 38 38)"
                        : palette.border,
                    backgroundColor: palette.inputBg,
                    color: palette.deep,
                  }}
                />
                {attemptedSave && errors.title ? (
                  <p className="text-sm text-red-600">{errors.title}</p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Description
                </label>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  className="h-32 w-full rounded-lg border px-4 py-3 outline-none"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.inputBg,
                    color: palette.deep,
                  }}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Property Type
                </label>
                <div className="relative">
                  <select
                    value={draft.propertyType}
                    onChange={(event) =>
                      setField(
                        "propertyType",
                        event.target.value as EditListingDraft["propertyType"],
                      )
                    }
                    className="w-full appearance-none rounded-lg border px-4 py-2 pr-10 outline-none"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.inputBg,
                      color: palette.deep,
                    }}
                  >
                    {propertyTypeOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                    size={16}
                    style={{ color: palette.softPurple }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Monthly Rent *
                </label>
                <input
                  value={draft.price}
                  onChange={(event) =>
                    setField("price", event.target.value.replace(/[^\d]/g, ""))
                  }
                  className="w-full rounded-lg border px-4 py-2 outline-none"
                  style={{
                    borderColor:
                      attemptedSave && errors.price
                        ? "rgb(220 38 38)"
                        : palette.border,
                    backgroundColor: palette.inputBg,
                    color: palette.deep,
                  }}
                />
                {attemptedSave && errors.price ? (
                  <p className="text-sm text-red-600">{errors.price}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Currency
                </label>
                <select
                  value={draft.currency}
                  onChange={(event) => setField("currency", event.target.value)}
                  className="w-full rounded-lg border px-4 py-2 outline-none"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.inputBg,
                    color: palette.deep,
                  }}
                >
                  {currencyOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Deposit
                </label>
                <input
                  value={draft.deposit}
                  onChange={(event) =>
                    setField(
                      "deposit",
                      event.target.value.replace(/[^\d]/g, ""),
                    )
                  }
                  className="w-full rounded-lg border px-4 py-2 outline-none"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.inputBg,
                    color: palette.deep,
                  }}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Bedrooms
                </label>
                <input
                  value={draft.numberOfBedrooms}
                  onChange={(event) =>
                    setField(
                      "numberOfBedrooms",
                      event.target.value.replace(/[^\d]/g, ""),
                    )
                  }
                  className="w-full rounded-lg border px-4 py-2 outline-none"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.inputBg,
                    color: palette.deep,
                  }}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Bathrooms
                </label>
                <input
                  value={draft.numberOfBathrooms}
                  onChange={(event) =>
                    setField(
                      "numberOfBathrooms",
                      event.target.value.replace(/[^\d]/g, ""),
                    )
                  }
                  className="w-full rounded-lg border px-4 py-2 outline-none"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.inputBg,
                    color: palette.deep,
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {activeSection === "location" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label
                className="text-sm font-semibold"
                style={{ color: palette.deep }}
              >
                Street Address *
              </label>
              <input
                value={draft.address}
                onChange={(event) => setField("address", event.target.value)}
                className="w-full rounded-lg border px-4 py-2 outline-none"
                style={{
                  borderColor:
                    attemptedSave && errors.address
                      ? "rgb(220 38 38)"
                      : palette.border,
                  backgroundColor: palette.inputBg,
                  color: palette.deep,
                }}
              />
              {attemptedSave && errors.address ? (
                <p className="text-sm text-red-600">{errors.address}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold"
                style={{ color: palette.deep }}
              >
                City *
              </label>
              <input
                value={draft.city}
                onChange={(event) => setField("city", event.target.value)}
                className="w-full rounded-lg border px-4 py-2 outline-none"
                style={{
                  borderColor:
                    attemptedSave && errors.city
                      ? "rgb(220 38 38)"
                      : palette.border,
                  backgroundColor: palette.inputBg,
                  color: palette.deep,
                }}
              />
              {attemptedSave && errors.city ? (
                <p className="text-sm text-red-600">{errors.city}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold"
                style={{ color: palette.deep }}
              >
                Area (sq ft)
              </label>
              <input
                value={draft.areaSqFt}
                onChange={(event) =>
                  setField("areaSqFt", event.target.value.replace(/[^\d]/g, ""))
                }
                className="w-full rounded-lg border px-4 py-2 outline-none"
                style={{
                  borderColor: palette.border,
                  backgroundColor: palette.inputBg,
                  color: palette.deep,
                }}
              />
            </div>
          </div>
        ) : null}

        {activeSection === "photos" ? (
          <div className="space-y-4">
            <label
              htmlFor="edit-listing-upload"
              className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed"
              style={{
                borderColor:
                  attemptedSave && errors.images
                    ? "rgb(220 38 38)"
                    : palette.border,
                backgroundColor: palette.cardBg,
              }}
            >
              <Upload size={38} style={{ color: palette.softPurple }} />
              <p className="mt-3 text-lg" style={{ color: palette.deep }}>
                Upload new photos or keep existing ones
              </p>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Up to 10 images, JPG/PNG/WEBP
              </p>
            </label>
            {attemptedSave && errors.images ? (
              <p className="text-sm text-red-600">{errors.images}</p>
            ) : null}

            <input
              id="edit-listing-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={uploadPhotos}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {draft.images.map((image) => (
                <div
                  key={image.id}
                  className="relative overflow-hidden rounded-xl"
                >
                  <img
                    src={image.previewUrl}
                    alt="Property preview"
                    className="h-40 w-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 flex gap-2">
                    {image.isPrimary ? (
                      <span
                        className="rounded-md px-2 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: palette.purple }}
                      >
                        Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(image.id)}
                        className="rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Set as cover
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeSection === "amenities" ? (
          <div className="space-y-5">
            <div>
              <p
                className="mb-2 text-sm font-semibold"
                style={{ color: palette.deep }}
              >
                Amenities
              </p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => {
                  const selected = draft.amenityIds.includes(amenity._id);

                  return (
                    <button
                      key={amenity._id}
                      type="button"
                      className="rounded-md border px-3 py-2 text-sm font-semibold"
                      style={{
                        borderColor: selected ? palette.purple : palette.border,
                        backgroundColor: selected
                          ? palette.chipBg
                          : palette.cardBg,
                        color: selected ? palette.purple : palette.deep,
                      }}
                      onClick={() => toggleAmenity(amenity._id)}
                    >
                      {amenity.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Available From
                </label>
                <input
                  type="date"
                  value={draft.availableFrom}
                  onChange={(event) =>
                    setField("availableFrom", event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-2 outline-none"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.inputBg,
                    color: palette.deep,
                  }}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Furnished
                </label>
                <button
                  type="button"
                  onClick={() => setField("isFurnished", !draft.isFurnished)}
                  className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors"
                  style={{
                    backgroundColor: draft.isFurnished
                      ? palette.purple
                      : palette.border,
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: draft.isFurnished
                        ? "translateX(30px)"
                        : "translateX(4px)",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-properties")}
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: palette.border, color: palette.deep }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              void submitUpdate();
            }}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: palette.purple, color: palette.pageBg }}
          >
            <CheckCircle2 size={16} />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default EditListingForm;
