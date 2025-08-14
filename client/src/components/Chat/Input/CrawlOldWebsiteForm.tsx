import React, { useState, useCallback } from 'react';
import { X, Calendar } from 'lucide-react';
import { Button } from '@librechat/client';

interface CrawlOldWebsiteFormProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (formData: CrawlFormData) => void;
}

export interface CrawlFormData {
  label: string;
  description: string;
  website: string;
  oldDomain: string;
  launchDate: string;
  listMode: string;
}

const CrawlOldWebsiteForm: React.FC<CrawlOldWebsiteFormProps> = ({
  isVisible,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CrawlFormData>({
    label: 'Old Site Crawl - Pre Migration Check',
    description:
      'Crawling the legacy site to ensure all old pages are accounted for before migration.',
    website: 'www.launchguardian.com',
    oldDomain: 'old.launchguardian.com',
    launchDate: '1 July, 2025',
    listMode: 'Raw Mode',
  });

  const handleInputChange = useCallback((field: keyof CrawlFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(formData);
    onClose();
  }, [formData, onSubmit, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className="mx-auto mb-4 w-full max-w-2xl rounded-lg bg-surface-secondary border border-border-medium shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white">Crawl Old Website</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={onClose}
            className="rounded px-3 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            Edit
          </Button>
          <Button
            onClick={onClose}
            className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-6">
        {/* Label */}
        <div>
          <label className="block mb-2 text-sm font-medium text-white">Label</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleInputChange('label', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 text-sm font-medium text-white">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg resize-none border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            This helps your team understand the purpose of this crawl.
          </p>
        </div>

        {/* Website and Old Domain */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-sm font-medium text-white">
              Select Website
            </label>
            <select
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="www.launchguardian.com">www.launchguardian.com</option>
              <option value="www.example.com">www.example.com</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-white">
              Select Old Domain
            </label>
            <select
              value={formData.oldDomain}
              onChange={(e) => handleInputChange('oldDomain', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="old.launchguardian.com">old.launchguardian.com</option>
              <option value="legacy.example.com">legacy.example.com</option>
            </select>
          </div>
        </div>

        {/* Launch Date */}
        <div>
          <label className="block mb-2 text-sm font-medium text-white">
            Select The Launch Date
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.launchDate}
              onChange={(e) => handleInputChange('launchDate', e.target.value)}
              className="w-full px-3 py-2 pr-10 border rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar className="absolute w-4 h-4 transform -translate-y-1/2 right-3 top-1/2 text-gray-400" />
          </div>
        </div>

        {/* List Mode */}
        <div>
          <label className="block mb-2 text-sm font-medium text-white">
            List Mode (Optional)
          </label>
          <textarea
            value={formData.listMode}
            onChange={(e) => handleInputChange('listMode', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg resize-none border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-gray-700 p-6">
        <Button
          onClick={handleCancel}
          className="px-6 py-2 text-sm font-medium transition-colors border rounded-lg border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="px-6 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default CrawlOldWebsiteForm;
