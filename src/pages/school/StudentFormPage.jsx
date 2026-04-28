import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import StudentForm from "../../components/shared/StudentForm";
import { toast } from "sonner";

export default function StudentFormPage() {
  const [batch, setBatch] = useState(null);
  const [batches, setBatches] = useState([]);
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

      // Get all batches and default to the latest editable batch
      const batchesResponse = await api.batches.getAll({
        school_id: school.id,
        sortBy: "created_at",
        orderBy: "DESC",
      });

      let draftBatch = null;
      if (batchesResponse.success && batchesResponse.data?.length > 0) {
        setBatches(batchesResponse.data || []);
        // Select the latest batch that is not locked; fallback to first
        draftBatch =
          batchesResponse.data.find((b) => b.status !== "locked") ||
          batchesResponse.data[0];
      }
      setBatch(draftBatch);

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

  const handleChange = (newFormData) => {
    setFormData(newFormData);
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
      toast.error("This batch is locked or not selectable");
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
          const value = formData.custom_fields[field.id] || "";
          await api.student_field_values.create({
            student_id: response.data.id,
            field_id: field.id,
            value: value,
          });
        }
        setFormData({ name: "", image_url: "", custom_fields: {} });
        setError(null);
        // show temporary success message
        toast.success("Student added successfully");
      }
    } catch (err) {
      const msg = err.message || "Failed to add student";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/school");
  };

  if (loading) return <LoadingSpinner />;
  if (error && !batch) return <div className="text-center p-8">{error}</div>;
  if (!batch)
    return (
      <div className="text-center">
        No editable batch found. Create a draft batch first.
      </div>
    );

  return (
    <div className="space-y-6">
      {batches.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 max-w-3xl mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Batch
          </label>
          <select
            value={batch?.id || ""}
            onChange={(e) => {
              const sel = batches.find((b) => b.id === e.target.value);
              setBatch(sel || null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.status ? ` - ${b.status}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <StudentForm
        formData={formData}
        fields={fields}
        loading={loading}
        saving={saving}
        error={error}
        batchLocked={batch?.status === "locked"}
        batchLockedMessage={
          batch?.status === "locked"
            ? "Selected batch is locked. You cannot add students to a locked batch."
            : undefined
        }
        isEdit={false}
        onChange={handleChange}
        onCustomFieldChange={handleCustomFieldChange}
        onPhotoUpload={handlePhotoUpload}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
