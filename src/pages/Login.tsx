import React, { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-lg shadow-md p-8 space-y-6">
        {/* Logo Section */}
        <div className="flex justify-center mb-4">
          <h1 className="text-2xl font-bold text-blue-700">Epredia</h1>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded border border-blue-200 text-center">
          Please enter your email and password to log in.
        </div>

        {/* Form */}
        <form className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-medium text-gray-700">Password</label>
              <a href="#" className="text-blue-600 hover:underline">
                Forgot Password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="text-sm text-gray-700">Remember me</label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700"
          >
            Log in
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="px-3 text-sm text-gray-500">or log in with</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* Social Logins */}
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center border border-gray-300 rounded py-2 space-x-2 hover:bg-gray-50">
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5" />
            <span className="text-sm font-medium">Sign in with Google</span>
          </button>
          <button className="w-full flex items-center justify-center border border-gray-300 rounded py-2 space-x-2 hover:bg-gray-50">
            <img src="https://www.svgrepo.com/show/303150/microsoft.svg" alt="Microsoft" className="w-5 h-5" />
            <span className="text-sm font-medium">Sign in with Microsoft</span>
          </button>
        </div>
      </div>
    </div>
  );
}
