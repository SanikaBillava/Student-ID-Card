import React from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { UserCircle2, Settings2, Users, Lock } from "lucide-react";
import { THEME } from "../constants";
import { STUDENT_BATCH_LIMIT } from "../data/appConfig";

export default function HomePage() {
  const { settings } = useSettings();

  const schools = [
    { id: "1", name: "APS", logo: "/schools/APS.jpg" },
    { id: "2", name: "AUGIC", logo: "/schools/AUGIC.png" },
    { id: "3", name: "BIS", logo: "/schools/BIS.jpeg" },
    { id: "4", name: "GDSSA", logo: "/schools/GDSSA.jpg" },
    { id: "5", name: "ITI", logo: "/schools/ITI.jpg" },
    { id: "6", name: "MCS", logo: "/schools/MCS.png" },
    { id: "7", name: "MKPSEA", logo: "/schools/MKPSEA.jpg" },
    { id: "8", name: "PMShri", logo: "/schools/PMShri.jpg" },
    { id: "8", name: "PMShriKumrada", logo: "/schools/PMShri_Kumrada.png" },
    { id: "8", name: "PNCA", logo: "/schools/PNCA.png" },
    { id: "8", name: "RIA", logo: "/schools/RIA.jpg" },
    { id: "8", name: "SVSS", logo: "/schools/SVSS.png" },
    { id: "8", name: "TPA", logo: "/schools/TPA.jpg" },
    { id: "8", name: "UGVS", logo: "/schools/UGVS.png" },
    { id: "8", name: "UJVNL", logo: "/schools/UJVNL.jpg" },
  ];

  const features = [
    {
      icon: UserCircle2,
      title: "Easy Authentication",
      description:
        "Secure sign-up and login system with school logo upload support.",
    },
    {
      icon: Settings2,
      title: "Dynamic Configuration",
      description:
        "Customize ID card fields based on your school requirements.",
    },
    {
      icon: Users,
      title: "Batch Management",
      description: `Manage up to ${STUDENT_BATCH_LIMIT} students per batch with draft save functionality.`,
    },
    {
      icon: Lock,
      title: "Secure Submission",
      description:
        "Creator-only edit access after batch submission for data security.",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to {settings?.site_name || "ID Card Portal"}
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Professional ID card management system for schools and educational
            institutions. Manage student data efficiently with our secure and
            easy-to-use platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-backgroundDark">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-center">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-backgroundDark">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Trusted by Schools
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Schools using our platform for seamless ID card management
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 place-items-center">
            {schools.map((school) => (
              <div
                key={school.id}
                className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28"
              >
                <img
                  src={school.logo}
                  alt={school.name}
                  className="h-full w-full object-contain hover:scale-105 transition duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
                <p className="text-gray-600">
                  Create an account with your school details and upload your
                  logo.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Configure Fields</h3>
                <p className="text-gray-600">
                  Select custom data fields required for your ID cards (one-time
                  setup).
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Add Students</h3>
                <p className="text-gray-600">
                  Enter student data one by one or in batches. Save as draft
                  anytime.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Review & Submit</h3>
                <p className="text-gray-600">
                  Once {STUDENT_BATCH_LIMIT} students are added, review and
                  submit the batch. Data is locked after submission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join hundreds of schools using our platform for efficient ID card
            management.
          </p>
          <Link
            to="/signup"
            className="px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg inline-block"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
}
