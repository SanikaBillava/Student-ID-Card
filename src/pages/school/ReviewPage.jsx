import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { CheckCircle, AlertCircle } from "lucide-react";
import { STUDENT_BATCH_LIMIT } from "../../constants";

export default function ReviewPage() {
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_token");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get school info
      const schoolResponse = await api.schools.getAll({
        admin_user_id: userId,
      });

      if (!schoolResponse.success || !schoolResponse.data?.length) {
        setError("School account was not found");
        return;
      }

      const school = schoolResponse.data[0];

      // Get current year's batch only
      const currentYear = new Date().getFullYear();
      const batchResponse = await api.batches.getAll({
        school_id: school.id,
        sortBy: "created_at",
        orderBy: "DESC",
      });

      if (batchResponse.success && batchResponse.data?.length > 0) {
        const currentYearBatch = batchResponse.data.find(
          (b) => b.year === currentYear,
        );
        setBatch(currentYearBatch || null);

        if (currentYearBatch) {
          const studentsResponse = await api.students.getAll({
            batch_id: currentYearBatch.id,
          });
          if (studentsResponse.success) {
            setStudents(studentsResponse.data || []);
          }
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!batch || Number(batch.total_students) < Number(batch.max_students)) {
      setError(
        `Cannot submit. Please add all ${STUDENT_BATCH_LIMIT} students first.`,
      );
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to submit this batch? Once submitted, only you (the creator) can edit the data.",
      )
    ) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const updateData = {
        status: "locked",
        submitted_at: new Date().toISOString(),
      };
      const response = await api.batches.update(batch.id, updateData);
      if (response.success) {
        alert("Batch submitted successfully!");
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to submit batch");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !batch) return <ErrorMessage message={error} />;
  if (!batch) return <div className="text-center">No batch found</div>;

  const canSubmit =
    Number(batch.total_students) >= Number(batch.max_students) &&
    batch.status === "draft";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <CheckCircle className="w-10 h-10 text-primary" />
          <h2 className="text-3xl font-bold">Review & Submit</h2>
        </div>

        {error && <ErrorMessage message={error} />}

        {batch.status === "locked" && (
          <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-success">Batch Submitted</p>
              <p className="text-sm text-gray-700">
                This batch was submitted on{" "}
                {new Date(batch.submitted_at).toLocaleString()}. Only you (the
                creator) can edit the data.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Batch Summary</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold">{batch.total_students}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-2xl font-bold capitalize">{batch.status}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">School</p>
              <p className="text-lg font-bold">{batch.school_name}</p>
            </div>
          </div>
        </div>

        {students.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Student List</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Photo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Added On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <img
                          src={student.image_url}
                          alt={student.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      </td>
                      <td className="px-4 py-3">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
          >
            Back to Dashboard
          </button>
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-success text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {submitting ? "Submitting..." : "Submit Batch"}
            </button>
          )}
          {/* {!batchLocked && (
            <button
              onClick={handleSubmitBatch}
              disabled={saving}
              className="flex-1 py-3 bg-success text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {saving ? "Submitting..." : "Submit Batch"}
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
}
