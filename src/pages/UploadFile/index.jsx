import React, { useState, useEffect } from "react";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from "../../firebase/firebase";
import { Link } from 'react-router-dom';
import { LogOut } from "../../components/CandidateModule/LogOut";
import "./style.css";
import { useAuth } from "../../contexts/authContext";
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { update, getDatabase, ref as dbRef, onValue } from "firebase/database";

const db = getFirestore(app);

export const UploadFile = () => {
  const storage = getStorage(app);
  const database = getDatabase(app);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  
  // Initialize uploadStatus
  const [uploadStatus, setUploadStatus] = useState({
    nbi: false,
    birth_certificate: false,
    certificate_of_employment: false,
    pre_employment_medical_exam: false,
    pag_ibig: false,
    bir: false,
    sss: false,
    philhealth: false,
    let_certificate: false,
  });

  const [completed, setCompleted] = useState(0);
  const [incomplete, setIncomplete] = useState(100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const completedOffset = circumference - (completed / 100) * circumference;
  const incompleteOffset = circumference - (incomplete / 100) * circumference;

  // Fetch progress data and upload status from Firestore on mount
  useEffect(() => {
    if (userId) {
      const progressRef = dbRef(database, `users/${userId}/profile`);
      onValue(progressRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCompleted(data.completed || 0);
          setIncomplete(data.incomplete || 100);
        }
      });

      // Fetch upload status from Firestore
      const fetchUploadStatus = async () => {
        const docRef = doc(db, 'UploadStatus', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUploadStatus(docSnap.data());
        } else {
          console.log('No upload status document found for this user.');
        }
      };

      fetchUploadStatus();
    }
  }, [userId, database]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        alert('File size exceeds 5 MB. Please upload a smaller file.');
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
        setError(null);
        if (selectedType) {
          handleTypeChange(selectedType, file);
        } else {
          setError('Please select a file type.');
        }
      }
    }
  };

  const handleIconClick = (type) => {
    setSelectedType(type);
    document.getElementById('fileInput').click();
  };

  const handleTypeChange = async (type, file) => {
    if (file && type) {
      const fileRef = storageRef(storage, `${type}/${userId}/${file.name}`);
  
      try {
        await getDownloadURL(fileRef);
        alert('A file with this name already exists. Please choose a different file or rename it.');
      } catch (error) {
        if (error.code === 'storage/object-not-found') {
          try {
            await uploadBytes(fileRef, file);
            alert('File uploaded successfully');
            
            const downloadURL = await getDownloadURL(fileRef);
            console.log('Download URL:', downloadURL);
  
            setUploadStatus((prevStatus) => {
              const updatedStatus = { ...prevStatus, [type]: true };
              const newCompleted = Math.round(Object.values(updatedStatus).filter(status => status).length * 11.1);
              const finalCompleted = Math.min(newCompleted, 100);
              const finalIncomplete = finalCompleted === 100 ? 0.1 : 100 - finalCompleted;
  
              // Update the incomplete state here
              setIncomplete(finalIncomplete); // Set the incomplete state
              
              // Update progress in Realtime Database
              if (userId) {
                const progressRef = dbRef(database, `users/${userId}/profile`);
                update(progressRef, {
                  completed: finalCompleted,
                  incomplete: finalIncomplete,
                }).catch((error) => {
                  console.error("Error updating progress in database:", error);
                });
              }
  
              // Update Firestore with the new upload status
              if (userId) {
                const uploadStatusRef = doc(db, 'UploadStatus', userId);
                getDoc(uploadStatusRef).then(docSnap => {
                  if (!docSnap.exists()) {
                    setDoc(uploadStatusRef, {
                      nbi: false,
                      birth_certificate: false,
                      certificate_of_employment: false,
                      pre_employment_medical_exam: false,
                      pag_ibig: false,
                      bir: false,
                      sss: false,
                      philhealth: false,
                      let_certificate: false,
                      [type]: true,
                    }).then(() => {
                      console.log('Upload status initialized in Firestore');
                    }).catch((error) => {
                      console.error("Error initializing upload status in Firestore:", error);
                    });
                  } else {
                    setDoc(uploadStatusRef, updatedStatus, { merge: true })
                      .catch((error) => {
                        console.error("Error updating upload status in Firestore:", error);
                      });
                  }
                });
              }
  
              return updatedStatus;
            });
  
            setSelectedFile(null);
            setSelectedType('');
          } catch (uploadError) {
            console.error('Error uploading file:', uploadError);
            alert('Error uploading file. Please try again.');
          }
        } else {
          console.error('Error checking file existence:', error);
          alert('Error checking file existence. Please try again.');
        }
      }
    } else {
      alert('Please select a file and a type.');
    }
  };
  
  
  
  return (
    <div className="upload-file">
      <div className="div">
        <img
          className="image"
          alt="Image"
          src="https://c.animaapp.com/sEHMluyY/img/image-1@2x.png"
        />

        <div className="overlap">
          <div className="rectangle" />

          <div className="frame">
            <div className="frame-wrapper">
              <div className="frame-2">
                <img
                  className="vector"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector.svg"
                />

                <img
                  className="img"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-1.svg"
                />

                <LogOut divClassName="log-out-instance" />
              </div>
            </div>
          </div>

          <div className="rectangle-2" />

          <div className="navbar">
            <Link to="/ApplicantDashboard" className="text-wrapper-2">Home</Link>
            <div className="text-wrapper-2">Application</div>

            <div className="text-wrapper-2">About</div>

            <div className="text-wrapper-2">Contact</div>

            <div className="text-wrapper-3">Upload File</div>
          </div>
        </div>

        <img
          className="rectangle-3"
          alt="Rectangle"
          src="https://c.animaapp.com/sEHMluyY/img/rectangle-44.svg"
        />

        <img
          className="logo"
          alt="Logo"
          src="https://c.animaapp.com/sEHMluyY/img/logo1-1.png"
        />

        <div className="rectangle-4" />

        <div className="overlap-group">
          <div className="text-wrapper-4">Progress</div>

          <div className="progress-circle">
              <svg width="100" height="100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#e6e6e6"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#4caf50"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={completedOffset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
              </svg>
              <span className="percentage">{completed}%</span>
            </div>

          <div className="iprogress-circle">
              <svg width="100" height="100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#e6e6e6"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#f44336"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={incompleteOffset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
              </svg>
              <span className="percentage">{incomplete === 0.1 ? '0%' : `${incomplete}%`}</span>
            </div>

          <div className="text-wrapper-6">Completed</div>

          <div className="text-wrapper-7">Incomplete</div>
        </div>

        <div className="frame-3">
          <div className="text-wrapper-8">Requirements</div>
        </div>
        <input type="file" id="fileInput" onChange={handleFileChange} accept=".pdf,.docx,image/*" className="file-upload-input" />

        <div className="frame-4">
          <div className="text-wrapper-9" >NBI Clearance</div>

          <div className="frame-5">
            <div className="frame-6">
              <div className="frame-7">
                <div className="text-wrapper-10">{uploadStatus.nbi ? "File Uploaded" : "No file uploaded"}</div>

                <img
                  className="vector-2"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-18.svg"
                />
              </div>

              <div className="frame-8">
                <div className="frame-9">
                  <img
                    className="vector-3"
                    alt="Vector"
                    src="https://c.animaapp.com/sEHMluyY/img/vector-19.svg"
                  />

                  <div className="text-wrapper-11" onClick={() => handleIconClick('nbi')}>Upload File</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-10">
          <div className="text-wrapper-9">SSS</div>

          <div className="frame-5">
            <div className="frame-6">
              <div className="frame-7">
                <div className="text-wrapper-10">{uploadStatus.sss ? "File Uploaded" : "No file uploaded"}</div>

                <img
                  className="vector-2"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-18.svg"
                />
              </div>

              <div className="frame-8">
                <div className="frame-9">
                  <img
                    className="vector-3"
                    alt="Vector"
                    src="https://c.animaapp.com/sEHMluyY/img/vector-19.svg"
                  />

                  <div className="text-wrapper-11 " onClick={() => handleIconClick('sss')}>Upload File</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-11">
          <div className="text-wrapper-9">PhilHealth</div>

          <div className="frame-5">
            <div className="frame-6">
              <div className="frame-7">
                <div className="text-wrapper-10">{uploadStatus.philhealth ? "File Uploaded" : "No file uploaded"}</div>

                <img
                  className="vector-2"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-18.svg"
                />
              </div>

              <div className="frame-8">
                <div className="frame-9">
                  <img
                    className="vector-3"
                    alt="Vector"
                    src="https://c.animaapp.com/sEHMluyY/img/vector-19.svg"
                  />

                  <div className="text-wrapper-11" onClick={() => handleIconClick('philhealth')}>Upload File</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-12">
          <div className="text-wrapper-9">LET Certificate</div>

          <div className="frame-5">
            <div className="frame-6">
              <div className="frame-7">
                <div className="text-wrapper-10">{uploadStatus.let_certificate ? "File Uploaded" : "No file uploaded"}</div>

                <img
                  className="vector-2"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-18.svg"
                />
              </div>

              <div className="frame-8">
                <div className="frame-9">
                  <img
                    className="vector-3"
                    alt="Vector"
                    src="https://c.animaapp.com/sEHMluyY/img/vector-19.svg"
                  />

                  <div className="text-wrapper-11" onClick={() => handleIconClick('let_certificate')}>Upload File</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-13">
          <div className="text-wrapper-9">Birth Certificate/PSA</div>

          <div className="frame-5">
            <div className="frame-14">
              <div className="frame-15">
                <div className="text-wrapper-10">{uploadStatus.birth_certificate ? "File Uploaded" : "No file uploaded"}</div>

                <img
                  className="vector-2"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-18.svg"
                />
              </div>

              <div className="frame-8">
                <div className="frame-9">
                  <img
                    className="vector-3"
                    alt="Vector"
                    src="https://c.animaapp.com/sEHMluyY/img/vector-19.svg"
                  />

                  <div className="text-wrapper-11" onClick={() => handleIconClick('birth_certificate')}>Upload File</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-16">
          <div className="text-wrapper-9">Certificate of Employment</div>

          <div className="frame-5">
            <div className="frame-6">
              <div className="frame-7">
                <div className="text-wrapper-10">{uploadStatus.certificate_of_employment ? "File Uploaded" : "No file uploaded"}</div>

                <img
                  className="vector-2"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-18.svg"
                />
              </div>

              <div className="frame-8">
                <div className="frame-9">
                  <img
                    className="vector-3"
                    alt="Vector"
                    src="https://c.animaapp.com/sEHMluyY/img/vector-19.svg"
                  />

                  <div className="text-wrapper-11" onClick={() => handleIconClick('certificate_of_employment')}>Upload File</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-17">
          <div className="text-wrapper-9">Pre Employment Medical Exam</div>

          <div className="frame-5">
            <div className="frame-6">
              <div className="frame-7">
                <div className="text-wrapper-10">{uploadStatus.pre_employment_medical_exam ? "File Uploaded" : "No file uploaded"}</div>

                <img
                  className="vector-2"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-18.svg"
                />
              </div>

              <div className="frame-8">
                <div className="frame-9">
                  <img
                    className="vector-3"
                    alt="Vector"
                    src="https://c.animaapp.com/sEHMluyY/img/vector-19.svg"
                  />

                  <div className="text-wrapper-11" onClick={() => handleIconClick('pre_employment_medical_exam')}>Upload File</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-18">
          <div className="text-wrapper-9">PAG-IBIG</div>

          <div className="frame-5">
            <div className="frame-6">
              <div className="frame-7">
                <div className="text-wrapper-10">{uploadStatus.pag_ibig ? "File Uploaded" : "No file uploaded"}</div>

                <img
                  className="vector-2"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-18.svg"
                />
              </div>

              <div className="frame-8">
                <div className="frame-9">
                  <img
                    className="vector-3"
                    alt="Vector"
                    src="https://c.animaapp.com/sEHMluyY/img/vector-19.svg"
                  />

                  <div className="text-wrapper-11" onClick={() => handleIconClick('pag_ibig')}>Upload File</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-19">
          <div className="text-wrapper-9">BIR</div>

          <div className="frame-5">
            <div className="frame-6">
              <div className="frame-7">
                <div className="text-wrapper-10">{uploadStatus.bir ? "File Uploaded" : "No file uploaded"}</div>

                <img
                  className="vector-2"
                  alt="Vector"
                  src="https://c.animaapp.com/sEHMluyY/img/vector-18.svg"
                />
              </div>

              <div className="frame-8">
                <div className="frame-9">
                  <img
                    className="vector-3"
                    alt="Vector"
                    src="https://c.animaapp.com/sEHMluyY/img/vector-19.svg"
                  />

                  <div className="text-wrapper-11" onClick={() => handleIconClick('bir')}>Upload File</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default UploadFile;
