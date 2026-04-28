import { PlusCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { STUDENT_BATCH_LIMIT } from "../../constants";

export default function CreateBatch() {
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchForm, setBatchForm] = useState({
    // name: `Batch ${new Date().getFullYear()}`,
    max_students:
      localStorage.getItem("defaultBatchLimit") || STUDENT_BATCH_LIMIT,
  });

  const schoolId = localStorage.getItem("schoolId");
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  // useEffect(() => {
  //   checkExistingBatch();
  // }, []);

  const checkExistingBatch = async () => {
    let existing = null;
    try {
      setLoading(true);

      // Get school info
      const schoolResponse = await api.schools.getAll({
        admin_user_id: userId,
      });

      if (!schoolResponse.success || !schoolResponse.data?.length) {
        setError("School account not found");
        return;
      }

      const school = schoolResponse.data[0];
      localStorage.setItem("schoolId", school.id);

      // Check if a batch with the default name exists
      const batchesResponse = await api.batches.getAll({
        school_id: school.id,
        sortBy: "created_at",
        orderBy: "DESC",
      });

      if (batchesResponse.success && batchesResponse.data?.length > 0) {
        existing = batchesResponse.data.find((b) => b.name === batchForm.name);
      }
    } catch (err) {
      setError(err.message || "Failed to check existing batch");
    } finally {
      setLoading(false);
    }
    return existing;
  };

  const deleteOldBatches = async (schoolId) => {
    try {
      // Get all batches
      const batchesResponse = await api.batches.getAll({
        school_id: schoolId,
      });

      if (batchesResponse.success && batchesResponse.data) {
        // Find batches older than 1 year (by created_at)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const previousBatches = batchesResponse.data.filter((b) => {
          const created = b.created_at ? new Date(b.created_at) : null;
          return created && created < oneYearAgo;
        });

        for (const prevBatch of previousBatches) {
          // Get all students in the batch
          const studentsResponse = await api.students.getAll({
            batch_id: prevBatch.id,
          });

          if (studentsResponse.success && studentsResponse.data) {
            // Delete all students
            for (const student of studentsResponse.data) {
              // Delete field values first
              const fieldValuesResponse = await api.student_field_values.getAll(
                {
                  student_id: student.id,
                },
              );

              if (fieldValuesResponse.success && fieldValuesResponse.data) {
                for (const fv of fieldValuesResponse.data) {
                  await api.student_field_values.delete(fv.id);
                }
              }

              // Delete student
              await api.students.delete(student.id);
            }
          }

          // Delete the batch
          await api.batches.delete(prevBatch.id);
        }
      }
    } catch (err) {
      console.error("Failed to delete old batches:", err);
      // Continue even if deletion fails
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setSaving(true);

    const existing = await checkExistingBatch();
    // Check if batch with same name exists
    if (existing) {
      setError(
        `A batch with the name "${batchForm.name}" already exists. Names must be unique.`,
      );
      return;
    }

    setError(null);

    try {
      // Delete batches older than 1 year before creating new batch
      await deleteOldBatches(schoolId);

      const response = await api.batches.create({
        school_id: schoolId,
        name: batchForm.name,
        max_students: Number(batchForm.max_students) || STUDENT_BATCH_LIMIT,
        status: "draft",
      });

      if (response.success) {
        navigate("/school");
      }
    } catch (err) {
      setError(err.message || "Failed to create batch");
    } finally {
      setSaving(false);
    }
  };

  // if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="mb-4">{error && <ErrorMessage message={error} />}</div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <PlusCircle className="w-7 h-7 text-primary" />
          <h2 className="text-2xl font-bold">Create Batch</h2>
        </div>
        {/* <p className="text-sm text-gray-600 mb-4">
          Creating a new batch will automatically delete batches older than one
          year.
        </p> */}
        <form
          onSubmit={handleCreateBatch}
          className="flex flex-col gap-4 max-w-md"
        >
          <div className="grid grid-cols-2 items-center">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              name="name"
              placeholder={`Batch ${new Date().getFullYear()}`}
              value={batchForm.name}
              onChange={(e) =>
                setBatchForm({ ...batchForm, name: e.target.value })
              }
              required
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 items-center">
            <label htmlFor="max_students">Max students</label>
            <input
              type="number"
              name="max_students"
              min="1"
              value={batchForm.max_students}
              onChange={(e) =>
                setBatchForm({ ...batchForm, max_students: e.target.value })
              }
              required
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400"
          >
            {saving ? "Creating..." : "Create Batch"}
          </button>
        </form>
      </div>
    </>
  );
}
