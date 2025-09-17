import React from "react";
import styles from "./TextAreaField.module.scss";

export default function TextAreaField({ label, name, value, onChange, ...props }) {
  return (
    <div className={styles.textAreaField}>
      <label htmlFor={name}>{label}</label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        {...props}
        className={styles.textarea}
      />
    </div>
  );
}
