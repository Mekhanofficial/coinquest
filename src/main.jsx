import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SideImg from "./components/contact/ContactImg.jsx";
import ContactUs from "./components/contact/ContactIndex.jsx";
import TradingViewChart from "./components/coinapi/Tradingview.jsx";
import CryptocurrencyMarketWidget from "./components/coinapi/CryptocurrencyMarketWidget.jsx";
import LoginPage from "./app/(auth)/login/LoginPage.jsx";
import SignUpPage from "./components/auth/sign-up/Form.jsx";
import { PrivateRoute } from "./PrivateRoute.jsx";
import Layout from "./components/dashboard/layout/Layout.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminDashboard from "./app/admin/AdminDashboard.jsx";
import AdminSignup from "./app/admin/AdminSignup.jsx";
import AdminLogin from "./app/admin/AdminLogin.jsx";
import ProtectedAdminRoute from "../src/app/admin/ProtectedAdminRoute.jsx";
import ForgotPassword from "./app/(auth)/login/ForgotPassword";
import AboutPage from "./pages/about/Hero";
import ServicePage from "./pages/services/Hero";
import ContactPage from "./pages/contact/Hero";
import HomePage from "./pages/home/Home";
import { MyCopyTradersPage } from "./pages/copytraders/MyCopytraders";
import DashPage from "./pages/dashboard/Hero";
import { NotificationProvider } from "./context/NotificationContext";
import { UserProvider } from "./context/UserContext";
import WithdrawalPage from "./pages/transactions/Withdrawal";
import AssetPage from "./pages/crypto assets/Assets";
import PlaceTradePage from "./pages/trades/PlaceTrade";
import MiningPage from "./pages/trades/Mining";
import Deposit from "./pages/transactions/deposit/Deposits";
import BuyCrypto from "./pages/trades/BuyCrypto";
import AccountPage from "./pages/account/Account";
import PasswordUpdate from "./pages/account/PasswordUpdate";
import ReferralsPage from "./pages/referrals/Referrals";
import EmailUpdatePage from "./pages/account/EmailUpdate";
import Transactions from "./pages/transactions/Transactions";
import PaymentProofPage from "./components/transactions/PaymentProof";
import Notification from "./pages/transactions/Notification";
import TradesRoiPage from "./pages/trades/TradesRoi";
import BuyBotPage from "./pages/trades/BuyBots";
import StakePage from "./pages/trades/Stake";
import SubscriptionPage from "./pages/subscription/Subscription";
import DailySignalPage from "./pages/dailysignal/DailySignal";
import RealestPage from "./pages/real estate/RealEstate";
import VerifyAccountPage from "./pages/account/VerifyAccount";
import ProjectDetail from "./components/real estate/RealEstatedetails";
import Modal from "./pages/copytraders/Modal";
import KycVerification from "./components/kycverification/KYCVerification";
import MyTraderPage from "./components/traders/MyTraders";
import SettingsPage from "./pages/settings/Settings";
import MessagesPage from "./pages/messages/Messages";
import WatchlistPage from "./pages/watchlist/Watchlist";
import HelpPage from "./pages/help/Help";
import UpdatePhotoPage from "./pages/account/UpdatePhotoPage";
import { TransactionProvider } from "./context/TransactionContext";
import { CopyTradersProvider } from "./context/CopyTraderContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

