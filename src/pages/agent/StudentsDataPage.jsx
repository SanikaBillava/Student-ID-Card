import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { Users, School } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export default function StudentsDataPage() {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
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
    } else {
      setBatches([]);
      setSelectedBatchId("");
      setStudents([]);
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    if (selectedBatchId) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [selectedBatchId, pagination.page]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await api.schools.getAll({ agent_id: userId });
      if (response.success) {
        setSchools(response.data || []);
        if (response.data?.length > 0) {
          setSelectedSchoolId(response.data[0].id);
        }
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
        if (response.data?.length > 0) {
          setSelectedBatchId(response.data[0].id);
        } else {
          setSelectedBatchId("");
          setStudents([]);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load batches");
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await api.students.getAll({
        batch_id: selectedBatchId,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success) {
        setStudents(response.data || []);
        setPagination((prev) => ({
          ...prev,
          total: response.pagination?.total || response.data?.length || 0,
          totalPages:
            response.pagination?.totalPages ||
            Math.ceil((response.pagination?.total || 0) / prev.limit),
        }));
      } else {
        setStudents([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
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
          onChange={(e) => setSelectedSchoolId(e.target.value)}
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
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                Batch {batch.year}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Students Table */}
      {loadingStudents ? (
        <LoadingSpinner />
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-600">
          No students found in this batch.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Added On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.email || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.created_at
                          ? new Date(student.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total} students
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
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
