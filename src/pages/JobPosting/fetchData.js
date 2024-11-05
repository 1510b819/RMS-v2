import { getFirestore, doc, getDoc } from 'firebase/firestore';

const fetchCandidateData = async (jobTitle) => {
  console.log(`Job Title to Fetch: ${jobTitle}`); // Log the job title being searched

  const db = getFirestore();
  const uploadsDocRef = doc(db, 'candidates', 'uploads'); // Reference to the uploads document
  const uploadsDocSnapshot = await getDoc(uploadsDocRef); // Fetch the uploads document

  const candidatesWithUploads = [];

  if (uploadsDocSnapshot.exists()) {
    const uploadsData = uploadsDocSnapshot.data(); // Get data from uploads document
    console.log('Uploads Data:', uploadsData); // Log the uploads data

    // Loop through each userId in uploadsData
    for (const userId in uploadsData) {
      const uploadData = uploadsData[userId]; // Access the upload data for the user

      // Check if the job title matches
      if (uploadData.jobTitle === jobTitle) {
        candidatesWithUploads.push({
          userId: userId, // Document ID as userId
          resume: uploadData.resume, // Resume link
          uploadedAt: uploadData.uploadedAt.toDate(), // Convert Firestore timestamp
          jobTitle: uploadData.jobTitle // Job title
        });
      }
    }
  } else {
    console.log('No uploads document found.'); // Log if the uploads document doesn't exist
  }

  console.log(`Fetched Candidates:`, candidatesWithUploads); // Log the fetched candidates
  return candidatesWithUploads;
};

export default fetchCandidateData; // Export the function itself
