// src/components/SummaryCard.jsx
const SummaryCard = ({ title, value }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-accent mt-2">{value}</p>
    </div>
  );
};

export default SummaryCard;
