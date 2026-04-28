import React from "react";

export default function StudentsTable({
  students = [],
  fields = [],
  fieldValues = {},
  showActions = false,
  onEdit,
  emptyMessage = "No students found.",
  valueFormatter,
}) {
  const getFieldValue = (studentId, fieldId) => {
    const values = fieldValues[studentId] || [];
    const fv = values.find((v) => v.field_id === fieldId);
    const raw = fv?.value;
    if (valueFormatter)
      return valueFormatter(fields.find((f) => f.id === fieldId) || {}, raw);
    return raw ?? "-";
  };

  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Photo
              </th>
              <th className="px-4 py-3 min-w-32 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              {fields.map((field) => (
                <th
                  key={field.id}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  {field.field_name}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Created At
              </th>
              {showActions && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  {student.image_url ? (
                    <img
                      src={student.image_url}
                      alt={student.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zM6 20v-1c0-2.21 3.582-4 6-4s6 1.79 6 4v1H6z" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 min-w-32 text-sm font-medium text-gray-900">
                  {student.name}
                </td>
                {fields.map((field) => (
                  <td
                    key={field.id}
                    className="px-4 py-4 text-sm text-gray-600"
                  >
                    {getFieldValue(student.id, field.id)}
                  </td>
                ))}
                <td className="px-4 py-4 text-sm text-gray-600">
                  {student.created_at
                    ? new Date(student.created_at).toLocaleDateString()
                    : "-"}
                </td>
                {showActions && (
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onEdit && onEdit(student.id)}
                      className="py-2 px-3 text-sm font-medium text-white bg-primaryDark rounded-lg hover:bg-primary-100"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
