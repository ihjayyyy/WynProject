import styles from './Button.module.scss';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button 
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
