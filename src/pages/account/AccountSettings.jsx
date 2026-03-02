import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faUser,
  faCreditCard,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

export default function AccountSetPage() {
  return (
    <>
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg ">
        <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
        <p className="text-gray-600 mb-6">
          Manage your account settings below.
        </p>

        <ul className="space-y-4">
          <li className="flex items-center justify-between p-3 bg-gray-100 rounded-lg shadow cursor-pointer hover:bg-gray-200">
            <span>
              <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Update
              Email
            </span>
            <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
              Edit
            </button>
          </li>
          <li className="flex items-center justify-between p-3 bg-gray-100 rounded-lg shadow cursor-pointer hover:bg-gray-200">
            <span>
              <FontAwesomeIcon icon={faLock} className="mr-2" /> Update Password
            </span>
            <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
              Edit
            </button>
          </li>
          <li className="flex items-center justify-between p-3 bg-gray-100 rounded-lg shadow cursor-pointer hover:bg-gray-200">
            <span>
              <FontAwesomeIcon icon={faUser} className="mr-2" /> Update Profile
              Photo
            </span>
            <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
              Edit
            </button>
          </li>
          <li className="flex items-center justify-between p-3 bg-gray-100 rounded-lg shadow cursor-pointer hover:bg-gray-200">
            <span>
              <FontAwesomeIcon icon={faCreditCard} className="mr-2" /> Manage
              Payment Methods
            </span>
            <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
              Edit
            </button>
          </li>
          <li className="flex items-center justify-between p-3 bg-red-100 text-red-600 rounded-lg shadow cursor-pointer hover:bg-red-200">
            <span>
              <FontAwesomeIcon icon={faTrash} className="mr-2" /> Delete Account
            </span>
            <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
              Delete
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}
