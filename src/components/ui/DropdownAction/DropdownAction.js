"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiMoreVertical } from 'react-icons/fi';
import styles from './DropdownAction.module.scss';

export default function DropdownAction({ item, items }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 160 });

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onDoc = (e) => {
      // close when clicking outside both trigger and menu
      if (
        triggerRef.current &&
        (triggerRef.current.contains(e.target) || (menuRef.current && menuRef.current.contains(e.target)))
      ) {
        return;
      }
      close();
    };

    const onEsc = (e) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [close]);

  const computePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const gap = 8;
    const preferredWidth = Math.max(120, rect.width * 1.5, 160);
    const maxWidth = Math.min(260, viewportWidth - 24); // leave some margin
    const width = Math.min(preferredWidth, maxWidth);

    // decide open below or above
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openAbove = spaceBelow < 160 && spaceAbove > spaceBelow;

    let top = openAbove ? rect.top - gap : rect.bottom + gap;
    if (openAbove) {
      // adjust to place menu above the trigger (subtract menu height later if needed)
      // We'll position the bottom at rect.top - gap by setting top to rect.top - estimatedHeight
      // but since we don't know height, position at rect.top - 200 (will adjust if it overflows)
      top = rect.top - 200;
      if (top < 8) top = 8; // clamp
    }

    // align right of menu with trigger right, but keep within viewport
    let left = rect.right - width;
    if (left < 8) left = 8;
    if (left + width > viewportWidth - 8) left = viewportWidth - width - 8;

    setMenuStyle({ top, left, width, openAbove });
  }, []);

  useEffect(() => {
    if (open) {
      computePosition();
      window.addEventListener('resize', computePosition);
      window.addEventListener('scroll', computePosition, true);
    }
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [open, computePosition]);

  const toggle = (e) => {
    e.stopPropagation();
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) computePosition();
  };


  if (!Array.isArray(items) || items.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('DropdownAction requires a non-empty `items` array prop');
    }
    return null;
  }

  const renderCustomItems = () => {
    return items.map((it, idx) => {
      const hidden = typeof it.hidden === 'function' ? it.hidden(item) : !!it.hidden;
      if (hidden) return null;
      const disabled = typeof it.disabled === 'function' ? it.disabled(item) : !!it.disabled;
      const cls = `${styles.menuItem} ${it.destructive ? styles.destructive : ''}`;
      return (
        <button
          key={it.key || idx}
          className={cls}
          onClick={(e) => {
            e.stopPropagation();
            close();
            if (it.onClick) it.onClick(item);
          }}
          disabled={disabled}
        >
          {it.icon ? <span className={styles.icon}>{it.icon}</span> : null}
          <span>{it.label}</span>
        </button>
      );
    });
  };

  const menu = (
    <div
      ref={menuRef}
      className={`${styles.menu} ${menuStyle.openAbove ? styles.openAbove : ''}`}
      role="menu"
      style={{ position: 'fixed', top: `${menuStyle.top}px`, left: `${menuStyle.left}px`, width: `${menuStyle.width}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {renderCustomItems()}
    </div>
  );

  return (
    <div className={styles.container} ref={triggerRef}>
      <button
        className={styles.trigger}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        onMouseDown={(e) => e.preventDefault()} // avoid focus steal
      >
        <FiMoreVertical size={16} />
      </button>

      {open && typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
    </div>
  );
}
