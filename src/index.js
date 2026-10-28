import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import PatientCard from './PatientCard';
import reportWebVitals from './reportWebVitals';

const EvaluationDemo = React.lazy(() => import('./EvaluationDemo'));
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {process.env.REACT_APP_EVAL_DEMO === "true" ? <React.Suspense fallback="Cargando demostración..."><EvaluationDemo /></React.Suspense> : new URLSearchParams(window.location.hash.slice(1)).has('tarjeta')
      ? <PatientCard token={new URLSearchParams(window.location.hash.slice(1)).get('tarjeta')} />
      : <App />}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
