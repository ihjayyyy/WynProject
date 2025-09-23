
import styles from './Button.module.scss';

export default function Button({
  children = 'Button',
  variant = 'primary',
  className = '',
  type = 'button',
  icon = null,
  ...props
}) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`}
      type={type}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}
