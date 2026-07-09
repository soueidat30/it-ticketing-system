import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute/ProtectedRoute";

import UserInactiveNotice from "./components/common/UserInactiveNotice/UserInactiveNotice";

import HomePage from "./pages/Home";
import AdminDashboard from "./pages/admin/Dashboard/Dashboard";
import UserManagement from "./pages/admin/UserManagement/UserManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement/DepartmentManagement";
import CategoryManagement from "./pages/admin/CategoryManagement/CategoryManagement";
import PriorityManagement from "./pages/admin/PriorityManagement/PriorityManagement";

import StatusManagement from "./pages/admin/StatusManagement/StatusManagement";
import Reports from "./pages/admin/Reports/Reports";

import ActivityLogs from "./pages/admin/ActivityLogs/ActivityLogs";

import Tickets from "./pages/admin/Tickets/Tickets";
import Notifications from "./pages/admin/Notifications/Notifications";
import AgentDashboard from "./pages/agent/Dashboard/Dashboard";
import AssignedTickets from "./pages/agent/AssignedTickets/AssignedTickets";
import TicketDetails from "./pages/agent/TicketDetails/TicketDetails";
import UpdateStatus from "./pages/agent/UpdateStatus/UpdateStatus";
import ResolveTicket from "./pages/agent/ResolveTicket/ResolveTicket";
import Profile from "./pages/agent/Profile/Profile";
import Comments from "./pages/agent/Comments/Comments";
import History from "./pages/agent/History/History";
import EmployeeDashboard from "./pages/employee/Dashboard/Dashboard";
import AdminLayout    from "./layouts/AdminLayout";


import ManagerLayout  from "./layouts/ManagerLayout";
import AgentLayout    from "./layouts/AgentLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import ManagerDashboard from "./pages/manager/Dashboard/Dashboard";
import Analytics from "./pages/manager/Analytics/Analytics";
import Report from "./pages/manager/Report/Report";
import ManagerProfile from "./pages/manager/ManagerProfile/ManagerProfile";

import MyTickets from "./pages/employee/MyTickets/MyTickets";
import CreateTicket from "./pages/employee/CreateTicket/CreateTicket";
import TeamTicket from "./pages/manager/Tickets/TeamTicket";
import TeamTicketDetail from "./pages/manager/Tickets/TeamTicketDetail";
import Notification from "./pages/employee/Notification/Notification";
import KnowledgeBase from "./pages/employee/KnowledgeBase/KnowledgeBase";
import EmployeeProfile from "./pages/employee/EmployeeProfile/EmployeeProfile";
import AssetDetails from "./pages/employee/AssetDetails/AssetDetails";
import AssetManagement from "./pages/admin/assets/AssetManagement";
import AssetDetail from "./pages/admin/assets/AssetDetail";
import MyAssets from "./pages/employee/MyAssets/MyAssets";
import ManagerAssets from "./pages/manager/Assets/ManagerAssets";


function App() {
  return (
    <BrowserRouter>
      <UserInactiveNotice />
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* ── Admin ── */}
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
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="priorities" element={<PriorityManagement />} />
          <Route path="statuses" element={<StatusManagement />} />
          <Route path="reports" element={<Reports/>} />
          <Route path="activity-logs" element={<ActivityLogs />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="assets" element={<AssetManagement />} />
          <Route path="assets/:id" element={<AssetDetail />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ── Manager ── */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="team-tickets" element={<TeamTicket />} />
          <Route path="team-tickets/:id" element={<TeamTicketDetail />} />
          <Route path="report" element={<Report />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notification />} />
          <Route path="profile" element={<ManagerProfile />} />
          
          {/* Moved inside the layout so it gets the RoleLanguageProvider */}
          <Route path="assets" element={<ManagerAssets />} />
          
          <Route path="settings" element={<div>Settings Page</div>} />
          <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
        </Route>

        {/* ── Agent ── */}
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
          <Route path="assigned-tickets" element={<AssignedTickets />} />
          <Route path="ticket-details" element={<TicketDetails />} />
          <Route path="update-status" element={<UpdateStatus />} />
          <Route path="resolve-ticket" element={<ResolveTicket />} />
          <Route path="profile" element={<Profile />} />
          <Route path="comments" element={<Comments />} />
          <Route path="history" element={<History />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ── Employee ── */}
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
          <Route path="create-ticket" element={<CreateTicket />} />
          <Route path="my-tickets" element={<MyTickets />} />
          <Route path="my-assets" element={<MyAssets />} />
          <Route path="my-assets/:id" element={<AssetDetails />} />
          <Route path="notification" element={<Notification />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="profile" element={<EmployeeProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;