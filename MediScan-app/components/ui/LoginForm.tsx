"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogIn, CheckCircle, Shield } from "lucide-react";
import useAuth from "@/hooks/useAuth";

interface LoginFormProps {
  isAdminLogin?: boolean;
  redirect?: string;
}

const LoginForm = ({
  isAdminLogin = false,
  redirect = "/analyze",
}: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [loginError, setLoginError] = useState("");

  const router = useRouter();
  const { error } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const registrationSuccessful =
        sessionStorage.getItem("registrationSuccess") === "true";

      const email = sessionStorage.getItem("registeredEmail") || "";

      if (registrationSuccessful) {
        setRegistrationSuccess(true);
        setRegisteredEmail(email);

        if (email.includes("@")) {
          const usernameFromEmail = email.split("@")[0];
          setUsername(usernameFromEmail);
        }

        sessionStorage.removeItem("registrationSuccess");
        sessionStorage.removeItem("registeredEmail");

        const timeoutId = setTimeout(() => {
          setRegistrationSuccess(false);
        }, 8000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, []);

  const saveTokens = (data: any) => {
  const accessToken = data.access_token || data.access || data.token;
  const refreshToken = data.refresh_token || data.refresh || data.token;

  localStorage.setItem("authTokens", JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken || accessToken,
  }));

  localStorage.setItem("authToken", accessToken);
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken || accessToken);
  localStorage.setItem("access", accessToken);
  localStorage.setItem("refresh", refreshToken || accessToken);
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("token", accessToken);

  const userData = data.user || {
    username: username,
    is_staff: false,
    is_superuser: false,
  };

  localStorage.setItem("userData", JSON.stringify(userData));
  localStorage.setItem("user", JSON.stringify(userData));

  const isAdminUser = Boolean(userData.is_staff || userData.is_superuser);
  localStorage.setItem("isAdmin", isAdminUser ? "true" : "false");
};
  const handleNormalLogin = async () => {
    const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Login returned HTML:", text);
      throw new Error("Login API did not return JSON. Check backend URL.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.detail || "Invalid username or password."
      );
    }

    saveTokens(data);
    localStorage.setItem("isAdmin", "true");

    window.location.href = redirect || "/analyze";
  };

  const handleAdminLogin = async () => {
    const response = await fetch(
      "http://127.0.0.1:8000/api/auth/admin-login/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Admin login returned HTML:", text);
      throw new Error("Admin login API did not return JSON. Check backend URL.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.detail || "Admin authentication failed."
      );
    }

    saveTokens(data);
    localStorage.setItem("isAdmin", "false");

    window.location.href = redirect || "/admin-dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setLoginError("");

    try {
      if (isAdminLogin) {
        await handleAdminLogin();
      } else {
        await handleNormalLogin();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setLoginError(err.message || "Login error");
    } finally {
      setIsLoading(false);
    }
  };

  const displayedError = loginError || error;

  return (
    <div className="w-full max-w-md">
      {isAdminLogin && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start">
            <Shield className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Admin authentication required
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                Please sign in with an administrator account to access the admin
                dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {registrationSuccess && !isAdminLogin && (
        <div className="mb-6 flex items-start rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Registration successful!
            </p>
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
              Your account has been created
              {registeredEmail ? ` for ${registeredEmail}` : ""}. Please sign
              in with your credentials.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="mb-1">
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Username
            </label>

            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-gray-400" />
              </div>

              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`block w-full rounded-md border py-3 pl-10 pr-3 shadow-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  displayedError ? "border-red-300" : "border-gray-300"
                }`}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1">
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>

            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full rounded-md border py-3 pl-10 pr-3 shadow-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  displayedError ? "border-red-300" : "border-gray-300"
                }`}
              />
            </div>
          </div>
        </div>

        {displayedError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {displayedError}
            </p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`group relative flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 transition-colors ${
              isAdminLogin
                ? "bg-slate-900 hover:bg-slate-700 focus:ring-slate-500"
                : "bg-green-700 hover:bg-green-800 focus:ring-green-500"
            }`}
          >
            {isLoading ? (
              <svg
                className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : isAdminLogin ? (
              <Shield className="mr-2 h-5 w-5" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}

            {isLoading
              ? "Logging in..."
              : isAdminLogin
              ? "Admin Sign in"
              : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;