import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import api from "../api";

const UserPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await api.get("/api/events/me");
        setUserName(response.data.name);
      } catch (err) {
        console.error("Failed to fetch user name: ", err);
      }
    };
    fetchUserName();
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/api/events/userpage");
        setEvents(response.data);
        setFilteredEvents(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setIsSearching(true);
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = events.filter((event) => {
        const eventDate = new Date(event.date_time).toLocaleDateString();
        return (
          event.name.toLowerCase().includes(lowercasedFilter) ||
          event.location.toLowerCase().includes(lowercasedFilter) ||
          eventDate.toLowerCase().includes(lowercasedFilter)
        );
      });
      setFilteredEvents(filtered);
      setIsSearching(false);
    }, 300);

    return () => {
      clearTimeout(timerId);
      setIsSearching(false);
    };
  }, [searchTerm, events]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleRegistration = async (eventId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.post(`/api/events/${eventId}/register`, {
        is_attending: newStatus,
      });

      const updatedEvents = events.map((event) =>
        event.event_id === eventId
          ? { ...event, is_attending: newStatus }
          : event
      );

      setEvents(updatedEvents);
      setFilteredEvents(updatedEvents);
    } catch (err) {
      console.error("Registration error: ", err.response?.data);
      alert(err.response?.data.error || "Registration update failed");
    }
  };

  const scrollCards = (direction) => {
    const container = document.getElementById("cardScrollContainer");
    const scrollAmount = 320;
    container.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <a className="navbar-brand">HackTrack</a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link active" to="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/userevents">
                  My Events
                </Link>
              </li>
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Dashboard
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/usernotifications">
                      Notifications
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/usercalendar">
                      Calendar
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/userfeedback">
                      Feedback & Review
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              <form
                className="d-flex"
                role="search"
                onSubmit={handleSearchSubmit}
              >
                <input
                  className="form-control me-2"
                  type="search"
                  id="search"
                  list="datalistOptions"
                  placeholder="Search Events"
                  aria-label="Search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <datalist id="datalistOptions">
                  {[...new Set(events.map((event) => event.name))].map(
                    (uniqueName, index) => (
                      <option key={index} value={uniqueName} />
                    )
                  )}
                  {events.length === 0 && (
                    <option value="No upcoming events" disabled />
                  )}
                </datalist>
                <button className="btn btn-outline-success" type="submit">
                  Search
                </button>
              </form>

              <button
                className="btn btn-outline-light ms-2"
                onClick={() => {
                  localStorage.clear();
                  alert("🔓 You have been logged out!");
                  window.location.href = "/";
                }}
              >
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mt-4 mb-5">
        <h1>Welcome {userName || "User"}</h1>
        <p>
          This is your user dashboard.Your one-stop hub for hackathon discovery
        </p>
      </div>

      <div className="container my-5 position-relative">
        <h2 className="mb-4">Upcoming Events</h2>

        {isSearching && (
          <div className="text-center my-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Searching...</span>
            </div>
          </div>
        )}

        <div
          id="cardScrollContainer"
          className="d-flex overflow-auto gap-3 pb-3 px-5"
        >
          {filteredEvents.map((event) => (
            <div
              key={event.event_id}
              className="card"
              style={{ minWidth: "300px" }}
            >
              <img
                src={
                  event.image_url ||
                  "https://via.placeholder.com/400x200.png?text=Event+Image"
                }
                className="card-img-top"
                alt={event.name}
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body text-center">
                <h5 className="card-title">{event.name}</h5>
                <p className="card-text text-muted">
                  {new Date(event.date_time).toLocaleDateString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  <br />
                  {new Date(event.date_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-muted">{event.location}</p>

                <div className="d-flex gap-2 justify-content-center">
                  <Link
                    to={`/userevent/${event.event_id}`}
                    className="btn btn-dark"
                  >
                    View Details
                  </Link>
                  <button
                    className={`btn ${
                      event.is_attending ? "btn-success" : "btn-outline-dark"
                    }`}
                    onClick={() =>
                      handleRegistration(event.event_id, event.is_attending)
                    }
                  >
                    {event.is_attending ? "Attending ✓" : "Register Now"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && !isSearching && filteredEvents.length === 0 && (
          <div className="text-center my-5">
            <h4>No events found matching "{searchTerm}"</h4>
            <button className="btn btn-link" onClick={() => setSearchTerm("")}>
              Clear search
            </button>
          </div>
        )}
      </div>

      <footer className="mt-5">
        <div className="social-icons mb-2">
          <a href="facebook.com" title="Facebook" className="text-light me-3">
            <i className="bi bi-facebook"></i>
          </a>
          <a href="twitter.com" title="Twitter" className="text-light me-3">
            <i className="bi bi-twitter"></i>
          </a>
          <a href="linkedin.com" title="LinkedIn" className="text-light">
            <i className="bi bi-linkedin"></i>
          </a>
        </div>
        <Link to="#top" className="text-info d-block mb-2">
          Back to Top ↑
        </Link>
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

export default UserPage;
