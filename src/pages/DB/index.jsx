import React, { useEffect, useState } from 'react';
import {app} from '../../firebase/firebase'; // Adjust path based on file structure
import './style.css'; 
import { jobPositionCourses } from './Courses'; 
import jobPositions from './JobPositions'; 

const DB = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJobPosition, setSelectedJobPosition] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await app.firestore().collection('users').get();
        const fetchedUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(fetchedUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('An error occurred while fetching users.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserSelect = (event) => {
    setSelectedUser(event.target.value);
  };

  const handleJobPositionSelect = (event) => {
    setSelectedJobPosition(event.target.value);
  };

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        let fetchedResumes = [];
        if (selectedUser) {
          const userResumesSnapshot = await app.firestore().collection('users').doc(selectedUser).collection('resumes').get();
          fetchedResumes = userResumesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          const resumesSnapshot = await app.firestore().collectionGroup('resumes').get();
          fetchedResumes = resumesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        setResumes(fetchedResumes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching resumes:', error);
        setError('An error occurred while fetching resumes.');
        setLoading(false);
      }
    };

    fetchResumes();
  }, [selectedUser]);

  const handleRemoveResume = async (resumeId) => {
    try {
      if (selectedUser) {
        await app.firestore().collection('users').doc(selectedUser).collection('resumes').doc(resumeId).delete();
      } else {
        await app.firestore().collectionGroup('resumes').doc(resumeId).delete();
      }
      setResumes(resumes.filter(resume => resume.id !== resumeId));
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  const filteredResumes = selectedJobPosition === ''
    ? resumes
    : resumes.filter(resume => {
        const requiredCourses = jobPositionCourses[selectedJobPosition];
        return (
          resume.Education &&
          resume.Education.Degree &&
          requiredCourses.some(course => resume.Education.Degree.includes(course))
        );
      });

  return (
    <div className="container">
      <h1>Resumes</h1>
      <div className="dropdown">
        <label htmlFor="user">Select User:</label>
        <select id="user" onChange={handleUserSelect} value={selectedUser}>
          <option value="">All Users</option>
          <option value="RjrtB6cFfjbKxLkSjnSStPajgLf2">Josh</option> 
          <option value="HS53qzJdSHgXAQo2FA2nyvreWVt1">Angel</option> 
          <option value="undefined">Franco</option>
        </select>
      </div>
      <div className="dropdown">
        <label htmlFor="jobPosition">Select Job Position:</label>
        <select id="jobPosition" onChange={handleJobPositionSelect} value={selectedJobPosition}>
          <option value="">Select...</option>
          {jobPositions.map((position, index) => (
            <option key={index} value={position}>{position}</option>
          ))}
        </select>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      <table className="resume-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Education Degree</th>
            <th>Skills</th>
            <th>Actions</th> {/* Add column for actions */}
          </tr>
        </thead>
        <tbody>
          {filteredResumes.map((resume, index) => (
            <tr key={index}>
              <td>{resume.Names}</td>
              <td>{resume.Emails[0]}</td>
              <td>{resume['Phone Number']}</td>
              <td>{resume.Education && resume.Education.Degree}</td>
              <td>{resume.Skills.join(', ')}</td>
              <td>
                <button onClick={() => handleRemoveResume(resume.id)}>Remove</button> {/* Button to remove the resume */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DB;
