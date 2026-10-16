import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Acceso denegado</h1>
      <p className="text-lg text-gray-700 mb-6">
        No tenés permiso para ver esta página.
      </p>
      <Link
        to="/"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
      >
        Volver al inicio
      </Link>
    </div>
  );
};

export default Unauthorized;
