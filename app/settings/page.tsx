"use client";

import { useUser } from "@clerk/nextjs";
import { AppHeader } from "@/components/AppHeader";

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showBackButton backHref="/dashboard" backLabel="Back to Dashboard" />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Account Settings</h1>

          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Account Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <p className="text-gray-900">
                    {user?.fullName || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      // Clerk's UserButton already handles this
                      window.location.href = '/user';
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    Manage Account with Clerk
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription / Billing */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Subscription & Billing
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900">
                  💡 <strong>Coming Soon:</strong> Manage your subscription and billing preferences here.
                </p>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Receive updates about your book orders
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-medium text-gray-900">Marketing Emails</h3>
                    <p className="text-sm text-gray-500">
                      Get tips and inspiration for your books
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Support & Help
              </h2>
              <div className="space-y-3">
                <a
                  href="mailto:support@beforebedtimeadventures.com"
                  className="block text-purple-600 hover:text-purple-700 font-medium"
                >
                  📧 Contact Support
                </a>
                <a
                  href="#"
                  className="block text-purple-600 hover:text-purple-700 font-medium"
                >
                  📖 View Help Center
                </a>
                <a
                  href="#"
                  className="block text-purple-600 hover:text-purple-700 font-medium"
                >
                  💬 Join Community
                </a>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-200">
              <h2 className="text-2xl font-semibold text-red-600 mb-4">
                Danger Zone
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Delete Account</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all your books. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                        // Handle account deletion
                        alert('Account deletion would be processed here');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
