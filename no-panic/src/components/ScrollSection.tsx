import React, { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export const ScrollSection = ({ children }: Props) => {
  return <div>{children}</div>;
};
