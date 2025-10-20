import React from 'react';
import styles from './styles.module.css';

interface Props {
  children: React.ReactNode;
  canExit?: boolean;
}

export const Modal = ({ children, canExit = true }: Props) => {
  return <div className={styles.modal}>{children}</div>;
};
