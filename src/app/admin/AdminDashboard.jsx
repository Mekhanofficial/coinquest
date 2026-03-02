import React, { useState, useEffect } from "react";
import UserTable from "./UserTable";
import FinanceSection from "./FinanceSection";
import SecuritySection from "./SecuritySection";
import SystemTools from "./SystemTools";
import OptionalFeatures from "./OptionalFeatures";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Card, CardContent } from "../../components/ui/card";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Shield,
  Settings,
  PlusSquare,
} from "lucide-react";
import { useTransactions } from "../../context/TransactionContext";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [isMobile, setIsMobile] = useState(false);
  const { pendingRequestsCount } = useTransactions();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { value: "users", icon: Users, label: "Users" },
    {
      value: "finance",
      icon: CreditCard,
      label: (
        <div className="flex items-center">
          Finance
          {pendingRequestsCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingRequestsCount}
            </span>
          )}
        </div>
      ),
    },
    { value: "security", icon: Shield, label: "Security" },
    { value: "system", icon: Settings, label: "System" },
    { value: "optional", icon: PlusSquare, label: "Optional" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {!isMobile && (
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Admin Panel
            </h1>
          </div>
          <nav className="mt-6">
            <ul className="space-y-1 p-2">
              {navItems.map((item) => (
                <li key={item.value}>
                  <button
                    onClick={() => setActiveTab(item.value)}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-md transition-all ${
                      activeTab === item.value
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 sm:gap-3">
                {isMobile && (
                  <LayoutDashboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
                {!isMobile && (
                  <LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                )}
                {isMobile ? "Dashboard" : "Admin Dashboard"}
              </h1>
              {!isMobile && (
                <p className="text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                  Manage your platform settings and user data
                </p>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              {!isMobile && (
                <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center shadow-xs hover:shadow-sm transition-shadow text-sm sm:text-base">
                  <span>Settings</span>
                </button>
              )}
              <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg flex items-center justify-center shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors text-sm sm:text-base">
                <PlusSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span>{isMobile ? "New" : "New Feature"}</span>
              </button>
            </div>
          </div>

          {!isMobile && (
            <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-indigo-800 dark:text-indigo-200">
                    System Status
                  </h2>
                  <p className="text-sm text-indigo-600 dark:text-indigo-300 mt-1">
                    All systems operational • Last updated 5 minutes ago
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                  Stable
                </div>
              </div>
            </div>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-4 sm:mt-6"
        >
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs w-max sm:w-full">
              {navItems.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="data-[state=active]:bg-indigo-50 data-[state=active]:dark:bg-indigo-900/30 data-[state=active]:text-indigo-700 data-[state=active]:dark:text-indigo-300 data-[state=active]:shadow-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-md transition-all text-sm sm:text-base flex items-center gap-1.5"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <TabsContent value="users" className="p-0">
              <UserTable />
            </TabsContent>
            <TabsContent value="finance" className="p-0">
              <FinanceSection />
            </TabsContent>
            <TabsContent value="security" className="p-0">
              <SecuritySection />
            </TabsContent>
            <TabsContent value="system" className="p-0">
              <SystemTools />
            </TabsContent>
            <TabsContent value="optional" className="p-0">
              <OptionalFeatures />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
