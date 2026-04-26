import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import FileUpload from "../components/FileUpload";
import ErrorMessage from "../components/ErrorMessage";
import { UserCircle2 } from "lucide-react";
import { AGENT_ID } from "../constants";

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  // const agentId = searchParams.get("agentId");
  // const isSchoolSignup = Boolean(agentId);
  const agentId = AGENT_ID; // default agent ID for all school signups
  const isSchoolSignup = true; // default to school signup for now
  const [formData, setFormData] = useState({
    name: "",
    school_name: "",
    phone: "",
    password: "",
    logo_url: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (url) => {
    setFormData({ ...formData, logo_url: url });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userResponse = await api.users.create({
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        role: isSchoolSignup ? "school" : "agent",
      });

      if (userResponse.success) {
        const user = userResponse.data;
        localStorage.setItem("userId", user.id);
        localStorage.setItem("role", isSchoolSignup ? "school" : "agent");
        localStorage.setItem("user_token", user.id);

        if (isSchoolSignup) {
          const schoolResponse = await api.schools.create({
            agent_id: agentId,
            admin_user_id: user.id,
            name: formData.school_name,
            logo_url: formData.logo_url,
          });

          if (schoolResponse.success) {
            localStorage.setItem("schoolId", schoolResponse.data.id);
            navigate("/school-onboarding");
          }
        } else {
          navigate("/agent");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <UserCircle2 className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-8">
          {isSchoolSignup ? "School Signup" : "Agent Signup"}
        </h2>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSchoolSignup && (
            <div>
              <label className="block text-sm font-medium mb-2">
                School Name *
              </label>
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{`${isSchoolSignup ? "Contact Person" : "Agent Name"} *`}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {isSchoolSignup && (
            <div>
              <label className="block text-sm font-medium mb-2">
                School Logo
              </label>
              <FileUpload onUploadSuccess={handleLogoUpload} accept="image/*" />
              {formData.logo_url && (
                <div className="mt-2">
                  <img
                    src={formData.logo_url}
                    alt="School Logo"
                    className="h-20 w-20 object-contain"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
