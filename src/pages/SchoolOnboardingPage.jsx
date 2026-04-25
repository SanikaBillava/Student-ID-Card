import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import { Settings2, Plus, X } from "lucide-react";

const DEFAULT_BATCH_LIMIT = 1000;
const default_fields = [
  {
    field_name: "Name",
    field_type: "text",
    is_required: true,
  },
  {
    field_name: "Photo",
    field_type: "text",
    is_required: true,
  },
];

export default function SchoolOnboardingPage() {
  const [schoolId, setSchoolId] = useState(localStorage.getItem("schoolId"));
  const [fields, setFields] = useState([...default_fields]);
  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "text",
    is_required: true,
  });
  const [batchLimit, setBatchLimit] = useState(DEFAULT_BATCH_LIMIT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  useEffect(() => {
    const loadSchool = async () => {
      if (schoolId || !userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.schools.getAll({ admin_user_id: userId });
        if (response.success && response.data?.length > 0) {
          setSchoolId(response.data[0].id);
          localStorage.setItem("schoolId", response.data[0].id);
        }
      } catch (err) {
        setError(err.message || "Failed to load school");
      } finally {
        setLoading(false);
      }
    };

    loadSchool();
  }, [schoolId, userId]);

  const addField = () => {
    if (!newField.field_name.trim()) {
      setError("Field name is required");
      return;
    }

    setFields([
      ...fields,
      { ...newField, field_name: newField.field_name.trim() },
    ]);
    setNewField({ field_name: "", field_type: "text", is_required: true });
    setError(null);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!schoolId) {
      setError("School account was not found");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      localStorage.setItem(
        "defaultBatchLimit",
        String(batchLimit || DEFAULT_BATCH_LIMIT),
      );

      for (const field of fields.filter(
        (el) => el.field_name !== "Name" && el.field_name !== "Photo",
      )) {
        await api.student_fields.create({
          school_id: schoolId,
          field_name: field.field_name,
          field_type: field.field_type,
          is_required: field.is_required,
        });
      }

      navigate("/school-dashboard");
    } catch (err) {
      setError(err.message || "Failed to save onboarding");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <Settings2 className="w-10 h-10 text-primary" />
          <h2 className="text-3xl font-bold">School Onboarding</h2>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium mb-2">
              Default Batch Limit
            </label>
            <input
              type="number"
              min="1"
              value={batchLimit}
              onChange={(e) => setBatchLimit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">
              Student Custom Fields
            </h3>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="Field Name"
                value={newField.field_name}
                onChange={(e) =>
                  setNewField({ ...newField, field_name: e.target.value })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={newField.field_type}
                onChange={(e) =>
                  setNewField({ ...newField, field_type: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newField.is_required}
                  onChange={(e) =>
                    setNewField({ ...newField, is_required: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span>Required</span>
              </label>
              <button
                type="button"
                onClick={addField}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {fields.length > 0 && (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={`${field.field_name}-${index}`}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">{field.field_name}</span>
                    <span className="text-sm text-gray-600">
                      ({field.field_type})
                    </span>
                    {field.is_required && (
                      <span className="text-sm text-red-600">*</span>
                    )}
                  </div>
                  {field.field_name !== "Name" &&
                    field.field_name !== "Photo" && (
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
