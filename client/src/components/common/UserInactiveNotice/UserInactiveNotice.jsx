import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  clearInactiveUserNotice,
  getInactiveUserNotice,
} from "../../../services/inactiveUserHandler";

export default function UserInactiveNotice() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    "Your account is deactivated. Please contact the administrator."
  );

  useEffect(() => {
    const notice = getInactiveUserNotice();
    if (!notice?.message) return;

    // Avoid synchronous state updates within the effect body.
    queueMicrotask(() => {
      setMessage(notice.message);
      setOpen(true);

      setTimeout(() => {
        clearInactiveUserNotice();
        setOpen(false);
        navigate("/", { replace: true });
      }, 3000);
    });
  }, [navigate]);


  if (!open) return null;

  return (
    <div
      className="user-inactive-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="user-inactive-modal"
        style={{
          width: "min(520px, 92vw)",
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 42,
            lineHeight: 1,
            color: "#d92d20",
            marginBottom: 12,
          }}
        >
          ⛔
        </div>
        <h2 style={{ margin: "8px 0 10px" }}>Account deactivated</h2>
        <p style={{ margin: 0, color: "#444" }}>{message}</p>
        <p style={{ margin: "12px 0 0", color: "#777" }}>
          You will be logged out automatically...
        </p>
      </div>
    </div>
  );
}

