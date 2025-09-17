import React from "react";
import styles from "./TextAreaField.module.scss";

export default function TextAreaField({ label, name, value, onChange, icon, ...props }) {
  return (
    <div className={styles.textAreaField}>
      {label && <label htmlFor={name}>{label}</label>}
      <div className={styles.inputIconWrap}>
        {icon && (
          <span className={styles.inputIcon}>{icon}</span>
        )}
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          {...props}
          className={styles.textarea}
        />
      </div>
    </div>
  );
}
