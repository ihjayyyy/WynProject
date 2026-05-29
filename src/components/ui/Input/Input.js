import React from 'react';
import { FiUpload } from 'react-icons/fi';
import styles from './Input.module.scss';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  icon,
  readOnly = false,
  multiline = false,
  rows = 3,
  className,        // applied to the field wrapper div, not the input
  inputClassName,   // applied directly to the input/textarea element
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
    <div className={`${styles.field} ${className || ''}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className={styles.inputIconWrap}>
        {icon && <span className={styles.inputIcon}>{icon}</span>}
        {multiline ? (
          <textarea
            className={`${styles.input} ${inputClassName || ''}`}
            id={id}
            name={props.name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
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
              className={`${styles.inputFile} ${inputClassName || ''}`}
              id={id}
              type="file"
              onChange={handleFileChange}
              onBlur={onBlur}
              readOnly={readOnly}
              {...props}
            />
          </div>
        ) : (
          <input
            className={`${styles.input} ${inputClassName || ''}`}
            id={id}
            type={type}
            // For date inputs, prefer the provided value; fall back to today only when value is empty
            value={type === 'date' ? value || today : value}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={
              type === 'number'
                ? (e) => {
                    if (Number(e.target.value) === 0) {
                      onChange &&
                        onChange({
                          target: { name: e.target.name, value: '' },
                        });
                    }
                  }
                : undefined
            }
            readOnly={readOnly}
            {...props}
          />
        )}
      </div>
    </div>
  );
}