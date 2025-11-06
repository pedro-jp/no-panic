'use client';

import { useEffect, useState } from 'react';
import { Scene3D } from '@/components/scene-3d';
import { ScrollSection } from '@/components/ScrollSection';
import styles from './styles.module.css';
import Image from 'next/image';
import { BiArrowToBottom, BiHeart, BiUserPlus } from 'react-icons/bi';

export default function Page() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / totalHeight;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className={styles.container}>
      <div className={styles.canvasContainer}>
        <Scene3D scrollProgress={scrollProgress} />
      </div>

      <section className={styles.hero}>
        <div className={styles.brainImageContainer}>
          <Image
            src='/images/brain.png'
            alt='Brain'
            width={300}
            height={300}
            className={styles.brainImage}
          />
        </div>
        <h1 className={styles.heroTitle}>MENTE & EQUILÍBRIO</h1>
        <p className={styles.heroSubtitle}>
          Descubra o poder da terapia e psicologia para transformar sua vida e
          alcançar o bem-estar mental
        </p>
        <div className={styles.scrollIndicator}>
          <BiArrowToBottom size={32} />
        </div>
      </section>

      <ScrollSection>
        <div className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>A Jornada do Autoconhecimento</h2>
          <p className={styles.sectionText}>
            A terapia é um espaço seguro onde você pode explorar seus
            pensamentos, emoções e comportamentos. Através do processo
            terapêutico, você desenvolve ferramentas para lidar com desafios,
            superar traumas e construir uma vida mais significativa.
          </p>
          <p className={styles.sectionText}>
            A psicologia moderna nos ensina que a saúde mental é tão importante
            quanto a saúde física. Cuidar da mente não é sinal de fraqueza, mas
            de coragem e autocuidado.
          </p>
        </div>
      </ScrollSection>

      <ScrollSection>
        <div className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>Benefícios da Terapia</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              {/* <Brain className={styles.cardIcon} size={40} /> */}
              <h3 className={styles.cardTitle}>Saúde Mental</h3>
              <p className={styles.cardText}>
                Desenvolva resiliência emocional e aprenda estratégias eficazes
                para gerenciar ansiedade, estresse e outros desafios mentais.
              </p>
            </div>
            <div className={styles.card}>
              <BiHeart className={styles.cardIcon} size={40} />
              <h3 className={styles.cardTitle}>Autoconhecimento</h3>
              <p className={styles.cardText}>
                Explore suas emoções profundas, identifique padrões de
                comportamento e compreenda melhor quem você realmente é.
              </p>
            </div>
            <div className={styles.card}>
              <BiUserPlus className={styles.cardIcon} size={40} />
              <h3 className={styles.cardTitle}>Relacionamentos</h3>
              <p className={styles.cardText}>
                Melhore suas habilidades de comunicação e construa
                relacionamentos mais saudáveis e significativos com as pessoas
                ao seu redor.
              </p>
            </div>
          </div>
        </div>
      </ScrollSection>

      <ScrollSection>
        <div className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>Abordagens Terapêuticas</h2>
          <p className={styles.sectionText}>
            Existem diversas abordagens na psicologia, cada uma com suas
            técnicas e filosofias. O importante é encontrar aquela que melhor se
            adapta às suas necessidades e objetivos pessoais.
          </p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Terapia Cognitivo-Comportamental
              </h3>
              <p className={styles.cardText}>
                Focada em identificar e modificar padrões de pensamento
                negativos que influenciam comportamentos e emoções.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Psicanálise</h3>
              <p className={styles.cardText}>
                Explora o inconsciente e experiências passadas para compreender
                conflitos internos e promover mudanças profundas.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Terapia Humanista</h3>
              <p className={styles.cardText}>
                Centrada na pessoa, valoriza o potencial humano de crescimento e
                autorrealização através da empatia e aceitação.
              </p>
            </div>
          </div>
        </div>
      </ScrollSection>

      <footer className={styles.footer}>
        <p>Cuide da sua mente. Invista no seu bem-estar.</p>
      </footer>
    </main>
  );
}
