import React from "react";
import styles from "./Button.module.scss";

export default function Button({ children, className = "", ...props }) {
  return (
    <button className={`${styles.button} ${className}`} {...props}>
      {children}
    </button>
  );
}
