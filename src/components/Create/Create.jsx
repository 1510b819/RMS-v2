import React from "react";
import "./style.css";

export const Create = ({ className, onClick }) => {
  return (
    <button className={`create ${className}`} onClick={onClick}>
      <div className="text-wrapper-5">Create</div>
    </button>
  );
};
