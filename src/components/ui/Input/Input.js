import React from "react";
import styles from "./Input.module.scss";

export default function Input({ label, id, type = "text", value, onChange, ...props }) {
  return (
    <div className={styles.field}>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}
