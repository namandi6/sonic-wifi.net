import { useState } from "react";
import { Wifi, Users, Activity, TrendingUp, Clock, CheckCircle, AlertCircle, Settings, BarChart3, X } from "lucide-react";

interface AdminDashboardProps {
  onClose: () => void;
}

const mockSessions = [
  { id: "S001", voucher: "ABCD-EFGH-1234", user: "192.168.1.10", package: "Full Speed", timeLeft: "18h 32m", status: "active" },
  { id: "S002", voucher: "WXYZ-MNOP-5678", user: "192.168.1.15", package: "Sprint", timeLeft: "1h 12m", status: "active" },
  { id: "S003", voucher: "QRST-UVWX-9012", user: "192.168.1.22", package: "Quick Dash", timeLeft: "Expired", status: "expired" },
  { id: "S004", voucher: "JKLM-NOPQ-3456", user: "192.168.1.31", package: "Power Week", timeLeft: "5d 14h", status: "active" },
  { id: "S005", voucher: "BCDE-FGHI-7890", user: "192.168.1.45", package: "Full Speed", timeLeft: "22h 5m", status: "active" },
];

const stats = [
  { label: "Active Sessions", value: "4", icon: Users, color: "electric" },
  { label: "Today's Revenue", value: "KES 1,340", icon: TrendingUp, color: "fire" },
  { label: "Total Vouchers Sold", value: "247", icon: BarChart3, color: "electric" },
  { label: "Uptime", value: "99.8%", icon: Activity, color: "fire" },
];

const AdminDashboard = ({ onClose }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"sessions" | "revenue">("sessions");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-electric/20 border border-electric/30 flex items-center justify-center">
            <Settings className="w-4 h-4 text-electric" />
          </div>
          <div>
            <h2 className="font-heading text-xl text-foreground">Admin Dashboard</h2>
            <p className="text-xs text-muted-foreground">Sonic Wi-Fi Management</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg p-2 hover:border-electric/40"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card-sonic rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    stat.color === "fire"
                      ? "bg-fire/20 border border-fire/30"
                      : "bg-electric/20 border border-electric/30"
                  }`}
                >
                  <stat.icon
                    className={`w-4 h-4 ${stat.color === "fire" ? "text-fire" : "text-electric"}`}
                  />
                </div>
              </div>
              <p
                className={`font-display text-3xl mb-1 ${
                  stat.color === "fire" ? "gradient-text-fire" : "gradient-text-electric"
                }`}
              >
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-0">
          {(["sessions", "revenue"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-heading text-sm uppercase tracking-wide border-b-2 transition-all -mb-px ${
                activeTab === tab
                  ? "border-electric text-electric"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "sessions" ? "Active Sessions" : "Revenue"}
            </button>
          ))}
        </div>

        {activeTab === "sessions" && (
          <div className="card-sonic rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Voucher
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Device IP
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Package
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Time Left
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-electric">{session.voucher}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{session.user}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{session.package}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span
                            className={
                              session.status === "expired"
                                ? "text-destructive"
                                : "text-foreground"
                            }
                          >
                            {session.timeLeft}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {session.status === "active" ? (
                            <CheckCircle className="w-4 h-4 text-electric" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span
                            className={`text-xs font-semibold uppercase tracking-wide ${
                              session.status === "active"
                                ? "text-electric"
                                : "text-destructive"
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "revenue" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { pkg: "Quick Dash (1hr)", count: 45, revenue: "KES 900", color: "electric" },
              { pkg: "Sprint (3hr)", count: 38, revenue: "KES 1,900", color: "electric" },
              { pkg: "Full Speed (24hr)", count: 89, revenue: "KES 8,900", color: "fire" },
              { pkg: "Power Week (7d)", count: 52, revenue: "KES 26,000", color: "fire" },
              { pkg: "Sonic Month (30d)", count: 23, revenue: "KES 34,500", color: "electric" },
            ].map((item) => (
              <div key={item.pkg} className="card-sonic rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-heading text-foreground">{item.pkg}</p>
                  <p className="text-sm text-muted-foreground">{item.count} vouchers sold</p>
                </div>
                <span
                  className={`font-display text-2xl ${
                    item.color === "fire" ? "gradient-text-fire" : "gradient-text-electric"
                  }`}
                >
                  {item.revenue}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
