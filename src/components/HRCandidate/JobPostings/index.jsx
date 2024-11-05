import React from "react";
import "./style.css";

export const JobPostings = ({ className }) => {
  return (
    <div className={`job-postings ${className}`}>
      <div className="text-wrapper">Job Posting</div>
    </div>
  );
};
