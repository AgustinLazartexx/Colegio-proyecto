// src/components/CardPanel.jsx
const CardPanel = ({ icon, title }) => {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-lg transition">
      <div className="text-secondary bg-secondary/10 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-accent">{title}</h3>
      </div>
    </div>
  );
};

export default CardPanel;
