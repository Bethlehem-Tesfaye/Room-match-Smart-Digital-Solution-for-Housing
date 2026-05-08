import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../../../lib/axios";
import { palette } from "../../../theme/palette";
import { useMyProfile } from "../../profile/hooks/useProfileHooks";
import { useAmenities } from "../../property/hooks/usePropertyHooks";
import BankInformationStep from "./BankInformationStep";
import PropertyAmenitiesStep from "./PropertyAmenitiesStep";
import PropertyDetailsStep from "./PropertyDetailsStep";
import PropertyLocationStep from "./PropertyLocationStep";
import PropertyPhotosStep from "./PropertyPhotosStep";
import {
  addListingSteps,
  initialBankInfoDraft,
  initialAddListingDraft,
} from "./addListingForm.constants";
import { useCreateCreatorProperty } from "../hooks/useCreatorPropertyHooks";
import type {
  AddListingDraft,
  AddListingImageDraft,
  AddListingStep,
  BankInfoDraft,
  BankOption,
  CreateListingPayload,
  SetAddListingField,
} from "../types/types";
import { useNavigate } from "react-router-dom";

const bankQueryKey = ["banks"] as const;

const initialAttemptedSteps = {
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
};

type BankValidationErrors = {
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  bankName?: string;
};

const hasBankValidationErrors = (errors: BankValidationErrors) =>
  Object.values(errors).some(Boolean);

