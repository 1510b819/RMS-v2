import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import './NotificationModal.css'; // Import the CSS

const NotificationModal = ({ show, onClose, notifications }) => {
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Your Notifications</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {notifications.length === 0 ? (
          <p>No notifications.</p>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="notification-item">
              <p>{notification.message}</p>
              <p>{new Date(notification.timestamp.toDate()).toLocaleString()}</p>
            </div>
          ))
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotificationModal;
