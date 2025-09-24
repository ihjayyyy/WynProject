
import styles from './Button.module.scss';

export default function Button({
  children,
  variant = 'primary',
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  type = 'button',
  icon = null,
  ...props
}) {
  const isIconOnly = !!icon && !children;
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
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {!isIconOnly && children}
    </button>
  );
}
