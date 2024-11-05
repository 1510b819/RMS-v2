import React, { useState, useEffect } from "react";
import { firestore } from "../../firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { app } from "../../firebase/firebase";
import { Dashboard } from "../../components/Job/Dashboard";
import { Group } from "../../components/Group";
import { JobPostings } from "../../components/HRCandidate/JobPostings";
import { LogOut } from "../../components/Job/LogOut";
import { Status } from "../../components/Job/Status";
import image1 from "../stilogo.png";
import { Link } from "react-router-dom";
import logo11 from "../stilogo.png";
import "./style.css";
import vector2 from "./vector-2.svg";

import vector from "./vector.svg";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // Import icons
import { skillWeights } from "./skillWeights";
import Fuse from "fuse.js";
import { ref, set, getDatabase, get, update } from "firebase/database";

const database = getDatabase(app);

const HRCandidate = () => {
  const [candidates, setCandidates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const candidatesPerPage = 10;

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const docRef = doc(firestore, "candidates", "uploads");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const uploadsData = docSnap.data();

          const candidatesData = await Promise.all(
            Object.entries(uploadsData).map(async ([userId, data]) => {
              // Fetch user data from Firestore
              const userDocRef = collection(
                firestore,
                "resumes",
                data.jobTitle,
                userId
              );
              const userQuery = query(userDocRef, orderBy("timestamp", "desc"));
              const querySnapshot = await getDocs(userQuery);

              let userData = {};
              if (!querySnapshot.empty) {
                userData = querySnapshot.docs[0].data();
              }

              // Ensure skills are always an array
              const skills = userData.skills || [];

              // Fetch resume name from Realtime Database
              const resumeRef = ref(database, `users/${userId}/profile`);
              const resumeSnapshot = await get(resumeRef);
              const resumeName = resumeSnapshot.exists()
                ? resumeSnapshot.val().resumeName
                : "N/A";

              // Use the fetched resumeName to replace the current name if it exists
              const displayName =
                resumeName !== "N/A"
                  ? resumeName
                  : userData.names?.[0] || "N/A";

              // Fetch job postings
              const jobRef = collection(firestore, "Job Posted");
              const jobQuery = query(jobRef);
              const jobSnapshot = await getDocs(jobQuery);

              let jobRequirementsText = "";
              jobSnapshot.forEach((doc) => {
                const jobData = doc.data();
                if (
                  jobData.title.trim().toLowerCase() ===
                  data.jobTitle.trim().toLowerCase()
                ) {
                  jobRequirementsText = jobData.requirements || ""; // Get requirements
                }
              });

              // Calculate score based on skills and requirements
              const score = calculateScore(
                skills,
                jobRequirementsText,
                skillWeights
              );

              // Console log to check skills and requirements being compared
              console.log(
                "Comparing Skills:",
                skills,
                "with Requirements:",
                jobRequirementsText
              );

              return {
                id: userId,
                name: displayName, // Use the resolved display name here
                email: userData.emails?.[0] || "N/A",
                phoneNumber: userData.phone || "N/A",
                skills: skills,
                industry: userData.industry?.Degree || "N/A",
                jobTitle: data.jobTitle,
                resume: data.resume,
                uploadedAt: data.uploadedAt,
                score, // Include score in candidate data
              };
            })
          );

          candidatesData.sort((a, b) => b.score - a.score);

          setCandidates(candidatesData);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching candidates: ", error);
      }
    };

    fetchCandidates();
  }, []);

  // Calculate score based on skills and requirements
  const calculateScore = (
    candidateSkills,
    jobRequirementsText,
    weights = {}
  ) => {
    // Split job requirements using multiple delimiters (commas, semicolons, line breaks)
    const jobSkillsArray = jobRequirementsText
      .split(/[,;\n]+/)
      .map((skill) => skill.trim().toLowerCase());

    let score = 0;

    // Normalize candidate skills for case insensitivity and remove stop words
    const stopWords = new Set(["the", "and", "or", "in", "of", "to", "for"]);
    const normalizedCandidateSkills = candidateSkills
      .map((skill) => skill.toLowerCase())
      .filter((skill) => !stopWords.has(skill));

    // Using a map to enhance fuzzy matching context
    const fuzzySkillsMap = new Map();
    normalizedCandidateSkills.forEach((skill) => {
      fuzzySkillsMap.set(skill, skill); // Maps each skill for fuzzy searching
    });

    // Configure fuzzy matching
    const fuseOptions = {
      threshold: 0.3, // Adjust as necessary for sensitivity
      keys: ["name"],
    };
    const fuse = new Fuse(
      Array.from(fuzzySkillsMap.keys()).map((skill) => ({ name: skill })),
      fuseOptions
    );

    // Process each job skill
    jobSkillsArray.forEach((jobSkill) => {
      // Use fuzzy search to find close matches or stick to exact matches
      const exactMatch = normalizedCandidateSkills.includes(jobSkill);
      const fuzzyMatch = fuse.search(jobSkill).length > 0;

      const weight = weights[jobSkill] || 1; // Use provided weight or default

      if (exactMatch || fuzzyMatch) {
        score += 10 * weight; // Assign weighted points for each match
      }
    });

    // Optional: Normalize the score to a scale of 0 to 100
    const maxScore = jobSkillsArray.length * 10; // Adjust based on your scoring logic
    score = Math.max(0, Math.min(score, maxScore)); // Ensure the score is between 0 and max possible score
    const normalizedScore = (score / maxScore) * 100;

    // Round off the normalized score to the nearest integer
    return Math.round(normalizedScore);
  };

  // Filter candidates based on search query
  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.skills
        .join(", ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Pagination Logic
  const indexOfLastCandidate = currentPage * candidatesPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
  const currentCandidates = filteredCandidates.slice(
    indexOfFirstCandidate,
    indexOfLastCandidate
  );

  const totalPages = Math.ceil(filteredCandidates.length / candidatesPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="HRCandidate">
      <div className="div-4">
        <img className="image" alt="Image" src={image1} />
        <div className="overlap">
          <div className="rectangle-3" />
          <div className="frame">
            <div className="frame-wrapper">
              <div className="frame-2">
                <img className="vector" alt="Vector" src={vector} />
                <img className="img" alt="Vector" src={vector2} />
                <LogOut divClassName="design-component-instance-node" />
              </div>
            </div>
          </div>
          <div className="rectangle-4" />
          <div className="frame-3">
            <Link to="/HRDashboard" className="dashboard-instance">
              <Dashboard />
            </Link>
            <div className="text-wrapper-5">Candidate</div>
            <Link to="/Status" className="design-component-instance-node">
              <Status />
            </Link>
            <Link to="/Jobposting" className="design-component-instance-node">
              <JobPostings />
            </Link>
          </div>
        </div>

        <div className="rectangle-5" />
        <div className="rectangle-6" />

        {/* Search Functionality in Frame-4 */}
        <div className="overlap-3">
          <div className="frame-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Job Title, Email, or Skills"
              className="search-input" // Add a class for styling
            />
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
          </div>
        </div>
        <div>
          <p className="n-a-note">
            * ‘N/A’ indicates that the information is either unavailable or was
            not provided in the resume.
          </p>
        </div>
        {/* Candidates Table */}
        <div className="overlap-2">
          <table className="candidates-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Score</th>
                <th>Job Title</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Skills</th>
                <th>Industry</th>
                <th>View Resume</th>
              </tr>
            </thead>
            <tbody>
              {currentCandidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>{candidate.name}</td>
                  <td>{candidate.score || "N/A"}</td>
                  <td>{candidate.jobTitle}</td>
                  <td>{candidate.email}</td>
                  <td>{candidate.phoneNumber}</td>
                  <td>{candidate.skills.join(", ") || "N/A"}</td>
                  <td>{candidate.industry || "N/A"}</td>
                  <td>
                    <a
                      href={candidate.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resume-link"
                    >
                      View Resume
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fixed Pagination at Bottom */}
        <div className="pagination fixed-pagination">
          <button
            className="prev"
            onClick={() =>
              handlePageChange(currentPage > 1 ? currentPage - 1 : currentPage)
            }
            disabled={currentPage === 1}
          >
            « Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <span
              key={i + 1}
              className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </span>
          ))}
          <button
            className="next"
            onClick={() =>
              handlePageChange(
                currentPage < totalPages ? currentPage + 1 : currentPage
              )
            }
            disabled={currentPage === totalPages}
          >
            Next »
          </button>
        </div>

        <img className="logo" alt="Logo" src={logo11} />
      </div>
    </div>
  );
};

export default HRCandidate;
