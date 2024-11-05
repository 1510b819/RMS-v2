import React from "react";
import "./style.css";

export const JobPosting = ({ className }) => {
  return (
    <div className={`job-postings ${className}`}>
      <div className="text-wrapper">Job Posting</div>
    </div>
  );
};

