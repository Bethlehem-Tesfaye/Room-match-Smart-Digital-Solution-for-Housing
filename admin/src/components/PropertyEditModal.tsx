import React, { useState, useEffect } from "react";
import { AdminPropertyDetail } from "../lib/api";

interface PropertyEditModalProps {
  property: AdminPropertyDetail | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<AdminPropertyDetail>) => Promise<void>;
  loading?: boolean;
}

function PropertyEditModal({ property, open, onClose, onSave, loading }: PropertyEditModalProps) {
  const [formData, setFormData] = useState<Partial<AdminPropertyDetail>>({});

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description,
        propertyType: property.propertyType,
        price: property.price,
        currency: property.currency,
        deposit: property.deposit,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (!open || !property) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Property</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="property-form">
            {/* Basic Info */}
            <fieldset className="form-section">
              <legend>Basic Information</legend>

              <div className="form-row">
                <div className="form-field">
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
                <div className="form-field">
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

              <div className="form-field">
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
            <fieldset className="form-section">
              <legend>Location</legend>
              <div className="form-field">
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
              <div className="form-field">
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
            <fieldset className="form-section">
              <legend>Pricing</legend>
              <div className="form-row">
                <div className="form-field">
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
                <div className="form-field">
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
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="deposit">Deposit</label>
                  <input
                    id="deposit"
                    name="deposit"
                    type="number"
                    min="0"
                    value={formData.deposit || 0}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
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
              <div className="form-field">
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
            <fieldset className="form-section">
              <legend>Property Details</legend>
              <div className="form-row">
                <div className="form-field">
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
                <div className="form-field">
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
              <div className="form-row">
                <div className="form-field">
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
                <div className="form-field">
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
              <div className="form-field">
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
              <div className="form-field">
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

            {/* Availability & Status */}
            <fieldset className="form-section">
              <legend>Availability & Status</legend>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="availableFrom">Available From</label>
                  <input
                    id="availableFrom"
                    name="availableFrom"
                    type="date"
                    value={formData.availableFrom ? formData.availableFrom.split("T")[0] : ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
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

            <div className="modal-actions">
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PropertyEditModal;
