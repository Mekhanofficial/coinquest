import { useState, useEffect, useMemo, useCallback } from "react";
import px17 from "../../pictures/px17.png";
import px18 from "../../pictures/px18.png";
import px19 from "../../pictures/px19.png";
import px20 from "../../pictures/px20.png";
import px21 from "../../pictures/px21.png";
import px22 from "../../pictures/px22.png";
import ProjectDetail from "../../components/real estate/RealEstatedetails";
import { useTheme } from "next-themes";
import { useUser } from "../../context/UserContext";
import { useTransactions } from "../../context/TransactionContext";
import { API_BASE_URL } from "../../config/api";
import {
  FaChartLine,
  FaBuilding,
  FaCoins,
  FaHistory,
  FaRocket,
} from "react-icons/fa";

const realest = [
  {
    id: 1,
    name: "Hilton Philadelphia City Avenue",
    image: px17,
    profitRate:
      "Discounted acquisition of a recently renovated hotel property in Philadelphia with below-market, assumable debt.",
    amount: "$33,000.00",
    Roi: "68.7%",
    type: "Hospitality",
    strategy: "Growth & Income",
  },
  {
    id: 2,
    name: "Fabian Labs, Palo Alto",
    image: px18,
    profitRate:
      "Two-building life science conversion in the heart of Silicon Valley and minutes from Stanford University.",
    amount: "$24,000.00",
    Roi: "57%",
    type: "Life Science",
    strategy: "Value-add",
  },
  {
    id: 3,
    name: "Go Store It Nashville",
    image: px19,
    profitRate:
      "Class A self-storage development in one of Nashville's fastest growing suburbs with constrained supply.",
    amount: "$15,000.00",
    Roi: "18%",
    type: "Self Storage",
    strategy: "Fixed Income",
  },
  {
    id: 4,
    name: "The Mirage - Texas State Student Housing",
    image: px20,
    profitRate:
      "A Texas State University student housing acquisition assuming below-market fixed-rate debt.",
    amount: "$32,500.00",
    Roi: "84.35%",
    type: "Student Housing",
    strategy: "Growth & Income",
  },
  {
    id: 5,
    name: "Palmetto Industrial Park",
    image: px21,
    profitRate:
      "Acquisition of a newly constructed three-building industrial property, attracting prospective tenants.",
    amount: "$25,000.00",
    Roi: "78%",
    type: "Industrial",
    strategy: "High Growth",
  },
  {
    id: 6,
    name: "Bridge Labs at Pegasus Park",
    image: px22,
    profitRate:
      "Life science redevelopment within a thriving new biotech-focused campus in Dallas.",
    amount: "$12,000.00",
    Roi: "85%",
    type: "Life Science",
    strategy: "Opportunistic",
  },
];

// Project details data
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

