import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import AdminTransactions from "./AdminTransaction";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { useTransactions } from "../../context/TransactionContext";
import { useUser } from "../../context/UserContext";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

export default function FinanceSection() {
  const {
    transactions,
    pendingRequests,
    pendingDeposits,
    pendingWithdrawals,
    notificationCount,
    clearNotifications,
    loading: transactionsLoading,
    approveTransaction,
    rejectTransaction,
  } = useTransactions();

  const { userData, refreshUser } = useUser();
  const [activeTab, setActiveTab] = useState("transactions");
  const [processingId, setProcessingId] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adjustMode, setAdjustMode] = useState("increase");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustingBalance, setAdjustingBalance] = useState(false);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshUser]);

  // Calculate totals
  const totalDeposits = transactions
    .filter((tx) => tx.type === "Deposit" && tx.status === "Completed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const totalWithdrawals = transactions
    .filter((tx) => tx.type === "Withdrawal" && tx.status === "Completed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;

  const getToken = () =>
    (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

  const fetchAdminUsers = async () => {
    try {
      setUsersLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/Admin/Users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setUsers(result.data || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load admin users", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleAdjustBalance = async () => {
    const amountValue = Number(adjustAmount);
    if (!selectedUserId) {
      toast.error("Select a user first.");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    try {
      setAdjustingBalance(true);
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/Admin/AdjustBalance`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          amount: amountValue,
          operation: adjustMode,
          note: adjustNote.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Request failed (${response.status})`);
      }

      const updatedBalance = Number(result?.data?.balance || 0).toFixed(2);
      toast.success(
        `${adjustMode === "increase" ? "Credited" : "Deducted"} $${amountValue.toFixed(
          2
        )}. New balance: $${updatedBalance}`
      );
      setAdjustAmount("");
      setAdjustNote("");
      await Promise.all([fetchAdminUsers(), refreshUser()]);
    } catch (error) {
      toast.error(error.message || "Failed to adjust balance.");
    } finally {
      setAdjustingBalance(false);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "deposits") {
      clearNotifications();
    }
  };

  const handleApprove = async (transactionId) => {
    try {
      setProcessingId(transactionId);
      await approveTransaction(transactionId);
      toast.success("Transaction approved successfully");
      refreshUser();
    } catch (error) {
      toast.error("Failed to approve transaction: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transactionId) => {
    try {
      setProcessingId(transactionId);
      await rejectTransaction(transactionId);
      toast.success("Transaction rejected");
      refreshUser();
    } catch (error) {
      toast.error("Failed to reject transaction: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Total Balance
                </h4>
                <p className="text-2xl font-bold mt-2">
                  ${userData?.balance?.toFixed(2) || "0.00"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Total Deposits
                </h4>
                <p className="text-2xl font-bold mt-2">
                  ${totalDeposits.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Pending Deposits
                  </h4>
                  {pendingDeposits.length > 0 && (
                    <span className="inline-flex h-6 items-center rounded-full bg-yellow-500 px-2 text-xs font-semibold text-white">
                      {pendingDeposits.length} new
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold mt-2">
                  {pendingDeposits.length}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Admin Balance Controls</h3>
          <p className="text-sm text-gray-500 mb-5">
            Credit or deduct a user balance directly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 bg-transparent"
                disabled={usersLoading}
              >
                <option value="">
                  {usersLoading ? "Loading users..." : "Select a user"}
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
              {selectedUser && (
                <p className="text-xs text-gray-500 mt-2">
                  Current Balance: ${Number(selectedUser.balance || 0).toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Operation</label>
              <select
                value={adjustMode}
                onChange={(e) => setAdjustMode(e.target.value)}
                className="w-full rounded-md border px-3 py-2 bg-transparent"
              >
                <option value="increase">Increase Balance</option>
                <option value="deduct">Deduct Balance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount (USD)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-md border px-3 py-2 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Note (optional)</label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Reason for adjustment"
                className="w-full rounded-md border px-3 py-2 bg-transparent"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              onClick={handleAdjustBalance}
              disabled={adjustingBalance || usersLoading || !selectedUserId}
            >
              {adjustingBalance
                ? "Applying..."
                : adjustMode === "increase"
                ? "Increase Balance"
                : "Deduct Balance"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="deposits">
            <div className="flex items-center gap-2">
              Pending Deposits
              {pendingDeposits.length > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-yellow-500 text-white text-xs rounded-full">
                  {pendingDeposits.length}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            <div className="flex items-center gap-2">
              Pending Withdrawals
              {pendingWithdrawals.length > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-yellow-500 text-white text-xs rounded-full">
                  {pendingWithdrawals.length}
                </span>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <AdminTransactions
            transactions={transactions}
            loading={transactionsLoading}
          />
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardContent className="pt-6">
              {pendingDeposits.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No pending deposits
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingDeposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="p-4 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-medium">{deposit.userName}</h4>
                        <p className="text-sm text-gray-500">
                          ${deposit.amount} via {deposit.method}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(deposit.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(deposit.id)}
                          disabled={
                            processingId === deposit.id || transactionsLoading
                          }
                        >
                          {processingId === deposit.id
                            ? "Processing..."
                            : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(deposit.id)}
                          disabled={
                            processingId === deposit.id || transactionsLoading
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardContent className="pt-6">
              {pendingWithdrawals.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No pending withdrawals
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="p-4 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-medium">{withdrawal.userName}</h4>
                        <p className="text-sm text-gray-500">
                          ${withdrawal.amount} via {withdrawal.method}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(withdrawal.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(withdrawal.id)}
                          disabled={
                            processingId === withdrawal.id ||
                            transactionsLoading
                          }
                        >
                          {processingId === withdrawal.id
                            ? "Processing..."
                            : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(withdrawal.id)}
                          disabled={
                            processingId === withdrawal.id ||
                            transactionsLoading
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
