import { ImageIcon, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { palette } from "../../../theme/palette";
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
    <div className="space-y-5">
      <div>
        <div
          className="mb-1 flex items-center gap-2 text-lg font-semibold"
          style={{ color: palette.deep }}
        >
          <ImageIcon size={18} style={{ color: palette.purple }} />
          Photos
        </div>
        <p className="text-sm" style={{ color: palette.softPurple }}>
          Add photos to showcase your property
        </p>
      </div>

      <label
        htmlFor="add-listing-upload"
        className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed"
        style={{
          borderColor: errors.images ? "rgb(220 38 38)" : palette.border,
          backgroundColor: palette.cardBg,
        }}
      >
        <Upload size={40} style={{ color: palette.softPurple }} />
        <p className="mt-3 text-xl" style={{ color: palette.deep }}>
          Click to upload or drag and drop
        </p>
        <p className="text-sm" style={{ color: palette.softPurple }}>
          PNG, JPG up to 10MB
        </p>
      </label>
      {errors.images ? (
        <p className="-mt-3 text-sm text-red-600">{errors.images}</p>
      ) : null}
      <input
        id="add-listing-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        multiple
        className="hidden"
        onChange={(event) => {
          void onUploadPhotos(event);
        }}
      />

      {draft.images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {draft.images.map((image) => (
            <div key={image.id} className="relative overflow-hidden rounded-xl">
              <img
                src={image.imageBase64}
                alt="Property preview"
                className="h-40 w-full object-cover"
              />
              {image.isPrimary ? (
                <span
                  className="absolute bottom-2 left-2 rounded-md px-2 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: palette.purple }}
                >
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetPrimary(image.id)}
                  className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white"
                >
                  Set as cover
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemovePhoto(image.id)}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default PropertyPhotosStep;
