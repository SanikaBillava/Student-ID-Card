import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { COMPANY_LOGO, THEME } from '../constants';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img src={settings?.site_logo || COMPANY_LOGO} alt="Logo" className="h-10 w-10" />
              <span className="text-xl font-bold">{settings?.site_name || 'ID Card Portal'}</span>
            </div>
            <p className="text-gray-400">Professional ID card management system for schools and institutions.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400">
              {settings?.contact_phone && <p>{settings.contact_phone}</p>}
              {settings?.contact_email && <p>{settings.contact_email}</p>}
              {settings?.address && <p>{settings.address}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {settings?.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {settings?.social_x && (
                <a href={settings.social_x} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-6 h-6" />
                </a>
              )}
              {settings?.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
          <p>Made with ❤️ by QOBO</p>
        </div>
      </div>
    </footer>
  );
}