import React, { ButtonHTMLAttributes } from 'react';
import styles from './styles.module.css';
import { GridLoader } from 'react-spinners';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: string;
  size?: number;
}

export const Button = ({ children, disabled, color, size, ...rest }: Props) => {
  return (
    <button className={styles.button} {...rest}>
      {disabled === true ? (
        <GridLoader size={size ? size : 2} color={color ? color : '#fff'} />
      ) : (
        children
      )}
    </button>
  );
};
