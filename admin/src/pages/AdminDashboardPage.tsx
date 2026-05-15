import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axios";
import { toast } from "sonner";
import { LogOut, Users, Home, FileText } from "lucide-react";
import { palette } from "../../../frontend/src/theme/palette"; // Adjust this path to your palette file
import "../../../frontend/src/index.css"; 
import "../index.css";
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
  }

  const handleLogout = () => {
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: palette.pageBg }}>
        <div className="text-xl" style={{ color: palette.deep }}>Loading Admin Panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: palette.pageBg, color: palette.deep }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: palette.sectionBg, borderBottom: `1px solid ${palette.border}` }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Room Match Admin</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition hover:opacity-80"
            style={{ backgroundColor: palette.cardMutedBg, color: palette.deep }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {[
            { id: "dashboard", icon: <Home size={20} />, label: "Dashboard" },
            { id: "users", icon: <Users size={20} />, label: "Users" },
            { id: "properties", icon: <FileText size={20} />, label: "Properties" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
              style={{
                backgroundColor: activeTab === tab.id ? palette.purple : palette.cardBg,
                color: activeTab === tab.id ? "#fff" : palette.deep,
                border: `1px solid ${palette.border}`
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Total Users", val: data?.statistics.totalUsers, icon: <Users size={40} color={palette.purple}/> },
                { label: "Total Properties", val: data?.statistics.totalProperties, icon: <FileText size={40} color={palette.deep}/> },
                { label: "Total Messages", val: data?.statistics.totalMessages, icon: <FileText size={40} color={palette.softPurple}/> },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl shadow-sm p-6 border" style={{ backgroundColor: palette.cardBg, borderColor: palette.border }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-70">{stat.label}</p>
                      <p className="text-3xl font-bold mt-2">{stat.val}</p>
                    </div>
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Users Table */}
            <div className="rounded-xl shadow-sm overflow-hidden border" style={{ backgroundColor: palette.cardBg, borderColor: palette.border }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: palette.border }}>
                <h2 className="text-lg font-semibold">Recent Users (Internal)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: palette.cardMutedBg }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Role</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: palette.border }}>
                    {/* FILTERING LOGIC: We exclude 'admin' from being shown in the matching-style list */}
                    {data?.recentUsers
                      .filter((user: any) => user.role !== "admin")
                      .map((user: any) => (
                      <tr key={user._id} className="transition-colors" style={{ borderBottom: `1px solid ${palette.border}` }}>
                        <td className="px-6 py-4 text-sm font-medium">{user.fullName}</td>
                        <td className="px-6 py-4 text-sm opacity-70">{user.userId}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: palette.softPurple, color: palette.deep }}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm opacity-70">
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

        {/* Other Tabs Placeholder */}
        {(activeTab === "users" || activeTab === "properties") && (
          <div className="rounded-xl shadow p-12 text-center border" style={{ backgroundColor: palette.cardBg, borderColor: palette.border }}>
             <p className="opacity-60">Management interface for {activeTab} loading using {palette.purple} theme...</p>
          </div>
        )}
      </div>
    </div>
  );
}