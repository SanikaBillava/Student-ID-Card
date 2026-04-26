import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import StudentForm from "../../components/shared/StudentForm";

export default function StudentEditPage() {
  const { id: studentId } = useParams();
  const navigate = useNavigate();
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
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get school info
      const schoolResponse = await api.schools.getAll({
        admin_user_id: userId,
      });
      if (!schoolResponse.success || !schoolResponse.data?.length) {
        setError("School account was not found");
        return;
      }

      const school = schoolResponse.data[0];

      // Load custom fields
      const fieldsResponse = await api.student_fields.getAll({
        school_id: school.id,
      });
      if (fieldsResponse.success) {
        setFields(fieldsResponse.data || []);
      }

      // Get current year's batch only
      const currentYear = new Date().getFullYear();
      const batchesResponse = await api.batches.getAll({
        school_id: school.id,
        sortBy: "created_at",
        orderBy: "DESC",
      });

      let draftBatch = null;
      if (batchesResponse.success && batchesResponse.data?.length > 0) {
        // Find current year batch that is not locked
        const currentYearBatch = batchesResponse.data.find(
          (b) => b.year === currentYear,
        );
        if (currentYearBatch && currentYearBatch.status !== "locked") {
          draftBatch = currentYearBatch;
        }
      }
      setBatch(draftBatch);

      // Only allow editing for draft batches
      if (!draftBatch) {
        setError("No editable batch found. Only draft batches can be edited.");
        setLoading(false);
        return;
      }

      // Load student data
      const studentResponse = await api.students.getById(studentId);
      if (!studentResponse.success) {
        setError("Student not found");
        return;
      }

      const student = studentResponse.data;
      setFormData({
        name: student.name || "",
        image_url: student.image_url || "",
        custom_fields: {},
      });

      // Load custom field values
      const fieldValuesResponse = await api.student_field_values.getAll({
        student_id: studentId,
      });
      if (fieldValuesResponse.success && fieldValuesResponse.data) {
        const customFields = {};
        fieldValuesResponse.data.forEach((fv) => {
          customFields[fv.field_id] = fv.value;
        });
        setFormData((prev) => ({
          ...prev,
          custom_fields: customFields,
        }));
      }
    } catch (err) {
      setError(err.message || "Failed to load student data");
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
      // Update student
      const response = await api.students.update(studentId, {
        name: formData.name,
        image_url: formData.image_url,
      });

      if (response.success) {
        // Update custom field values
        for (const field of fields) {
          // First try to update existing
          const existingValuesResponse = await api.student_field_values.getAll({
            student_id: studentId,
          });

          if (existingValuesResponse.success && existingValuesResponse.data) {
            const existingValue = existingValuesResponse.data.find(
              (v) => v.field_id === field.id,
            );

            if (existingValue) {
              // Update existing
              await api.student_field_values.update(existingValue.id, {
                value: formData.custom_fields[field.id] || "",
              });
            } else {
              // Create new
              await api.student_field_values.create({
                student_id: studentId,
                field_id: field.id,
                value: formData.custom_fields[field.id] || "",
              });
            }
          }
        }

        alert("Student updated successfully!");
        navigate("/school");
      }
    } catch (err) {
      setError(err.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/school");
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <StudentForm
      formData={formData}
      fields={fields}
      loading={loading}
      saving={saving}
      error={error}
      isEdit={true}
      onChange={handleChange}
      onCustomFieldChange={handleCustomFieldChange}
      onPhotoUpload={handlePhotoUpload}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
