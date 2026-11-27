// src/context/AlertContext.jsx
import { createContext, useContext, useState } from 'react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert((current) => (current?.message === message ? null : current));
    }, 4500);
  }

  function clearAlert() {
    setAlert(null);
  }

  return (
    <AlertContext.Provider value={{ alert, showAlert, clearAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}