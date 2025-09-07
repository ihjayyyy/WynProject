
import LoginForm from '../../components/LoginForm/LoginForm';
import styles from './page.module.scss';

export default function LoginPage() {
  return (
    <main className={styles.container}>
      <LoginForm />
    </main>
  );
}
