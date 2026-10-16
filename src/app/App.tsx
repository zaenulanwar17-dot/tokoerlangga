import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { DemoAuthProvider } from '../context/DemoAuthContext';
import { StorefrontCartProvider } from '../context/StorefrontCartContext';
import { ToastProvider } from '../context/ToastContext';
import { StoreSettingsProvider } from '../context/StoreSettingsContext';

export const App: React.FC = () => {
  return (
    <StoreSettingsProvider>
      <DemoAuthProvider>
        <StorefrontCartProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </StorefrontCartProvider>
      </DemoAuthProvider>
    </StoreSettingsProvider>
  );
};

export default App;
