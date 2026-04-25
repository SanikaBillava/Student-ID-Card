import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Copy, School, Users } from 'lucide-react';

export default function AgentDashboard() {
  const [schools, setSchools] = useState([]);
  const [batchesBySchool, setBatchesBySchool] = useState({});
  const [studentsByBatch, setStudentsByBatch] = useState({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_token');

  const inviteLink = useMemo(() => {
    if (!userId) return '';
    return `${window.location.origin}/signup?agentId=${userId}`;
  }, [userId]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const schoolsResponse = await api.schools.getAll({ agent_id: userId });
      const agentSchools = schoolsResponse.success ? schoolsResponse.data || [] : [];
      const nextBatchesBySchool = {};
      const nextStudentsByBatch = {};

      for (const school of agentSchools) {
        const batchesResponse = await api.batches.getAll({ school_id: school.id, status: 'locked' });
        const lockedBatches = batchesResponse.success ? batchesResponse.data || [] : [];
        nextBatchesBySchool[school.id] = lockedBatches;

        for (const batch of lockedBatches) {
          const studentsResponse = await api.students.getAll({ batch_id: batch.id });
          nextStudentsByBatch[batch.id] = studentsResponse.success ? studentsResponse.data || [] : [];
        }
      }

      setSchools(agentSchools);
      setBatchesBySchool(nextBatchesBySchool);
      setStudentsByBatch(nextStudentsByBatch);
    } catch (err) {
      setError(err.message || 'Failed to load agent dashboard');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Agent Dashboard</h1>
              <p className="text-gray-600 mt-1">Invite schools and review locked batch data.</p>
            </div>
            <button onClick={copyInviteLink} className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors">
              <Copy className="w-4 h-4" />
              <span>{copied ? 'Copied' : 'Invite School'}</span>
            </button>
          </div>
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm break-all">{inviteLink}</div>
        </div>

        {schools.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-600">No schools have signed up from your invite yet.</div>
        ) : (
          <div className="space-y-6">
            {schools.map((school) => (
              <div key={school.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-3 mb-4">
                  {school.logo_url ? <img src={school.logo_url} alt={school.name} className="w-12 h-12 object-contain" /> : <School className="w-10 h-10 text-primary" />}
                  <h2 className="text-2xl font-bold">{school.name}</h2>
                </div>

                {(batchesBySchool[school.id] || []).length === 0 ? (
                  <p className="text-gray-600">No locked batches yet.</p>
                ) : (
                  <div className="space-y-5">
                    {batchesBySchool[school.id].map((batch) => (
                      <div key={batch.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold">Batch {batch.year}</h3>
                          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">Locked</span>
                        </div>
                        {(studentsByBatch[batch.id] || []).length === 0 ? (
                          <p className="text-gray-600">No students in this batch.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold">Photo</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold">Added On</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {studentsByBatch[batch.id].map((student) => (
                                  <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{student.image_url ? <img src={student.image_url} alt={student.name} className="w-12 h-12 rounded-full object-cover" /> : <Users className="w-8 h-8 text-gray-400" />}</td>
                                    <td className="px-4 py-3">{student.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(student.created_at).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
