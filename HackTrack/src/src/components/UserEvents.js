import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from "../api";

const UserEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/events/userevents", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        setEvents(response.data);
        setFilteredEvents(response.data);
      } catch (err) {
        console.error("Error fetching events: ", err);
        setMessage({ text: "Failed to load events", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = events.filter(
      (event) =>
        event.name.toLowerCase().includes(value) ||
        event.location.toLowerCase().includes(value)
    );
    setFilteredEvents(filtered);
  };

  const handleRegistration = async (eventId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.post(
        `/api/events/${eventId}/register`,
        { is_attending: newStatus }, // ADD: Request body
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const updatedEvents = events.map((event) =>
        event.event_id === eventId
          ? { ...event, is_attending: newStatus }
          : event
      );

      setEvents(updatedEvents);
      setFilteredEvents(updatedEvents);

      setMessage({
        text: `Successfully ${newStatus ? "registered" : "unregistered"}`,
        type: "success",
      });
    } catch (err) {
      console.error("Registration failed: ", err);
      setMessage({
        text: err.response?.data?.error || "Registration failed",
        type: "error",
      });
    }
  };

  return (
    <div>
      {/* ADD: Search input in nav */}
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <button
            className="btn btn-dark text-white"
            onClick={() => navigate("/UserPage")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>
          <input
            type="text"
            className="form-control"
            placeholder="Search events..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </nav>

      {/* ADD: Message display */}
      {message.text && (
        <div className={`alert alert-${message.type} m-3`}>{message.text}</div>
      )}

      <div className="container">
        {/* CHANGE: Use filteredEvents instead of hardcoded array */}
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {filteredEvents.length === 0 ? (
            <div className="col-12 text-center py-5">
              <h3 className="text-muted">No upcoming events found</h3>
              <p className="lead">Check back later for new events!</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.event_id} className="col">
                <div className="card h-100">
                  <img
                    src={
                      event.image_path || // Now using image_path from backend
                      "https://via.placeholder.com/400x200.png?text=Event+Image"
                    }
                    className="card-img-top"
                    alt={event.name}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{event.event_name}</h5>
                    {/*<p className="card-text">{event.description}</p> */}
                    <div className="mt-auto">
                      <p className="card-text">
                        <small className="text-muted">
                          <i className="bi bi-calendar-event me-2"></i>
                          {new Date(event.date_time).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                          <br />
                          <i className="bi bi-geo-alt me-2"></i>
                          {event.location}
                        </small>
                      </p>
                      <div className="d-grid gap-2">
                        <Link
                          to={`/events/${event.event_id}`}
                          className="btn btn-dark"
                        >
                          <i className="bi bi-info-circle me-2"></i>
                          Event Details
                        </Link>
                        <button
                          className={`btn ${
                            event.is_attending
                              ? "btn-success"
                              : "btn-outline-dark"
                          }`}
                          onClick={() =>
                            handleRegistration(
                              event.event_id,
                              event.is_attending
                            )
                          }
                        >
                          {event.is_attending ? (
                            <>
                              <i className="bi bi-check-circle me-2"></i>
                              Registered
                            </>
                          ) : (
                            <>
                              <i className="bi bi-calendar-plus me-2"></i>
                              Register Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ADD: Empty state */}
        {!loading && filteredEvents.length === 0 && (
          <div className="text-center my-5">
            <h4>No events found{searchTerm && ` for "${searchTerm}"`}</h4>
          </div>
        )}
      </div>

      {/* Footer remains same */}
    </div>
  );
};

export default UserEvents;
