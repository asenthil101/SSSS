interface TileProps {
  label: string;
  data: string | number;
}

const Tile: React.FC<TileProps> = ({ label, data }) => {
  return (
    <div className="rounded-xl border border-gray-300 px-5 py-4 transition-all transform hover:scale-105 hover:border-blue-400 hover:bg-gradient-to-br from-blue-100 to-white hover:shadow-lg">
      <h2 className="mb-3 text-2xl font-semibold text-gray-700">{label}</h2>
      <p className="m-0 max-w-[30ch] text-lg text-gray-500">{data}</p>
    </div>
  );
};

export default Tile;
