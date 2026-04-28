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
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
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
    loadSchools();
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      loadBatches(selectedSchoolId);
      loadFields(selectedSchoolId);
    } else {
      setBatches([]);
      setSelectedBatchId("");
      setStudents([]);
      setFields([]);
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    if (selectedBatchId) loadStudents();
    else setStudents([]);
  }, [selectedBatchId, meta.page]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await api.schools.getAll({ agent_id: userId });
      if (response.success) {
        setSchools(response.data || []);
        if (response.data?.length > 0) setSelectedSchoolId(response.data[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async (schoolId) => {
    try {
      const response = await api.batches.getAll({
        school_id: schoolId,
        status: "locked",
      });
      if (response.success) {
        setBatches(response.data || []);
        if (response.data?.length > 0) setSelectedBatchId(response.data[0].id);
        else {
          setSelectedBatchId("");
          setStudents([]);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load batches");
    }
  };

  const loadFields = async (schoolId) => {
    try {
      const response = await api.student_fields.getAll({ school_id: schoolId });
      if (response.success) setFields(response.data || []);
    } catch (err) {
      console.error("Failed to load fields:", err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await api.students.getAll({
        batch_id: selectedBatchId,
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
      } else setStudents([]);
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

  const getFieldValue = (studentId, fieldId) => {
    const values = fieldValues[studentId] || [];
    const fieldValue = values.find((v) => v.field_id === fieldId);
    return fieldValue?.value || "-";
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900">Students Data</h1>
        <p className="text-gray-600 mt-1">View students by school and batch.</p>
      </div>

      {/* School Selection */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select School
        </label>
        <select
          value={selectedSchoolId}
          onChange={(e) => {
            setSelectedSchoolId(e.target.value);
            setMeta((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      {/* Batch Selection */}
      {batches.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              setMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loadingStudents ? (
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
            showActions={false}
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
