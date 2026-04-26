import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import { Settings2, Plus } from "lucide-react";

const DEFAULT_BATCH_LIMIT = 1000;

// ✅ Predefined fields
const PREDEFINED_FIELDS = [
  {
    field_name: "Name",
    field_type: "text",
    is_required: true,
    selected: true,
    locked: true,
  },
  {
    field_name: "Photo",
    field_type: "text",
    is_required: true,
    selected: true,
    locked: true,
  },
  { field_name: "Father Name", field_type: "text", selected: false },
  { field_name: "Mother Name", field_type: "text", selected: false },
  { field_name: "Phone", field_type: "text", selected: false },
  { field_name: "Address", field_type: "text", selected: false },
  { field_name: "DOB", field_type: "date", selected: false },
  { field_name: "Class", field_type: "number", selected: false },
  { field_name: "Roll Number", field_type: "number", selected: false },
];

export default function SchoolOnboardingPage() {
  const [schoolId, setSchoolId] = useState(localStorage.getItem("schoolId"));
  const [fields, setFields] = useState(PREDEFINED_FIELDS);
  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "text",
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

  // ✅ Toggle field selection
  const toggleField = (index) => {
    const updated = [...fields];
    if (updated[index].locked) return;

    updated[index].selected = !updated[index].selected;
    setFields(updated);
  };

  // ✅ Add custom field
  const addCustomField = () => {
    if (!newField.field_name.trim()) {
      setError("Field name is required");
      return;
    }

    setFields([
      ...fields,
      {
        ...newField,
        field_name: newField.field_name.trim(),
        selected: true,
      },
    ]);

    setNewField({ field_name: "", field_type: "text" });
    setError(null);
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

      // ✅ Only selected fields saved
      for (const field of fields.filter(
        (f) =>
          f.selected && f.field_name !== "Name" && f.field_name !== "Photo",
      )) {
        await api.student_fields.create({
          school_id: schoolId,
          field_name: field.field_name,
          field_type: field.field_type,
          is_required: field.is_required || false,
        });
      }

      navigate("/school");
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
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <Settings2 className="w-10 h-10 text-primary" />
          <h2 className="text-3xl font-bold">School Onboarding</h2>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Batch Limit */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Default Batch Limit
            </label>
            <input
              type="number"
              min="1"
              value={batchLimit}
              onChange={(e) => setBatchLimit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Field Selection */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Select Student Fields
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {fields.map((field, index) => (
                <button
                  type="button"
                  key={`${field.field_name}-${index}`}
                  onClick={() => toggleField(index)}
                  className={`p-4 rounded-xl border text-left transition-all
                    ${
                      field.selected
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-gray-300 hover:border-primary"
                    }
                    ${field.locked ? "opacity-70 cursor-not-allowed" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{field.field_name}</span>

                    {field.locked && (
                      <span className="text-xs bg-black/20 px-2 py-1 rounded">
                        Required
                      </span>
                    )}
                  </div>

                  <p className="text-xs opacity-80 mt-1">{field.field_type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Field */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Add Custom Field</h3>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Field Name"
                value={newField.field_name}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    field_name: e.target.value,
                  })
                }
                className="flex-1 px-4 py-2 border rounded-lg"
              />

              <select
                value={newField.field_type}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    field_type: e.target.value,
                  })
                }
                className="px-4 py-2 border rounded-lg"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>

              <button
                type="button"
                onClick={addCustomField}
                className="px-5 py-2 bg-primary text-white rounded-lg flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Submit */}
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
