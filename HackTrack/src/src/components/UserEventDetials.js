import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get(`/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvent(response.data);
      } catch (err) {
        console.error("Error loading event:", err);
        setError(err.response?.data?.error || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-5 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <button
        className="btn btn-dark text-white mb-3"
        onClick={() => navigate("/UserPage")}
      >
        <i className="bi bi-arrow-left"></i> Back To Home Page
      </button>

      {event && (
        <>  
          <h1 className="mb-4">{event.name}</h1>

          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.name}
              className="img-fluid mb-4 rounded"
            />
          ) : (
            <div className="bg-secondary text-white p-5 mb-4 text-center">
              No image available
            </div>
          )}

          <p>{event.description}</p>
          <p>
            <strong>Date:</strong>{" "}
            {new Date(event.date_time).toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p>
            <strong>Location:</strong> {event.location}
          </p>
        </>
      )}
    </div>
  );
};

export default EventDetail;
