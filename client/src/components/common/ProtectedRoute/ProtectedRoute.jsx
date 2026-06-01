import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user) {
        return <Navigate to="/" replace />;
    }

const role = typeof user.role === "object" ? user.role.name : user.role;

    if (!allowedRoles.includes(role)) {
        return role ? <Navigate to={`/${role}/dashboard`} replace /> : <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;