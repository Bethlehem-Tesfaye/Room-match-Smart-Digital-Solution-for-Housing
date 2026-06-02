import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  MapPin,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../../lib/axios";
import { useMyProfile } from "../../profile/hooks/useProfileHooks";
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
import type { BankInfoDraft, BankOption } from "../../addListing/types/types";
import BankInformationStep from "../../addListing/components/BankInformationStep";
import {
  currencyOptions,
  initialBankInfoDraft,
  propertyTypeOptions,
} from "../../addListing/components/addListingForm.constants";

const sectionItems: Array<{
  key: EditListingSectionKey;
  label: string;
  icon: typeof Building2;
}> = [
  { key: "details", label: "Property details", icon: Building2 },
  { key: "location", label: "Location", icon: MapPin },
  { key: "photos", label: "Photos", icon: ImageIcon },
  { key: "bank", label: "Bank information", icon: Sparkles },
  { key: "amenities", label: "Amenities & final", icon: Sparkles },
];

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
  leasePeriod: String(property.leasePeriod ?? ""),
  initialPayment: String(property.initialPayment ?? ""),
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
  allowRoommates: !!property.allowRoommates,
});

// ── Shared field wrapper ──────────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
  span2,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${span2 ? "md:col-span-2" : ""}`}>
      <label
        className="font-mono text-[10px] uppercase tracking-widest"
        style={{ color: "var(--palette-soft-purple)" }}
      >
        {label}
        {required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Shared text input ─────────────────────────────────────────────────────────
function TextInput({
  value,
  onChange,
  hasError,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors"
      style={{
        borderColor: hasError ? "#dc2626" : "var(--palette-border)",
        backgroundColor: "var(--palette-input-bg)",
        color: "var(--palette-deep)",
      }}
    />
  );
}

interface EditListingFormProps {
  propertyId: string;
}

function EditListingForm({ propertyId }: EditListingFormProps) {
  const navigate = useNavigate();
  const profileQuery = useMyProfile(true);
  const {
    data: property,
    isLoading,
    isError,
    error,
  } = useEditListingProperty(propertyId);
  const { data: amenities = [] } = useAmenities();
  const { data: banks = [], isLoading: isLoadingBanks } = useQuery<
    BankOption[],
    Error
  >({
    queryKey: ["banks"],
    queryFn: async () => {
      const response = await api.get<{ banks: BankOption[] }>("/api/banks");
      return response.data.banks ?? [];
    },
  });
  const updateMutation = useUpdateEditListingProperty();
  const validAmenityIdSet = useMemo(
    () => new Set(amenities.map((a) => a._id)),
    [amenities],
  );
  const isRentedProperty = property?.status === "Rented";

  const [activeSection, setActiveSection] =
    useState<EditListingSectionKey>("details");
  const [draft, setDraft] = useState<EditListingDraft | null>(null);
  const [bankInfo, setBankInfo] = useState<BankInfoDraft>(initialBankInfoDraft);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBankName = useMemo(() => {
    return (
      banks.find((b) => b.id === bankInfo.bankCode)?.name ??
      bankInfo.bankName ??
      ""
    );
  }, [bankInfo.bankCode, bankInfo.bankName, banks]);

  useEffect(() => {
    if (!property) return;
    setDraft(createDraftFromProperty(property));
  }, [property]);

  useEffect(() => {
    const profileBankInfo = profileQuery.data?.bankInfo;
    if (!profileBankInfo) return;
    setBankInfo({
      accountName: profileBankInfo.accountName ?? "",
      accountNumber: profileBankInfo.accountNumber ?? "",
      bankCode: profileBankInfo.bankCode ?? "",
      bankName: profileBankInfo.bankName ?? "",
      chapaSubaccountId: profileBankInfo.chapaSubaccountId ?? "",
    });
  }, [profileQuery.data]);

  useEffect(() => {
    if (!draft) return;
    const filtered = draft.amenityIds.filter((id) => validAmenityIdSet.has(id));
    if (filtered.length !== draft.amenityIds.length) {
      setDraft((prev) => (prev ? { ...prev, amenityIds: filtered } : prev));
    }
  }, [draft, validAmenityIdSet]);

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
    if (!trimmedTitle) nextErrors.title = "Title is required.";
    else if (trimmedTitle.length < 3)
      nextErrors.title = "Title must be at least 3 characters.";
    if (!draft.price || Number(draft.price) <= 0)
      nextErrors.price = "Monthly rent is required.";
    if (!draft.leasePeriod || Number(draft.leasePeriod) <= 0)
      nextErrors.leasePeriod = "Lease period is required.";
    if (draft.initialPayment === "" || Number(draft.initialPayment) < 0)
      nextErrors.initialPayment = "Initial payment is required.";
    if (!draft.address.trim()) nextErrors.address = "Address is required.";
    if (!draft.city.trim()) nextErrors.city = "City is required.";
    return nextErrors;
  }, [draft]);

  const bankValidationErrors = useMemo(() => {
    const nextErrors: {
      accountName?: string;
      accountNumber?: string;
      bankCode?: string;
      bankName?: string;
    } = {};
    if (!bankInfo.accountName.trim())
      nextErrors.accountName = "Account name is required.";
    if (!bankInfo.accountNumber.trim())
      nextErrors.accountNumber = "Account number is required.";
    if (!bankInfo.bankCode.trim())
      nextErrors.bankCode = "Bank name is required.";
    return nextErrors;
  }, [bankInfo]);

  const setField = <K extends keyof EditListingDraft>(
    key: K,
    value: EditListingDraft[K],
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const setBankField = <K extends keyof BankInfoDraft>(
    key: K,
    value: BankInfoDraft[K],
  ) => {
    setBankInfo((prev) => ({ ...prev, [key]: value }));
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
      if (!nextImages.some((i) => i.isPrimary) && nextImages[0])
        nextImages[0] = { ...nextImages[0], isPrimary: true };
      return { ...prev, images: nextImages };
    });
    event.target.value = "";
  };

  const setPrimaryImage = (id: string) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            images: prev.images.map((i) => ({ ...i, isPrimary: i.id === id })),
          }
        : prev,
    );
  };

  const removeImage = (id: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const toRemove = prev.images.find((i) => i.id === id);
      if (toRemove?.file && toRemove.previewUrl.startsWith("blob:"))
        URL.revokeObjectURL(toRemove.previewUrl);
      const nextImages = prev.images.filter((i) => i.id !== id);
      if (!nextImages.some((i) => i.isPrimary) && nextImages[0])
        nextImages[0] = { ...nextImages[0], isPrimary: true };
      return { ...prev, images: nextImages };
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
    if (isRentedProperty) {
      toast.error("Rented properties cannot be edited.");
      return;
    }
    setAttemptedSave(true);
    if (Object.keys(errors).length > 0) {
      if (
        errors.title ||
        errors.price ||
        errors.leasePeriod ||
        errors.initialPayment
      )
        setActiveSection("details");
      else if (errors.address || errors.city) setActiveSection("location");
      return;
    }
    if (
      bankValidationErrors.accountName ||
      bankValidationErrors.accountNumber ||
      bankValidationErrors.bankCode
    ) {
      setActiveSection("bank");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/profile/setup-bank", {
        accountName: bankInfo.accountName.trim(),
        accountNumber: bankInfo.accountNumber.trim(),
        bankCode: bankInfo.bankCode.trim(),
        bankName: selectedBankName.trim(),
      });
    } catch (bankError) {
      toast.error(
        bankError instanceof Error
          ? bankError.message
          : "Failed to save bank information",
      );
      setActiveSection("bank");
      return;
    }
    const payload = new FormData();
    payload.append("title", draft.title.trim());
    payload.append("description", draft.description.trim());
    payload.append("propertyType", draft.propertyType);
    payload.append("price", String(Number(draft.price || 0)));
    payload.append("currency", draft.currency);
    payload.append("deposit", String(Number(draft.deposit || 0)));
    payload.append("leasePeriod", String(Number(draft.leasePeriod || 0)));
    payload.append("initialPayment", String(Number(draft.initialPayment || 0)));
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
    payload.append("allowRoommates", String(draft.allowRoommates));
    const sanitizedAmenityIds = draft.amenityIds.filter((id) =>
      validAmenityIdSet.has(id),
    );
    payload.append("amenityIds", JSON.stringify(sanitizedAmenityIds));
    const existingImageUrls = draft.images
      .filter((i) => !i.file && i.imageUrl)
      .map((i) => i.imageUrl as string);
    payload.append("existingImageUrls", JSON.stringify(existingImageUrls));
    draft.images
      .filter((i) => i.file)
      .forEach((i) => payload.append("images", i.file as File));
    const primaryImageIndex = draft.images.findIndex((i) => i.isPrimary);
    payload.append(
      "primaryImageIndex",
      String(primaryImageIndex >= 0 ? primaryImageIndex : 0),
    );
    try {
      await updateMutation.mutateAsync({ propertyId, payload });
      toast.success("Listing updated successfully.");
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update listing",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading || !draft) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10 pt-20 space-y-6">
        <div className="space-y-2">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-8 w-56 rounded-xl" />
          <div className="skeleton h-4 w-80 rounded" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[140, 110, 90, 150, 160].map((w, i) => (
            <div
              key={i}
              className="skeleton h-9 rounded-full"
              style={{ width: w }}
            />
          ))}
        </div>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "var(--palette-border)" }}
        >
          <div className="skeleton h-12 w-full" />
          <div className="p-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`space-y-2 ${i < 2 ? "md:col-span-2" : ""}`}
              >
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-10 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12 pt-20">
        <div
          className="rounded-2xl border px-6 py-10 text-center text-sm"
          style={{
            borderColor: "var(--palette-border)",
            backgroundColor: "var(--palette-card-bg)",
            color: "var(--palette-soft-purple)",
          }}
        >
          {error.message || "Failed to load listing."}
        </div>
      </section>
    );
  }

  const isSaving = isSubmitting || updateMutation.isPending;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 pt-20 space-y-6">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <Link
          to="/dashboard/my-properties"
          className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-opacity hover:opacity-70"
          style={{
            borderColor: "var(--palette-border)",
            backgroundColor: "var(--palette-card-bg)",
            color: "var(--palette-deep)",
          }}
          aria-label="Back to listings"
        >
          <ArrowLeft size={14} />
        </Link>
        <div>
          <p
            className="mb-1 font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--palette-soft-purple)" }}
          >
            Owner · My properties
          </p>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--palette-deep)" }}
          >
            Edit listing
          </h1>
          <p
            className="mt-0.5 text-sm"
            style={{ color: "var(--palette-soft-purple)" }}
          >
            Jump to any section and update your property details.
          </p>
        </div>
      </div>

      {/* Rented warning */}
      {isRentedProperty && (
        <div
          className="rounded-xl border px-4 py-3 text-sm font-medium"
          style={{
            borderColor: "#fecaca",
            backgroundColor: "#fff1f2",
            color: "#dc2626",
          }}
        >
          This property is currently rented — editing is locked.
        </div>
      )}

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {sectionItems.map(({ key, label, icon: Icon }) => {
          const isActive = activeSection === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive
                  ? "#8b64c8"
                  : "var(--palette-card-bg)",
                color: isActive ? "#ffffff" : "var(--palette-deep)",
                border: `1px solid ${isActive ? "#8b64c8" : "var(--palette-border)"}`,
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Section card */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: "var(--palette-border)",
          backgroundColor: "var(--palette-card-bg)",
          boxShadow: "0 1px 4px rgba(46,31,74,0.06)",
        }}
      >
        {/* Header strip */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{
            backgroundColor: "var(--palette-card-muted-alt-bg)",
            borderColor: "var(--palette-border)",
          }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--palette-soft-purple)" }}
          >
            {sectionItems.find((s) => s.key === activeSection)?.label}
          </span>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6">
          {/* ── Details ── */}
          {activeSection === "details" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Listing title"
                required
                error={attemptedSave ? errors.title : undefined}
                span2
              >
                <TextInput
                  value={draft.title}
                  onChange={(v) => setField("title", v)}
                  hasError={!!(attemptedSave && errors.title)}
                />
              </Field>

              <Field label="Description" span2>
                <textarea
                  value={draft.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className="h-28 w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none"
                  style={{
                    borderColor: "var(--palette-border)",
                    backgroundColor: "var(--palette-input-bg)",
                    color: "var(--palette-deep)",
                  }}
                />
              </Field>

              {/* Roommates toggle */}
              <div
                className="md:col-span-2 rounded-xl border px-4 py-3"
                style={{
                  borderColor: "var(--palette-border)",
                  backgroundColor: "var(--palette-section-bg)",
                }}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.allowRoommates}
                    onChange={(e) =>
                      setField("allowRoommates", e.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded"
                  />
                  <span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--palette-deep)" }}
                    >
                      Allow roommates
                    </span>
                    <span
                      className="mt-0.5 block text-xs"
                      style={{ color: "var(--palette-soft-purple)" }}
                    >
                      Tenants renting this property can use the roommate
                      matching feature.
                    </span>
                  </span>
                </label>
              </div>

              <Field label="Property type">
                <div className="relative">
                  <select
                    value={draft.propertyType}
                    onChange={(e) =>
                      setField(
                        "propertyType",
                        e.target.value as EditListingDraft["propertyType"],
                      )
                    }
                    className="w-full appearance-none rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none"
                    style={{
                      borderColor: "var(--palette-border)",
                      backgroundColor: "var(--palette-input-bg)",
                      color: "var(--palette-deep)",
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
                    size={14}
                    style={{ color: "var(--palette-soft-purple)" }}
                  />
                </div>
              </Field>

              <Field
                label="Monthly rent"
                required
                error={attemptedSave ? errors.price : undefined}
              >
                <TextInput
                  value={draft.price}
                  onChange={(v) => setField("price", v.replace(/[^\d]/g, ""))}
                  hasError={!!(attemptedSave && errors.price)}
                />
              </Field>

              <Field label="Currency">
                <select
                  value={draft.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                  style={{
                    borderColor: "var(--palette-border)",
                    backgroundColor: "var(--palette-input-bg)",
                    color: "var(--palette-deep)",
                  }}
                >
                  {currencyOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Deposit">
                <TextInput
                  value={draft.deposit}
                  onChange={(v) => setField("deposit", v.replace(/[^\d]/g, ""))}
                />
              </Field>

              <Field label="Floor number">
                <TextInput
                  value={draft.floorNumber}
                  onChange={(v) =>
                    setField("floorNumber", v.replace(/[^\d]/g, ""))
                  }
                />
              </Field>

              <Field label="Total floors">
                <TextInput
                  value={draft.totalFloors}
                  onChange={(v) =>
                    setField("totalFloors", v.replace(/[^\d]/g, ""))
                  }
                />
              </Field>

              <Field label="Area (sq ft)">
                <TextInput
                  value={draft.areaSqFt}
                  onChange={(v) =>
                    setField("areaSqFt", v.replace(/[^\d]/g, ""))
                  }
                />
              </Field>

              <Field
                label="Lease period (months)"
                required
                error={attemptedSave ? errors.leasePeriod : undefined}
              >
                <TextInput
                  value={draft.leasePeriod}
                  onChange={(v) =>
                    setField("leasePeriod", v.replace(/[^\d]/g, ""))
                  }
                  hasError={!!(attemptedSave && errors.leasePeriod)}
                />
              </Field>

              <Field
                label="Initial payment"
                required
                error={attemptedSave ? errors.initialPayment : undefined}
              >
                <TextInput
                  value={draft.initialPayment}
                  onChange={(v) =>
                    setField("initialPayment", v.replace(/[^\d]/g, ""))
                  }
                  hasError={!!(attemptedSave && errors.initialPayment)}
                />
              </Field>

              <Field label="Bedrooms">
                <TextInput
                  value={draft.numberOfBedrooms}
                  onChange={(v) =>
                    setField("numberOfBedrooms", v.replace(/[^\d]/g, ""))
                  }
                />
              </Field>

              <Field label="Bathrooms">
                <TextInput
                  value={draft.numberOfBathrooms}
                  onChange={(v) =>
                    setField("numberOfBathrooms", v.replace(/[^\d]/g, ""))
                  }
                />
              </Field>
            </div>
          )}

          {/* ── Location ── */}
          {activeSection === "location" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Street address"
                required
                error={attemptedSave ? errors.address : undefined}
                span2
              >
                <TextInput
                  value={draft.address}
                  onChange={(v) => setField("address", v)}
                  hasError={!!(attemptedSave && errors.address)}
                />
              </Field>
              <Field
                label="City"
                required
                error={attemptedSave ? errors.city : undefined}
              >
                <TextInput
                  value={draft.city}
                  onChange={(v) => setField("city", v)}
                  hasError={!!(attemptedSave && errors.city)}
                />
              </Field>
            </div>
          )}

          {/* ── Photos ── */}
          {activeSection === "photos" && (
            <div className="space-y-4">
              <label
                htmlFor="edit-listing-upload"
                className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors"
                style={{
                  borderColor: "var(--palette-border)",
                  backgroundColor: "var(--palette-section-bg)",
                }}
              >
                <Upload
                  size={28}
                  style={{ color: "var(--palette-soft-purple)" }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--palette-deep)" }}
                >
                  Upload new photos or keep existing ones
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--palette-soft-purple)" }}
                >
                  Up to 10 images · JPG / PNG / WEBP
                </p>
              </label>
              <input
                id="edit-listing-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={uploadPhotos}
              />

              {draft.images.length > 0 && (
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
                      <div className="absolute bottom-2 left-2">
                        {image.isPrimary ? (
                          <span
                            className="rounded-md px-2 py-1 text-xs font-semibold text-white"
                            style={{ backgroundColor: "#8b64c8" }}
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
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Bank ── */}
          {activeSection === "bank" && (
            <BankInformationStep
              bankInfo={bankInfo}
              banks={banks}
              hasExistingBankAccount={Boolean(bankInfo.chapaSubaccountId)}
              isLoadingBanks={isLoadingBanks}
              errors={{
                accountName: attemptedSave
                  ? bankValidationErrors.accountName
                  : undefined,
                accountNumber: attemptedSave
                  ? bankValidationErrors.accountNumber
                  : undefined,
                bankCode: attemptedSave
                  ? bankValidationErrors.bankCode
                  : undefined,
                bankName: attemptedSave
                  ? bankValidationErrors.bankName
                  : undefined,
              }}
              onChangeField={setBankField}
            />
          )}

          {/* ── Amenities ── */}
          {activeSection === "amenities" && (
            <div className="space-y-6">
              <div>
                <p
                  className="mb-3 font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--palette-soft-purple)" }}
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
                        onClick={() => toggleAmenity(amenity._id)}
                        className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
                        style={{
                          borderColor: selected
                            ? "#8b64c8"
                            : "var(--palette-border)",
                          backgroundColor: selected
                            ? "#f0ebff"
                            : "var(--palette-card-bg)",
                          color: selected ? "#8b64c8" : "var(--palette-deep)",
                        }}
                      >
                        {amenity.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Available from">
                  <input
                    type="date"
                    value={draft.availableFrom}
                    onChange={(e) => setField("availableFrom", e.target.value)}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                    style={{
                      borderColor: "var(--palette-border)",
                      backgroundColor: "var(--palette-input-bg)",
                      color: "var(--palette-deep)",
                    }}
                  />
                </Field>

                <Field label="Furnished">
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setField("isFurnished", !draft.isFurnished)
                      }
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{
                        backgroundColor: draft.isFurnished
                          ? "#8b64c8"
                          : "var(--palette-border)",
                      }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        style={{
                          transform: draft.isFurnished
                            ? "translateX(26px)"
                            : "translateX(4px)",
                        }}
                      />
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* Footer strip */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"
          style={{ borderColor: "var(--palette-border)" }}
        >
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-properties")}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium"
            style={{
              borderColor: "var(--palette-border)",
              color: "var(--palette-deep)",
              backgroundColor: "var(--palette-card-muted-alt-bg)",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void submitUpdate()}
            disabled={isSaving || isRentedProperty}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: "#8b64c8" }}
          >
            {isSaving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCircle2 size={13} />
            )}
            {isRentedProperty
              ? "Editing locked"
              : isSaving
                ? "Saving…"
                : "Save changes"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default EditListingForm;
