import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user) {
        return <Navigate to="/" replace />;
    }

const role = typeof user.role === "object" ? user.role.name : user.role;

    // If admin deactivates user, backend login is blocked, but also guard route access.
    // Note: we don't rely on user.status stored in localStorage (can be stale).
    // The backend blocks inactive users and the frontend logout happens on API error.

    if (!allowedRoles.includes(role)) {

        return role ? <Navigate to={`/${role}/dashboard`} replace /> : <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;