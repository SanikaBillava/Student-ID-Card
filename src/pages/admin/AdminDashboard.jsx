import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('user_token');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const batchResponse = await api.batches.getAll({ user_id: userId, sortBy: 'created_at', orderBy: 'DESC' });
      if (batchResponse.success && batchResponse.data?.length > 0) {
        const currentBatch = batchResponse.data[0];
        setBatch(currentBatch);
        const studentsResponse = await api.students.getAll({ batch_id: currentBatch.id });
        if (studentsResponse.success) {
          setStudents(studentsResponse.data || []);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!batch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No batch found. Please complete the configuration setup.</p>
        <Link to="/configuration" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors inline-block">
          Start Configuration
        </Link>
      </div>
    );
  }

  const progress = (Number(batch.total_students) / Number(batch.max_students)) * 100;
  const canSubmit = Number(batch.total_students) >= Number(batch.max_students);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {batch.school_logo && (
          <img src={batch.school_logo} alt="School Logo" className="h-16 w-16 object-contain" />
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-8 h-8 text-primary" />
            <h3 className="text-lg font-semibold">Total Students</h3>
          </div>
          <p className="text-3xl font-bold">{batch.total_students} / {batch.max_students}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-8 h-8 text-warning" />
            <h3 className="text-lg font-semibold">Status</h3>
          </div>
          <p className="text-2xl font-bold capitalize">{batch.status}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-3 mb-2">
            <CheckCircle className="w-8 h-8 text-success" />
            <h3 className="text-lg font-semibold">Progress</h3>
          </div>
          <p className="text-3xl font-bold">{progress.toFixed(0)}%</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-3 mb-2">
            <AlertCircle className="w-8 h-8 text-info" />
            <h3 className="text-lg font-semibold">Remaining</h3>
          </div>
          <p className="text-3xl font-bold">{batch.max_students - batch.total_students}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Progress Tracker</h2>
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{batch.total_students} students added</span>
            <span>{batch.max_students} required</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-primary h-4 rounded-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
        </div>
        {!canSubmit && (
          <p className="text-sm text-gray-600 mt-2">Add {batch.max_students - batch.total_students} more students to enable submission.</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/admin/students/new" className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors text-center">
          Add New Student
        </Link>
        {canSubmit && batch.status === 'draft' && (
          <Link to="/admin/review" className="flex-1 py-3 bg-success text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-center">
            Review & Submit
          </Link>
        )}
      </div>

      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Students</h2>
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
                {students.slice(0, 5).map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                    </td>
                    <td className="px-4 py-3">{student.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(student.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}