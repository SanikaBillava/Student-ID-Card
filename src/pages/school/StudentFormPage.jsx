import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import StudentForm from "../../components/shared/StudentForm";

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
    <StudentForm
      formData={formData}
      fields={fields}
      loading={loading}
      saving={saving}
      error={error}
      isEdit={false}
      onChange={handleChange}
      onCustomFieldChange={handleCustomFieldChange}
      onPhotoUpload={handlePhotoUpload}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
