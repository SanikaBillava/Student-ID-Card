import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { School } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export default function AllSchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, [pagination.page]);

  const loadSchools = async () => {
    try {
      setLoading(true);

      const response = await api.schools.getAll({
        agent_id: userId,
        page: pagination.page,
        limit: pagination.limit,
      });

      const adminUserIds = response.data.map((s) => s.admin_user_id);
      const uniqueIds = [...new Set(adminUserIds)];

      const usersResults = await Promise.all(
        uniqueIds.map((id) => api.users.getById(id)),
      );

      const userMap = {};
      usersResults.forEach((res) => {
        if (res?.data) {
          userMap[res.data.id] = res.data.phone;
        }
      });

      const responseData = response.data.map((school) => ({
        ...school,
        phone: userMap[school.admin_user_id] || null,
      }));

      if (response.success) {
        setSchools(responseData);
        setPagination((prev) => ({
          ...prev,
          total: response.pagination?.total || responseData.length,
          totalPages:
            response.pagination?.totalPages ||
            Math.ceil((response.pagination?.total || 0) / prev.limit),
        }));
      } else {
        setSchools([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load schools");
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-900">All Schools</h1>
        <p className="text-gray-600 mt-1">
          View all schools registered under your account.
        </p>
      </div>

      {schools.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-600">
          No schools have signed up yet.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Logo
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      School Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {schools.map((school) => (
                    <tr key={school.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {school.logo_url ? (
                          <img
                            src={school.logo_url}
                            alt={school.name}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <School className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {school.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {school.phone || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {school.created_at
                          ? new Date(school.created_at).toLocaleDateString()
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
                  of {pagination.total} schools
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
