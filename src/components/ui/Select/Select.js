"use client";

import React, { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import styles from './Select.module.scss';

export default function Select({
  id,
  value,
  onChange,
  options = [],
  className,
  searchable = false,
  placeholder = 'Select...',
  ...props
}) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e) {
      const clickedInsideWrapper =
        wrapperRef.current && wrapperRef.current.contains(e.target);
      const clickedInsideDropdown =
        dropdownRef.current && dropdownRef.current.contains(e.target);

      if (!clickedInsideWrapper && !clickedInsideDropdown) {
        setOpen(false);
        setQuery('');
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Position dropdown
  useEffect(() => {
    if (!open) {
      setDropdownStyle(null);
      return;
    }

    function updatePosition() {
      const rect =
        inputRef.current?.getBoundingClientRect() ??
        wrapperRef.current?.getBoundingClientRect();

      if (!rect) return;

      setDropdownStyle({
        position: 'absolute',
        left: `${rect.left}px`,
        top: `${rect.bottom + window.scrollY}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  // Escape key closes dropdown
  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        inputRef.current?.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const opts = Array.isArray(options) ? options : [];

  const selectedOption = opts.find(
    (o) => String(o.value) === String(value)
  );

  const filtered =
    query.trim() === ''
      ? opts
      : opts.filter((o) =>
          (o.label || '')
            .toString()
            .toLowerCase()
            .includes(query.toLowerCase())
        );

  function handleSelect(val) {
    onChange?.({ target: { value: val } });
    setOpen(false);
    setQuery('');
  }

  return (
    <div
      ref={wrapperRef}
      className={`${styles.selectWrapper} ${styles.searchableWrapper}${
        className ? ` ${className}` : ''
      }`}
    >
      <div className={styles.searchInputWrap}>
        {searchable ? (
          <input
            ref={inputRef}
            id={id}
            type="text"
            name="search-select"
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className={styles.searchableInput}
            value={open ? query : selectedOption?.label || ''}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
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
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuery('');
              setOpen((s) => !s);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            {...props}
          >
            {selectedOption?.label || placeholder}
          </button>
        )}

        <div
          className={`${styles.selectArrow}${open ? ` ${styles.open}` : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((s) => !s);
          }}
          role="button"
          aria-hidden
        >
          <FiChevronDown size={16} />
        </div>
      </div>

      {open &&
        typeof document !== 'undefined' &&
        (dropdownStyle
          ? createPortal(
              <ul
                ref={dropdownRef}
                className={styles.dropdownList}
                role="listbox"
                style={dropdownStyle}
              >
                {filtered.length === 0 ? (
                  <li className={styles.noResults}>No results found</li>
                ) : (
                  filtered.map((opt, i) => (
                    <li
                      key={`${opt.value}_${i}`}
                      role="option"
                      aria-selected={String(opt.value) === String(value)}
                      className={`${styles.dropdownItem}${
                        String(opt.value) === String(value)
                          ? ` ${styles.selectedItem}`
                          : ''
                      }`}
                      onClick={() => handleSelect(opt.value)}
                    >
                      {opt.label}
                    </li>
                  ))
                )}
              </ul>,
              document.body
            )
          : (
              <ul
                ref={dropdownRef}
                className={styles.dropdownList}
                role="listbox"
              >
                {filtered.length === 0 ? (
                  <li className={styles.noResults}>No results found</li>
                ) : (
                  filtered.map((opt, i) => (
                    <li
                      key={`${opt.value}_${i}`}
                      role="option"
                      aria-selected={String(opt.value) === String(value)}
                      className={`${styles.dropdownItem}${
                        String(opt.value) === String(value)
                          ? ` ${styles.selectedItem}`
                          : ''
                      }`}
                      onClick={() => handleSelect(opt.value)}
                    >
                      {opt.label}
                    </li>
                  ))
                )}
              </ul>
            ))}
    </div>
  );
}