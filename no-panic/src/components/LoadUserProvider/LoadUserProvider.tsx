'use client';
import React from 'react';
import { LoadUser } from '../loadUser/loadUser';
import { Provider } from '../provider/auth-provider';

export const LoadUserProvider = () => {
  return (
    <Provider>
      <LoadUser />
    </Provider>
  );
};