export default function RealestPage() {
  const { theme, systemTheme } = useTheme();
  const { userData, isAuthenticated, updateUserBalance, getAuthToken } = useUser();
  const { addTransaction } = useTransactions();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [selectedReal, setSelectedReal] = useState(null);
  const [investmentRecords, setInvestmentRecords] = useState([]);
  const [isSyncingInvestments, setIsSyncingInvestments] = useState(false);
  const [investmentError, setInvestmentError] = useState("");
  const [investmentSuccess, setInvestmentSuccess] = useState("");
  const [prefersDark, setPrefersDark] = useState(false);

  const parseJsonSafely = async (response) => {
    const text = await response.text();
    try {
      return { json: JSON.parse(text), text };
    } catch {
      return { json: null, text };
    }
  };

  const getCleanToken = useCallback(() => {
    const token = getAuthToken?.();
    if (!token) return null;
    return token.replace(/^["']|["']$/g, "").trim();
  }, [getAuthToken]);

  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const isDarkMode = useMemo(() => {
    if (effectiveTheme === "dark") return true;
    if (effectiveTheme === "light") return false;
    return prefersDark;
  }, [effectiveTheme, prefersDark]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(media.matches);
    const handler = (event) => setPrefersDark(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const mapBackendRecordToInvestment = useCallback((row) => {
    const normalizedStatus = `${row?.status || "Active"}`.toLowerCase();
    return {
      id: String(row?._id || row?.id || `real-${Date.now()}`),
      backendId: String(row?._id || row?.id || ""),
      projectId: Number(row?.projectId || 0),
      amount: Number(row?.amount || 0),
      duration: Number(row?.durationDays || 30),
      startDate: row?.startDate || row?.createdAt || new Date().toISOString(),
      endDate:
        row?.endDate ||
        new Date(
          Date.now() + Number(row?.durationDays || 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
      status:
        normalizedStatus === "completed"
          ? "completed"
          : normalizedStatus === "cancelled"
          ? "cancelled"
          : "pending",
      roi: Number(row?.roi || 0),
      reference: row?.reference || "",
      expectedPayoutUsd: Number(row?.expectedPayoutUsd || 0),
    };
  }, []);

  const syncInvestmentsFromBackend = useCallback(async () => {
    const token = getCleanToken();
    if (!token) return;

    setIsSyncingInvestments(true);
    try {
      const response = await fetch(`${API_BASE_URL}/RealEstate`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to sync real estate investments.");
      }

      const rows = Array.isArray(result?.data) ? result.data : [];
      const mapped = rows.map(mapBackendRecordToInvestment);
      setInvestmentRecords(mapped);
    } catch (error) {
      console.error("Real estate sync failed:", error);
      setInvestmentError("Unable to sync real estate records from backend.");
    } finally {
      setIsSyncingInvestments(false);
    }
  }, [getCleanToken, mapBackendRecordToInvestment]);

  useEffect(() => {
    if (!isAuthenticated) return;
    syncInvestmentsFromBackend();
  }, [isAuthenticated, syncInvestmentsFromBackend, userData?.userId, userData?.uid]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const handleFocusSync = () => syncInvestmentsFromBackend();
    window.addEventListener("focus", handleFocusSync);
    return () => window.removeEventListener("focus", handleFocusSync);
  }, [isAuthenticated, syncInvestmentsFromBackend]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "realEstateInvestments",
      JSON.stringify(investmentRecords)
    );
  }, [investmentRecords]);

  useEffect(() => {
    if (!investmentSuccess) return;
    const timer = setTimeout(() => setInvestmentSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [investmentSuccess]);

  const handleViewClick = (real) => {
    setSelectedReal(real);
    setIsDetailOpen(true);
  };

  const handleInvestClick = (real) => {
    setSelectedReal(real);
    setInvestmentError("");
    setIsInvestOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
  };

  const closeInvest = () => {
    setIsInvestOpen(false);
    setInvestmentError("");
  };

  const handleInvestmentSubmit = async ({ projectId, amount, duration }) => {
    const real = realest.find((r) => r.id === projectId);
    if (!real) {
      const message = "Unable to locate the selected property.";
      setInvestmentError(message);
      return { success: false, error: message };
    }

    if (!isAuthenticated) {
      const message = "Please sign in before investing.";
      setInvestmentError(message);
      return { success: false, error: message };
    }

    const token = getCleanToken();
    if (!token) {
      const message = "Session expired. Please sign in again.";
      setInvestmentError(message);
      return { success: false, error: message };
    }

    const detail = projectDetails[projectId];
    const minimumValue = detail?.minimum
      ? parseFloat(detail.minimum.replace(/[^0-9.]/g, "")) || 0
      : parseFloat(real.amount.replace(/[^0-9.]/g, "")) || 0;
    if (!amount || amount < minimumValue) {
      const message = `Insufficient investment amount. Minimum investment is ${
        detail?.minimum || real.amount
      }.`;
      setInvestmentError(message);
      return { success: false, error: message };
    }

    const currentBalance = Number(userData?.balance ?? 0);
    if (amount > currentBalance) {
      const message =
        "Insufficient balance. Please fund your account before investing.";
      setInvestmentError(message);
      return { success: false, error: message };
    }

    const timestamp = Date.now();
    const durationDays = duration || 30;
    const startDate = new Date().toISOString();
    const endDate = new Date(
      timestamp + durationDays * 24 * 60 * 60 * 1000
    ).toISOString();
    const roiPct = parseFloat(`${real.Roi || 0}`.replace(/[^0-9.]/g, "")) || 0;
    const expectedPayoutUsd = amount + (amount * roiPct) / 100;

    const balanceResult = await updateUserBalance(-amount);
    if (!balanceResult?.success) {
      const message =
        balanceResult?.error || "Balance update failed. Please try again.";
      setInvestmentError(message);
      return { success: false, error: message };
    }

    try {
      const payload = {
        projectId,
        reference: `REAL-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        propertyName: real.name,
        location: real.type,
        amount,
        roi: roiPct,
        durationDays,
        startDate,
        endDate,
        expectedPayoutUsd,
        status: "Active",
      };

      const response = await fetch(`${API_BASE_URL}/RealEstate/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to save investment to backend.");
      }

      const record = mapBackendRecordToInvestment(result.data);
      setInvestmentRecords((prev) => [
        ...prev.filter((rec) => rec.projectId !== projectId),
        record,
      ]);

      await addTransaction({
        type: "debit",
        category: "realestate",
        amount,
        status: "completed",
        currency: "USD",
        description: `Real estate investment: ${real.name}`,
        metadata: {
          projectId,
          projectName: real.name,
          durationDays,
          roi: roiPct,
        },
      });

      setInvestmentError("");
      setInvestmentSuccess(
        `Investment submitted: $${amount.toLocaleString()} toward ${real.name}.`
      );

      setTimeout(async () => {
        try {
          await fetch(`${API_BASE_URL}/RealEstate/${record.backendId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ status: "Completed" }),
          });
        } catch (statusError) {
          console.warn("Real estate completion sync failed:", statusError);
        } finally {
          setInvestmentRecords((prev) =>
            prev.map((rec) =>
              rec.id === record.id ? { ...rec, status: "completed" } : rec
            )
          );
        }
      }, 3000);

      setIsInvestOpen(false);
      return { success: true };
    } catch (error) {
      console.error("Real estate investment failed:", error);
      await updateUserBalance(amount);
      await addTransaction({
        type: "credit",
        category: "realestate",
        amount,
        status: "cancelled",
        currency: "USD",
        description: `Real estate rollback: ${real.name}`,
        metadata: { projectId, reason: "create-failed" },
      });
      const message = error?.message || "Investment failed. Please try again.";
      setInvestmentError(message);
      return { success: false, error: message };
    }
  };

  const recordMap = useMemo(() => {
    const map = new Map();
    investmentRecords.forEach((record) => {
      map.set(record.projectId, record);
    });
    return map;
  }, [investmentRecords]);

  const invested = realest.filter(
    (real) => recordMap.get(real.id)?.status === "completed"
  );
  const investing = realest.filter(
    (real) => recordMap.get(real.id)?.status === "pending"
  );
  const available = realest.filter((real) => !recordMap.has(real.id));

  const currentInvestment = selectedReal && recordMap.get(selectedReal.id);

  return (
    <div
      className={`min-h-screen px-4 py-10 sm:px-6 lg:px-8 ${
        isDarkMode ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div className="w-full">
        {(investmentError || investmentSuccess) && (
          <div className="w-full mb-8 space-y-2">
            {investmentError && (
              <div className="rounded-2xl bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 text-sm">
                {investmentError}
              </div>
            )}
            {investmentSuccess && (
              <div className="rounded-2xl bg-green-900/20 border border-green-500/60 text-green-300 px-4 py-3 text-sm">
                {investmentSuccess}
              </div>
            )}
          </div>
        )}
        {isSyncingInvestments && (
          <div className="w-full mb-6 text-xs text-cyan-400">
            Syncing investment records from backend...
          </div>
        )}

        {/* Portfolio Sections */}
        {invested.length > 0 && (
          <div className="mb-12">
            <h2
              className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              <FaHistory className="text-xl" />
              My Investment Portfolio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invested.map((real) => (
                <PropertyCard
                  key={real.id}
                  real={real}
                  isDarkMode={isDarkMode}
                  status="invested"
                  onViewClick={() => handleViewClick(real)}
                  investmentRecord={recordMap.get(real.id)}
                />
              ))}
            </div>
          </div>
        )}

        {investing.length > 0 && (
          <div className="mb-12">
            <h2
              className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
                isDarkMode ? "text-cyan-400" : "text-indigo-700"
              }`}
            >
              <FaRocket className="text-xl" />
              Active Investments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investing.map((real) => (
                <PropertyCard
                  key={real.id}
                  real={real}
                  isDarkMode={isDarkMode}
                  status="investing"
                  onViewClick={() => handleViewClick(real)}
                  investmentRecord={recordMap.get(real.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Properties */}
        <div className="mb-12">
          <h2
            className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              isDarkMode ? "text-teal-400" : "text-teal-600"
            }`}
          >
            <FaBuilding className="text-xl" />
            Available Properties
          </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {available.map((real) => (
                <PropertyCard
                  key={real.id}
                  real={real}
                  isDarkMode={isDarkMode}
                  status="available"
                  onViewClick={() => handleViewClick(real)}
                  onInvestClick={() => handleInvestClick(real)}
                  investmentRecord={recordMap.get(real.id)}
                />
            ))}
          </div>
        </div>
      </div>

      {/* Project Detail Modal */}
      {isDetailOpen && (
        <ProjectDetail
          project={selectedReal}
          onClose={closeDetail}
          theme={theme}
          investmentRecord={currentInvestment}
          handleInvestClick={handleInvestmentSubmit}
          availableBalance={Number(userData?.balance ?? 0)}
        />
      )}

      {/* Investment Modal */}
      {isInvestOpen && (
        <InvestmentModal
          project={selectedReal}
          onClose={closeInvest}
          theme={theme}
          handleInvest={handleInvestmentSubmit}
          isInvesting={currentInvestment?.status === "pending"}
          isInvested={currentInvestment?.status === "completed"}
          availableBalance={Number(userData?.balance ?? 0)}
        />
      )}
    </div>
  );
}

function PropertyCard({
  real,
  isDarkMode,
  status,
  onViewClick,
  onInvestClick,
  investmentRecord,
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
          : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
      } ${
        status === "invested"
          ? "ring-2 ring-green-500"
          : status === "investing"
          ? "ring-2 ring-cyan-500 animate-pulse"
          : ""
      }`}
    >
      {/* Status Ribbon */}
      {status !== "available" && (
        <div
          className={`absolute top-4 right-0 z-10 px-4 py-1 rounded-l-lg ${
            status === "invested"
              ? "bg-gradient-to-r from-green-600 to-emerald-700"
              : "bg-gradient-to-r from-cyan-600 to-blue-700"
          }`}
        >
          <span className="text-white text-sm font-medium">
            {status === "invested" ? "Invested" : "Processing..."}
          </span>
        </div>
      )}

      {/* Property Image */}
      <div className="h-48 overflow-hidden">
        <img
          className="w-full h-full object-cover"
          src={real.image}
          alt={real.name}
        />
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h2
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {real.name}
          </h2>
          <div
            className={`text-xs px-2 py-1 rounded-full ${
              isDarkMode
                ? "bg-slate-700 text-cyan-300"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {real.type}
          </div>
        </div>

        <p
          className={`mb-4 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
        >
          {real.profitRate}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div
            className={`p-3 rounded-xl ${
              isDarkMode ? "bg-slate-800" : "bg-indigo-50"
            }`}
          >
            <div className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
              Min. Investment
            </div>
            <div
              className={`font-bold ${
                isDarkMode ? "text-teal-300" : "text-teal-600"
              }`}
            >
              {real.amount}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl ${
              isDarkMode ? "bg-slate-800" : "bg-indigo-50"
            }`}
          >
            <div className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
              Projected ROI
            </div>
            <div
              className={`font-bold ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              {real.Roi}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onViewClick}
            className={`py-3 rounded-xl transition-all ${
              isDarkMode
                ? "bg-slate-700 hover:bg-slate-600 text-cyan-400"
                : "bg-gray-200 hover:bg-gray-300 text-indigo-700"
            }`}
          >
            View Details
          </button>

          {status === "available" && onInvestClick && (
            <button
              onClick={onInvestClick}
              className={`py-3 rounded-xl transition-all ${
                isDarkMode
                  ? "bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white"
              }`}
            >
              Invest Now
            </button>
          )}
        </div>

        {investmentRecord && (
          <div className="mt-3 text-xs text-slate-400">
            Locked ${investmentRecord.amount.toLocaleString()} ·{" "}
            {investmentRecord.duration} days
          </div>
        )}
      </div>
    </div>
  );
}

// InvestmentModal component
const InvestmentModal = ({
  project,
  onClose,
  theme,
  handleInvest,
  isInvesting,
  isInvested,
  availableBalance = 0,
}) => {
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentDuration, setInvestmentDuration] = useState(30);
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const details = projectDetails[project.id];
  const minimumValue = details?.minimum
    ? parseFloat(details.minimum.replace(/[^0-9.]/g, "")) || 0
    : parseFloat(details?.value) || 0;
  const amountValue = Number(investmentAmount || 0);
  const hasAmount = investmentAmount !== "" && Number.isFinite(amountValue);
  const balanceValue = Number(availableBalance ?? 0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);

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

  const handleSubmit = async () => {
    if (!investmentAmount || Number.isNaN(amountValue) || amountValue <= 0) {
      setShowSuccess(false);
      setModalMessage("Enter a valid investment amount.");
      return;
    }

    if (amountValue < minimumValue) {
      setShowSuccess(false);
      setModalMessage(`Minimum investment is ${formatCurrency(minimumValue)}.`);
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

    setModalMessage("");
    const result = await handleInvest({
      projectId: project?.id,
      amount: amountValue,
      duration: investmentDuration || 30,
    });

    if (result?.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setShowSuccess(false);
      setModalMessage(
        result?.error || "Unable to submit this investment right now."
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-md shadow-2xl ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
            : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2
              className={`text-2xl font-bold ${
                isDarkMode ? "text-cyan-400" : "text-indigo-700"
              }`}
            >
              Invest in {project.name}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-200/30 ${
                isDarkMode ? "text-gray-300" : "text-gray-500"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Status Indicator */}
          {(isInvesting || isInvested) && (
            <div className="mb-6">
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
                <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
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
                <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
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
                    setInvestmentAmount(e.target.value.replace(/[^0-9.]/g, ""))
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

          {/* Invest Button */}
          <button
            onClick={handleSubmit}
            disabled={isInvesting || isInvested}
            className={`w-full py-4 mt-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Your investment has been submitted successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
