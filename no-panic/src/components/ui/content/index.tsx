import React, { ReactNode } from 'react';
import styles from './styles.module.css';

interface Props {
  children: ReactNode;
}

export const Content = ({ children }: Props) => {
  return <div className={styles.content}>{children}</div>;
};
