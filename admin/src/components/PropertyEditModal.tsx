import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AdminPropertyDetail } from "../lib/api";
import { adminPalette } from "../theme/palette";

interface PropertyEditModalProps {
  property: AdminPropertyDetail | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<AdminPropertyDetail> | FormData) => Promise<void>;
  loading?: boolean;
}

function PropertyEditModal({ property, open, onClose, onSave, loading }: PropertyEditModalProps) {
  const [formData, setFormData] = useState<Partial<AdminPropertyDetail>>({});
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description,
        propertyType: property.propertyType,
        price: property.price,
        currency: property.currency,
        leasePeriod: property.leasePeriod,
        initialPayment: property.initialPayment,
        address: property.address,
        city: property.city,
        numberOfBedrooms: property.numberOfBedrooms,
        numberOfBathrooms: property.numberOfBathrooms,
        floorNumber: property.floorNumber,
        totalFloors: property.totalFloors,
        areaSqFt: property.areaSqFt,
        isFurnished: property.isFurnished,
        availableFrom: property.availableFrom,
        status: property.status,
      });
      setExistingImageUrls(property.images?.map((image) => image.imageUrl) || []);
      setNewImageFiles([]);
    }
  }, [property, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? value ? Number(value) : 0
            : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setNewImageFiles(Array.from(files));
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImageUrls((prev) => prev.filter((url) => url !== imageUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!property) return;

      const useFormData =
        newImageFiles.length > 0 ||
        existingImageUrls.length !== (property.images?.length ?? 0);

      if (useFormData) {
        const payload = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          payload.append(key, typeof value === "boolean" ? String(value) : String(value));
        });

        payload.append("existingImageUrls", JSON.stringify(existingImageUrls));

        newImageFiles.forEach((file) => payload.append("images", file));

        await onSave(payload);
      } else {
        await onSave(formData);
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (!open || !property) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border shadow-xl"
        style={{
          borderColor: adminPalette.border,
          backgroundColor: adminPalette.cardBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4"
          style={{
            borderColor: adminPalette.border,
            backgroundColor: adminPalette.cardBg,
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: adminPalette.deep }}>
            Edit property
          </h2>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border"
            style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset className="admin-form-section">
              <legend>Basic Information</legend>

              <div className="admin-form-row">
                <div className="admin-form-field">
                  <label htmlFor="title">Title</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="admin-form-field">
                  <label htmlFor="propertyType">Property Type</label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType || ""}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Condo">Condo</option>
                    <option value="Studio">Studio</option>
                    <option value="SharedRoom">Shared Room</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </fieldset>

            {/* Location */}
            <fieldset className="admin-form-section">
              <legend>Location</legend>
              <div className="admin-form-field">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            {/* Pricing */}
            <fieldset className="admin-form-section">
              <legend>Pricing</legend>
              <div className="admin-form-row">
                <div className="admin-form-field">
                  <label htmlFor="price">Price</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    value={formData.price || 0}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="admin-form-field">
                  <label htmlFor="currency">Currency</label>
                  <input
                    id="currency"
                    name="currency"
                    type="text"
                    value={formData.currency || "ETB"}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-field">
                  <label htmlFor="initialPayment">Initial Payment</label>
                  <input
                    id="initialPayment"
                    name="initialPayment"
                    type="number"
                    min="0"
                    value={formData.initialPayment || 0}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="admin-form-field">
                <label htmlFor="leasePeriod">Lease Period (months)</label>
                <input
                  id="leasePeriod"
                  name="leasePeriod"
                  type="number"
                  min="1"
                  value={formData.leasePeriod || 1}
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            {/* Details */}
            <fieldset className="admin-form-section">
              <legend>Property Details</legend>
              <div className="admin-form-row">
                <div className="admin-form-field">
                  <label htmlFor="numberOfBedrooms">Bedrooms</label>
                  <input
                    id="numberOfBedrooms"
                    name="numberOfBedrooms"
                    type="number"
                    min="0"
                    value={formData.numberOfBedrooms || 0}
                    onChange={handleChange}
                  />
                </div>
                <div className="admin-form-field">
                  <label htmlFor="numberOfBathrooms">Bathrooms</label>
                  <input
                    id="numberOfBathrooms"
                    name="numberOfBathrooms"
                    type="number"
                    min="0"
                    value={formData.numberOfBathrooms || 0}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-field">
                  <label htmlFor="floorNumber">Floor Number</label>
                  <input
                    id="floorNumber"
                    name="floorNumber"
                    type="number"
                    min="0"
                    value={formData.floorNumber || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="admin-form-field">
                  <label htmlFor="totalFloors">Total Floors</label>
                  <input
                    id="totalFloors"
                    name="totalFloors"
                    type="number"
                    min="0"
                    value={formData.totalFloors || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="admin-form-field">
                <label htmlFor="areaSqFt">Area (Sq Ft)</label>
                <input
                  id="areaSqFt"
                  name="areaSqFt"
                  type="number"
                  min="0"
                  value={formData.areaSqFt || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="isFurnished">
                  <input
                    id="isFurnished"
                    name="isFurnished"
                    type="checkbox"
                    checked={formData.isFurnished || false}
                    onChange={handleChange}
                  />
                  Furnished
                </label>
              </div>
            </fieldset>

            {/* Images */}
            <fieldset className="admin-form-section">
              <legend>Images</legend>
              {existingImageUrls.length > 0 && (
                <div className="image-preview-grid">
                  {existingImageUrls.map((imageUrl) => (
                    <div key={imageUrl} className="image-preview-card">
                      <img src={imageUrl} alt="Existing property" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(imageUrl)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="admin-form-field">
                <label htmlFor="images">Add Images</label>
                <input
                  id="images"
                  name="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                />
              </div>
              {newImageFiles.length > 0 && (
                <p>{newImageFiles.length} new image(s) ready to upload.</p>
              )}
            </fieldset>

            {/* Availability & Status */}
            <fieldset className="admin-form-section">
              <legend>Availability & Status</legend>
              <div className="admin-form-row">
                <div className="admin-form-field">
                  <label htmlFor="availableFrom">Available From</label>
                  <input
                    id="availableFrom"
                    name="availableFrom"
                    type="date"
                    value={formData.availableFrom ? formData.availableFrom.split("T")[0] : ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="admin-form-field">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || "Active"}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Rented">Rented</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <div
              className="flex justify-end gap-2 border-t pt-4"
              style={{ borderColor: adminPalette.border }}
            >
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: adminPalette.accent }}
              >
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PropertyEditModal;
