import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute/ProtectedRoute";

import HomePage from "./pages/Home";
import AdminDashboard from "./pages/admin/Dashboard/Dashboard";
import UserManagement from "./pages/admin/UserManagement/UserManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement/DepartmentManagement";
import CategoryManagement from "./pages/admin/CategoryManagement/CategoryManagement";
import PriorityManagement from "./pages/admin/PriorityManagement/PriorityManagement";
import RoleManagement from "./pages/admin/RoleManagement/RoleManagement";
import StatusManagement from "./pages/admin/StatusManagement/StatusManagement";
import Reports from "./pages/admin/Reports/Reports";
import SystemSettings from "./pages/admin/SystemSettings/SystemSettings";
import ActivityLogs from "./pages/admin/ActivityLogs/ActivityLogs";

import Tickets from "./pages/admin/Tickets/Tickets";
import Notifications from "./pages/admin/Notifications/Notifications";
import ManagerDashboard from "./pages/manager/Dashboard";
import AgentDashboard from "./pages/agent/Dashboard/Dashboard";
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
          <Route path="users" element={<UserManagement />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="priorities" element={<PriorityManagement />} />
          <Route path="statuses" element={<StatusManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="activity-logs" element={<ActivityLogs />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
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