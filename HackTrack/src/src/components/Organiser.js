import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from "../api";

const Organiser = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage({ text: "You must be logged in to view this page.", type: "error" });
          return;
        }

        const response = await api.get("/api/events/organizer", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Only future events
        const upcoming = response.data.filter(
          (evt) => new Date(evt.date_time) > new Date()
        );
        setEvents(upcoming);
      } catch (err) {
        console.error("Error fetching organizer events:", err);
        setMessage({
          text: err.response?.data?.error || "Failed to load events",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerEvents();
  }, []);

  // Helper to build image URL
  const getImageUrl = (filename) => {
    if (!filename) {
      return "https://via.placeholder.com/400x200?text=No+Image";
    }
    // Assumes api.defaults.baseURL ends in your backend host (e.g. http://localhost:5000)
    return `${api.defaults.baseURL}/uploads/${filename}`;
  };

  return (
    <div>
      {/* Back Button */}
      <button
        className="btn btn-dark text-white mb-3 ms-3 mt-3"
        onClick={() => navigate("/HomePage")}
      >
        <i className="bi bi-arrow-left"></i> Back To Home Page
      </button>

      <div className="container text-center pt-5">
        {/* Button Group */}
        <div className="btn-group mb-5" role="group">
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => navigate("/organiser")}
          >
            My Events
          </button>
          <button
            type="button"
            className="btn btn-light"
            onClick={() => navigate("/create-event")}
          >
            Create Events
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Message Alert */}
        {!loading && message.text && (
          <div
            className={`alert alert-${
              message.type === "error" ? "danger" : "success"
            }`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        {/* No Events */}
        {!loading && events.length === 0 && !message.text && (
          <p className="text-muted">You have no upcoming events.</p>
        )}

        {/* Event Cards */}
        <div className="row justify-content-center">
          {!loading &&
            events.map((event) => (
              <div className="col-md-4 mb-5" key={event.eventid}>
                <div className="card h-100">
                  <img
                    src={getImageUrl(event.image)}
                    className="card-img-top"
                    alt={event.name}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{event.name}</h5>
                    <p className="card-text mb-1">
                      <strong>Date:</strong>{" "}
                      {new Date(event.date_time).toLocaleDateString("en-ZA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="card-text mb-1">
                      <strong>Time:</strong>{" "}
                      {new Date(event.date_time).toLocaleTimeString("en-ZA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="card-text mb-3">
                      <i className="bi bi-geo-alt-fill"></i> {event.location}
                    </p>
                    <Link
                      to={`/myevent/${event.eventid}`}
                      className="btn btn-dark mt-auto"
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-center text-light mt-5 py-4">
        <div className="social-icons mb-2">
          <a href="#" title="Facebook" className="text-light me-3">
            <i className="bi bi-facebook"></i>
          </a>
          <a href="#" title="Twitter" className="text-light me-3">
            <i className="bi bi-twitter"></i>
          </a>
          <a href="#" title="LinkedIn" className="text-light">
            <i className="bi bi-linkedin"></i>
          </a>
        </div>

        <a href="#top" className="text-info d-block mb-2">
          Back to Top ↑
        </a>

        <div className="contact-info text-light">
          📧 Email: support@hacktrack.com
          <br />☎ Phone: +27 (71) 376-6731
        </div>

        <div style={{ marginTop: "15px" }}>
          &copy; 2025 HackTrack. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Organiser;
