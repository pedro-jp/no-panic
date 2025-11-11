import React from 'react';
import { GridLoader } from 'react-spinners';

export const Loader = () => {
  return (
    <GridLoader
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%,-50%)',
      }}
      size={40}
      color='gray'
    />
  );
};
