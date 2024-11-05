import React, { useState, useEffect } from "react";
import { LogOut } from "../../components/CandidateModule/LogOut";
import "./style.css";
import sti from "../stilogo.png";
import Back from "../Settings/Back.png";
import Frame174 from "../HRDashboard/Frame 174.png";
import Phone from "../HRDashboard/Phone.png";
import Message from "../HRDashboard/Message.png";
import SettingsButton from "../UploadFile/Settings.png";
import EditIcon from "./EditIcon.png";
import ProfileIcon from "../Settings/ProfileIcon.png";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/authContext";
import { firestore, database } from "../../firebase/firebase"; // Import Firestore
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"; // Import Firestore functions
import { doc, setDoc } from "firebase/firestore";
import { ref, set, getDatabase, get,update } from "firebase/database";



const MyProfile = () => {
  const { currentUser } = useAuth();
  const [resumeName, setResumeName] = useState("Juan Dela Cruz");
  const [email, setEmail] = useState("juandelacruz@gmail.com");
  const [phone, setPhone] = useState("09123456789");
  const [skills, setSkills] = useState("Network, Programming");
  const [industry, setIndustry] = useState("Information Technology");
  const [salary, setSalary] = useState("25,000 /mon");
  const [experience, setExperience] = useState("0-2 years");
  const [country, setCountry] = useState("Philippines");
  const [city, setCity] = useState("Las Piñas");
  const [province, setProvince] = useState("Metro Manila");
  const [postal, setPostal] = useState("1750");
  const [barangay, setBarangay] = useState("Almanza Uno");
  const [objectives, setObjectives] = useState(""); // New state for objectives
  const userId = currentUser?.uid;

  const [isEditing, setIsEditing] = useState(false);
  const [isEditing2, setIsEditing2] = useState(false);
  const [isEditing3, setIsEditing3] = useState(false);
  const [isEditingObjectives, setIsEditingObjectives] = useState(false); // State to toggle editing objectives

  

  const fetchProfileOrResume = async () => {
    try {
      const db = getDatabase();
      const profileRef = ref(db, `users/${userId}/profile`);
  
      // Check for existing profile in Realtime Database
      const profileSnapshot = await get(profileRef);
      if (profileSnapshot.exists()) {
        console.log("Profile found in Realtime Database.");
        const profileData = profileSnapshot.val();
  
        // Define fields and status values
        const statusFields = new Set(['completed', 'incomplete', 'JobApplied']);
        const requiredFields = [
          'resumeName',
          'email',
          'phone',
          'skills',
          'industry'
        ];
  
        // Check if any required fields have valid values
        const hasValidProfileData = requiredFields.some(field => {
          const value = profileData[field]?.trim();
          return value && !statusFields.has(value); // Must be non-empty and not a job status
        });
  
        // Check if the profile contains only job status fields
        const containsOnlyJobStatus = Object.values(profileData).every(value => 
          statusFields.has(value)
        );
  
        if (hasValidProfileData) {
          // Profile is valid; set data from Realtime Database profile
          setResumeName(profileData.resumeName?.trim() || "Juan Dela Cruz");
          setEmail(profileData.email?.trim() || "juandelacruz@gmail.com");
          setPhone(profileData.phone?.trim() || "09123456789");
          setObjectives(profileData.objectives?.trim() || "")
          setSkills(profileData.skills?.trim() || "Network, Programming");
          setIndustry(profileData.industry?.trim() || "Information Technology");
        } else {
          console.log("Profile found but contains only job statuses. Fetching latest resume from Firestore.");
          await fetchLatestResumeFromFirestore();
        }
      } else {
        console.log("No profile found, fetching the latest resume from Firestore.");
        await fetchLatestResumeFromFirestore();
      }
    } catch (error) {
      console.error("Error fetching profile or latest resume:", error);
    }
  };
  
  // Function to fetch the latest resume from Firestore
  const fetchLatestResumeFromFirestore = async () => {
    if (userId) {
      const resumesRef = collection(firestore, `users/${userId}/profile`);
      const latestResumeQuery = query(
        resumesRef,
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(latestResumeQuery);
  
      if (!querySnapshot.empty) {
        console.log("Latest resume found in Firestore.");
        const latestResume = querySnapshot.docs[0].data();
  
        console.log("Latest resume data:", latestResume); // Log the structure
  
        // Check for names and set resume name safely
        const nameArray = latestResume.names || [];
        const name = Array.isArray(nameArray) && nameArray.length > 0 ? nameArray[0] : "";
        setResumeName(name.trim() || "Juan Dela Cruz");
  
        // Safely handle email
        const emailArray = latestResume.emails || [];
        const email = Array.isArray(emailArray) && emailArray.length > 0 ? emailArray[0].trim() : "";
        setEmail(email || "juandelacruz@gmail.com");
  
        // Safely handle phone
        const phone = (latestResume.phone || "").trim();
        setPhone(phone || "09123456789");
  
        //const skills = profileData.skills || "Network, Programming";
        //setSkills(skills.trim());
        
        //const industry = profileData.industry || "Information Technology";
        //setIndustry(industry.trim());

        setObjectives(latestResume.objectives || "My objective is to leverage my strong problem-solving skills and experience in network administration to contribute to STI's innovative IT environment. I'm particularly interested in MIS and believe my skills can be an asset to your team.  This position represents an exciting opportunity to learn from industry leaders and grow my expertise in MIS."); // Set objectives if present


        // Safely handle skills
        const skillsArray = latestResume.skills || [];
        const skills = Array.isArray(skillsArray) ? skillsArray.map(skill => skill.trim()).join(", ") : "";
        setSkills(skills || "Network, Programming");
  
        // Safely handle industry - access Degree or other needed field
        const industry = (latestResume.industry?.Degree || "").trim();
        setIndustry(industry || "Information Technology");
      } else {
        console.log("No resume found in Firestore.");
      }
    }
  };
  
  useEffect(() => {
    if (userId) {
      fetchProfileOrResume();
    }
  }, [userId]);

  const saveProfile = async () => {
    if (userId) {
      try {
        const userDocRef = doc(firestore, `users/${userId}/profile`, "info");
        await setDoc(userDocRef, {
          resumeName,
          email,
          phone,
          skills,
          timestamp: new Date(),
          industry,
          salary,
          experience,
          country,
          city,
          province,
          postal,
          barangay,
          objectives,
        });

        // Save profile info to Realtime Database
        const userRef = ref(database, `users/${userId}/profile`);
        await update(userRef, {
          resumeName,
          email,
          phone,
          skills,
          timestamp: new Date().toISOString(),
          industry,
          salary,
          experience,
          country,
          city,
          province,
          postal,
          barangay,
          objectives, // Save objectives
        });

        alert("Profile saved successfully!");
      } catch (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save profile. Please try again.");
      }
    }
  };

  const fetchLatestResume = async () => {};

  return (
    <div className="my-profile">
      <div className="div">
        <img className="image" alt="Image" src="image-1.png" />
        <div className="overlap">
          <div className="frame">
            <div className="frame-wrapper">
              <div className="frame-2">
                <img
                  className="vector"
                  alt="Vector"
                  src="https://c.animaapp.com/u3FUp8l1/img/vector-2.svg"
                />
                <img className="img" alt="Vector" src={SettingsButton} />
                <LogOut divClassName="log-out-instance" />
              </div>
            </div>
          </div>
          <div className="navbar">
            <div className="text-wrapper-2">Home</div>
            <div className="text-wrapper-2">Application</div>
            <div className="text-wrapper-2">About</div>
            <div className="text-wrapper-2">Contact</div>
            <div className="text-wrapper-2">Upload File</div>
          </div>
        </div>
        <div className="overlap-group">
          <div className="rectangle" />
        </div>
        <img className="logo" alt="Logo" src={sti} />
        <div className="rectangle-2" />
        <div className="overlap-2">
          <div className="frame-3">
            <img className="icon-person" alt="Icon person" src={ProfileIcon} />
            <div className="frame-4">
              {isEditing ? (
                // Editable fields
                <div className="edit-fields">
                  <input
                    className="text-wrapper-7"
                    type="text"
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                  />
                  <input
                    className="text-wrapper-8"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                  <input
                    className="text-wrapper-8"
                    type="text"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                  />
                  <input
                    className="text-wrapper-8"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <div className="text-wrapper-7">{resumeName}</div>
                  <div className="text-wrapper-8">{industry}</div>
                  <p className="p">
                    {barangay}, {city}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="div-wrapper">
            
          </div>
        </div>
        <div className="overlap-3">
          <div className="text-wrapper-10">Personal Information</div>

          <div className="frame-6">
            <div className="text-wrapper-11">Name</div>
            {isEditing2 ? (
              <input
                className="text-wrapper-12"
                type="text"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-12">{resumeName}</div>
            )}
          </div>

          <div className="frame-7">
            <div className="text-wrapper-13">Experience</div>
            {isEditing2 ? (
              <input
                className="text-wrapper-14"
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-14">{experience}</div>
            )}
          </div>

          <div className="frame-8">
            <div className="text-wrapper-15">Expected Salary</div>
            {isEditing2 ? (
              <input
                className="text-wrapper-16"
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-16">{salary}</div>
            )}
          </div>

          <div className="frame-9">
            <div className="text-wrapper-11">Industry</div>
            {isEditing2 ? (
              <input
                className="text-wrapper-17"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-17">{industry}</div>
            )}
          </div>

          <div className="frame-10">
            <div className="text-wrapper-18">Email address</div>
            {isEditing2 ? (
              <input
                className="text-wrapper-19"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-19">{email}</div>
            )}
          </div>

          <div className="frame-11">
            <div className="text-wrapper-11">Phone</div>
            {isEditing2 ? (
              <input
                className="text-wrapper-20"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-20">{phone}</div>
            )}
          </div>

          <div className="frame-12">
            <div className="text-wrapper-11">Skills</div>
            {isEditing2 ? (
              <input
                className="text-wrapper-21"
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-21">{skills}</div>
            )}
          </div>

          <div className="div-wrapper">
            <div
              className="frame-5 hover-effect"
              onClick={() => setIsEditing2(!isEditing2)}
            >
              <img className="vector-7" alt="Vector" src={EditIcon} />
              <div className="text-wrapper-9">
                {isEditing2 ? "Cancel" : "Edit"}
              </div>
            </div>
          </div>
        </div>
        <div className="overlap-4">
          <div className="frame-13">
            <div
              className="frame-5 hover-effect"
              onClick={() => setIsEditing3(!isEditing3)}
            >
              <img className="vector-7" alt="Vector" src={EditIcon} />
              <div className="text-wrapper-9">
                {isEditing3 ? "Cancel" : "Edit"}
              </div>
            </div>
          </div>
          <div className="text-wrapper-22">Address</div>

          <div className="frame-14">
            <div className="text-wrapper-11">Country</div>
            {isEditing3 ? (
              <input
                className="text-wrapper-23"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-23">{country}</div>
            )}
          </div>

          <div className="frame-15">
            <div className="text-wrapper-11">Province</div>
            {isEditing3 ? (
              <input
                className="text-wrapper-24"
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-24">{province}</div>
            )}
          </div>

          <div className="frame-16">
            <div className="text-wrapper-11">Barangay</div>
            {isEditing3 ? (
              <input
                className="text-wrapper-24"
                type="text"
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-24">{barangay}</div>
            )}
          </div>

          <div className="frame-17">
            <div className="text-wrapper-11">City</div>
            {isEditing3 ? (
              <input
                className="text-wrapper-23"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-23">{city}</div>
            )}
          </div>

          <div className="frame-18">
            <div className="text-wrapper-25">Postal Code</div>
            {isEditing3 ? (
              <input
                className="text-wrapper-23"
                type="text"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
              />
            ) : (
              <div className="text-wrapper-23">{postal}</div>
            )}
          </div>
        </div>
        <div className="text-wrapper-77">Objectives</div>
        {isEditingObjectives ? (
          <textarea
            className="textBox"
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
          />
        ) : (
          <div className="textBox">{objectives}</div>
        )}
        <button
          className="editObjectives"
          onClick={() => setIsEditingObjectives(!isEditingObjectives)}
        >
          {isEditingObjectives ? "Save Objectives" : "Edit Objectives"}
        </button>
        <Link to="/Settings">
          <div className="frame-19">
            <img className="vector-8" alt="Vector" src={Back} />
            <div className="text-wrapper-26">My Profile</div>
          </div>
        </Link>
        <button className="custom-button" onClick={saveProfile}>
          Save Profile
        </button>
      </div>
    </div>
  );
};

export default MyProfile;
