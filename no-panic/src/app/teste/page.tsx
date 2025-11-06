'use client';

import { Scene3D } from '@/components/scene-3d';
import { BiArrowToBottom, BiHeart, BiUserPlus } from 'react-icons/bi';
import styles from './styles.module.css';

export default function Page() {
  return (
    <main className={styles.container}>
      <Scene3D />

      <section className={styles.hero}>
        <h1 id='top'>NO PANIC</h1>
        <h2>Psicologia Online, sem pressa e sem pressão.</h2>
        <p>
          Conecte-se com psicólogos de verdade, sem sair de casa. Cuide da
          mente, melhore o foco e viva com mais leveza.
        </p>
        <a href='#beneficios' className={styles.scrollBtn}>
          <BiArrowToBottom size={32} />
        </a>
      </section>

      <section id='beneficios' className={styles.section}>
        <h2>Equilíbrio começa com autoconhecimento</h2>
        <p>
          A terapia é um espaço seguro pra você entender suas emoções, descobrir
          seus limites e aprender a se cuidar de forma real.
        </p>
        <p>Aqui, o foco é você — sem julgamentos, sem rótulos. Só evolução.</p>
        <a href='#porque' className={styles.scrollBtn}>
          <BiArrowToBottom size={32} />
        </a>
      </section>

      <section id='porque' className={styles.section}>
        <a href='#top' className={styles.scrollBtn}>
          <BiArrowToBottom size={32} />
        </a>
        <h2>Por que escolher o No Panic?</h2>
        <div className={styles.grid}>
          <Card
            icon={<BiHeart size={40} />}
            title='Cuidado de verdade'
            text='Psicólogos certificados e empáticos, prontos pra te ouvir e ajudar a crescer.'
          />
          <Card
            icon={<BiUserPlus size={40} />}
            title='Terapia do seu jeito'
            text='Sessões online, acessíveis e no seu ritmo. Sem filas, sem complicação.'
          />
          <Card
            icon={<BiHeart size={40} />}
            title='Resultados reais'
            text='Ganhe autoconfiança, equilíbrio emocional e clareza pra encarar qualquer desafio.'
          />
        </div>
        <a href='#end' className={styles.scrollBtn}>
          <BiArrowToBottom size={32} />
        </a>
      </section>

      <section id='end' className={styles.section}>
        <a href='#porque' className={styles.scrollBtn}>
          <BiArrowToBottom size={32} />
        </a>
        <h2>Abordagens que transformam</h2>
        <div className={styles.grid}>
          <Card
            title='Terapia Cognitivo-Comportamental'
            text='Ajuda a identificar padrões de pensamento e a construir novos caminhos mentais.'
          />
          <Card
            title='Psicanálise'
            text='Explora o inconsciente e revela as causas profundas dos seus conflitos.'
          />
          <Card
            title='Terapia Humanista'
            text='Valoriza o seu potencial de mudança e crescimento pessoal.'
          />
        </div>
      </section>

      <footer className={styles.footer}>
        <p>Sem pânico. Só você, sua mente e o próximo passo.</p>
      </footer>
    </main>
  );
}

function Card({
  icon,
  title,
  text,
}: {
  icon?: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className={styles.card}>
      {icon && <div className={styles.cardIcon}>{icon}</div>}
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
