import React, { useState, useEffect } from "react";
import { Candidate } from "../../components/Job/Candidate";
import { Dashboard } from "../../components/Job/Dashboard";
import { Find } from "../../components/Find";
import { JobPosting } from "../../components/CandidateModule/Dashboard/JobPosting";
import { LogOut } from "../../components/CandidateModule/LogOut";
import { Status } from "../../components/Status";
import "./style.css";
import { doSignOut } from "../../firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import sti from "../stilogo.png";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // nag install muna ako ng npm install react-calendar
import { database } from "../../firebase/firebase";
import { ref, set, getDatabase, get, update, onValue } from "firebase/database";
import "./ScheduleInterview.css"; // CSS ng calendar


export const StatusScreen = () => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentApplicantId, setCurrentApplicantId] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [applicantStatus, setApplicantStatus] = useState("Received"); // Eto yung default na lalabas sa statuse
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query
  const [jobType, setJobType] = useState("Full-Time"); // State for job type
  const [currentApplicant, setCurrentApplicant] = useState(null); // To track the applicant being scheduled
  const [position, setPosition] = useState(""); // State for position
  const handleLogout = () => {
    doSignOut()
      .then(() => {
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };
  

  useEffect(() => {
    // Reference to users data in Realtime Database
    const usersRef = ref(database, "users");

    // Fetch the data once and set up listener for changes
    onValue(usersRef, (snapshot) => {
      const usersData = [];
      snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        const userProfile = childSnapshot.val().profile || {};

        // Extract relevant fields
        const {
          JobApplied = "N/A",
          resumeName = "Unknown",
          status = "Received",
          completed = 0,
        } = userProfile;

        // Push formatted user data
        usersData.push({ userId, JobApplied, resumeName, status, completed });
      });

      setUsers(usersData); // Update state with the new user data
    });
  }, []);

  

  const handleScheduleOpen = (userId) => {
    setCurrentApplicantId(userId);
    // Fetch the existing schedule for the selected applicant
    const scheduleRef = ref(database, `users/${userId}/profile/sched`);
    
    get(scheduleRef).then((snapshot) => {
      if (snapshot.exists()) {
        const scheduleData = snapshot.val();
        // Set the selected date and time from existing schedule
        setSelectedDate(new Date(scheduleData.date)); // Assuming date is stored as ISO string
        setSelectedTime(scheduleData.time || ''); // Fallback to empty string if time is not set
      } else {
        // No existing schedule, reset to default
        setSelectedDate(new Date());
        setSelectedTime('');
      }
    }).catch((error) => {
      console.error("Error fetching schedule:", error);
      // Handle error, you may want to reset or set defaults
      setSelectedDate(new Date());
      setSelectedTime('');
    });

    setIsScheduleOpen(true);
  };

  
  const handleScheduleClose = () => {
    setIsScheduleOpen(false);
    setSelectedDate(new Date()); // Reset date
    setSelectedTime(''); // Reset time
  };

  const handleScheduleConfirm = () => {
    console.log("Selected Date:", selectedDate);
    console.log("Selected Time:", selectedTime);
    console.log("Current Applicant ID:", currentApplicantId); // Check the current applicant ID

    if (selectedDate && selectedTime && currentApplicantId) {
      const scheduleRef = ref(database, `users/${currentApplicantId}/profile/sched`);

      set(scheduleRef, {
        date: selectedDate.toISOString(), // Store as ISO string if needed
        time: selectedTime,
      })
      .then(() => {
        console.log("Schedule saved successfully!");
        handleScheduleClose(); // Close modal after saving
      })
      .catch((error) => {
        console.error("Error saving schedule:", error);
      });

      setSelectedDate(new Date()); // Reset date
      setSelectedTime(''); // Reset time
    } else {
      alert("Please select both date and time.");
    }
  };
  
  
  

  const handleStatusChange = (e, userId) => {
    const newStatus = e.target.value; // Get the new status from the dropdown

    // Reference to the specific user's status in Realtime Database
    const statusRef = ref(database, `users/${userId}/profile/status`);

    // Log the reference and new status
    console.log(`Updating status for userId: ${userId} to: ${newStatus}`);

    set(statusRef, newStatus) // Set the new status for the user
      .then(() => {
        console.log("Status updated successfully");
      })
      .catch((error) => {
        console.error("Error updating status: ", error);
      });
  };

  const uniquePositions = [...new Set(users.map(applicant => applicant.JobApplied))];

  const filteredUsers = users.filter(applicant =>
    applicant.resumeName.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (position ? applicant.JobApplied === position : true)
  );

  return (
    <div className="status-screen">
      <div className="status-2">
        <div className="ellipse" />
        <img
          className="image"
          alt="Image"
          src="https://c.animaapp.com/rQt1npRo/img/image-1@2x.png"
        />

        <div className="overlap">
          <div className="rectangle" />
          <div className="frame">
            <div className="frame-wrapper">
              <div className="frame-2">
                <img
                  className="vector"
                  alt="Vector"
                  src="https://c.animaapp.com/rQt1npRo/img/vector.svg"
                />
                <img
                  className="img"
                  alt="Vector"
                  src="https://c.animaapp.com/rQt1npRo/img/vector-1.svg"
                />
                <LogOut onClick={handleLogout} />
              </div>
            </div>
          </div>
          <div className="rectangle-2" />
          <div className="group">
          <Link to="/HRDashboard" className="dashboard-instance hover-effect">
            <Dashboard />
          </Link>
          </div>
          <Link to="/HRCandidate" className="candidate-instance hover-effect"> <Candidate /></Link>
          <Status className="status-instance" />
          <Link to="/JobPosting" className="job-posting-instance hover-effect"> <JobPosting /></Link>
        </div>

        <div className="rectangle-3" />
        <img className="logo" alt="Logo" src={sti} />

        <div className="text-wrapper-6">Applicant Status</div>
        <div className="rectangle-4" />

        <div className="frame-3">
          <div className="group-2" />
          <div className="magnifying-glass-wrapper">
            <div className="magnifying-glass">
              <div className="overlap-group">
                <img
                  className="vector-stroke"
                  alt="Vector stroke"
                  src="https://c.animaapp.com/rQt1npRo/img/vector--stroke-.svg"
                />
                <img
                  className="vector-stroke-2"
                  alt="Vector stroke"
                  src="https://c.animaapp.com/rQt1npRo/img/vector--stroke--1.svg"
                />
              </div>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} // Update search query state
                className="text-wrapper-7"
              />
            </div>
          </div>

          
          <div className="text-wrapper-8">Position</div>
          <div className="group-3">
            <div className="div-wrapper">
            <select value={position} onChange={(e) => setPosition(e.target.value)}>
              <option value="">Select Position</option>
              {uniquePositions.map((pos, index) => (
                <option key={index} value={pos}>{pos}</option>
              ))}
            </select>
            </div>
          </div>
        </div>

        <div className="navbar">
          <div className="text-wrapper-10">Candidate</div>
          <div className="text-wrapper-11">Job</div>
          <div className="text-wrapper-12">Status</div>
          <div className="text-wrapper-13">
            Schedule Interview
          </div>
          <div className="text-wrapper-14">Progress</div>
        </div>

        <div className="overlap-2">
          {filteredUsers.map((applicant) => (
            <div key={applicant.userId} className="applicant-card">
              <div className="applicant-details">
                <div className="applicant-info">
                  <div className="text-wrapper-16">
                    {applicant.resumeName || "Unknown"}
                  </div>
                  <div className="text-wrapper-15">
                    {applicant.JobApplied || "PE Teacher"}
                  </div>
                </div>

                <div className="status-selection">
                  <label
                    htmlFor={`applicant-status-dropdown-${applicant.userId}`}
                  ></label>
                  <select
                    id={`applicant-status-dropdown-${applicant.userId}`}
                    value={applicant.status}
                    onChange={(e) => handleStatusChange(e, applicant.userId)} // Correctly passing userId
                    className="status-dropdown"
                  >
                    <option value="Received">Received</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview Scheduled">
                      Interview Scheduled
                    </option>
                    <option value="Interview Completed">
                      Interview Completed
                    </option>
                    <option value="Technical Assessment">
                      Technical Assessment
                    </option>
                    <option value="Hired">Hired</option>
                  </select>
                </div>

                <div className="text-wrapper-17" onClick={() => handleScheduleOpen(applicant.userId)}>
                  Create schedule
                </div>

                <div className="applicant-status">
                  <div className="text-wrapper-18">
                    {applicant.status || "Onboarding"}
                  </div>
                  <div className="frame-5">
                    <div
                      className="rectangle-5"
                      style={{
                        width: `${applicant.completed || 0}px`,
                      }}
                    />
                    <div className="text-wrapper-19">
                    {`${applicant.completed || 0}%`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Schedule Interview Modal */}
        {isScheduleOpen && (
          <div className="schedule-overlay">
            <div className="schedule-modal">
              <h2>Schedule Interview</h2>
              <label>Date:</label>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                className="calendar"
              />
              <label>Time:</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="time-input"
              />
              <div className="button-group">
                <button
                  onClick={handleScheduleConfirm}
                  className="schedule-button"
                >
                  Confirm
                </button>
                <button onClick={handleScheduleClose} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusScreen;
