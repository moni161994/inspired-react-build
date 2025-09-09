import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/lovable-uploads/9f30c983-142b-434d-be0e-ede38d03ae17.png')`
          }}
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-6">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="text-2xl font-bold text-blue-600">cvent</div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-2xl font-bold text-blue-600">...iCAPTURE</div>
            </div>
          </div>

          {/* Info alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              Please enter your email and password to log in.
            </AlertDescription>
          </Alert>

          <form className="space-y-4">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                placeholder="Enter your email"
              />
            </div>

            {/* Password field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="text-sm space-x-2">
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Forgot Password?
                  </a>
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Don't have one yet?
                  </a>
                </div>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                placeholder="Enter your password"
              />
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label htmlFor="remember" className="text-sm text-gray-700">
                Remember me
              </label>
            </div>

            {/* Login button */}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              Log in
            </Button>
          </form>

          {/* Social login section */}
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-500">
              or log in with
            </div>

            {/* Google login */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 py-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </Button>

            {/* Microsoft login */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-800 text-white hover:bg-gray-700 border-gray-800"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              <span>Sign in with Microsoft</span>
            </Button>
          </div>

          {/* Enterprise SSO */}
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">
              or log in with
            </div>
            <Button variant="link" className="text-blue-600 hover:text-blue-500">
              🏢 Enterprise Single Sign-On
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;