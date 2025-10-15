import React, { ButtonHTMLAttributes } from 'react';
import styles from './styles.module.css';
import { GridLoader } from 'react-spinners';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button = ({ children, disabled, ...rest }: Props) => {
  return (
    <button className={styles.button} {...rest}>
      {disabled === true ? <GridLoader size={2} color='#fff' /> : children}
    </button>
  );
};
