import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { Users, CheckCircle, Clock, PlusCircle, School } from "lucide-react";

const DEFAULT_BATCH_LIMIT = 1000;

export default function SchoolDashboard() {
  const [schoolRecord, setSchoolRecord] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [students, setStudents] = useState([]);
  const [fields, setFields] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  const selectedBatch = useMemo(
    () =>
      batches.find((batch) => batch.id === selectedBatchId) ||
      batches[0] ||
      null,
    [batches, selectedBatchId],
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBatch?.id) {
      loadStudents(selectedBatch.id);
    } else {
      setStudents([]);
    }
  }, [selectedBatch?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const schoolResponse = await api.schools.getAll({
        admin_user_id: userId,
      });
      if (!schoolResponse.success || !schoolResponse.data?.length) {
        setSchoolRecord(null);
        return;
      }

      const school = schoolResponse.data[0];
      setSchoolRecord(school);
      localStorage.setItem("schoolId", school.id);

      const [batchesResponse, fieldsResponse] = await Promise.all([
        api.batches.getAll({
          school_id: school.id,
          sortBy: "created_at",
          orderBy: "DESC",
        }),
        api.student_fields.getAll({ school_id: school.id }),
      ]);

      const loadedBatches = batchesResponse.success
        ? batchesResponse.data || []
        : [];
      setBatches(loadedBatches);
      setSelectedBatchId(loadedBatches[0]?.id || "");
      setFields(fieldsResponse.success ? fieldsResponse.data || [] : []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (batchId) => {
    try {
      const studentsResponse = await api.students.getAll({ batch_id: batchId });
      if (studentsResponse.success) {
        setStudents(studentsResponse.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load students");
    }
  };

  const handleSubmitBatch = async () => {
    if (!selectedBatch) return;
    if (
      !window.confirm(
        "Submit this batch? Student editing will be disabled after locking.",
      )
    )
      return;

    setSaving(true);
    setError(null);

    try {
      const response = await api.batches.update(selectedBatch.id, {
        status: "locked",
      });
      if (response.success) {
        setBatches(
          batches.map((batch) =>
            batch.id === selectedBatch.id
              ? { ...batch, status: "locked" }
              : batch,
          ),
        );
      }
    } catch (err) {
      setError(err.message || "Failed to submit batch");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !schoolRecord) return <ErrorMessage message={error} />;
  if (!schoolRecord) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">
          No school account found for this user.
        </p>
        <Link
          to="/signup"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors inline-block"
        >
          Create Account
        </Link>
      </div>
    );
  }

  const progress = selectedBatch
    ? (students.length /
        Number(selectedBatch.max_students || DEFAULT_BATCH_LIMIT)) *
      100
    : 0;
  const batchLocked = selectedBatch?.status === "locked";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          {schoolRecord.logo_url ? (
            <img
              src={schoolRecord.logo_url}
              alt={schoolRecord.name}
              className="h-16 w-16 object-contain"
            />
          ) : (
            <School className="w-12 h-12 text-primary" />
          )}
          <div>
            <h1 className="text-3xl font-bold">School Dashboard</h1>
            <p className="text-gray-600">{schoolRecord.name}</p>
          </div>
        </div>
        {batches.length > 0 && (
          <select
            value={selectedBatch?.id || ""}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                Batch {batch.year} ({batch.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {selectedBatch ? (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-8 h-8 text-primary" />
                <h3 className="text-lg font-semibold">Total Students</h3>
              </div>
              <p className="text-3xl font-bold">
                {students.length} / {selectedBatch.max_students}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-8 h-8 text-warning" />
                <h3 className="text-lg font-semibold">Status</h3>
              </div>
              <p className="text-2xl font-bold capitalize">
                {selectedBatch.status}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="w-8 h-8 text-success" />
                <h3 className="text-lg font-semibold">Progress</h3>
              </div>
              <p className="text-3xl font-bold">{progress.toFixed(0)}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Progress Tracker</h2>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{students.length} students added</span>
              <span>{selectedBatch.max_students} maximum</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {!batchLocked && (
              <Link
                to="/school/students/new"
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors text-center"
              >
                Add New Student
              </Link>
            )}
            {!batchLocked && (
              <button
                onClick={handleSubmitBatch}
                disabled={saving}
                className="flex-1 py-3 bg-success text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {saving ? "Submitting..." : "Submit Batch"}
              </button>
            )}
          </div>

          {fields.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              No custom fields configured yet. You can add them from school
              onboarding before adding students.
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Students</h2>
            {students.length === 0 ? (
              <p className="text-gray-600">
                No students added to this batch yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
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
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {student.image_url && (
                            <img
                              src={student.image_url}
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
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
            )}
          </div>
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-600">
            <p className="mb-6">
              Create your first batch to begin adding students.
            </p>
            <Link
              to={"/school/batches/new"}
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400"
            >
              Create New Batch
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
