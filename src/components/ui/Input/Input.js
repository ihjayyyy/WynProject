import React from 'react';
import { FiUpload } from 'react-icons/fi';
import styles from './Input.module.scss';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  icon,
  readOnly = false,
  multiline = false,
  rows = 3,
  ...props
}) {
  const today = new Date().toISOString().split('T')[0];
  const [fileName, setFileName] = React.useState('');
  const inputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFileName('');
    } else if (files.length === 1) {
      setFileName(files[0].name);
    } else {
      setFileName(`${files.length} files`);
    }
    if (onChange) onChange(e);
  };
  return (
    <div className={styles.field}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className={styles.inputIconWrap}>
        {icon && <span className={styles.inputIcon}>{icon}</span>}
        {multiline ? (
          <textarea
            className={styles.input}
            id={id}
            name={props.name}
            value={value}
            onChange={onChange}
            rows={rows}
            readOnly={readOnly}
            {...props}
          />
        ) : type === 'file' ? (
          <div className={styles.fileInputWrap}>
            {!readOnly && (
              <button
                type="button"
                className={styles.fileButton}
                onClick={() => inputRef.current && inputRef.current.click()}
                aria-label="Upload file"
                title="Upload file">
                <FiUpload size={18} />
              </button>
            )}
            <span className={styles.fileName} title={fileName}>
              {fileName || 'No file chosen'}
            </span>
            <input
              ref={inputRef}
              className={styles.inputFile}
              id={id}
              type="file"
              onChange={handleFileChange}
              readOnly={readOnly}
              {...props}
            />
          </div>
        ) : (
          <input
            className={styles.input}
            id={id}
            type={type}
            // For date inputs, prefer the provided value; fall back to today only when value is empty
            value={type === 'date' ? value || today : value}
            onChange={onChange}
            readOnly={readOnly}
            {...props}
          />
        )}
      </div>
    </div>
  );
}
