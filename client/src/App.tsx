import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Controller from './views/Controller';
import Display from './views/Display';
import Admin from './views/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/controller" element={<Controller />} />
        <Route path="/display" element={<Display />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<Navigate to="/controller" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
