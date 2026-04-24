export const Button = ({ children, onClick, type = "button", className }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-5 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm ${className}`}
    >
      {children}
    </button>
  );
};
