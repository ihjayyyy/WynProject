import React from "react";
import styles from "./SaveButton.module.scss";

export default function SaveButton({ children = "Save", ...props }) {
  return (
    <button className={styles.saveButton} type="submit" {...props}>
      {children}
    </button>
  );
}