const proRouter = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "/services",
    element: <ServicePage />,
  },
  {
    path: "/contact",
    element: <ContactPage />,
  },
  {
    path: "/LoginPage",
    element: <LoginPage />,
  },
  {
    path: "/login",
    element: <Navigate to="/LoginPage" replace />,
  },
  {
    path: "/SignUpPage",
    element: <SignUpPage />,
  },
  {
    path: "/ForgotPassword",
    element: <ForgotPassword />,
  },
  // Protected routes
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/Dashboard",
        element: (
          <Layout>
            <DashPage />
          </Layout>
        ),
      },
      {
        path: "/Assets",
        element: (
          <Layout>
            <AssetPage />
          </Layout>
        ),
      },
      {
        path: "/PlaceTrade",
        element: (
          <Layout>
            <PlaceTradePage />
          </Layout>
        ),
      },
      {
        path: "/Mining",
        element: (
          <Layout>
            <MiningPage />
          </Layout>
        ),
      },
      {
        path: "/Deposits",
        element: (
          <Layout>
            <Deposit />
          </Layout>
        ),
      },
      {
        path: "/MyTraders",
        element: (
          <Layout>
            <MyTraderPage/>
          </Layout>
        ),
      },
      {
        path: "/BuyCrypto",
        element: (
          <Layout>
            <BuyCrypto />
          </Layout>
        ),
      },
      {
        path: "/Account",
        element: (
          <Layout>
            <AccountPage />
          </Layout>
        ),
      },
      {
        path: "/account",
        element: <Navigate to="/Account" replace />,
      },
      {
        path: "/Settings",
        element: (
          <Layout>
            <SettingsPage />
          </Layout>
        ),
      },
      {
        path: "/settings",
        element: <Navigate to="/Settings" replace />,
      },
      {
        path: "/Messages",
        element: (
          <Layout>
            <MessagesPage />
          </Layout>
        ),
      },
      {
        path: "/messages",
        element: <Navigate to="/Messages" replace />,
      },
      {
        path: "/PasswordUpdate",
        element: (
          <Layout>
            <PasswordUpdate />
          </Layout>
        ),
      },
      {
        path: "/Referrals",
        element: (
          <Layout>
            <ReferralsPage />
          </Layout>
        ),
      },
      {
        path: "/EmailUpdate",
        element: (
          <Layout>
            <EmailUpdatePage />
          </Layout>
        ),
      },
      // {
      //   path: "/UpdatePhotoPage",
      //   element: <Update />,
      // },
      {
        path: "/Transactions",
        element: (
          <Layout>
            <Transactions />
          </Layout>
        ),
      },
      {
        path: "/PaymentProof",
        element: (
          <Layout>
            <PaymentProofPage />
          </Layout>
        ),
      },
      {
        path: "/Notification",
        element: (
          <Layout>
            <Notification />
          </Layout>
        ),
      },
      {
        path: "/kyc-verification",
        element: (
          <Layout>
            <KycVerification />
          </Layout>
        ),
      },
      {
        path: "/Withdrawal",
        element: (
          <Layout>
            <WithdrawalPage />
          </Layout>
        ),
      },
      {
        path: "/TradesRoi",
        element: (
          <Layout>
            <TradesRoiPage />
          </Layout>
        ),
      },
      {
        path: "/MyCopytraders",
        element: (
          <Layout>
            <MyCopyTradersPage />
          </Layout>
        ),
      },
      {
        path: "/BuyBots",
        element: (
          <Layout>
            <BuyBotPage />
          </Layout>
        ),
      },
      {
        path: "/Stake",
        element: (
          <Layout>
            <StakePage />
          </Layout>
        ),
      },
      {
        path: "/Subscription",
        element: (
          <Layout>
            <SubscriptionPage />
          </Layout>
        ),
      },
      {
        path: "/DailySignal",
        element: (
          <Layout>
            <DailySignalPage />
          </Layout>
        ),
      },
      {
        path: "/RealEstate",
        element: (
          <Layout>
            <RealestPage />
          </Layout>
        ),
      },
      {
        path: "/VerifyAccount",
        element: (
          <Layout>
            <VerifyAccountPage />
          </Layout>
        ),
      },
      {
        path: "/UpdatePhotoPage",
        element: (
          <Layout>
            <UpdatePhotoPage />
          </Layout>
        ),
      },
      {
        path: "/Watchlist",
        element: (
          <Layout>
            <WatchlistPage />
          </Layout>
        ),
      },
      {
        path: "/Help",
        element: (
          <Layout>
            <HelpPage />
          </Layout>
        ),
      },
    ],
  },
  // Public routes (remain unchanged)
  {
    path: "/ContactIndex",
    element: <ContactUs />,
  },
  {
    path: "/RealEstateDetails",
    element: <ProjectDetail />,
  },
  {
    path: "/Modal",
    element: <Modal />,
  },

  {
    path: "/trading-view",
    element: <TradingViewChart />,
  },
  {
    path: "/CryptocurrencyMarketWidget",
    element: <CryptocurrencyMarketWidget />,
  },
  {
    path: "/ContactImg",
    element: <SideImg />,
  },
  //Admin URLS/route
  {
    path: "/AdminDashboard",
    element: (
      <ProtectedAdminRoute>
        <AdminDashboard />
      </ProtectedAdminRoute>
    ),
  },

  {
    path: "/AdminSignup",
    element: <AdminSignup />,
  },
  {
    path: "/AdminLogin",
    element: <AdminLogin />,
  },
]);

root.render(
  <React.StrictMode>
    <UserProvider>
      <TransactionProvider>
        <CopyTradersProvider>
          <NotificationProvider>
            <RouterProvider router={proRouter} />
            <ToastContainer />
          </NotificationProvider>
        </CopyTradersProvider>
      </TransactionProvider>
    </UserProvider>
  </React.StrictMode>
);
