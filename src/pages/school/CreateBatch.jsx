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
  const [loading, setLoading] = useState(true);
  const [existingBatch, setExistingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    year: new Date().getFullYear(),
    max_students:
      localStorage.getItem("defaultBatchLimit") || STUDENT_BATCH_LIMIT,
  });

  const schoolId = localStorage.getItem("schoolId");
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  useEffect(() => {
    checkExistingBatch();
  }, []);

  const checkExistingBatch = async () => {
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

      // Check if batch exists for current year
      const currentYear = new Date().getFullYear();
      const batchesResponse = await api.batches.getAll({
        school_id: school.id,
        sortBy: "created_at",
        orderBy: "DESC",
      });

      if (batchesResponse.success && batchesResponse.data?.length > 0) {
        const currentYearBatch = batchesResponse.data.find(
          (b) => b.year === currentYear,
        );
        setExistingBatch(currentYearBatch || null);
      }
    } catch (err) {
      setError(err.message || "Failed to check existing batch");
    } finally {
      setLoading(false);
    }
  };

  const deletePreviousYearData = async (schoolId, currentYear) => {
    try {
      // Get all batches
      const batchesResponse = await api.batches.getAll({
        school_id: schoolId,
      });

      if (batchesResponse.success && batchesResponse.data) {
        // Find previous year batches
        const previousBatches = batchesResponse.data.filter(
          (b) => b.year < currentYear,
        );

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
      console.error("Failed to delete previous year data:", err);
      // Continue even if deletion fails
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();

    // Check if batch already exists for current year
    if (existingBatch) {
      setError(
        `A batch for year ${batchForm.year} already exists. Only one batch is allowed per year.`,
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();

      // Delete previous year data before creating new batch
      await deletePreviousYearData(schoolId, currentYear);

      const response = await api.batches.create({
        school_id: schoolId,
        year: Number(batchForm.year),
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

  if (loading) return <LoadingSpinner />;

  // If batch already exists for current year, show message
  if (existingBatch) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <PlusCircle className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Batch Already Exists</h2>
        <p className="text-gray-600 mb-4">
          A batch for year {existingBatch.year} already exists. Only one batch
          is allowed per year.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Status:{" "}
          <span className="font-semibold capitalize">
            {existingBatch.status}
          </span>
        </p>
        <button
          onClick={() => navigate("/school")}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">{error && <ErrorMessage message={error} />}</div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <PlusCircle className="w-7 h-7 text-primary" />
          <h2 className="text-2xl font-bold">Create Batch</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Creating a new batch will automatically delete all data from previous
          years.
        </p>
        <form
          onSubmit={handleCreateBatch}
          className="flex flex-col gap-4 max-w-md"
        >
          <div className="grid grid-cols-2 items-center">
            <label htmlFor="year">Year</label>
            <input
              type="number"
              name="year"
              value={batchForm.year}
              // onChange={(e) =>
              //   setBatchForm({ ...batchForm, year: e.target.value })
              // }

              readOnly
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
