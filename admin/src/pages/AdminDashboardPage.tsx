import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axios";
import { toast } from "sonner";
import { LogOut, Users, Home, FileText } from "lucide-react";

interface DashboardData {
  statistics: {
    totalUsers: number;
    totalProperties: number;
    totalMessages: number;
  };
  recentListings: any[];
  recentUsers: any[];
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/dashboard");
      setData(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load dashboard");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear auth and redirect to login
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Room Match Admin</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Home size={20} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "users"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users size={20} />
            Users
          </button>
          <button
            onClick={() => setActiveTab("properties")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "properties"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FileText size={20} />
            Properties
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {data?.statistics.totalUsers}
                    </p>
                  </div>
                  <Users className="text-blue-600" size={40} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Properties
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {data?.statistics.totalProperties}
                    </p>
                  </div>
                  <FileText className="text-green-600" size={40} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Messages
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {data?.statistics.totalMessages}
                    </p>
                  </div>
                  <FileText className="text-purple-600" size={40} />
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Users
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.recentUsers.map((user: any) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.fullName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.userId}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              All Users
            </h2>
            <p className="text-gray-600">User management features coming soon...</p>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === "properties" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              All Properties
            </h2>
            <p className="text-gray-600">
              Property management features coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
