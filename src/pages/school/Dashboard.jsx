import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { Users, Clock, School } from "lucide-react";

export default function SchoolDashboard() {
  const [schoolRecord, setSchoolRecord] = useState(null);
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (batch?.id) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [batch?.id]);

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

      // Load fields
      const fieldsResponse = await api.student_fields.getAll({
        school_id: school.id,
      });
      setFields(fieldsResponse.success ? fieldsResponse.data || [] : []);

      // Get current year's batch
      const currentYear = new Date().getFullYear();
      const batchesResponse = await api.batches.getAll({
        school_id: school.id,
        sortBy: "created_at",
        orderBy: "DESC",
      });

      if (batchesResponse.success && batchesResponse.data?.length > 0) {
        // Find current year batch
        const currentYearBatch = batchesResponse.data.find(
          (b) => b.year === currentYear,
        );
        setBatch(currentYearBatch || null);
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!batch) return;

    try {
      const studentsResponse = await api.students.getAll({
        batch_id: batch.id,
        page: 1,
        limit: 5,
      });

      if (studentsResponse.success) {
        setStudents(studentsResponse.data || []);

        // Load custom field values for last 5 students
        if (studentsResponse.data?.length > 0) {
          loadFieldValues(studentsResponse.data.map((s) => s.id));
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load students");
    }
  };

  const loadFieldValues = async (studentIds) => {
    try {
      const valuesMap = {};
      for (const studentId of studentIds) {
        const response = await api.student_field_values.getAll({
          student_id: studentId,
        });
        if (response.success && response.data) {
          valuesMap[studentId] = response.data;
        }
      }
      setFieldValues(valuesMap);
    } catch (err) {
      console.error("Failed to load field values:", err);
    }
  };

  const handleSubmitBatch = async () => {
    if (!batch) return;
    if (
      !window.confirm(
        "Lock this batch? Student editing will be disabled after locking.",
      )
    )
      return;

    setSaving(true);
    setError(null);

    try {
      const response = await api.batches.update(batch.id, {
        status: "locked",
      });
      if (response.success) {
        setBatch({ ...batch, status: "locked" });
      }
    } catch (err) {
      setError(err.message || "Failed to lock batch");
    } finally {
      setSaving(false);
    }
  };

  const getFieldValue = (studentId, fieldId) => {
    const values = fieldValues[studentId] || [];
    const fieldValue = values.find((v) => v.field_id === fieldId);
    return fieldValue?.value || "-";
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

  const batchLocked = batch?.status === "locked";

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
        {batch && (
          <div className="text-sm text-gray-600">Batch {batch.year}</div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {batch ? (
        <>
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-8 h-8 text-primary" />
                <h3 className="text-lg font-semibold">Total Students</h3>
              </div>
              <p className="text-3xl font-bold">{students.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-8 h-8 text-secondary" />
                <h3 className="text-lg font-semibold">Max Students</h3>
              </div>
              <p className="text-3xl font-bold">{batch.max_students}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-8 h-8 text-warning" />
                <h3 className="text-lg font-semibold">Status</h3>
              </div>
              <p className="text-2xl font-bold capitalize">{batch.status}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/school/students"
              className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors text-center"
            >
              View All Students
            </Link>
            {!batchLocked && (
              <button
                onClick={handleSubmitBatch}
                disabled={saving}
                className="flex-1 py-3 bg-success text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {saving ? "Locking..." : "Lock Data"}
              </button>
            )}
          </div>

          {fields.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              No custom fields configured yet. You can add them from school
              onboarding before adding students.
            </div>
          )}

          {/* Last 5 Students */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Recent Students</h2>
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
                      {fields.map((field) => (
                        <th
                          key={field.id}
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          {field.field_name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Added On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {student.image_url ? (
                            <img
                              src={student.image_url}
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {student.name}
                        </td>
                        {fields.map((field) => (
                          <td
                            key={field.id}
                            className="px-4 py-3 text-sm text-gray-600"
                          >
                            {getFieldValue(student.id, field.id)}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.created_at
                            ? new Date(student.created_at).toLocaleDateString()
                            : "-"}
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
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">
            No batch found for the current year. Create a batch to get started.
          </p>
          <Link
            to="/school/batches/new"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors inline-block"
          >
            Create Batch
          </Link>
        </div>
      )}
    </div>
  );
}
