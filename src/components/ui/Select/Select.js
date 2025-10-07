"use client";

import React, { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import styles from './Select.module.scss';

export default function Select({ id, value, onChange, options = [], className, searchable = false, placeholder = 'Select...', ...props }) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState(null);

  useEffect(() => {
    function handleClick(e) {
      // Close only when click is outside both the wrapper and the portal dropdown
      const clickedInsideWrapper = wrapperRef.current && wrapperRef.current.contains(e.target);
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!clickedInsideWrapper && !clickedInsideDropdown) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // compute and set dropdown position when opening and on scroll/resize
  useEffect(() => {
    if (!open) {
      setDropdownStyle(null);
      return;
    }

    function updatePosition() {
      try {
        const rect = inputRef.current ? inputRef.current.getBoundingClientRect() : (wrapperRef.current && wrapperRef.current.getBoundingClientRect());
        if (!rect) return;
        const style = {
          position: 'absolute',
          left: `${rect.left}px`,
          top: `${rect.bottom + window.scrollY}px`,
          width: `${rect.width}px`,
          zIndex: 9999
        };
        setDropdownStyle(style);
      } catch (e) {
        // ignore
      }
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  // close on Escape and return focus to the control
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        try { inputRef.current && inputRef.current.focus(); } catch (err) {}
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const selectedOption = options.find(o => o.value === value);

  function handleSelect(val) {
    // emulate native select event shape
    if (onChange) onChange({ target: { value: val } });
    setOpen(false);
    setQuery('');
  }

  // Always render the custom dropdown UI (portal) so it isn't clipped by containers.
  // When `searchable` is false we render a read-only control that toggles the same dropdown list.

  const filtered = query.trim() === ''
    ? options
    : options.filter(o => (o.label || '').toString().toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={wrapperRef} className={styles.selectWrapper + ' ' + styles.searchableWrapper + (className ? ` ${className}` : '')}>
      <div className={styles.searchInputWrap}>
        {searchable ? (
          <input
            ref={inputRef}
            id={id}
            className={styles.searchableInput}
            value={open ? query : (selectedOption ? selectedOption.label : '')}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            {...props}
          />
        ) : (
          <button
            ref={inputRef}
            id={id}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            className={styles.customSelect}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setQuery(''); setOpen(s => !s); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            {...props}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </button>
        )}
        <div className={styles.selectArrow + (open ? ` ${styles.open}` : '')} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(s => !s); }} role="button" aria-hidden>
          <FiChevronDown size={16} />
        </div>
      </div>

      {open && typeof document !== 'undefined' && (dropdownStyle ? createPortal(
        <ul ref={dropdownRef} className={styles.dropdownList} role="listbox" style={{ ...dropdownStyle }}>
          {filtered.length === 0 && (
            <li className={styles.noResults}>No results found</li>
          )}
          {filtered.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={styles.dropdownItem + (opt.value === value ? ` ${styles.selectedItem}` : '')}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>, document.body) : (
          <ul ref={dropdownRef} className={styles.dropdownList} role="listbox">
            {filtered.length === 0 && (
              <li className={styles.noResults}>No results found</li>
            )}
            {filtered.map(opt => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={styles.dropdownItem + (opt.value === value ? ` ${styles.selectedItem}` : '')}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
