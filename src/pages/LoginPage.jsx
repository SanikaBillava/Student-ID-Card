import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import ErrorMessage from "../components/ErrorMessage";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.users.getAll({ phone: formData.phone });
      if (response.success && response.data?.length > 0) {
        const user = response.data.find(
          (item) => item.password === formData.password,
        );

        if (!user) {
          setError("Invalid phone or password");
          return;
        }

        // const dashboardPath = user.role === "agent" ? "/agent" : "/school";
        const dashboardPath = user.role === "agent" ? "/admin" : "/school";
        localStorage.setItem("userId", user.id);
        localStorage.setItem(
          "role",
          user.role === "agent" ? "agent" : "school",
        );
        localStorage.setItem("user_token", user.id);
        navigate(dashboardPath);
      } else {
        setError("Invalid phone or password");
      }
    } catch (err) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <LogIn className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-8">Login</h2>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
