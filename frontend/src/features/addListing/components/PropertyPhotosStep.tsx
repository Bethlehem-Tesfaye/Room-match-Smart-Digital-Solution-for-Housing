import { Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import type { AddListingDraft } from "../types/types";

interface PropertyPhotosStepProps {
  draft: AddListingDraft;
  onUploadPhotos: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSetPrimary: (id: string) => void;
  onRemovePhoto: (id: string) => void;
  errors: {
    images?: string;
  };
}

function PropertyPhotosStep({
  draft,
  onUploadPhotos,
  onSetPrimary,
  onRemovePhoto,
  errors,
}: PropertyPhotosStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--palette-soft-purple)" }}>
        Add photos to showcase your property. Up to 10 images.
      </p>

      <label
        htmlFor="add-listing-upload"
        className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors"
        style={{
          borderColor: "var(--palette-border)",
          backgroundColor: "var(--palette-section-bg)",
        }}
      >
        <Upload size={26} style={{ color: "var(--palette-soft-purple)" }} />
        <p
          className="text-sm font-medium"
          style={{ color: "var(--palette-deep)" }}
        >
          Click to upload or drag and drop
        </p>
        <p className="text-xs" style={{ color: "var(--palette-soft-purple)" }}>
          PNG · JPG · up to 10 MB
        </p>
      </label>
      <input
        id="add-listing-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        multiple
        className="hidden"
        onChange={(e) => void onUploadPhotos(e)}
      />

      {errors.images && (
        <p className="text-xs" style={{ color: "#dc2626" }}>
          {errors.images}
        </p>
      )}

      {draft.images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {draft.images.map((image) => (
            <div key={image.id} className="relative overflow-hidden rounded-xl">
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
                    onClick={() => onSetPrimary(image.id)}
                    className="rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white"
                  >
                    Set as cover
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemovePhoto(image.id)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PropertyPhotosStep;
