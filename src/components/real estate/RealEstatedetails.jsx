import { useTheme } from "next-themes";
import {
  faFileAlt,
  faXmark,
  faChartLine,
  faBuilding,
  faCalendar,
  faDollarSign,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";

const ProjectDetail = ({
  project,
  onClose,
  theme,
  investmentRecord,
  handleInvestClick,
  availableBalance = 0,
}) => {
  const [view, setView] = useState("property");
  const [isInvesting, setIsInvesting] = useState(false);
  const [isInvested, setIsInvested] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentDuration, setInvestmentDuration] = useState(30);
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    setIsInvesting(investmentRecord?.status === "pending");
    setIsInvested(investmentRecord?.status === "completed");
  }, [investmentRecord]);

  const parseCurrency = (value) => {
    if (!value) return 0;
    const parsed = Number(`${value}`.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);

  const handleDetailInvest = async () => {
    const amountValue = parseCurrency(investmentAmount);
    const minimumValue = parseCurrency(project?.amount);
    const balanceValue = Number(availableBalance ?? 0);

    if (!investmentAmount || Number.isNaN(amountValue) || amountValue <= 0) {
      setShowSuccess(false);
      setModalMessage("Enter a valid investment amount.");
      return;
    }

    if (amountValue < minimumValue) {
      setShowSuccess(false);
      setModalMessage(
        `Minimum investment is ${formatCurrency(minimumValue)}.`
      );
      return;
    }

    if (amountValue > balanceValue) {
      setShowSuccess(false);
      setModalMessage(
        `Insufficient funds. Available balance is ${formatCurrency(
          balanceValue
        )}.`
      );
      return;
    }

    if (!investmentDuration) {
      setShowSuccess(false);
      setModalMessage("Select an investment duration.");
      return;
    }

    setModalMessage("");
    const result = await handleInvestClick({
      projectId: project.id,
      amount: amountValue,
      duration: investmentDuration,
    });

    if (result?.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setInvestmentAmount("");
      setInvestmentDuration(30);
    } else {
      setShowSuccess(false);
      setModalMessage(
        result?.error || "Unable to submit this investment right now."
      );
    }
  };

  // Define projectDetails object
  const projectDetails = {
    1: {
      propertyDescription:
        "Hilton City Line is a dual-branded 329-key hotel asset that operates under The Hilton and Homewood Suites flags. The Sponsor has secured a discounted purchase price with a highly accretive deal structure, acquiring a majority equity interest from the current owner of the Property at an attractive cost basis. Seeking to capitalize on the recovery of the Philadelphia hospitality sector, along with assuming the existing below-market, fixed-rate debt on the Property, the deal presents potentially favorable timing to invest in the rebounding market and asset class. In addition, the potential to sell the Property unencumbered by the franchise agreements, which expire at the end of the target hold period, may provide an opportune exit strategy.",
      documentDescription:
        "Hilton City Line is a dual-branded 329-key hotel asset that operates under The Hilton and Homewood Suites flags. The Sponsor has secured a discounted purchase price with a highly accretive deal structure, acquiring a majority equity interest from the current owner of the Property at an attractive cost basis. Seeking to capitalize on the recovery of the Philadelphia hospitality sector, along with assuming the existing below-market, fixed-rate debt on the Property, the deal presents potentially favorable timing to invest in the rebounding market and asset class. In addition, the potential to sell the Property unencumbered by the franchise agreements, which expire at the end of the target hold period, may provide an opportune exit strategy.",
      documents: [
        {
          name: "Financial Report",
          link: "https://example.com/financial-report.pdf",
        },
        {
          name: "Legal Documents",
          link: "https://example.com/legal-documents.pdf",
        },
        {
          name: "Project Overview",
          link: "https://example.com/project-overview.pdf",
        },
      ],
      whyProperty: [
        "We view the acquisition terms as compelling for this deal – most notably the discounted purchase price that is ~$5M less than competing offers (~$10MM less after taking into account closing costs and capex) and the Property's assumable below market, fixed-rate debt.",
        "We observe a strong positive trend in recent revenue metrics, with net operating income up 10% year-to-date compared to budget projections and tracking well towards the projected 2025 exit NOI, conservatively underwritten at 85% of 2019 (pre-pandemic) numbers.",
        "The hotel will be unencumbered by the current Hilton brand agreement at the end of the 2.25 year target hold period, potentially making it more attractive to buyers.",
      ],
      whySponsor: [
        "We believe DoveHill is a suitable Sponsor for this deal given their singular focus on hospitality (20 portfolio assets).",
        "A family connection to the Seller helped the Sponsor out-position other bidders and secure the Property with attractive terms, including assuming the in-place debt.",
        "Previously headquartered in Philadelphia, the Sponsor has intimate knowledge of the local market and this asset specifically.",
      ],
      type: "Hospitality",
      acres: "1.90",
      strategy: "Growth & Income",
      objective: "Value-add",
      minimum: "$33,000.00",
      roi: "68.7%",
      value: "33000",
      duration: "3 Days",
    },
    2: {
      propertyDescription:
        "Fabian Labs is a two-building, life science campus totaling 24,000 SF located in the heart of Silicon Valley in Palo Alto, 35 miles south of San Francisco, CA. Graymark Capital acquired the Property in 2020 and intends to design and buildout the turnkey lab/office space to meet the needs of life science tenants that are seeking space in the constrained, competitive market of the Bay Area. Proximate to the key components emerging life science companies need – the Bay Area life science venture capital/private equity environment and deep talent pool from top research institutions (Stanford University and University of California Berkeley) – Fabian Labs will be poised to capitalize in the #2 life science market in the country.",
      documentDescription:
        "Fabian Labs is a two-building, life science campus totaling 24,000 SF located in the heart of Silicon Valley in Palo Alto, 35 miles south of San Francisco, CA. Graymark Capital acquired the Property in 2020 and intends to design and buildout the turnkey lab/office space to meet the needs of life science tenants that are seeking space in the constrained, competitive market of the Bay Area. Proximate to the key components emerging life science companies need – the Bay Area life science venture capital/private equity environment and deep talent pool from top research institutions (Stanford University and University of California Berkeley) – Fabian Labs will be poised to capitalize in the #2 life science market in the country.",
      documents: [
        {
          name: "Financial Report",
          link: "https://example.com/financial-report.pdf",
        },
        {
          name: "Legal Documents",
          link: "https://example.com/legal-documents.pdf",
        },
        {
          name: "Project Overview",
          link: "https://example.com/project-overview.pdf",
        },
      ],
      whyProperty: [],
      whySponsor: [],
      type: "Life Science/Lab",
      acres: "0.7",
      strategy: "Growth & Income",
      objective: "Value-add",
      minimum: "$24,000.00",
      roi: "57%",
      value: "24000",
      duration: "3 Days",
    },
    3: {
      propertyDescription:
        "Go Store It Nashville is a ground-up, self-storage development opportunity presented by Madison Capital Group. The Project is located in Franklin, TN, a rapidly expanding submarket (five-year population growth projection of 9%) located approximately 25 miles south of Nashville. When complete, the Class A property will include 1,286 climate-controlled units and be managed by Go Store It, a wholly-owned subsidiary of Madison Capital.",
      documentDescription:
        "Go Store It Nashville is a ground-up, self-storage development opportunity presented by Madison Capital Group. The Project is located in Franklin, TN, a rapidly expanding submarket (five-year population growth projection of 9%) located approximately 25 miles south of Nashville. When complete, the Class A property will include 1,286 climate-controlled units and be managed by Go Store It, a wholly-owned subsidiary of Madison Capital.",
      documents: [
        {
          name: "Financial Report",
          link: "https://example.com/financial-report.pdf",
        },
        {
          name: "Legal Documents",
          link: "https://example.com/legal-documents.pdf",
        },
        {
          name: "Project Overview",
          link: "https://example.com/project-overview.pdf",
        },
      ],
      whyProperty: [
        "We believe this deal could be well-positioned to capitalize on the significant population growth in Franklin, TN, as one of the first-to-market self-storage assets in the burgeoning submarket.",
        "Franklin’s multifamily inventory has more than doubled since 2010, a strong potential indication of new, unmet self-storage demand in the submarket.",
        "Only one competitor exists within a 3-mile radius, currently in lease-up, with a rigorous process to secure approvals from the city creating a higher barrier to entry.",
      ],
      whySponsor: [
        "Madison’s in-house management company, Go Store It, with nearly 100 self-storage facilities across the U.S., has deep industry and market knowledge to draw upon to potentially drive revenue and operational efficiency, in our view.",
        "Using their in-house general contractor also generally enables Madison to have more control over timelines and costs.",
        "Madison’s co-investment of 25% is significant compared to the average sponsor’s contribution on the Marketplace and reflects their conviction in the deal.",
      ],
      type: "Self storage",
      acres: "3.02",
      strategy: "Fixed income",
      objective: "Value-add",
      minimum: "$15,000.00",
      roi: "75%",
      value: "15000",
      duration: "3 Days",
    },
    4: {
      propertyDescription:
        "The Mirage is an 816-bed, garden-style student housing asset located in San Marcos, TX, almost halfway between Austin and San Antonio along I-35. San Marcos is home to Texas State University (38,376 enrollment 2022-23), a university with a growing student body that has outpaced its current supply of student housing options, resulting in high occupancy rates and steady rent growth. The Sponsor acquired the asset on May 1st, 2023 and intends to implement a comprehensive value-add renovation strategy on all units, community amenities, and common areas that will position the Property, which sits directly along the campus shuttle route, to capture NOI upside given the excess demand for upgraded, proximate student housing options.",
      documentDescription:
        "The Mirage is an 816-bed, garden-style student housing asset located in San Marcos, TX, almost halfway between Austin and San Antonio along I-35. San Marcos is home to Texas State University (38,376 enrollment 2022-23), a university with a growing student body that has outpaced its current supply of student housing options, resulting in high occupancy rates and steady rent growth. The Sponsor acquired the asset on May 1st, 2023 and intends to implement a comprehensive value-add renovation strategy on all units, community amenities, and common areas that will position the Property, which sits directly along the campus shuttle route, to capture NOI upside given the excess demand for upgraded, proximate student housing options.",
      documents: [
        {
          name: "Financial Report",
          link: "https://example.com/financial-report.pdf",
        },
        {
          name: "Legal Documents",
          link: "https://example.com/legal-documents.pdf",
        },
        {
          name: "Project Overview",
          link: "https://example.com/project-overview.pdf",
        },
      ],
      whyProperty: [],
      whySponsor: [],
      type: "Student Housing",
      acres: "23.6",
      strategy: "Growth & Income",
      objective: "Value-add",
      minimum: "$32,500.00",
      roi: "84.35%",
      value: "32500",
      duration: "3 Days",
    },
    5: {
      propertyDescription:
        "Palmetto Industrial Park is a newly constructed, three-building industrial property located in Palmetto, FL, approximately 45 miles south of Tampa. Having executed the purchase and sale agreement back in Q2 2022, the Sponsor, Stonemont Financial Group, will acquire the Property upon completion, which is expected to be in Q3 2023. Upon closing, the Sponsor intends to lease up the buildings, which are divisible down to 40,000 SF units to appeal to mid-sized, logistic-focused users in the low vacancy submarket (1.9%), and exit the Project at the end of the 2-year targeted hold period.",
      documentDescription:
        "Palmetto Industrial Park is a newly constructed, three-building industrial property located in Palmetto, FL, approximately 45 miles south of Tampa. Having executed the purchase and sale agreement back in Q2 2022, the Sponsor, Stonemont Financial Group, will acquire the Property upon completion, which is expected to be in Q3 2023. Upon closing, the Sponsor intends to lease up the buildings, which are divisible down to 40,000 SF units to appeal to mid-sized, logistic-focused users in the low vacancy submarket (1.9%), and exit the Project at the end of the 2-year targeted hold period.",
      documents: [
        {
          name: "Financial Report",
          link: "https://example.com/financial-report.pdf",
        },
        {
          name: "Legal Documents",
          link: "https://example.com/legal-documents.pdf",
        },
        {
          name: "Project Overview",
          link: "https://example.com/project-overview.pdf",
        },
      ],
      whyProperty: [
        "We view the acquisition timing of this Project at the completion of construction as potentially advantageous in reducing the uncertainty typically found with labor and material costs for most development deals.",
        "We believe the constrained industrial market and submarket, both currently below 2% vacancy, are a potentially strong indicator of the demand for newly built space.",
        "The Sponsor is already seeing a positive response with pre-leasing efforts, including several requests for proposals (RFPs) in-hand from prospective tenants and even owner/user purchase interest, seeming to support the demand assumptions of the business plan.",
      ],
      whySponsor: [
        "Stonemont Financial Group’s extensive industrial acquisition and development experience (38.7M BSF) makes them well-equipped to execute the intended business plan, in our view.",
        "Stonemont focuses on key industrial markets with supply-demand dislocations, and we believe the high-demand Tampa Bay market fits that strategy well.",
        "Stonemont has been actively involved in the Project throughout the entire development, helping ensure they are in a strong position to execute the lease-up strategy with strong product and a flexible design.",
      ],
      type: "Industrial",
      acres: "38",
      strategy: "Fixed income",
      objective: "High growth",
      minimum: "$25,000.00",
      roi: "78%",
      value: "25000",
      duration: "3 Days",
    },
    6: {
      propertyDescription:
        "Bridge Labs at Pegasus Park will be a redeveloped, state-of-the-art life science asset, located within the dynamic, future-focused campus of Pegasus Park, less than 15 minutes from downtown Dallas, TX. The Sponsor, Montgomery Street Partners, benefits from the strategic partnership with Lyda Hill Philanthropies (“LHP”), whose affiliate is an investor in the campus partnership and will be a limited partner in Bridge Labs at Pegasus Park. The LHP team has extensive life science experience and strong ties to venture capital firms within the North Texas ecosystem. Bridge Labs will be a 135,000 SF purpose-built asset that will be the region’s first institutional-quality, non-incubator space with top-of-the-line infrastructure, amenities, and shared spaces. Situated adjacent to BioLabs, the premier coworking incubator space for life science startups that selected Dallas as its first non-coastal/gateway market, Bridge Labs will seek to capture the outflow of companies seeking more space upon “graduating” from the incubator or fleeing the coastal hubs in search of emerging science ecosystems and more cost-effective lease opportunities. Dallas has been recognized as a top three emerging life science hub and Bridge Labs will seek to take advantage of filling the void of a lack of available space in the fast-growing market.",
      documentDescription:
        "Bridge Labs at Pegasus Park will be a redeveloped, state-of-the-art life science asset, located within the dynamic, future-focused campus of Pegasus Park, less than 15 minutes from downtown Dallas, TX. The Sponsor, Montgomery Street Partners, benefits from the strategic partnership with Lyda Hill Philanthropies (“LHP”), whose affiliate is an investor in the campus partnership and will be a limited partner in Bridge Labs at Pegasus Park. The LHP team has extensive life science experience and strong ties to venture capital firms within the North Texas ecosystem. Bridge Labs will be a 135,000 SF purpose-built asset that will be the region’s first institutional-quality, non-incubator space with top-of-the-line infrastructure, amenities, and shared spaces. Situated adjacent to BioLabs, the premier coworking incubator space for life science startups that selected Dallas as its first non-coastal/gateway market, Bridge Labs will seek to capture the outflow of companies seeking more space upon “graduating” from the incubator or fleeing the coastal hubs in search of emerging science ecosystems and more cost-effective lease opportunities. Dallas has been recognized as a top three emerging life science hub and Bridge Labs will seek to take advantage of filling the void of a lack of available space in the fast-growing market.",
      documents: [
        {
          name: "Financial Report",
          link: "https://example.com/financial-report.pdf",
        },
        {
          name: "Legal Documents",
          link: "https://example.com/legal-documents.pdf",
        },
        {
          name: "Project Overview",
          link: "https://example.com/project-overview.pdf",
        },
      ],
      whyProperty: [
        "We believe the burgeoning Dallas life science market is emerging as a leading centrally located life science hub, offering cheaper rents than the coastal markets and an educated workforce stemming from multiple major research universities.",
        "Bridge Labs is uniquely well-positioned, in our view, within thriving Pegasus Park and adjacent to BioLabs, the premier national life science incubator platform.",
        "The strong pre-leasing activity – about 30% of Bridge Labs has already been signed for – gives us conviction in the pent-up demand for modern lab space in Dallas.",
      ],
      whySponsor: [
        "Montgomery Street Partners’ past experience with multiple life science real estate projects prepares them to spearhead this dynamic opportunity, in our view.",
        "The project leadership group – including MSP and J. Small Investments as general partners – will have invested about $21 million in Pegasus Park once Bridge Labs is completed, which reflects their conviction in the project and alignment of interests with investors.",
        "Montgomery Street Partners’ strategic partnership with Lyda Hill Philanthropies (LHP) is a key component to the Project in our view, as LHP has made significant financial investments in Pegasus Park and is actively supporting the campus through strong ties to the local venture capital and life sciences ecosystem.",
      ],
      type: "Life Science - Lab/R&D",
      acres: "2",
      strategy: "Fixed income",
      objective: "Opportunistic",
      minimum: "$12,000.00",
      roi: "85%",
      value: "12000",
      duration: "3 Days",
    },
  };

  const details = projectDetails[project.id];
  const minimumValue =
    parseCurrency(details?.minimum) || parseCurrency(details?.value);
  const amountValue = parseCurrency(investmentAmount);
  const hasAmount = investmentAmount !== "" && Number.isFinite(amountValue);
  const balanceValue = Number(availableBalance ?? 0);

  const balanceWarning = (() => {
    if (!Number.isFinite(balanceValue)) return "";
    if (hasAmount) {
      if (amountValue <= 0) return "";
      if (minimumValue && amountValue < minimumValue) {
        return `Minimum investment is ${formatCurrency(minimumValue)}.`;
      }
      if (amountValue > balanceValue) {
        return `Insufficient funds. Available balance is ${formatCurrency(
          balanceValue
        )}.`;
      }
      return "";
    }
    if (minimumValue && balanceValue < minimumValue) {
      return `Insufficient funds. Available balance is ${formatCurrency(
        balanceValue
      )}. Minimum required is ${formatCurrency(minimumValue)}.`;
    }
    return "";
  })();

  const feedbackMessage =
    showSuccess || isInvesting || isInvested
      ? ""
      : modalMessage || balanceWarning;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
            : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
        }`}
      >
        {/* Header with status indicator */}
        <div
          className={`p-6 border-b ${
            isDarkMode ? "border-slate-700" : "border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2
                className={`text-2xl md:text-3xl font-bold ${
                  isDarkMode ? "text-cyan-400" : "text-indigo-700"
                }`}
              >
                {project.name}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    isDarkMode
                      ? "bg-slate-700 text-cyan-300"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {details.type}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    isDarkMode
                      ? "bg-slate-700 text-green-400"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  ROI: {details.roi}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    isDarkMode
                      ? "bg-slate-700 text-teal-400"
                      : "bg-teal-100 text-teal-700"
                  }`}
                >
                  Min: {details.minimum}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-200/30 ${
                isDarkMode ? "text-gray-300" : "text-gray-500"
              }`}
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>
          </div>

          {/* Status Indicator */}
          {(isInvesting || isInvested) && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isInvesting ? "bg-blue-500 animate-pulse" : "bg-green-500"
                  }`}
                ></div>
                <span
                  className={`text-sm font-medium ${
                    isInvesting ? "text-blue-500" : "text-green-500"
                  }`}
                >
                  {isInvesting
                    ? "Investment in progress..."
                    : "Successfully invested"}
                </span>
              </div>
              <div
                className={`h-2 rounded-full overflow-hidden ${
                  isDarkMode ? "bg-slate-700" : "bg-gray-200"
                }`}
              >
                <div
                  className={`h-full ${
                    isInvesting
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse"
                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                  }`}
                  style={{ width: isInvesting ? "70%" : "100%" }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-8">
          {/* Left Column */}
          <div className="md:w-1/2">
            <div className="rounded-xl overflow-hidden mb-6">
              <img
                src={project.image}
                alt={project.name}
                className="w-full h-64 object-cover"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 rounded-xl bg-gray-200/30 dark:bg-slate-700/50">
              <button
                onClick={() => setView("property")}
                className={`flex-1 py-3 rounded-xl text-center ${
                  view === "property"
                    ? isDarkMode
                      ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : isDarkMode
                    ? "text-gray-300 hover:bg-slate-700"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Property Details
              </button>
              <button
                onClick={() => setView("document")}
                className={`flex-1 py-3 rounded-xl text-center ${
                  view === "document"
                    ? isDarkMode
                      ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : isDarkMode
                    ? "text-gray-300 hover:bg-slate-700"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Documents
              </button>
            </div>

            {/* Content based on view */}
            {view === "property" ? (
              <div
                className={`rounded-xl p-5 ${
                  isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
                }`}
              >
                <h3
                  className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    isDarkMode ? "text-cyan-300" : "text-indigo-700"
                  }`}
                >
                  <FontAwesomeIcon icon={faBuilding} />
                  Property Description
                </h3>
                <p className={isDarkMode ? "text-slate-300" : "text-gray-700"}>
                  {details.propertyDescription}
                </p>

                {details.whyProperty.length > 0 && (
                  <>
                    <h3
                      className={`text-xl font-bold mt-6 mb-4 flex items-center gap-2 ${
                        isDarkMode ? "text-cyan-300" : "text-indigo-700"
                      }`}
                    >
                      Why This Property
                    </h3>
                    <ul className="space-y-3">
                      {details.whyProperty.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                              isDarkMode
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-blue-500/20 text-blue-600"
                            }`}
                          >
                            <span className="text-xs font-bold">✓</span>
                          </div>
                          <p
                            className={
                              isDarkMode ? "text-slate-300" : "text-gray-700"
                            }
                          >
                            {point}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {details.whySponsor.length > 0 && (
                  <>
                    <h3
                      className={`text-xl font-bold mt-6 mb-4 flex items-center gap-2 ${
                        isDarkMode ? "text-cyan-300" : "text-indigo-700"
                      }`}
                    >
                      Why This Sponsor
                    </h3>
                    <ul className="space-y-3">
                      {details.whySponsor.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                              isDarkMode
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-blue-500/20 text-blue-600"
                            }`}
                          >
                            <span className="text-xs font-bold">✓</span>
                          </div>
                          <p
                            className={
                              isDarkMode ? "text-slate-300" : "text-gray-700"
                            }
                          >
                            {point}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <div
                className={`rounded-xl p-5 ${
                  isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
                }`}
              >
                <h3
                  className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    isDarkMode ? "text-cyan-300" : "text-indigo-700"
                  }`}
                >
                  <FontAwesomeIcon icon={faFileAlt} />
                  Documents
                </h3>
                <div className="space-y-3">
                  {details.documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isDarkMode
                          ? "bg-slate-700 hover:bg-slate-600 text-cyan-400"
                          : "bg-white hover:bg-gray-100 text-blue-600"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isDarkMode ? "bg-cyan-500/20" : "bg-blue-500/20"
                        }`}
                      >
                        <FontAwesomeIcon icon={faFileAlt} className="text-xl" />
                      </div>
                      <span className="font-medium">{doc.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Investment Panel */}
          <div className="md:w-1/2">
            <div
              className={`rounded-xl p-6 ${
                isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
              }`}
            >
              <h3
                className={`text-xl font-bold mb-6 flex items-center gap-2 ${
                  isDarkMode ? "text-cyan-300" : "text-indigo-700"
                }`}
              >
                <FontAwesomeIcon icon={faChartLine} />
                Investment Details
              </h3>

              {investmentRecord && (
                <div className="mb-4 text-sm text-slate-300 space-y-1">
                  <p>
                    Amount: ${investmentRecord.amount.toLocaleString()}
                  </p>
                  <p>Duration: {investmentRecord.duration} days</p>
                </div>
              )}

              {/* Property Attributes Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-slate-700" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-blue-500/20 text-blue-600"
                      }`}
                    >
                      <FontAwesomeIcon icon={faBuilding} className="text-sm" />
                    </div>
                    <span
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Type
                    </span>
                  </div>
                  <p
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {details.type}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-slate-700" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Acres
                    </span>
                  </div>
                  <p
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {details.acres}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-slate-700" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Strategy
                    </span>
                  </div>
                  <p
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {details.strategy}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-slate-700" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Objective
                    </span>
                  </div>
                  <p
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {details.objective}
                  </p>
                </div>
              </div>

              {/* ROI Highlight */}
              <div
                className={`p-5 rounded-xl mb-6 bg-gradient-to-r ${
                  isDarkMode
                    ? "from-cyan-900/50 to-blue-900/50"
                    : "from-blue-100 to-indigo-100"
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <p
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Minimum Investment
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isDarkMode ? "text-teal-300" : "text-teal-600"
                      }`}
                    >
                      {details.minimum}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Projected ROI
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isDarkMode ? "text-green-400" : "text-green-600"
                      }`}
                    >
                      {details.roi}
                    </p>
                  </div>
                </div>
              </div>

              {/* Investment Form */}
              <div className="mb-6">
                <h3
                  className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    isDarkMode ? "text-cyan-300" : "text-indigo-700"
                  }`}
                >
                  Invest in this Property
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      className={`block mb-2 ${
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="text"
                        value={investmentAmount}
                        onChange={(e) =>
                          setInvestmentAmount(
                            e.target.value.replace(/[^0-9.]/g, "")
                          )
                        }
                        className={`w-full pl-10 pr-4 py-3 rounded-xl ${
                          isDarkMode
                            ? "bg-slate-700 text-white"
                            : "bg-white text-gray-800"
                        }`}
                        placeholder="Enter amount"
                        disabled={isInvesting || isInvested}
                      />
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-slate-500" : "text-gray-500"
                      }`}
                    >
                      Minimum investment: {details.minimum}
                    </p>
                  </div>

                  <div>
                    <label
                      className={`block mb-2 ${
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      Duration
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[30, 60, 90, 180, 365].map((days) => (
                        <button
                          key={days}
                          onClick={() => setInvestmentDuration(days)}
                          className={`py-3 rounded-xl ${
                            investmentDuration === days
                              ? isDarkMode
                                ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white"
                                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                              : isDarkMode
                              ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                              : "bg-white hover:bg-gray-100 text-gray-800"
                          }`}
                          disabled={isInvesting || isInvested}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>

                {/* Invest Button */}
              <button
                onClick={handleDetailInvest}
                disabled={isInvesting || isInvested}
                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  isInvesting || isInvested
                    ? isDarkMode
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500"
                }`}
              >
                {isInvesting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing Investment...</span>
                  </>
                ) : isInvested ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    <span>Already Invested</span>
                  </>
                ) : (
                  "Invest Now"
                )}
              </button>

              {feedbackMessage && (
                <p className="text-sm text-rose-400 mt-3">{feedbackMessage}</p>
              )}

              {/* Success Message */}
              {showSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheck} className="text-xl" />
                  <span>Your investment has been submitted successfully!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
