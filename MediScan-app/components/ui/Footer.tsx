"use client";

import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-[#131619] border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and Copyright */}
          <div className="flex flex-col md:flex-row items-center mb-6 md:mb-0">
            <div className="flex items-center mb-3 md:mb-0 md:mr-4">
              <Image
                src="/logo3.png"
                alt="MediScan AI Logo"
                width={28}
                height={28}
                className="rounded-md mr-2"
              />
              <span className="font-semibold text-[#24AE7C] dark:text-[#24AE7C]">
                MediScan AI
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} MediScan AI. All rights reserved.
            </span>
          </div>

          {/* Links */}
          <div className="flex space-x-6">
            <Link
              href="/about"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#4AC97E] dark:hover:text-[#24AE7C] transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#4AC97E] dark:hover:text-[#24AE7C] transition-colors"
            >
              Contact
            </Link>
            <a
              href="#"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#4AC97E] dark:hover:text-[#24AE7C] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#4AC97E] dark:hover:text-[#24AE7C] transition-colors"
            >
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
