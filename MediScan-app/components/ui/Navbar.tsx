"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { Menu, X, LogOut, Github } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticatedUser, logout } = useAuth();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Analyze", href: "/analyze", protected: true },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const isActiveLink = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();

    localStorage.removeItem("authTokens");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");

    localStorage.removeItem("user");
    localStorage.removeItem("isAdmin");

    window.location.href = "/";
  };

  return (
    <nav className="bg-white shadow-sm dark:bg-[#131619] dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/logo3.png"
                  alt="MediScan AI Logo"
                  width={32}
                  height={32}
                  className="rounded-md"
                />
                <span className="font-bold text-xl text-[#24AE7C] dark:text-[#4AC97E]">
                  MediScan AI
                </span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                {navLinks.map(
                  (link) =>
                    (!link.protected || isAuthenticatedUser) && (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={classNames(
                          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          {
                            "bg-green-100 text-[#24AE7C] dark:bg-green-900 dark:text-green-200":
                              isActiveLink(link.href),
                            "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700":
                              !isActiveLink(link.href),
                          }
                        )}
                      >
                        {link.name}
                      </Link>
                    )
                )}
              </div>
            </div>
          </div>

          {/* Right side: auth only */}
          <div className="hidden md:flex items-center space-x-3">
            {!isAuthenticatedUser ? (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-[#24AE7C] text-white hover:bg-green-700 transition-colors"
                >
                  Register
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={classNames(
          "md:hidden transition-all duration-300 ease-in-out",
          {
            "max-h-screen opacity-100": mobileMenuOpen,
            "max-h-0 opacity-0 overflow-hidden": !mobileMenuOpen,
          }
        )}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map(
            (link) =>
              (!link.protected || isAuthenticatedUser) && (
                <Link
                  key={link.name}
                  href={link.href}
                  className={classNames(
                    "block px-3 py-2 rounded-md text-base font-medium",
                    {
                      "bg-green-100 text-[#24AE7C] dark:bg-[#4AC97E] dark:text-green-200":
                        isActiveLink(link.href),
                      "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700":
                        !isActiveLink(link.href),
                    }
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              )
          )}

          <a
            href="https://github.com/MMansy19/cdss-xray-app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Github className="h-5 w-5 mr-2" />
            GitHub Repository
          </a>

          {!isAuthenticatedUser ? (
            <>
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>

              <Link
                href="/register"
                className="block px-3 py-2 rounded-md text-base font-medium bg-[#24AE7C] text-white hover:bg-green-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </>
          ) : (
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center w-full space-x-2 px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;