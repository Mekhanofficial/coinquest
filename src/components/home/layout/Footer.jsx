import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faInstagram,
  faPinterest,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import px12 from "../../../pictures/px12.png";

export default function FooterPage() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-950 text-white pt-16 pb-8 relative z-40">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* Brand section */}
          <div className="space-y-6">
            <div className="flex items-center">
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-cyan-700">
                Koin
                <span className=" bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-cyan-950">
                  Fu
                </span>
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Expert insights, innovative technology, and unmatched support -
              discover the coinquest advantage.
            </p>

            <div className="flex gap-4">
              {[faFacebook, faTwitter, faInstagram, faPinterest].map(
                (icon, index) => (
                  <button
                    key={index}
                    className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center transition-all duration-300 hover:bg-teal-500 hover:scale-110 group"
                  >
                    <FontAwesomeIcon
                      icon={icon}
                      className="text-gray-300 group-hover:text-white text-lg"
                    />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Links sections */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-wide relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-teal-500">
              Categories
            </h2>
            <ul className="space-y-4">
              {["What is ICO", "Token", "Road Map", "Advisor", "Payments"].map(
                (item, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-teal-400 transition-colors duration-300 flex items-center group"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-3 group-hover:bg-teal-400 transition-colors"></span>
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-wide relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-teal-500">
              Useful Links
            </h2>
            <ul className="space-y-4">
              {[
                "Payment & TAX",
                "Terms of Services",
                "My Account",
                "Return Policy",
                "Discount",
              ].map((item, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-teal-400 transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-3 group-hover:bg-teal-400 transition-colors"></span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-wide relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-teal-500">
              Newsletter
            </h2>
            <p className="text-gray-300">
              Get a 20% discount on your first order by subscribing to our
              newsletter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  type="email"
                  placeholder="Enter Your Email"
                />
              </div>
              <button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center whitespace-nowrap">
                <span className="mr-2">Subscribe</span>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-8"></div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-gray-400 text-sm">
          <p>© 2025 coinquest Ltd. All Rights Reserved</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-teal-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-teal-400 transition-colors">
              Terms & Conditions
            </a>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">Secured by</span>
            <div className="bg-gray-800 rounded-lg p-2">
              <img src={px12} alt="Security badge" className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
