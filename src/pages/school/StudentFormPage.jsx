import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import FileUpload from "../../components/FileUpload";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { UserPlus } from "lucide-react";

export default function StudentFormPage() {
  const [batch, setBatch] = useState(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
    custom_fields: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const schoolResponse = await api.schools.getAll({
        admin_user_id: userId,
      });
      if (!schoolResponse.success || !schoolResponse.data?.length) {
        setError("School account was not found");
        return;
      }

      const school = schoolResponse.data[0];
      const batchesResponse = await api.batches.getAll({
        school_id: school.id,
        sortBy: "created_at",
        orderBy: "DESC",
      });
      const draftBatch = (batchesResponse.data || []).find(
        (item) => item.status !== "locked",
      );
      setBatch(draftBatch || null);

      const fieldsResponse = await api.student_fields.getAll({
        school_id: school.id,
      });
      if (fieldsResponse.success) {
        setFields(fieldsResponse.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setFormData({
      ...formData,
      custom_fields: { ...formData.custom_fields, [fieldId]: value },
    });
  };

  const handlePhotoUpload = (url) => {
    setFormData({ ...formData, image_url: url });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!batch || batch.status === "locked") {
      setError("This batch is locked");
      return;
    }
    if (!formData.name.trim()) {
      setError("Student name is required");
      return;
    }
    if (!formData.image_url) {
      setError("Student photo is required");
      return;
    }

    for (const field of fields) {
      if (field.is_required && !formData.custom_fields[field.id]) {
        setError(`${field.field_name} is required`);
        return;
      }
    }

    setError(null);
    setSaving(true);

    try {
      const response = await api.students.create({
        batch_id: batch.id,
        name: formData.name,
        image_url: formData.image_url,
      });

      if (response.success) {
        for (const field of fields) {
          await api.student_field_values.create({
            student_id: response.data.id,
            field_id: field.id,
            value: formData.custom_fields[field.id] || "",
          });
        }
        navigate("/school");
      }
    } catch (err) {
      setError(err.message || "Failed to add student");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !batch) return <ErrorMessage message={error} />;
  if (!batch)
    return (
      <div className="text-center">
        No editable batch found. Create a draft batch first.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <UserPlus className="w-10 h-10 text-primary" />
          <h2 className="text-3xl font-bold">Add New Student</h2>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Student Photo *
            </label>
            <FileUpload onUploadSuccess={handlePhotoUpload} accept="image/*" />
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
                {field.field_name}{" "}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              )}
            </div>
          ))}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/school")}
              className="flex-1 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
