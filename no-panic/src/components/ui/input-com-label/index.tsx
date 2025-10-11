import React, { InputHTMLAttributes } from 'react';
import styles from './styles.module.css';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = ({ label, ...rest }: Props) => {
  return (
    <label className={styles.label}>
      {label}
      <input {...rest} spellCheck={false} />
    </label>
  );
};
