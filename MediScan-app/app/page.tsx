"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { ArrowRight, Layers, Shield, BarChart3, LogOut  } from "lucide-react";
import StructuredData from "@/components/ui/StructuredData";
import Slider from "@/components/Slider";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
}) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

export default function Home() {
  const slides = [
    {
      id: "slider1",
      Images: [
        "images/slides/00000001_001.png",
        "images/slides/00000001_002.png",
        "images/slides/00000003_000.png",
        "images/slides/00000002_000.png",
      ],
      direction: "left",
    },
  ];
  const { isAuthenticatedUser } = useAuth();
const [mounted, setMounted] = useState(false);
const [isAdmin, setIsAdmin] = useState(false);


useEffect(() => {
  setMounted(true);

  const adminFlag = localStorage.getItem("isAdmin") === "true";

  const userData =
    localStorage.getItem("userData") || localStorage.getItem("user");

  if (userData) {
    try {
      const parsedUser = JSON.parse(userData);
      setIsAdmin(Boolean(parsedUser.is_staff || parsedUser.is_superuser || adminFlag));
    } catch {
      setIsAdmin(adminFlag);
    }
  } else {
    setIsAdmin(adminFlag);
  }
}, []);

const handleLogout = () => {
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

  if (!mounted) {
    return null; // Return nothing during SSR
  }

  return (
    <>
      {/* Add structured data for SEO */}
      <StructuredData
        type="website"
        name="MediScan AI - AI-Powered Clinical Decision Support System"
        description="Enhance diagnostic accuracy and speed with advanced machine learning algorithms designed to assist medical professionals in chest X-ray interpretation."
        customData={{
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
          applicationCategory: "HealthcareApplication",
        }}
      />

      <div>
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="block justify-center items-center max-w-3xl mx-auto">
            <div className="">
              <div className="block justify-center text-center items-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  AI-Powered <br />
                  <span className="text-[#24AE7C] hover:text-green-700 transition-colors duration-500">
                    Chest X-Ray
                  </span>{" "} <br />
                  Analysis for Clinical Decision Support
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Enhance diagnostic accuracy and speed with our advanced
                  machine learning algorithms designed to assist medical
                  professionals in chest X-ray .
                </p>
                <section>
                  {slides.map((slider) => (
                    <Slider
                      key={slider.id}
                      id={slider.id}
                      images={slider.Images}
                      direction={"left"}
                    />
                  ))}
                </section>
                <div className="flex flex-wrap justify-center items-center gap-4">
                  {!isAuthenticatedUser && (
                    <>
                      <Link
                        href="/login"
                        className="inline-flex items-center px-6 py-3 bg-[#24AE7C] text-white font-medium rounded-lg transition-colors"
                      >
                        Login to Start
                        <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                      </Link>

                      <Link
                        href="/login?admin=true&redirect=/admin-dashboard"
                        className="inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Admin Dashboard
                        <Shield className="ml-2 h-5 w-5" aria-hidden="true" />
                      </Link>
                    </>
                  )}

                  {isAuthenticatedUser && !isAdmin && (
                    <Link
                      href="/analyze"
                      className="inline-flex items-center px-6 py-3 bg-[#24AE7C] text-white font-medium rounded-lg transition-colors"
                    >
                      Analyze
                      <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                    </Link>
                  )}

                  {isAuthenticatedUser && isAdmin && (
                    <Link
                      href="/admin-dashboard"
                      className="inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Admin Dashboard
                      <Shield className="ml-2 h-5 w-5" aria-hidden="true" />
                    </Link>
                  )}

                  {isAuthenticatedUser && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Logout
                      <LogOut className="ml-2 h-5 w-5" aria-hidden="true" />
                    </button>
                  )}

                  <Link
                    href="/about"
                    className="inline-flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
                    aria-label="Learn More"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-100 dark:bg-gray-800/50 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" id="features">
                Key Features
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our clinical decision support system helps radiologists and
                clinicians make faster, more accurate diagnoses.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                title="AI-Powered Analysis"
                description="Advanced deep learning algorithms trained on thousands of expert-annotated chest X-rays."
                icon={
                  <Layers className="h-6 w-6 text-[#24AE7C] dark:text-green-400" />
                }
              />
              <FeatureCard
                title="Visualization Tools"
                description="Heatmap overlays highlight regions of interest to improve interpretability."
                icon={
                  <BarChart3 className="h-6 w-6 text-[#24AE7C] dark:text-green-400" />
                }
              />
              <FeatureCard
                title="Clinical Guidelines"
                description="Evidence-based recommendations tailored to detected findings."
                icon={
                  <Shield className="h-6 w-6 text-[#24AE7C] dark:text-green-400" />
                }
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="md:flex md:items-center md:justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Ready to enhance your diagnostic workflow?
                </h2>
                <p className="text-green-100">
                  Start using our AI-assisted chest X-ray analysis tool today.
                </p>
              </div>
              {!isAuthenticatedUser ? (
  <Link
    href="/login"
    className="inline-block px-8 py-4 bg-white text-[#24AE7C] font-bold rounded-lg shadow hover:bg-green-50 transition-colors"
  >
    Login Now
  </Link>
) : !isAdmin ? (
  <Link
    href="/analyze"
    className="inline-block px-8 py-4 bg-white text-[#24AE7C] font-bold rounded-lg shadow hover:bg-green-50 transition-colors"
  >
    Start Analysis
  </Link>
) : (
  <Link
    href="/admin-dashboard"
    className="inline-block px-8 py-4 bg-white text-[#24AE7C] font-bold rounded-lg shadow hover:bg-green-50 transition-colors"
  >
    Open Admin Dashboard
  </Link>
)}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
