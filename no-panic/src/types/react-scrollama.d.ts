declare module 'react-scrollama' {
  import * as React from 'react';

  interface ScrollamaProps {
    children: React.ReactNode;
    onStepEnter?: (data: { data: any }) => void;
    onStepExit?: (data: { data: any }) => void;
    offset?: number;
  }

  interface StepProps {
    data?: any;
    children: React.ReactNode;
  }

  export const Scrollama: React.FC<ScrollamaProps>;
  export const Step: React.FC<StepProps>;
}
