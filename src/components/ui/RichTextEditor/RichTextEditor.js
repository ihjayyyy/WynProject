'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './RichTextEditor.module.scss';

// Dynamically import ReactQuill to avoid SSR issues
let ReactQuill = null;

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['clean'],
];

export default function RichTextEditor({ label, value = '', onChange, readOnly = false, placeholder = '' }) {
  const [mounted, setMounted] = useState(false);
  const quillRef = useRef(null);

  useEffect(() => {
    import('react-quill-new').then((mod) => {
      ReactQuill = mod.default;
      setMounted(true);
    });
    // Import quill CSS once
    import('react-quill-new/dist/quill.snow.css');
  }, []);

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.editorWrap} ${readOnly ? styles.readOnly : ''}`}>
        {mounted && ReactQuill ? (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value || ''}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={placeholder}
            modules={{ toolbar: readOnly ? false : TOOLBAR }}
          />
        ) : (
          <div className={styles.skeleton} />
        )}
      </div>
    </div>
  );
}
