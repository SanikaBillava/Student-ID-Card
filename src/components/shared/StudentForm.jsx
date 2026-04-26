import React from "react";
import { useNavigate } from "react-router-dom";
import FileUpload from "../../components/FileUpload";
import ErrorMessage from "../../components/ErrorMessage";
import { UserPlus, Edit2 } from "lucide-react";

export default function StudentForm({
  formData,
  fields,
  loading,
  saving,
  error,
  isEdit = false,
  onChange,
  onCustomFieldChange,
  onPhotoUpload,
  onSubmit,
  onCancel,
}) {
  const navigate = useNavigate();

  const handleChange = (e) => {
    onChange({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomFieldChange = (fieldId, value) => {
    onCustomFieldChange(fieldId, value);
  };

  const handlePhotoUpload = (url) => {
    onPhotoUpload(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          {isEdit ? (
            <Edit2 className="w-10 h-10 text-primary" />
          ) : (
            <UserPlus className="w-10 h-10 text-primary" />
          )}
          <h2 className="text-3xl font-bold">
            {isEdit ? "Edit Student" : "Add New Student"}
          </h2>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Student Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Student Photo *
            </label>
            <FileUpload
              onUploadSuccess={handlePhotoUpload}
              accept="image/*"
              disabled={loading}
            />
            {formData.image_url && (
              <div className="mt-4">
                <img
                  src={formData.image_url}
                  alt="Student"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium mb-2">
                {field.field_name}
                {field.is_required && <span className="text-red-600">*</span>}
              </label>
              {field.field_type === "text" && (
                <input
                  type="text"
                  value={formData.custom_fields[field.id] || ""}
                  onChange={(e) =>
                    handleCustomFieldChange(field.id, e.target.value)
                  }
                  required={field.is_required}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              )}
              {field.field_type === "number" && (
                <input
                  type="number"
                  value={formData.custom_fields[field.id] || ""}
                  onChange={(e) =>
                    handleCustomFieldChange(field.id, e.target.value)
                  }
                  required={field.is_required}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              )}
              {field.field_type === "date" && (
                <input
                  type="date"
                  value={formData.custom_fields[field.id] || ""}
                  onChange={(e) =>
                    handleCustomFieldChange(field.id, e.target.value)
                  }
                  required={field.is_required}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              )}
            </div>
          ))}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel || (() => navigate("/school"))}
              disabled={saving}
              className="flex-1 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEdit ? "Update Student" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
