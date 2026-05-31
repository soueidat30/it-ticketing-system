import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute/ProtectedRoute";

import HomePage from "./pages/Home";
import AdminDashboard from "./pages/admin/Dashboard";
import ManagerDashboard from "./pages/manager/Dashboard";
import AgentDashboard from "./pages/agent/Dashboard";
import EmployeeDashboard from "./pages/employee/Dashboard";
import AdminLayout    from "./layouts/AdminLayout";
import ManagerLayout  from "./layouts/ManagerLayout";
import AgentLayout    from "./layouts/AgentLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
        </Route>
        <Route
          path="/agent"
          element={
            <ProtectedRoute allowedRoles={["agent"]}>
              <AgentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AgentDashboard />} />
        </Route>
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;