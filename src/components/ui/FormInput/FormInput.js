import React from "react";
import styles from "./FormInput.module.scss";

export default function FormInput({ label, id, type = "text", value, onChange, ...props }) {
  return (
    <div className={styles.field}>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        {...props}
        className={styles.input}
      />
    </div>
  );
}
