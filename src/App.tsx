import { Link, Route, Routes } from 'react-router-dom';
import type { NotificationPayload } from '#shared/types';

function Nav() {
  return (
    <nav className="flex items-center justify-between p-4 border-b border-gray-800">
      <div className="font-semibold">Ergonomic App</div>
      <div className="flex gap-4">
        <Link to="/" className="hover:underline">Inicio</Link>
        <Link to="/live" className="hover:underline">En vivo</Link>
        <Link to="/settings" className="hover:underline">Ajustes</Link>
      </div>
    </nav>
  );
}

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Bienvenido</h1>
      <p className="text-gray-300">Estructura base lista. Backend Python se iniciará con la app. Salud: usa el botón para probar notificaciones.</p>
      <div className="mt-4">
        <button
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          onClick={() => {
            const payload: NotificationPayload = { title: 'Prueba', body: 'Notificación informativa', severity: 'info' };
            window.api?.notify(payload);
          }}
        >
          Probar notificación
        </button>
      </div>
    </div>
  );
}

function Live() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">Monitoreo en vivo</h2>
      <p className="text-gray-300">Placeholder para stream y análisis en tiempo real (MediaPipe/OpenCV).</p>
    </div>
  );
}

function Settings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">Ajustes</h2>
      <ul className="list-disc ml-6 text-gray-300">
        <li>Autoinicio del sistema</li>
        <li>Preferencias de notificaciones</li>
        <li>Privacidad (procesamiento 100% local)</li>
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <div className="h-full flex flex-col">
      <Nav />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<Live />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    api?: {
      notify: (payload: NotificationPayload) => void;
    };
  }
}



