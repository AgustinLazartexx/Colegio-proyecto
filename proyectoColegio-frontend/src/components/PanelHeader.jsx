// src/components/PanelHeader.jsx
const PanelHeader = ({ title, subtitle }) => {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold text-accent">{title}</h1>
      <p className="text-gray-600 mt-1">{subtitle}</p>
    </header>
  );
};

export default PanelHeader;
