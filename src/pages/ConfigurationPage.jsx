import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import ErrorMessage from '../components/ErrorMessage';
import { Settings2, Plus, X } from 'lucide-react';
import { STUDENT_BATCH_LIMIT } from '../data/appConfig';

export default function ConfigurationPage() {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ name: '', type: 'text', required: true });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_token');

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return;

      try {
        const response = await api.users.getById(userId);
        if (response.success && response.data) {
          setSchoolName(response.data.school_name || '');
        }
      } catch (err) {
        console.error('Failed to load user details:', err);
      }
    };

    loadUser();
  }, [userId]);

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' }
  ];

  const addField = () => {
    if (!newField.name.trim()) {
      setError('Field name is required');
      return;
    }
    setFields([...fields, { ...newField, display_order: fields.length + 1 }]);
    setNewField({ name: '', type: 'text', required: true });
    setError(null);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fields.length === 0) {
      setError('Please add at least one custom field');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const batchData = {
        user_id: userId,
        school_name: schoolName,
        status: 'draft',
        total_students: 0,
        max_students: STUDENT_BATCH_LIMIT
      };
      const batchResponse = await api.batches.create(batchData);
      
      if (batchResponse.success) {
        const batchId = batchResponse.data.id;
        for (const field of fields) {
          await api.field_configurations.create({
            batch_id: batchId,
            field_name: field.name,
            field_type: field.type,
            is_required: field.required,
            display_order: field.display_order
          });
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <Settings2 className="w-10 h-10 text-primary" />
          <h2 className="text-3xl font-bold">Configuration Setup</h2>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800"><strong>Note:</strong> Student Name and Photo are mandatory fields. Configure additional custom fields below.</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Add Custom Fields</h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input type="text" placeholder="Field Name (e.g., Father Name)" value={newField.name} onChange={(e) => setNewField({ ...newField, name: e.target.value })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
            <select value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg">
              {fieldTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={newField.required} onChange={(e) => setNewField({ ...newField, required: e.target.checked })} className="w-4 h-4" />
              <span>Required</span>
            </label>
            <button onClick={addField} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {fields.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Configured Fields</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">Student Name</span>
                  <span className="text-sm text-gray-600">(Mandatory)</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">Student Photo</span>
                  <span className="text-sm text-gray-600">(Mandatory)</span>
                </div>
              </div>
              {fields.map((field, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">{field.name}</span>
                    <span className="text-sm text-gray-600">({field.type})</span>
                    {field.required && <span className="text-sm text-red-600">*</span>}
                  </div>
                  <button onClick={() => removeField(index)} className="text-red-600 hover:text-red-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || fields.length === 0} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400">
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}