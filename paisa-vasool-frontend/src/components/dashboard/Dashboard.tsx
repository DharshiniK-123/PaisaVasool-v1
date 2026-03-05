import React from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../app/store';
import { logoutThunk } from '../../features/auth/slices/authSlice';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                PaisaVasool Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.first_name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Intake and Matching System
            </h2>
            <p className="text-gray-600 mb-6">
              Welcome to your dashboard. Here you can manage invoices, payment details, 
              and view matching reports.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Documents
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload invoices and payment details in PDF, CSV, or Excel format.
                </p>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Upload Files
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  View Matches
                </h3>
                <p className="text-gray-600 mb-4">
                  Review matched payments and invoices with confidence scores.
                </p>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  View Matches
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aging Reports
                </h3>
                <p className="text-gray-600 mb-4">
                  Monitor aged invoices and generate reminder emails.
                </p>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  View Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
