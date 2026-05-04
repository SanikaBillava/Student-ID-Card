import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const FIELD_TYPES = ["text", "number", "date"];
const COMMON_FIELDS = [
  { field_name: "Father Name", field_type: "text" },
  { field_name: "Mother Name", field_type: "text" },
  { field_name: "Phone", field_type: "text" },
  { field_name: "Address", field_type: "text" },
  { field_name: "DOB", field_type: "date" },
  { field_name: "Class", field_type: "number" },
  { field_name: "Roll Number", field_type: "number" },
];

export default function Setting() {
  const [school, setSchool] = useState(null);
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "text",
    is_required: false,
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(false);
  const [deletingFieldId, setDeletingFieldId] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState(null);

  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  useEffect(() => {
    loadSettings();
  }, []);

  const existingFieldNames = useMemo(
    () => new Set(fields.map((field) => field.field_name.toLowerCase())),
    [fields],
  );

  const availableCommonFields = COMMON_FIELDS.filter(
    (field) => !existingFieldNames.has(field.field_name.toLowerCase()),
  );

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const schoolResponse = await api.schools.getAll({
        admin_user_id: userId,
      });

      if (!schoolResponse.success || !schoolResponse.data?.length) {
        setError("School account was not found");
        return;
      }

      const schoolRecord = schoolResponse.data[0];
      setSchool(schoolRecord);
      localStorage.setItem("schoolId", schoolRecord.id);

      const fieldsResponse = await api.student_fields.getAll({
        school_id: schoolRecord.id,
      });
      setFields(fieldsResponse.success ? fieldsResponse.data || [] : []);
    } catch (err) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async (field = newField) => {
    const fieldName = field.field_name.trim();

    if (!school?.id) {
      setError("School account was not found");
      return;
    }

    if (!fieldName) {
      setError("Field name is required");
      return;
    }

    if (existingFieldNames.has(fieldName.toLowerCase())) {
      setError("This field already exists");
      return;
    }

    try {
      setSavingField(true);
      setError(null);
      const response = await api.student_fields.create({
        school_id: school.id,
        field_name: fieldName,
        field_type: field.field_type,
        is_required: field.is_required || false,
      });

      if (response.success) {
        setFields((prev) => [...prev, response.data]);
        setNewField({
          field_name: "",
          field_type: "text",
          is_required: false,
        });
        toast.success("Student field added");
      }
    } catch (err) {
      toast.error(err.message || "Failed to add student field");
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteField = async (field) => {
    const confirmed = window.confirm(
      `Delete ${field.field_name}? Existing student values for this field may no longer be shown.`,
    );

    if (!confirmed) return;

    try {
      setDeletingFieldId(field.id);
      await api.student_fields.delete(field.id);
      setFields((prev) => prev.filter((item) => item.id !== field.id));
      toast.success("Student field deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete student field");
    } finally {
      setDeletingFieldId(null);
    }
  };

  const handlePasswordChange = (event) => {
    setPasswords((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwords.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setSavingPassword(true);
      const userResponse = await api.users.getById(userId);
      const user = userResponse.data;

      if (user?.password !== passwords.currentPassword) {
        toast.error("Current password is incorrect");
        return;
      }

      await api.users.update(userId, {
        name: user.name,
        phone: user.phone,
        role: user.role,
        password: passwords.newPassword,
      });

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password updated");
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3">
          <Settings2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage student fields and account password.
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Student Fields
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Name and Photo are always required. Add or delete the extra fields
          used for student records.
        </p>

        {availableCommonFields.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Common Fields
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableCommonFields.map((field) => (
                <button
                  key={field.field_name}
                  type="button"
                  onClick={() => handleAddField(field)}
                  disabled={savingField}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    <span className="block font-medium text-gray-900">
                      {field.field_name}
                    </span>
                    <span className="text-xs uppercase text-gray-500">
                      {field.field_type}
                    </span>
                  </span>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Add Custom Field
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto_auto] md:items-center">
            <input
              type="text"
              placeholder="Field Name"
              value={newField.field_name}
              onChange={(event) =>
                setNewField((prev) => ({
                  ...prev,
                  field_name: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
            />
            <select
              value={newField.field_type}
              onChange={(event) =>
                setNewField((prev) => ({
                  ...prev,
                  field_type: event.target.value,
                }))
              }
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={newField.is_required}
                onChange={(event) =>
                  setNewField((prev) => ({
                    ...prev,
                    is_required: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Required
            </label>
            <button
              type="button"
              onClick={() => handleAddField()}
              disabled={savingField}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              <Plus className="h-4 w-4" />
              {savingField ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Field Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Required
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fields.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-6 text-center text-sm text-gray-600"
                  >
                    No extra student fields configured yet.
                  </td>
                </tr>
              ) : (
                fields.map((field) => (
                  <tr key={field.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {field.field_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {field.field_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {field.is_required ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field)}
                        disabled={deletingFieldId === field.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingFieldId === field.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form
        onSubmit={handlePasswordSubmit}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900">
          Update Password
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              required
              minLength="6"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              required
              minLength="6"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingPassword}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {savingPassword ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
