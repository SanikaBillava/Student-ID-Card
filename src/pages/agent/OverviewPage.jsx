import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { School, Users, Lock, Copy } from "lucide-react";

export default function OverviewPage() {
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalStudents: 0,
    totalLocked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");

  const inviteLink = `${window.location.origin}/signup?agentId=${userId}`;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get all schools for this agent
      const schoolsResponse = await api.schools.getAll({ agent_id: userId });
      const schools = schoolsResponse.success ? schoolsResponse.data || [] : [];

      let totalStudents = 0;
      let totalLocked = 0;

      // For each school, get batches and students
      for (const school of schools) {
        const batchesResponse = await api.batches.getAll({
          school_id: school.id,
          status: "locked",
        });
        const lockedBatches = batchesResponse.success
          ? batchesResponse.data || []
          : [];

        totalLocked += lockedBatches.length;

        // Get students for each locked batch
        for (const batch of lockedBatches) {
          const studentsResponse = await api.students.getAll({
            batch_id: batch.id,
          });
          const students = studentsResponse.success
            ? studentsResponse.data || []
            : [];
          totalStudents += students.length;
        }
      }

      setStats({
        totalSchools: schools.length,
        totalStudents,
        totalLocked,
      });
    } catch (err) {
      setError(err.message || "Failed to load stats");
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

  const statCards = [
    {
      label: "Total Schools",
      value: stats.totalSchools,
      icon: School,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Total Locked Batches",
      value: stats.totalLocked,
      icon: Lock,
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Invite Link Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Overview</h1>
            <p className="text-gray-600 mt-1">
              View your agent dashboard summary and invite schools.
            </p>
          </div>
          <button
            onClick={copyInviteLink}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? "Copied" : "Invite School"}</span>
          </button>
        </div>
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm break-all">
          {inviteLink}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
