import { useRef, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faExchangeAlt,
  faReceipt,
  faCoins,
  faTimes,
  faArrowDown,
  faFileAlt,
  faDatabase,
  faPlus,
  faMoneyBillTransfer,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "next-themes";
import PropTypes from "prop-types";

const actionItems = [
  {
    icon: faArrowDown,
    label: "Deposit",
    path: "/deposits",
    accent: "from-emerald-500/20 to-teal-400/20 text-emerald-500",
  },
  {
    icon: faMoneyBillTransfer,
    label: "Withdraw",
    path: "/withdrawal",
    accent: "from-amber-500/20 to-orange-400/20 text-amber-500",
  },
  {
    icon: faFileAlt,
    label: "Proof",
    path: "/paymentproof",
    accent: "from-sky-500/20 to-cyan-400/20 text-sky-500",
  },
  {
    icon: faDatabase,
    label: "Stake",
    path: "/stake",
    accent: "from-violet-500/20 to-fuchsia-400/20 text-violet-500",
  },
];

const FooterActionWidget = ({ isOpen, onClose, centerX }) => {
  const { theme } = useTheme();

  if (!isOpen || centerX === null) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close quick actions"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
      />
      <div
        className={`fixed bottom-24 z-50 w-[min(94vw,30rem)] rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900/90 text-slate-100"
            : "border-teal-100 bg-white/95 text-slate-900"
        }`}
        style={{
          left: `${centerX}px`,
          transform: "translateX(-50%)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold tracking-wide text-teal-500">
            Quick Actions
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-1.5 transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800"
                : "hover:bg-slate-100"
            }`}
            aria-label="Close quick actions"
          >
            <FontAwesomeIcon icon={faTimes} className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {actionItems.map(({ icon, label, path, accent }) => (
            <Link
              key={label}
              to={path}
              onClick={onClose}
              className={`group flex flex-col items-center rounded-xl p-2.5 transition-all duration-200 hover:-translate-y-0.5 ${
                theme === "dark"
                  ? "hover:bg-slate-800/80"
                  : "hover:bg-slate-50"
              }`}
            >
              <span
                className={`mb-1.5 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${accent}`}
              >
                <FontAwesomeIcon icon={icon} className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

FooterActionWidget.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  centerX: PropTypes.number,
};

const FooterNavItem = ({ icon, label, path, active }) => {
  return (
    <Link
      to={path}
      className={`group relative flex min-w-[62px] flex-col items-center gap-0.5 text-[11px] font-medium transition-all duration-200 ${
        active
          ? "text-teal-500"
          : "text-slate-500 hover:text-teal-500 dark:text-slate-400 dark:hover:text-teal-300"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
          active
            ? "bg-teal-500/20 text-teal-400"
            : "bg-slate-100 group-hover:bg-teal-500/15 dark:bg-slate-800 dark:group-hover:bg-teal-500/15"
        }`}
      >
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      </span>
      <span>{label}</span>
      <span
        className={`absolute -bottom-1 h-1 w-1 rounded-full bg-teal-400 transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </Link>
  );
};

FooterNavItem.propTypes = {
  icon: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
};

const FooterToggleButton = ({ isWidgetOpen, onClick, buttonRef }) => {
  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      aria-label={isWidgetOpen ? "Close quick actions" : "Open quick actions"}
      className={`relative -top-5 z-10 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
        isWidgetOpen
          ? "border-teal-300/50 bg-gradient-to-br from-teal-500 to-cyan-500 text-white"
          : "border-teal-400/40 bg-gradient-to-br from-teal-600 to-sky-600 text-white"
      }`}
    >
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-teal-400/40 blur-md" />
      <FontAwesomeIcon
        icon={isWidgetOpen ? faTimes : faPlus}
        className="relative h-4.5 w-4.5"
      />
    </button>
  );
};

FooterToggleButton.propTypes = {
  isWidgetOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  buttonRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
};

const Footer = ({ isSidebarOpen }) => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [buttonCenter, setButtonCenter] = useState(null);
  const buttonRef = useRef(null);
  const location = useLocation();

  const updateButtonCenter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonCenter(rect.left + rect.width / 2);
    }
  };

  useEffect(() => {
    if (!isWidgetOpen) return undefined;

    updateButtonCenter();
    window.addEventListener("resize", updateButtonCenter);
    window.addEventListener("scroll", updateButtonCenter, true);

    return () => {
      window.removeEventListener("resize", updateButtonCenter);
      window.removeEventListener("scroll", updateButtonCenter, true);
    };
  }, [isWidgetOpen]);

  useEffect(() => {
    setIsWidgetOpen(false);
  }, [location.pathname]);

  const isPathActive = (path) => {
    const current = location.pathname.toLowerCase();
    const target = path.toLowerCase();
    return current === target || current.startsWith(`${target}/`);
  };

  const leftNavItems = [
    { icon: faHome, label: "Home", path: "/dashboard" },
    { icon: faCoins, label: "Assets", path: "/assets" },
  ];

  const rightNavItems = [
    { icon: faExchangeAlt, label: "Trade", path: "/placetrade" },
    { icon: faReceipt, label: "History", path: "/transactions" },
  ];

  return (
    <>
      <FooterActionWidget
        isOpen={isWidgetOpen}
        onClose={() => setIsWidgetOpen(false)}
        centerX={buttonCenter}
      />

      <footer
        className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-200 ${
          isSidebarOpen ? "md:left-64" : "md:left-16"
        }`}
      >
        <div className="mx-auto h-[78px] w-full max-w-xl px-3 pb-3">
          <div className="flex h-full items-end">
            <div className="relative flex h-[64px] w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 shadow-[0_10px_30px_rgba(2,8,23,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_12px_36px_rgba(2,8,23,0.55)]">
              <div className="flex items-center gap-3">
                {leftNavItems.map((item) => (
                  <FooterNavItem
                    key={item.path}
                    {...item}
                    active={isPathActive(item.path)}
                  />
                ))}
              </div>

              <FooterToggleButton
                isWidgetOpen={isWidgetOpen}
                onClick={() => setIsWidgetOpen((prev) => !prev)}
                buttonRef={buttonRef}
              />

              <div className="flex items-center gap-3">
                {rightNavItems.map((item) => (
                  <FooterNavItem
                    key={item.path}
                    {...item}
                    active={isPathActive(item.path)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

Footer.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
};

export default Footer;
