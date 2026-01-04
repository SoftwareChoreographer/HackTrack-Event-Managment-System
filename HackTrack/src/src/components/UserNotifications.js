import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const UserNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);

    //Add emoji mapping based on type
    const emojiMap = {
      event: '🎉',
      feedback: '💬'
    };

    // Fetch notifications from API
    useEffect(() => {
      const fetchNotifications = async () => {
          try {
              const response = await fetch('/api/notifications');
              const data = await response.json();
              setNotifications(data);
          } catch (error) {
              console.error('Error fetching notifications:', error);
          }
      };
      fetchNotifications();
  }, []);


  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
        {/* Back Button */}
      <button className="btn btn-dark mb-3 ms-3 mt-3 text-white" onClick={() => navigate('/UserPage')}>
        <i className="bi bi-arrow-left me-2"></i> Back To Home Page
      </button>
      {/* Page Header */}
      <div className="container mt-5">
        <h1 className="mb-4"><i className="bi bi-bell-fill"></i> Notifications</h1>

        {/* Notification Cards */}
        {notifications.map((note) => (
          <div className="notification-card mb-3 p-4 rounded" key={note.id} 
          style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <h5>
              {note.type === 'event' && '🎉'}
              {note.type === 'feedback' && '💬 '}
              {note.title}
              </h5>
            <p>{note.message}</p>
            <small className="text-muted">
              Posted {formatDistanceToNow(new Date(note.created_at))} ago
            </small>
             {/* Added event link button */}
             {note.event_id && (
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={() => navigate(`/events/${note.event_id}`)}
              >
                View Event
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 mt-5" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', color: '#ccc' }}>
        <div className="mb-2">
          <a href="facebook.com" className="text-light me-3"><i className="bi bi-facebook"></i></a>
          <a href="twitter.com" className="text-light me-3"><i className="bi bi-twitter"></i></a>
          <a href="linkedin.com" className="text-light"><i className="bi bi-linkedin"></i></a>
        </div>
        <a href="#top" className="text-info d-block mb-2">Back to Top ↑</a>
        <div>
          📧 support@hacktrack.com | ☎ +27 (71) 376-6731
        </div>
        <div className="mt-3">
          &copy; 2025 HackTrack. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default UserNotifications;