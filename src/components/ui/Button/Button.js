
import { useRef } from 'react';
import styles from './Button.module.scss';

export default function Button({
  children,
  variant = 'primary',
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  type = 'button',
  icon = null,
  onClick,
  ...props
}) {
  const clickLockRef = useRef(false);
  const isIconOnly = !!icon && !children;

  const handleClick = async (event) => {
    if (clickLockRef.current) return;
    clickLockRef.current = true;

    try {
      await onClick?.(event);
    } finally {
      setTimeout(() => {
        clickLockRef.current = false;
      }, 300);
    }
  };

  return (
    <button
      className={[
        styles.button,
        styles[variant],
        styles[size],
        isIconOnly ? styles.iconOnly : '',
        className
      ].filter(Boolean).join(' ')}
      type={type}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {!isIconOnly && children}
    </button>
  );
}
