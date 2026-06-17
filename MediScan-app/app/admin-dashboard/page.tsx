"use client";
import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Users,
  UserRound,
  Stethoscope,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
type DashboardStats = {
  total_scans: number;
  total_users: number;
  pneumonia_count: number;
  anomaly_count: number;
  normal_count: number;
  male_count: number;
  female_count: number;
  average_age: number;
};

type PatientRow = {
  id: number;
  patient_name: string;
  age: number;
  gender: string;
  diagnosis_type: string;
  final_status: string;
  has_pneumonia: boolean;
  confidence: number;
  detected_diseases: any[];
  created_at: string;
  created_by: string | null;
};

type UserRow = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
};

type DashboardData = {
  statistics: DashboardStats;
  patients: PatientRow[];
  users: UserRow[];
};

const API_URL = "http://127.0.0.1:8000/api/admin-dashboard/";

export default function AdminDashboardPage() {
  const router = useRouter();                       
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
const [showModal, setShowModal] = useState(false);
const handleEdit = (user: UserRow) => {
  setEditingUser(user);
  setShowModal(true);
};

const handleDelete = async (id: number) => {
  if (!confirm("Delete this user ?")) return;

  const token = getToken();

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/auth/users/${id}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    setData((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.filter((u) => u.id !== id),
          }
        : prev
    );
  } catch (err) {
    alert("Unable to delete user");
  }
};

  const getToken = () => {
    return (
      localStorage.getItem("access") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken")
    );
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          router.push("/login?admin=true&redirect=/admin-dashboard");
          return;
        }

        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (response.status === 403) {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token");

  router.push("/login?admin=true&redirect=/admin-dashboard");
  return;
}

        if (!response.ok) {
          throw new Error(result.detail || result.error || "Erreur dashboard.");
        }

        setData(result);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const diagnosisChartData = useMemo(() => {
    if (!data) return [];

    return [
      { name: "Pneumonie", value: data.statistics.pneumonia_count },
      { name: "Anomalies", value: data.statistics.anomaly_count },
      { name: "Normal", value: data.statistics.normal_count },
    ];
  }, [data]);

  const genderChartData = useMemo(() => {
    if (!data) return [];

    return [
      { name: "Femmes", value: data.statistics.female_count },
      { name: "Hommes", value: data.statistics.male_count },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131619] px-6 py-10 text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#24AE7C]" />
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#131619] px-6 py-10 text-white">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            <h1 className="text-xl font-bold">Erreur d’accès</h1>
          </div>
          <p className="mt-3 text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.statistics;

  const saveUser = async () => {
  if (!editingUser) return;

  const token = getToken();

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/auth/users/${editingUser.id}/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editingUser.username,
          email: editingUser.email,
          is_staff: editingUser.is_staff,
          is_superuser: editingUser.is_superuser,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Update failed");
    }

    const updatedUser = await response.json();

    setData((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.map((u) =>
              u.id === updatedUser.id ? updatedUser : u
            ),
          }
        : prev
    );

    setShowModal(false);
  } catch (err) {
    alert("Unable to update user");
  }
};

  return (
    <div className="min-h-screen bg-[#131619] px-4 py-8 text-gray-100 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-7xl space-y-8"
      >
        <div>
          <p className="text-sm font-medium text-[#24AE7C]">Administration</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Dashboard Admin
          </h1>
          <p className="mt-2 text-gray-400">
            Statistiques des analyses, patients, diagnostics et utilisateurs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total analyses" value={stats.total_scans} icon={<Activity />} />
          <StatCard title="Pneumonie" value={stats.pneumonia_count} icon={<Stethoscope />} />
          <StatCard title="Autres anomalies" value={stats.anomaly_count} icon={<AlertTriangle />} />
          <StatCard title="Normal" value={stats.normal_count} icon={<CheckCircle2 />} />
          <StatCard title="Utilisateurs" value={stats.total_users} icon={<Users />} />
          <StatCard title="Femmes" value={stats.female_count} icon={<UserRound />} />
          <StatCard title="Hommes" value={stats.male_count} icon={<UserRound />} />
          <StatCard title="Âge moyen" value={stats.average_age} icon={<Activity />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Répartition des diagnostics">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={diagnosisChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    background: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" fill="#24AE7C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Répartition par genre">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  <Cell fill="#24AE7C" />
                  <Cell fill="#60a5fa" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Patients analysés</h2>
            <p className="text-sm text-gray-400">
              Liste des patients et leurs diagnostics.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-gray-400">
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Âge</th>
                  <th className="px-4 py-3">Genre</th>
                  <th className="px-4 py-3">Diagnostic</th>
                  <th className="px-4 py-3">Confiance</th>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Date</th>

                </tr>
              </thead>

              <tbody>
                {data.patients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                      Aucun patient analysé pour le moment.
                    </td>
                  </tr>
                ) : (
                  data.patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b border-gray-800/70 hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-3 font-medium">{patient.patient_name}</td>
                      <td className="px-4 py-3">{patient.age}</td>
                      <td className="px-4 py-3">
                        {patient.gender === "male" ? "Homme" : "Femme"}
                      </td>
                      <td className="px-4 py-3">
                        <DiagnosisBadge type={patient.diagnosis_type} />
                      </td>
                      <td className="px-4 py-3">
                        {(patient.confidence * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">{patient.created_by || "-"}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(patient.created_at).toLocaleString()}
                      </td>
                      
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Utilisateurs</h2>
            <p className="text-sm text-gray-400">
              Liste des utilisateurs inscrits.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-gray-400">
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3">Superuser</th>
                  <th className="px-4 py-3">Date inscription</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {data.users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-800/70 hover:bg-gray-800/40"
                  >
                    <td className="px-4 py-3 font-medium">{user.username}</td>
                    <td className="px-4 py-3">{user.email || "-"}</td>
                    <td className="px-4 py-3">{user.is_staff ? "Oui" : "Non"}</td>
                    <td className="px-4 py-3">{user.is_superuser ? "Oui" : "Non"}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(user.date_joined).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(user.id)}
                            className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </motion.div>
      {showModal && editingUser && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="w-full max-w-md rounded-2xl bg-gray-900 p-6">
      <h2 className="mb-4 text-xl font-bold">
        Edit User
      </h2>

      <input
        className="mb-3 w-full rounded border p-2 text-black"
        value={editingUser.username}
        onChange={(e) =>
          setEditingUser({
            ...editingUser,
            username: e.target.value,
          })
        }
      />

      <input
        className="mb-3 w-full rounded border p-2 text-black"
        value={editingUser.email}
        onChange={(e) =>
          setEditingUser({
            ...editingUser,
            email: e.target.value,
          })
        }
      />

      <label className="mb-3 flex gap-2">
        <input
          type="checkbox"
          checked={editingUser.is_staff}
          onChange={(e) =>
            setEditingUser({
              ...editingUser,
              is_staff: e.target.checked,
            })
          }
        />
        Staff
      </label>

      <label className="mb-3 flex gap-2">
        <input
          type="checkbox"
          checked={editingUser.is_superuser}
          onChange={(e) =>
            setEditingUser({
              ...editingUser,
              is_superuser: e.target.checked,
            })
          }
        />
        Superuser
      </label>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => setShowModal(false)}
          className="rounded bg-gray-600 px-4 py-2"
        >
          Cancel
        </button>

        <button
          onClick={saveUser}
          className="rounded bg-green-600 px-4 py-2"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 shadow-xl"
    >
      <div className="rounded-xl bg-[#24AE7C]/10 p-3 text-[#24AE7C] w-fit">
        {icon}
      </div>
      <p className="mt-4 text-sm text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 shadow-xl">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}

function DiagnosisBadge({ type }: { type: string }) {
  const label = formatDiagnosis(type);

  const style =
    type === "pneumonia"
      ? "bg-red-500/15 text-red-300 border-red-500/30"
      : type === "other_pulmonary_disease"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-green-500/15 text-green-300 border-green-500/30";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

function formatDiagnosis(type: string) {
  if (type === "pneumonia") return "Pneumonie";
  if (type === "other_pulmonary_disease") return "Anomalie pulmonaire";
  if (type === "normal") return "Normal";
  return type;
}