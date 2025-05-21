import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

<<<<<<< HEAD
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
=======
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
>>>>>>> bffb8d82164a4e29ac985da94d8b6a3e8e279e2c
);
