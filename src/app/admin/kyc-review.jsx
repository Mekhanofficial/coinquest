// /pages/admin/kyc-review.jsx
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";

export default function KYCReviewPage() {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_BASE_URL}/Admin/Kyc`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setSubmissions(result.data || []);
        } else {
          setSubmissions([]);
        }
      } catch (error) {
        console.error("Failed to load KYC submissions", error);
        setSubmissions([]);
      }
    };

    fetchSubmissions();
  }, []);

  const updateKYC = async (uid, status) => {
    const token = localStorage.getItem("authToken");
    await fetch(`${API_BASE_URL}/Admin/UpdateKycStatus`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ userId: uid, status }),
    });

    alert(`User ${uid} ${status}`);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === uid ? { ...s, status } : s))
    );
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6">KYC Submissions</h1>
      {submissions.map((submission) => (
        <div key={submission.id} className="mb-4 border p-4 rounded shadow">
          <p><strong>Name:</strong> {submission.name || "N/A"}</p>
          <p><strong>Email:</strong> {submission.email || "N/A"}</p>
          <p><strong>Status:</strong> {submission.status}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {submission.governmentId && (
              <a
                href={submission.governmentId}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Government ID
              </a>
            )}
            {submission.selfie && (
              <a
                href={submission.selfie}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Selfie
              </a>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => updateKYC(submission.userId, "verified")}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => updateKYC(submission.userId, "rejected")}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
