"use client";

import AdminTableItem from "./AdminTableItem";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";

const AdminTable = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
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
      console.error("Failed to load users", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="overflow-hidden grid grid-rows-[auto_1fr] gap-3">
      <p className="text-neutral-300">
        Total Users <span className="text-[#97afd5]">({users.length})</span>
      </p>
      <div className="border rounded-md border-[#97afd5] overflow-auto h-full table-scroll">
        {isLoading ? (
          <div className="grid h-full place-content-center ">
            <span className="block w-10 h-10 border-2 border-[#97afd5] border-l-transparent animate-spin rounded-full"></span>
          </div>
        ) : (
          <>
            <table className="admin-table w-full">
              <thead className="border border-[#97afd5]">
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Profit</th>
                  <th>Total Deposit</th>
                  <th>Total Withdrawal</th>
                  <th>Transaction Code</th>
                </tr>
              </thead>

              <tbody>
                {users.map((data, i) => (
                  <AdminTableItem
                    key={data.id}
                    id={data.id}
                    firstName={data.firstName}
                    LastName={data.lastName}
                    email={data.email}
                    className={`${i > 0 && "border-t border-[#97afd5]"}`}
                    phoneNumber={data.phoneNumber || "NULL"}
                    profit={data.profit || 0}
                    totalDeposit={data.totalDeposit || 0}
                    totalWithdrawal={data.totalWithdrawal || 0}
                    transactionCode={data.transactionCode || "No Codes"}
                  />
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminTable;
