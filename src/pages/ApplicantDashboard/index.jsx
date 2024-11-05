import React, { useState, useEffect, useRef } from "react";
import { Group } from "../../components/Group";
import { LogOut } from "../../components/CandidateModule/LogOut";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import { doSignOut } from "../../firebase/auth";
import { useNavigate } from "react-router-dom";
import usePositionToggle from "./usePositionToggle";
import { Header } from "../../components/ApplicantDashboard/Header";
import sti from "../stilogo.png";
import SettingsButton from "../UploadFile/Settings.png";
import { useAuth } from "../../contexts/authContext";
import { AddJob } from "../../components/AddJob";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMale, faClock, faCalendar } from "@fortawesome/free-solid-svg-icons"; // Import icons
import NotificationModal from "../../components/NotificationModal";
import { database } from "../../firebase/firebase"; // Import Firestore
import {
  addDoc,
  doc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  getFirestore,
  setDoc,
  serverTimestamp,
  updateDoc,
  deleteField,
  getDoc,
  limit,
  where,
} from "firebase/firestore";
import { firestore, storage, auth } from "../../firebase/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  getStorage,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import { ref as dataBaseRef, set, getDatabase, get, update } from "firebase/database";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ApplicantDashboard = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState([]);
  const [industry, setIndustry] = useState("");
  const [salary, setSalary] = useState("");
  const [experience, setExperience] = useState("");
  const [city, setCity] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { positions, handleTogglePosition } = usePositionToggle();
  const [selected, setSelected] = useState(null);
  const [jobPostings, setJobPostings] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("Full time");
  const [slotsLeft, setSlotsLeft] = useState(1);
  const [objectives, setObjectives] = useState("");
  const [jobPosts, setJobPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 3;
  const [search, setSearch] = useState({
    title: "",
    type: "",
    position: "",
    date: "",
  });
  const [selectedJob, setSelectedJob] = useState(null); // State for the selected job
  const [isOverlayOpen, setIsOverlayOpen] = useState(false); // State for the overlay visibility
  const [jobRequirements, setJobRequirements] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const [resumeStatus, setResumeStatus] = useState({});
  const [resumeUploaded, setResumeUploaded] = useState(false); // Track if a resume was uploaded
  const [activePosition, setActivePosition] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null); // Store job details for deletion
  const database = getDatabase();


  const handleOpenConfirmation = (jobId, userId, jobTitle) => {
    setJobToDelete({ jobId, userId, jobTitle });
    setIsConfirmationOpen(true);
  };

  useEffect(() => {
    const fetchProfileOrResume = async () => {
      try {
        const db = getDatabase(); // Initialize Firebase Realtime Database
        const profileRef = dataBaseRef(db, `users/${userId}/profile`);
  
        // Check for existing profile in Realtime Database
        const profileSnapshot = await get(profileRef);
        console.log("Profile Snapshot:", profileSnapshot.exists(), profileSnapshot.val());
  
        if (profileSnapshot.exists()) {
          // Profile exists, extract data and update state
          const profileData = profileSnapshot.val();

          const experience = profileData.experience || "0-1 year";
          console.log("Experience:", experience);
          setExperience(experience.trim());

          const salary = profileData.salary || "25,000 /mon";
          console.log("Salary:", salary);
          setSalary(salary.trim());

          const city = profileData.city || "Las Piñas";
          console.log("City:", city);
          setCity(city.trim());
    
          const email = profileData.email || "juandelacruz@gmail.com";
          console.log("Email:", email);
          setEmail(email.trim());
    
          const phone = profileData.phone || "09123456789";
          console.log("Phone:", phone);
          setPhone(phone.trim());
    
          const skills = profileData.skills || "Network, Programming";
          const skillsArray = skills.split(",").map(skill => skill.trim());
          setSkills(skillsArray);
            
          const industry = profileData.industry || "Information Technology";
          console.log("Industry:", industry);
          setIndustry(industry.trim());

          const objectives = profileData.objectives || "My objective is to leverage my strong problem-solving skills and experience in network administration to contribute to STI's innovative IT environment. I'm particularly interested in MIS and believe my skills can be an asset to your team. This position represents an exciting opportunity to learn from industry leaders and grow my expertise in MIS";
          console.log("Objectives:", objectives);
          setObjectives(objectives.trim());
    
        } else {
          // No profile found, proceed with fetching the latest resume from Firestore
          console.log("No profile found, fetching from Firestore...");
          if (userId) {
            const resumesRef = collection(firestore, `users/${userId}/profile`);
            const latestResumeQuery = query(
              resumesRef,
              orderBy("timestamp", "desc"),
              limit(1)
            );
            const querySnapshot = await getDocs(latestResumeQuery);
  
            if (!querySnapshot.empty) {
              const latestResume = querySnapshot.docs[0].data();
              console.log("Latest Resume:", latestResume);

              // Extract and validate the email
              const email = (latestResume.email || "").trim();
              setEmail(email || "juandelacruz@gmail.com");
    
              // Extract and validate the phone
              const phone = (latestResume.phone || "").trim();
              setPhone(phone || "09123456789");
    
              // Extract and validate the skills
              const skillsArray = latestResume.skills || [];
              const skills =
                skillsArray.length > 0
                  ? skillsArray.map((skill) => skill.trim()).join(", ")
                  : "";
              setSkills(skills || "Network, Programming");
    
              const industry = (latestResume.Industry || "").trim();
              setIndustry(industry || "Information Technology");
            } else {
              console.log("No resumes found in Firestore.");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile or latest resume:", error);
      }
    };
  
    if (userId) {
      fetchProfileOrResume();
    } else {
      console.log("User ID is not set.");
    }
  }, [userId]);
  
  const handleConfirmDelete = async () => {
    if (jobToDelete) {
      await handleDeleteResume(
        jobToDelete.jobId,
        jobToDelete.userId,
        jobToDelete.jobTitle
      );
    }
    setIsConfirmationOpen(false); // Close confirmation overlay
  };

  const handleCancelDelete = () => {
    setIsConfirmationOpen(false); // Close confirmation overlay
  };

  // Function to fetch notifications for the current user
  const fetchNotifications = async () => {
    const db = getFirestore();
    const q = query(
      collection(db, "notification"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const fetchedNotifications = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setNotifications(fetchedNotifications);
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications(); // Fetch notifications when userId changes
    }
  }, [userId]);

  const handleImageClick = () => {
    setIsNotificationModalOpen(true);
  };

  const handleCloseNotificationModal = () => {
    setIsNotificationModalOpen(false);
  };

  const handleJobCardSelect = (jobTitle) => {
    setSelectedJobTitle(jobTitle);
  };

  console.log("User ID from state:", userId);

  const handleApplyClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleApplyOrReplace = async () => {
    if (resumeStatus[selectedJob.id] === "apply") {
      console.log("Applying for job:", selectedJob.id);
      await handleApplyClick();
    } else if (resumeStatus[selectedJob.id] === "replace") {
      
      console.log("Replacing resume for job:", selectedJob.id);
      await handleApplyClick();
    }
  };

  const handleDeleteResume = async (jobId, userId, jobTitle) => {
    const storagePath = `resume/${jobTitle}/${userId}`;
    const storageRef = ref(storage, storagePath);
    const db = getFirestore(); // Initialize Firestore
  
    try {
      // Deleting files from Firebase Storage
      const listResponse = await listAll(storageRef);
      const deletePromises = listResponse.items.map((itemRef) =>
        deleteObject(itemRef)
      );
      await Promise.all(deletePromises);
      console.log(
        `All files in the folder ${storagePath} deleted from Firebase Storage.`
      );
  
      // Firestore: Deleting the entire userId collection
      const firestorePath = `resumes/${jobTitle}/${userId}`;
      const userCollectionRef = collection(firestore, firestorePath); // Reference to the userId collection
  
      const q = query(userCollectionRef);
      const querySnapshot = await getDocs(q);
  
      // Delete all documents inside the userId collection
      const deleteCollectionPromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteCollectionPromises);
      console.log(`Collection for userId ${userId} deleted from Firestore.`);
      toast.success("Resume Deleted!");
      setUploadingResume(false);
  
      // Delete the specific userId field from candidates/uploads
      const uploadsDocRef = doc(db, `candidates/uploads`); // Reference to the uploads document
      await updateDoc(uploadsDocRef, {
        [userId]: deleteField(), // Remove the map with the key `userId`
      });
      console.log(
        `Field for userId ${userId} deleted from candidates/uploads.`
      );
  
      // Create a notification for the deleted resume
      const notificationMessage = `${userId} has deleted their resume for ${jobTitle}.`;
  
      await setDoc(doc(db, `notification/${userId}`), {
        userId: userId,
        jobTitle: jobTitle,
        message: notificationMessage,
        timestamp: serverTimestamp(), // Firestore timestamp
      });
  
      console.log("Notification added to Firestore.");
  
      // Update resume status if needed
      setResumeStatus((prevStatus) => ({
        ...prevStatus,
        [jobId]: "apply",
      }));
    } catch (error) {
      if (error.code === "storage/object-not-found") {
        console.error("File or folder not found, unable to delete:", error);
      } else {
        console.error("Error deleting resume or Firestore collection:", error);
      }
    }
  };
  

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
  
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  
      if (!validTypes.includes(file.type)) {
        toast.error("Only PDF and DOCX files are allowed.");
        return;
      }
  
      if (file.size > maxSizeInBytes) {
        toast.error("File size must be less than 5MB.");
        return;
      }
  
      try {
        setLoading(true);
        const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
        const selectedJobTitle = selectedJob.title; // Ensure selectedJob.title is available in scope
  
        // Create a storage reference for Firebase
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `resume/${selectedJobTitle}/${userId}/${file.name}`
        );
  
        // Upload the file to Firebase Storage
        await uploadBytes(storageRef, file);
        console.log("File uploaded to Firebase Storage.");
  
        // Get the download URL for the uploaded file
        const downloadURL = await getDownloadURL(storageRef);
        console.log("File URL:", downloadURL);
  
        // Save user upload information to Firestore under "candidates/uploads"
        const db = getFirestore();
        const uploadsDocRef = doc(db, "candidates", "uploads");
  
        // Get the document to check if it exists
        const docSnap = await getDoc(uploadsDocRef);
  
        if (docSnap.exists()) {
          // If the document exists, update it
          await updateDoc(uploadsDocRef, {
            [userId]: {
              resume: downloadURL, // Resume file URL
              jobTitle: selectedJobTitle, // Job title
              uploadedAt: serverTimestamp(), // Timestamp
            },
          });
        } else {
          // If the document doesn't exist, create it
          await setDoc(uploadsDocRef, {
            [userId]: {
              resume: downloadURL, // Resume file URL
              jobTitle: selectedJobTitle, // Job title
              uploadedAt: serverTimestamp(), // Timestamp
            },
          });
        }
  
        console.log("User resume info saved in Firestore.");
  
        // Create a notification for the uploaded resume
        const notificationMessage = `${userId} has uploaded a resume for ${selectedJobTitle}.`;
        const notificationId = `${userId}_${selectedJobTitle}`; // Unique ID for the notification
  
        await setDoc(doc(db, `notification/${notificationId}`), {
          userId: userId,
          jobTitle: selectedJobTitle,
          message: notificationMessage,
          timestamp: serverTimestamp(), // Firestore timestamp
        });
  
        console.log("Notification added to Firestore.");
  
        // Update the JobApplied field in Realtime Database
        const database = getDatabase();
        const jobAppliedRef = dataBaseRef(database, `users/${userId}/profile`);
        await update(jobAppliedRef, {
          JobApplied: selectedJobTitle,
        });
        console.log("JobApplied field updated in Realtime Database.");
  
        // Continue with FormData to send data to your backend
        const formData = new FormData();
        formData.append("resume", file);
        formData.append("userId", userId);
        formData.append("jobTitle", selectedJobTitle);
  
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
  
        const parsedData = await response.json();
  
        if (response.ok) {
          setResumeUploaded((prev) => !prev);
          toast.success("Resume processed successfully!");
          toast.success("The button is now disabled as you currently have an application in progress.");
          console.log("Parsed resume data:", parsedData);
          setUploadingResume(true);
        } else {
          toast.error("Failed to process resume.");
          console.error("Error:", parsedData.message);
        }
      } catch (error) {
        toast.error("Failed to upload file: " + error.message);
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
  };
  

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearch((prevSearch) => ({
      ...prevSearch,
      [name]: value,
    }));
  };
  useEffect(() => {
    const fetchJobPosts = async () => {
      try {
        const jobPostsCollection = collection(firestore, "Job Posted");
        const q = query(jobPostsCollection); // No need for ordering here
        const querySnapshot = await getDocs(q);
        const jobs = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        jobs.sort((a, b) => {
          const dateA = new Date(a.timePosted);
          const dateB = new Date(b.timePosted);

          return dateB - dateA;
        });

        setJobPosts(jobs);
      } catch (e) {
        console.error("Error fetching job posts: ", e);
      }
    };
    fetchJobPosts();
  }, []);

  useEffect(() => {
    const checkResumeStatus = async () => {
      if (selectedJob && userId) {
        console.log(
          `Checking resume folder at: resume/${selectedJob.title}/${userId}`
        );
        const storage = getStorage();
        const resumeFolderRef = ref(
          storage,
          `resume/${selectedJob.title}/${userId}/`
        );

        try {
          // Attempt to list all items in the resume folder
          const listResponse = await listAll(resumeFolderRef);

          // Check for valid resume files in the folder
          const hasValidResume = listResponse.items.some((itemRef) => {
            const fileName = itemRef.name.toLowerCase();
            return fileName.endsWith(".pdf") || fileName.endsWith(".docx");
          });

          // Update resume status based on presence of valid files
          setResumeStatus((prev) => ({
            ...prev,
            [selectedJob.id]: hasValidResume ? "replace" : "apply",
          }));
        } catch (error) {
          console.error("Error checking resume folder:", error);

          // Handle specific error cases
          if (error.code === "storage/object-not-found") {
            // Folder does not exist, meaning no resume has been uploaded
            setResumeStatus((prev) => ({
              ...prev,
              [selectedJob.id]: "apply",
            }));
          } else {
            // General error handling
            setResumeStatus((prev) => ({
              ...prev,
              [selectedJob.id]: "apply",
            }));
          }
        }
      } else {
        console.warn("Selected job or user ID is not defined");
      }
    };

    checkResumeStatus();
  }, [selectedJob, userId, resumeUploaded]); // Added resumeUploaded as a dependency

  const handleRadioChange = (event) => {
    setSelected(event.target.value);
  };
  const handleLogout = () => {
    doSignOut()
      .then(() => {
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  const filteredPosts = jobPosts.filter(
    (post) =>
      (search.title === "" ||
        post.title.toLowerCase().includes(search.title.toLowerCase())) &&
      (search.type === "" || post.type === search.type) &&
      (search.position === "" || post.title === search.position) &&
      (search.date === "" || post.timePosted.includes(search.date))
  );

  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
  };

  const handleCardClick = (job) => {
    setSelectedJob(job);
    setIsOverlayOpen(true);
  };

  return (
    <div className="applicant-dashboard">
      <div className="div-4">
        <div className="overlap-6">
          {/* <img className="image" alt="Image" src="https://c.animaapp.com/u3FUp8l1/img/image-4@2x.png" /> */}
          <div className="centerContainer" style={styles.centerContainer}>
            {currentPosts.map((job, index) => (
              <div
                key={index}
                style={{
                  ...styles.jobCard, // Spread in the rest of the static job card styles
                  boxShadow:
                    hoveredIndex === index
                      ? "0px 8px 16px rgba(0, 0, 0, 0.2)" // Apply shadow if card is hovered
                      : "0px 4px 8px rgba(0, 0, 0, 0.1)", // Default shadow
                }}
                onClick={() => handleCardClick(job)}
                onMouseEnter={() => setHoveredIndex(index)} // Set the hovered index
                onMouseLeave={() => setHoveredIndex(null)} // Reset hover state
              >
                <img src={sti} alt="STI Logo" style={styles.logo} />
                <div style={styles.cardContent}>
                  <h4 style={styles.campus}>STI Las Piñas Campus</h4>
                  <h3 style={styles.title}>{job.title}</h3>
                  <div style={styles.infoContainer}>
                    <img
                      src="https://c.animaapp.com/b7Lhz5U5/img/mappinline-1.svg"
                      alt="Slots Left"
                      style={styles.icon}
                    />
                    <span style={styles.info}>{job.slots} slot(s) left</span>
                    <img
                      src="https://c.animaapp.com/b7Lhz5U5/img/clock-1.svg"
                      alt="Job Type"
                      style={styles.icon}
                    />
                    <span style={styles.info}>{job.type}</span>
                    <img
                      src="https://c.animaapp.com/b7Lhz5U5/img/calendarblank-1.svg"
                      alt="Posted At"
                      style={styles.icon}
                    />
                    <span style={styles.info}>Posted at {job.timePosted}</span>
                  </div>
                  <p style={styles.description}>
                    {job.description.length > 100
                      ? `${job.description.substring(0, 100)}...` // Truncate the description
                      : job.description}{" "}
                    {/* Show full description if less than 100 characters */}
                  </p>
                </div>
                <div>
                  <h2 class="applyButton">Apply Now</h2>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/*<img className="image-2" alt="Image" src="https://c.animaapp.com/u3FUp8l1/img/image-1@2x.png" />*/}
        <img className="image-2" alt="Image" src={sti} />
        <div className="navbar">
          <div className="rectangle-3" />
          {/* <img className="vector" alt="Vector" src="https://c.animaapp.com/u3FUp8l1/img/vector.svg" /> */}
          <Link to="/Settings">
            <img
              className="vector"
              alt="Vector"
              src={SettingsButton}
              style={{ cursor: "pointer" }}
            />
          </Link>
          {/*<img className="vector-2" alt="Vector" src="https://c.animaapp.com/u3FUp8l1/img/vector-1.svg" />*/}
          <img
            className="vector-3"
            alt="Vector"
            src="https://c.animaapp.com/u3FUp8l1/img/vector-2.svg"
            onClick={handleImageClick} // Open the modal on click
          />

          <NotificationModal
            show={isNotificationModalOpen}
            onClose={handleCloseNotificationModal}
            notifications={notifications}
          />
          <LogOut
            className="log-out-instance hover-effect"
            onClick={handleLogout}
          />
          <div className="text-wrapper-12 hover-effect">Application</div>
          <div className="text-wrapper-13 hover-effect">About</div>
          <div className="text-wrapper-14 hover-effect">Contact</div>
          <Link to="/UploadFile" className="text-wrapper-34 hover-effect">
            Upload File
          </Link>
          <div className="rectangle-4" />
          <div className="text-wrapper-15">Home</div>
        </div>
        <div className="rectangle-5" />
        <div
          className="overlap-8"
          style={{ ...styles.container, backgroundColor: "white" }}
        >
          <h3 style={styles.title}>Filter by Job Title</h3>
          <div style={styles.radioGroup}>
            <div style={styles.radioItem}>
              <label>
                <input
                  type="radio"
                  name="title"
                  value="" // This will represent "All Positions"
                  checked={search.title === ""}
                  onChange={handleSearchChange}
                  style={styles.radioInput}
                />
                All Positions
              </label>
            </div>
            {Array.from(new Set(jobPosts.map((post) => post.title))).map(
              (title) => (
                <div key={title} style={styles.radioItem}>
                  <label>
                    <input
                      type="radio"
                      name="title"
                      value={title}
                      checked={search.title === title}
                      onChange={handleSearchChange}
                      style={styles.radioInput}
                    />
                    {title}
                  </label>
                </div>
              )
            )}
          </div>
        </div>

        <div
          className="overlap-10"
          style={{ height: "50px", display: "flex", alignItems: "center" }}
        >
          <div className="row w-100 d-flex align-items-center">
            {" "}
            {/* Added w-100 for full width */}
            <div className="col">
              {" "}
              {/* Full width for title search */}
              <input
                type="text"
                name="title"
                placeholder="Search by title"
                value={search.title}
                onChange={handleSearchChange}
                style={styles.searchInput}
              />
            </div>
            <div className="col-auto">
              {" "}
              {/* Auto width for position select */}
              <select
                name="position"
                value={search.position}
                onChange={handleSearchChange}
                style={styles.searchSelect}
              >
                <option value="">All Positions</option>
                {Array.from(new Set(jobPosts.map((post) => post.title))).map(
                  (title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="overlap-12">
          <div className="my-objective-is-to-wrapper">
            <p className="my-objective-is-to">
              {objectives}
            </p>
          </div>
          <div className="text-wrapper-26">Contacts</div>
          <div className="text-wrapper-27">Objective</div>
          <div className="text-wrapper-28">Skills</div>
          <div className="text-wrapper-29">About Me</div>
          <img
            className="uis-bag"
            alt="Uis bag"
            src="https://c.animaapp.com/u3FUp8l1/img/uis-bag.svg"
          />
          <div className="frame-13">
            <div className="text-wrapper-30">Primary Industry:</div>
            <div className="text-wrapper-31">{industry}</div>
          </div>
          <div className="frame-14">
            <div className="text-wrapper-30">Experience:</div>
            <div className="text-wrapper-31">{experience}</div>
          </div>
          <div className="frame-15">
            <div className="text-wrapper-30">Expected Salary:</div>
            <p className="text-wrapper-31">{salary}</p>
          </div>
          <div className="frame-16">
            <div className="text-wrapper-30">Phone:</div>
            <div className="text-wrapper-31">{phone}</div>
          </div>
          <div className="frame-17">
            <div className="text-wrapper-30">Location:</div>
            <div className="text-wrapper-31">{city}</div>
          </div>
          <div className="frame-18">
            <div className="text-wrapper-30">Email:</div>
            <div className="text-wrapper-31">{email}</div>
          </div>
          <img
            className="mdi-calendar"
            alt="Mdi calendar"
            src="https://c.animaapp.com/u3FUp8l1/img/mdi-calendar.svg"
          />
          <img
            className="clarity-dollar-solid"
            alt="Clarity dollar solid"
            src="https://c.animaapp.com/u3FUp8l1/img/clarity-dollar-solid.svg"
          />
          <div className="overlap-13">
            <div className="text-wrapper-32">{skills[0] || "N/A" } </div>
          </div>
          <div className="overlap-14">
            <div className="text-wrapper-33">{skills[1] || "N/A" }</div>
          </div>
        </div>

        {/* Overlay for displaying job details */}
        {isOverlayOpen && selectedJob && (
          <div className="overlay">
            <div className="overlay-content">
              <h2>
                <input
                  type="text"
                  name="title"
                  value={selectedJob.title || ""}
                  readOnly
                  style={styles.input}
                />
              </h2>
              <h2 className="school">STI Las Pinas Campus</h2>
              <div className="info" style={styles.infoContainer}>
                <FontAwesomeIcon icon={faMale} style={styles.icon} />
                <span className={styles.info}>{selectedJob.slots}</span>
                <h1 className="slots-left" style={{ marginLeft: "5px" }}>
                  slot(s) left
                </h1>
                <FontAwesomeIcon icon={faClock} style={styles.icon} />
                <span className={styles.info}>{selectedJob.type}</span>
                <FontAwesomeIcon icon={faCalendar} style={styles.icon} />
                <span className={styles.info}>{selectedJob.timePosted}</span>
              </div>

              <div className="overlay-description">
                <p>
                  <strong>Description:</strong>
                </p>
                <textarea
                  name="description"
                  value={selectedJob.description || ""}
                  readOnly
                  style={styles.textarea}
                />
                <h1>Notes: </h1>
                <h2 className="notes-section">
                  *To ensure your application is accurately evaluated, please
                  align your resume closely with the job requirements and skills
                  detailed in this posting. Our initial screening is conducted
                  through an automated resume parser that relies on this
                  information. Only candidates identified by this technology
                  will be further reviewed by our HR team. Your attention to
                  detail is appreciated.
                  {/* Add instructions when the button is disabled */}
                </h2>
              </div>

              <div className="overlay-actions">
                <button className="overlay-close" onClick={handleCloseOverlay}>
                  Close
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <button
                  className={`overlay-button ${
                    resumeStatus[selectedJob.id] === "apply"
                      ? "apply-button"
                      : "replace-button"
                  }`}
                  onClick={loading ? null : handleApplyOrReplace}
                  disabled={loading || uploadingResume}
                >
                  {loading
                    ? "Uploading..."
                    : resumeStatus[selectedJob.id] === "apply"
                    ? "Apply"
                    : "Replace"}
                </button>

                {/* New Cancel button */}
                <button
                  className="cancel-button"
                  onClick={() =>
                    handleOpenConfirmation(
                      selectedJob.id,
                      userId,
                      selectedJob.title
                    )
                  }
                  disabled={resumeStatus[selectedJob.id] !== "replace"}
                >
                  Cancel
                </button>
                {isConfirmationOpen && (
                  <div className="confirmation-overlay">
                    <div className="confirmation-content">
                      <h2>Are you sure you want to delete this resume?</h2>
                      <p>This action cannot be undone.</p>
                      <div className="confirmation-actions">
                        <button
                          onClick={handleConfirmDelete}
                          className="yes-button"
                        >
                          Yes
                        </button>
                        <button
                          onClick={handleCancelDelete}
                          className="no-button"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <ToastContainer />
              </div>
            </div>
          </div>
        )}

        <div className="pagination-container" style={styles.pagination}>
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={styles.pageButton}
          >
            &laquo; Prev
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={`pagination-button ${
                currentPage === index + 1 ? "active" : ""
              }`}
              onClick={() => handlePageChange(index + 1)}
              style={{
                ...styles.pageButton,
                ...(currentPage === index + 1 ? styles.activePageButton : {}),
              }}
            >
              {index + 1}
            </button>
          ))}
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={styles.pageButton}
          >
            Next &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  centerContainer: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  searchInput: {
    marginRight: "10px",
    padding: "5px 10px", // Ensure padding matches Bootstrap inputs
    height: "38px", // Match Bootstrap's input height
    width: "100%", // Make the input take full width of its column
  },
  searchSelect: {
    padding: "5px 10px", // Ensure padding matches Bootstrap selects
    height: "38px", // Match Bootstrap's select height
  },

  container: {
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    lineHeight: "36px",
  },
  radioGroup: {
    marginBottom: "12px",
  },
  radioItem: {
    marginBottom: "8px",
  },
  radioInput: {
    marginRight: "8px",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "4px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },

  jobCard: {
    display: "flex",
    alignItems: "center",
    padding: "50  px",
    borderRadius: "8px",
    border: "1px solid #C6C6C6",
    width: "835px",
    height: "235px",
    backgroundColor: "#FFFFFF",
    marginBottom: "15px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    position: "relative",
    transition: "box-shadow 0.3s ease",
  },
  logo: {
    marginRight: "20px",
    width: "150px",
    height: "auto",
    marginBottom: "50px",
    marginLeft: "50px",
  },
  cardContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  campus: {
    fontSize: "18px",
    fontFamily: "DM Sans",
    fontWeight: "400",
    color: "#141414",
    margin: "0 0 10px 0",
  },
  input: {
    display: "block",
    marginBottom: "10px",
    width: "calc(100% - 20px)",
    borderRadius: "4px",
    boxSizing: "border-box",
    fontFamily: "DM Sans",
    fontSize: "32px",
    fontWeight: "700",
    lineHeight: "48px",
    textAlign: "left",
  },
  textarea: {
    display: "block",
    marginBottom: "10px",
    width: "calc(100% - 20px)",
    padding: "10px",
    height: "250px",
    borderRadius: "4px",
  },
  title: {
    fontSize: "24px",
    fontFamily: "DM Sans",
    fontWeight: "500",
    color: "#141414",
    margin: "0 0 10px 0",
  },
  infoContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
  },
  icon: {
    width: "16px", // Adjust as needed
    height: "16px", // Adjust as needed
    marginRight: "5px",
  },
  info: {
    fontSize: "16px",
    fontFamily: "DM Sans",
    fontWeight: "400",
    color: "#141414",
    marginRight: "15px",
  },
  description: {
    fontSize: "16px",
    fontFamily: "DM Sans",
    fontWeight: "400",
    color: "#141414",
    margin: "0 0 10px 0",
  },
  removeButton: {
    padding: "10px 20px",
    fontSize: "16px",
    fontFamily: "DM Sans",
    fontWeight: "500",
    color: "#FFFFFF",
    backgroundColor: "#FF4C4C",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    position: "absolute",
    bottom: "15px",
    right: "15px",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    background: "#fff", // Optional: add background color to distinguish the controls
    borderTop: "1px solid #ddd", // Optional: add a border on top
    padding: "10px",
    boxShadow: "0 -2px 5px rgba(0, 0, 0, 0.1)", // Optional: add a shadow for better visibility
    zIndex: "10",
  },
  pageButton: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    margin: "0 5px",
    border: "1px solid #ddd", // Optional: add a border for better definition
    borderRadius: "5px", // Optional: add rounded corners
    backgroundColor: "#f5f5f5", // Optional: add a background color
  },
  activePageButton: {
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
  },
};

export default ApplicantDashboard;
