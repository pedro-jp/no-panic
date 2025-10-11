import React, { ReactNode } from 'react';
import styles from './styles.module.css';

interface Props {
  children: ReactNode;
}

export const Container = ({ children }: Props) => {
  return <div className={styles.container}>{children}</div>;
};
