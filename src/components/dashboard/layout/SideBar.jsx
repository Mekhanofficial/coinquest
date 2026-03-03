import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import DashboardSidebar from "../../../constants/DashboardSidebar";
import { useTheme } from "next-themes";
import PropTypes from "prop-types";

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const { theme } = useTheme();
  const sidebarRef = useRef(null);
  const showFullSidebar = isSidebarOpen;

  const sidebarBg = theme === "dark" ? "bg-zinc-950" : "bg-gray-50";
  const headerBg = theme === "dark" ? "bg-slate-800" : "bg-gray-200";
  const hoverBg = theme === "dark" ? "hover:bg-slate-700" : "hover:bg-gray-300";
  const borderColor = theme === "dark" ? "border-slate-700" : "border-gray-200";

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 bottom-0 z-40 transition-all duration-200 ease-in-out ${
          showFullSidebar ? "w-64" : "w-16"
        } ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } overflow-x-hidden`}
      >
        {/* Inner Wrapper with Spacing */}
        <div className="h-full p-1.5">
          {/* Main Sidebar Content */}
          <div
            className={`h-full ${sidebarBg} ${borderColor} border shadow-xl flex flex-col rounded-r-xl overflow-hidden`}
          >
            {/* Header Section */}
            <div
              className={`flex items-center ${
                showFullSidebar
                  ? `justify-between ${headerBg}`
                  : "justify-center"
              } h-16 mx-2 mt-2 rounded-lg`}
            >
              {showFullSidebar ? (
                <h1 className="text-xl font-bold text-teal-500 dark:text-teal-600 whitespace-nowrap ml-3">
                  KOIN-
                  <span className="text-teal-400 dark:text-teal-500">FU</span>
                </h1>
              ) : (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className={`text-xl font-bold text-teal-500 dark:text-teal-600 rounded-md px-2 py-1 ${hoverBg}`}
                  aria-label="Expand sidebar"
                >
                  KF
                </button>
              )}
              {showFullSidebar && (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`p-2 rounded-full ${hoverBg} mr-2`}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Content Section */}
            <div
              className={`flex-1 ${
                showFullSidebar ? "overflow-y-auto" : "overflow-hidden"
              } mx-2 mb-2 overflow-x-hidden`}
            >
              <div className="py-1 overflow-x-hidden">
                <DashboardSidebar isCollapsed={!showFullSidebar} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Sidebar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
};
