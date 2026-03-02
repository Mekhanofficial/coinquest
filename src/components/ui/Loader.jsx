const Loader = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-white font-bold">Loading...</span>
        </div>
      </div>
    );
  };


  export default Loader