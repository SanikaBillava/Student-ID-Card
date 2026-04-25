import { PlusCircle } from "lucide-react";
import React, { useState } from "react";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../../components/ErrorMessage";

export default function CreateBatch() {
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [batchForm, setBatchForm] = useState({
    year: new Date().getFullYear(),
    max_students:
      localStorage.getItem("defaultBatchLimit") || DEFAULT_BATCH_LIMIT,
  });

  const schoolId = localStorage.getItem("schoolId");

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    console.log(batchForm, "bf");
    // if (!schoolRecord) return;

    setSaving(true);
    setError(null);

    try {
      const response = await api.batches.create({
        school_id: schoolId,
        year: Number(batchForm.year),
        max_students: Number(batchForm.max_students) || DEFAULT_BATCH_LIMIT,
        status: "draft",
      });

      if (response.success) {
        // const nextBatches = [response.data, ...batches];
        // setBatches(nextBatches);
        // setSelectedBatchId(response.data.id);
        navigate("/school-dashboard");
      }
    } catch (err) {
      console.log(err);
      setError(err.message || "Failed to create batch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-4">{error && <ErrorMessage message={error} />}</div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <PlusCircle className="w-7 h-7 text-primary" />
          <h2 className="text-2xl font-bold">Create Batch</h2>
        </div>
        <form
          onSubmit={handleCreateBatch}
          className="grid md:grid-cols-[1fr_1fr_auto] gap-4"
        >
          <input
            type="number"
            name="year"
            value={batchForm.year}
            onChange={(e) =>
              setBatchForm({ ...batchForm, year: e.target.value })
            }
            required
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
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
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Create Batch"}
          </button>
        </form>
      </div>
    </>
  );
}
