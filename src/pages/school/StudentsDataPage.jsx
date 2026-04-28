import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import StudentsTable from "../../components/shared/StudentsTable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { valueFormatter } from "../../utils";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export default function StudentsDataPage() {
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 0,
  });

  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (batch) loadStudents();
  }, [batch, meta.page]);

  const loadData = async () => {
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

      const fieldsResponse = await api.student_fields.getAll({
        school_id: school.id,
      });
      if (fieldsResponse.success) setFields(fieldsResponse.data || []);

      const batchesResponse = await api.batches.getAll({
        school_id: school.id,
        sortBy: "created_at",
        orderBy: "DESC",
      });
      if (batchesResponse.success && batchesResponse.data?.length > 0) {
        setBatches(batchesResponse.data || []);
        setBatch(batchesResponse.data[0] || null);
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
      setLoadingStudents(true);
      const response = await api.students.getAll({
        batch_id: batch.id,
        page: meta.page,
        limit: meta.limit,
      });

      if (response.success) {
        setStudents(response.data || []);
        setMeta((prev) => ({
          ...prev,
          total: response.meta?.total || response.data?.length || 0,
          totalPages:
            response.meta?.totalPages ||
            Math.ceil((response.meta?.total || 0) / prev.limit),
        }));

        if (response.data?.length > 0)
          loadFieldValues(response.data.map((s) => s.id));
      } else {
        setStudents([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadFieldValues = async (studentIds) => {
    try {
      const valuesMap = {};
      for (const studentId of studentIds) {
        const response = await api.student_field_values.getAll({
          student_id: studentId,
        });
        if (response.success && response.data)
          valuesMap[studentId] = response.data;
      }
      setFieldValues(valuesMap);
    } catch (err) {
      console.error("Failed to load field values:", err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages)
      setMeta((prev) => ({ ...prev, page: newPage }));
  };

  const handleEditStudent = (studentId) =>
    navigate(`/school/students/${studentId}/edit`);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900">Students Data</h1>
        <p className="text-gray-600 mt-1">
          View all students in your batches.
          {batches.length > 0 && (
            <span className="ml-2">
              <select
                value={batch?.id || ""}
                onChange={(e) => {
                  const sel = batches.find((b) => b.id === e.target.value);
                  setBatch(sel || null);
                }}
                className="ml-2 px-2 py-1 border border-gray-200 rounded-md"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {" - "}
              {batch?.status}
            </span>
          )}
        </p>
      </div>

      {!batch ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-600">
          No batch found. Create a batch first to add students.
        </div>
      ) : loadingStudents ? (
        <LoadingSpinner />
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-600">
          No students found in this batch.
        </div>
      ) : (
        <>
          <StudentsTable
            students={students}
            fields={fields}
            fieldValues={fieldValues}
            showActions={batch.status !== "locked"}
            onEdit={handleEditStudent}
            valueFormatter={valueFormatter}
            emptyMessage={"No students found in this batch."}
          />

          {meta.totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(meta.page - 1) * meta.limit + 1} to{" "}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
                  students
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(meta.page - 1)}
                    disabled={meta.page === 1}
                    className="p-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(meta.page + 1)}
                    disabled={meta.page === meta.totalPages}
                    className="p-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
