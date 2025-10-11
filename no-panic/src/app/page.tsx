import Image from 'next/image';
import styles from './page.module.css';
import { TbCalendarHeart, TbVideo } from 'react-icons/tb';
import Link from 'next/link';

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <Image src='/logo_azul_sf.png' alt='Logo' height={50} width={50} />
          <h2>NoPanic</h2>
          <span>Terapia online</span>
        </div>

        <div className={styles.text}>
          <p className={styles.paragrafo}>
            Aplicativo de terapia online. <br />
            Conecte-se com profissionais <br />
            qualificados no conforto da sua casa.
          </p>
        </div>

        <div className={styles.login}>
          <button>
            <Link href='/login'>Entrar</Link>
          </button>
          <button>
            <Link href='/cadastro'>Cadastro</Link>
          </button>
        </div>

        <div className={styles.chamadas}>
          <div className={styles.chamada}>
            <TbVideo size={20} color='white' />
            <span>Sessões Online</span>
            <p>Videochamadas seguras e privadas</p>
          </div>
          <div className={styles.chamada}>
            <TbCalendarHeart size={20} color='white' />
            <span>Agendamento fácil</span>
            <p>Marque suas sessões com praticidade</p>
          </div>
          <div className={styles.chamada}>
            <TbVideo size={20} color='white' />
            <span>Profissionais Qualificados</span>
            <p>Terapeutas certificados e experientes</p>
          </div>
        </div>
      </div>
    </main>
  );
}
