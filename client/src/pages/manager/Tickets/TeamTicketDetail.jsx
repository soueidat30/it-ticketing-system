import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./TeamTicketDetail.css";

import {
  getTicketById,
  getTicketComments,
  addTicketComment
} from "../../../services/ticketService";

export default function TeamTicketDetail() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const t = await getTicketById(token, id);
        const c = await getTicketComments(token, id);

        setTicket(t);
        setComments(Array.isArray(c) ? c : []);
      } catch (err) {
        console.error("Error loading ticket:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token && id) fetchData();
  }, [token, id]);

  const addComment = async () => {
    if (!text.trim()) return;

    try {
      await addTicketComment(token, id, text);

      const updated = await getTicketComments(token, id);
      setComments(Array.isArray(updated) ? updated : []);

      setText("");
    } catch (err) {
      console.error("Add comment failed:", err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!ticket) return <p>No ticket found</p>;

  return (
    <div className="td-page">

      {/* TICKET HEADER */}
      <div className="td-card">
        <h2 className="td-title">{ticket.title}</h2>
        <p className="td-sub">
          Ticket #{ticket.id} • Status:{" "}
          <b>{ticket.status?.status_name}</b>
        </p>
      </div>

      {/* COMMENTS */}
      <div className="td-card">
        <h3>Comments</h3>

        <div className="td-comments">
          {comments.length === 0 ? (
            <p>No comments yet</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="td-comment">
                <b>{c.user?.full_name}</b>
                <p>{c.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* INPUT */}
        <div className="td-input">
          <textarea
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button onClick={addComment}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}