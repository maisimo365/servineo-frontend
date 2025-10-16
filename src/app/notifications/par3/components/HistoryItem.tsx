// components/HistoryItem.tsx
import { HistoryItemProps } from '../types';

const HistoryItem: React.FC<HistoryItemProps> = ({ status, title, fixer, date }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Completado":
        return { bg: "bg-[#16A34A]", border: "border-[#16A34A]" };
      case "En proceso":
        return { bg: "bg-[#2B6AE0]", border: "border-[#2B6AE0]" };
      case "Pendiente":
        return { bg: "bg-[#FFC857]", border: "border-[#FFC857]" };
      case "Fallido":
        return { bg: "bg-[#EF4444]", border: "border-[#EF4444]" };
      case "Enviado":
        return { bg: "bg-[#2B31E0]", border: "border-[#2B31E0]" };
      default:
        return { bg: "bg-[#64748B]", border: "border-[#64748B]" };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <div className={`border-l-4 ${styles.border} p-4 mb-4 bg-white shadow-sm rounded-lg hover:shadow-md transition duration-300 border border-[#D1D5DB]`}>
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-[#111827] text-sm">{title}</h4>
        <span className={`text-xs text-white px-2 py-1 rounded-full font-medium ${styles.bg}`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-[#111827] mt-1 font-normal">
        <span className="font-medium">Fixer:</span> {fixer}
      </p>
      <div className="text-xs text-right text-[#64748B] mt-2">{date}</div>
    </div>
  );
};

export default HistoryItem;