function CreatePropertyForm() {
  const [step, setStep] = useState<AddListingStep>(1);
  const [draft, setDraft] = useState<AddListingDraft>(initialAddListingDraft);
  const [bankInfo, setBankInfo] = useState<BankInfoDraft>(initialBankInfoDraft);
  const navigate = useNavigate();
  const [attemptedSteps, setAttemptedSteps] = useState<
    Record<AddListingStep, boolean>
  >(initialAttemptedSteps);
  const [isSavingBankInfo, setIsSavingBankInfo] = useState(false);
  const createProperty = useCreateCreatorProperty();
  const profileQuery = useMyProfile(true);
  const { data: amenities = [] } = useAmenities();
  const { data: banks = [], isLoading: isLoadingBanks } = useQuery<
    BankOption[],
    Error
  >({
    queryKey: bankQueryKey,
    queryFn: async () => {
      const response = await api.get<{ banks: BankOption[] }>("/api/banks");
      return response.data.banks ?? [];
    },
  });

  useEffect(() => {
    const profileBankInfo = profileQuery.data?.bankInfo;

    if (!profileBankInfo) {
      return;
    }

    setBankInfo({
      accountName: profileBankInfo.accountName ?? "",
      accountNumber: profileBankInfo.accountNumber ?? "",
      bankCode: profileBankInfo.bankCode ?? "",
      bankName: profileBankInfo.bankName ?? "",
      chapaSubaccountId: profileBankInfo.chapaSubaccountId ?? "",
    });
  }, [profileQuery.data]);

  const setField: SetAddListingField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const stepProgress = useMemo(
    () => addListingSteps.map((item) => item.id <= step),
    [step],
  );

  const hasExistingBankAccount = Boolean(bankInfo.chapaSubaccountId);
  const selectedBankName = useMemo(() => {
    return (
      banks.find((bank) => bank.id === bankInfo.bankCode)?.name ??
      bankInfo.bankName ??
      ""
    );
  }, [bankInfo.bankCode, bankInfo.bankName, banks]);

  const bankValidationErrors = useMemo<BankValidationErrors>(() => {
    const errors: BankValidationErrors = {};

    if (!bankInfo.accountName.trim()) {
      errors.accountName = "Account name is required.";
    }

    if (!bankInfo.accountNumber.trim()) {
      errors.accountNumber = "Account number is required.";
    }

    if (!bankInfo.bankCode.trim()) {
      errors.bankCode = "Bank name is required.";
    }

    return errors;
  }, [bankInfo]);

  const validationErrors = useMemo(() => {
    const stepOneErrors: {
      title?: string;
      price?: string;
      numberOfBedrooms?: string;
      numberOfBathrooms?: string;
      leasePeriod?: string;
      initialPayment?: string;
    } = {};

    const stepTwoErrors: {
      address?: string;
      city?: string;
    } = {};

    const stepThreeErrors: {
      images?: string;
    } = {};

    const stepFourErrors: {
      accountName?: string;
      accountNumber?: string;
      bankCode?: string;
    } = {};

    const trimmedTitle = draft.title.trim();
    if (!trimmedTitle) {
      stepOneErrors.title = "Listing title is required.";
    } else if (trimmedTitle.length < 3) {
      stepOneErrors.title = "Listing title must be at least 3 characters.";
    }

    if (!draft.price || Number(draft.price) <= 0) {
      stepOneErrors.price = "Monthly rent is required.";
    }

    if (!draft.leasePeriod || Number(draft.leasePeriod) <= 0) {
      stepOneErrors.leasePeriod = "Lease period (months) is required.";
    }

    if (draft.initialPayment === "" || Number(draft.initialPayment) < 0) {
      stepOneErrors.initialPayment = "Initial payment is required.";
    }

    if (draft.numberOfBedrooms === "") {
      stepOneErrors.numberOfBedrooms = "Bedrooms is required.";
    }

    if (draft.numberOfBathrooms === "") {
      stepOneErrors.numberOfBathrooms = "Bathrooms is required.";
    }

    if (!draft.address.trim()) {
      stepTwoErrors.address = "Street address is required.";
    }

    if (!draft.city.trim()) {
      stepTwoErrors.city = "City is required.";
    }

    // if (!draft.images.length) {
    //   stepThreeErrors.images = "At least one photo is required.";
    // }

    if (!bankInfo.accountName.trim()) {
      stepFourErrors.accountName = "Account name is required.";
    }

    if (!bankInfo.accountNumber.trim()) {
      stepFourErrors.accountNumber = "Account number is required.";
    }

    if (!bankInfo.bankCode.trim()) {
      stepFourErrors.bankCode = "Bank name is required.";
    }

    return {
      1: stepOneErrors,
      2: stepTwoErrors,
      3: stepThreeErrors,
      4: stepFourErrors,
      5: {},
    };
  }, [bankInfo, draft]);

  const canGoNext = useMemo(
    () => Object.keys(validationErrors[step]).length === 0,
    [step, validationErrors],
  );

  const goNext = () => {
    setAttemptedSteps((prev) => ({ ...prev, [step]: true }));

    if (!canGoNext) {
      return;
    }

    setStep((prev) => (prev < 4 ? ((prev + 1) as AddListingStep) : prev));
  };

  const setBankField = <K extends keyof BankInfoDraft>(
    key: K,
    value: BankInfoDraft[K],
  ) => {
    setBankInfo((prev) => ({ ...prev, [key]: value }));
  };

  const submitBankInfo = async () => {
    setAttemptedSteps((prev) => ({ ...prev, [step]: true }));

    if (hasBankValidationErrors(validationErrors[4])) {
      return false;
    }

    setIsSavingBankInfo(true);

    try {
      const response = await api.post<{
        message: string;
        profile: { bankInfo?: BankInfoDraft | null };
      }>("/api/profile/setup-bank", {
        accountName: bankInfo.accountName.trim(),
        accountNumber: bankInfo.accountNumber.trim(),
        bankCode: bankInfo.bankCode.trim(),
        bankName: selectedBankName.trim(),
      });

      const savedBankInfo = response.data.profile.bankInfo;

      if (savedBankInfo) {
        setBankInfo({
          accountName: savedBankInfo.accountName ?? "",
          accountNumber: savedBankInfo.accountNumber ?? "",
          bankCode: savedBankInfo.bankCode ?? "",
          bankName: savedBankInfo.bankName ?? selectedBankName,
          chapaSubaccountId: savedBankInfo.chapaSubaccountId ?? "",
        });
      }

      toast.success(
        response.data.message || "Bank information saved successfully.",
      );
      setStep(5);
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save bank information";
      toast.error(message);
      return false;
    } finally {
      setIsSavingBankInfo(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (step === 4) {
      await submitBankInfo();
      return;
    }

    if (step < 4) {
      goNext();
      return;
    }

    await onSubmit();
  };

  const goBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as AddListingStep) : prev));
  };

  const onUploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const drafts = files.slice(0, 10).map((file, index) => {
      return {
        id: `${file.name}-${Date.now()}-${index}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: false,
      } as AddListingImageDraft;
    });

    setDraft((prev) => {
      const merged = [...prev.images, ...drafts].slice(0, 10);
      if (!merged.some((item) => item.isPrimary) && merged[0]) {
        merged[0] = { ...merged[0], isPrimary: true };
      }
      return { ...prev, images: merged };
    });

    event.target.value = "";
  };

  const setPrimaryPhoto = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.map((image) => ({
        ...image,
        isPrimary: image.id === id,
      })),
    }));
  };

  const removePhoto = (id: string) => {
    setDraft((prev) => {
      const removedPhoto = prev.images.find((image) => image.id === id);
      if (removedPhoto) {
        URL.revokeObjectURL(removedPhoto.previewUrl);
      }

      const next = prev.images.filter((image) => image.id !== id);
      if (!next.some((image) => image.isPrimary) && next[0]) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return { ...prev, images: next };
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setDraft((prev) => {
      const exists = prev.amenityIds.includes(amenityId);
      return {
        ...prev,
        amenityIds: exists
          ? prev.amenityIds.filter((id) => id !== amenityId)
          : [...prev.amenityIds, amenityId],
      };
    });
  };

  const onSubmit = async () => {
    const payload: CreateListingPayload = new FormData();

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
    payload.append("status", "Active");
    payload.append("amenityIds", JSON.stringify(draft.amenityIds));
    payload.append("leasePeriod", String(Number(draft.leasePeriod || 0)));
    payload.append("initialPayment", String(Number(draft.initialPayment || 0)));

    const primaryImageIndex = draft.images.findIndex(
      (image) => image.isPrimary,
    );
    payload.append(
      "primaryImageIndex",
      String(primaryImageIndex >= 0 ? primaryImageIndex : 0),
    );

    draft.images.forEach((image) => {
      payload.append("images", image.file);
    });

    try {
      await createProperty.mutateAsync(payload);
      toast.success("Property created successfully.");
      navigate("/dashboard/my-properties");
      draft.images.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
      setDraft(initialAddListingDraft);
      setAttemptedSteps({ 1: false, 2: false, 3: false, 4: false, 5: false });
      setStep(1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create property";
      toast.error(message);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <PropertyDetailsStep
          draft={draft}
          setField={setField}
          errors={attemptedSteps[1] ? validationErrors[1] : {}}
        />
      );
    }

    if (step === 2) {
      return (
        <PropertyLocationStep
          draft={draft}
          setField={setField}
          errors={attemptedSteps[2] ? validationErrors[2] : {}}
        />
      );
    }

    if (step === 3) {
      return (
        <PropertyPhotosStep
          draft={draft}
          onUploadPhotos={onUploadPhotos}
          onSetPrimary={setPrimaryPhoto}
          onRemovePhoto={removePhoto}
          errors={attemptedSteps[3] ? validationErrors[3] : {}}
        />
      );
    }

    if (step === 4) {
      return (
        <BankInformationStep
          bankInfo={bankInfo}
          banks={banks}
          hasExistingBankAccount={hasExistingBankAccount}
          isLoadingBanks={isLoadingBanks}
          errors={attemptedSteps[4] ? bankValidationErrors : {}}
          onChangeField={setBankField}
        />
      );
    }

    return (
      <PropertyAmenitiesStep
        draft={draft}
        amenities={amenities}
        setField={setField}
        onToggleAmenity={toggleAmenity}
      />
    );
  };

  return (
    <section className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold" style={{ color: palette.deep }}>
          List Your Property
        </h1>
        <p className="mt-2 text-lg" style={{ color: palette.softPurple }}>
          Fill in the details to reach thousands of potential tenants
        </p>
      </div>

      <div className="mb-8 grid grid-cols-5 gap-2">
        {addListingSteps.map((item, index) => (
          <div
            key={item.id}
            className="h-2 rounded-full"
            style={{
              backgroundColor: stepProgress[index]
                ? palette.purple
                : palette.border,
            }}
          />
        ))}
      </div>

      <div
        className="rounded-2xl border p-6 md:p-8 shadow-sm"
        style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}
      >
        {renderStep()}

        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-lg font-semibold"
              style={{ borderColor: palette.border, color: palette.deep }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
          ) : (
            <span />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => void handlePrimaryAction()}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-lg font-semibold text-white"
              style={{ backgroundColor: palette.purple }}
              disabled={step === 4 ? isSavingBankInfo : false}
            >
              {step === 4
                ? isSavingBankInfo
                  ? "Saving..."
                  : hasExistingBankAccount
                    ? "Confirm & Continue"
                    : "Save & Continue"
                : "Next"}
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handlePrimaryAction()}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-lg font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: palette.purple }}
              disabled={createProperty.isPending}
            >
              <CheckCircle2 size={18} />
              {createProperty.isPending ? "Publishing..." : "Publish Listing"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default CreatePropertyForm;
