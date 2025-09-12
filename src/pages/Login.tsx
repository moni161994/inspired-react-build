import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialState = {
  email: "",
  code: "",
};

export default function LoginPage() {
  const [loginInfo, setLoginInfo] = useState(initialState);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const { request, loading } = useApi();

  const handleChange = (e) => {
    setLoginInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ✅ LOGIN SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = await request("/login", "POST", {
      email: loginInfo.email,
      code: loginInfo.code,
    });

    if (data?.status_code === 200) {
      setMessage("✅ Logged in successfully!");

      if (data.auth_token) {
        localStorage.setItem("token", data.auth_token);
        localStorage.setItem("isLoggedIn", "true"); // ✅ important
        localStorage.setItem("email", loginInfo.email)
      }

      navigate("/analytics");
      setLoginInfo(initialState);
    } else {
      setMessage(data?.msg || "Login failed");
    }
  };

  // ✅ GENERATE OTP
  const handleGenerateCode = async () => {
    if (!loginInfo.email) {
      alert("Please enter your email");
      return;
    }

    const res = await request("/generate_otp", "POST", {
      email_id: loginInfo.email,
    });

    if (res?.message === 'OTP sent successfully') {
      alert("OTP sent to your email!");
      console.log("OTP Response:", res);
    } else {
      alert(res?.msg || "Failed to send OTP");
    }
  };

  const isDisabled = !loginInfo.email.trim() || !loginInfo.code.trim();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-lg shadow-md p-8 space-y-6">
        <div className="flex justify-center mb-4">
          <h1 className="text-2xl font-bold text-blue-700">Epredia</h1>
        </div>

        <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded border border-blue-200 text-center">
          Please enter your email and code to log in.
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <Input
              placeholder="Enter email..."
              onChange={handleChange}
              value={loginInfo.email}
              name="email"
            />
          </div>

          {/* Generate Code Button */}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleGenerateCode}
              disabled={loading}
              className="bg-purple-500 text-white text-sm font-semibold px-3 py-1 rounded-md hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Generate Code"}
            </button>
          </div>

          {/* OTP Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter Code
            </label>
            <Input
              placeholder="Enter code..."
              onChange={handleChange}
              value={loginInfo.code}
              name="code"
            />
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 w-full"
            disabled={isDisabled || loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        {message && (
          <p className="text-red-500 text-center text-2xl">{message}</p>
        )}
      </div>
    </div>
  );
}
