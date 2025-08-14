import React, { useState, useCallback } from 'react';
import { useLocalize } from '~/hooks';
// import { Button } from '~/components/ui';

interface CrawlFormData {
  website: string;
  launchDate: string;
  description: string;
}

interface WebsiteOption {
  label: string;
  value: string;
}

interface CrawlFormProps {
  onSubmit?: (data: CrawlFormData) => void;
  onCancel?: () => void;
  websiteOptions?: WebsiteOption[];
  isSubmitted?: boolean;
  submittedData?: CrawlFormData & { websiteLabel?: string };
}

const CrawlForm: React.FC<CrawlFormProps> = ({ onSubmit, onCancel, websiteOptions = [], isSubmitted = false, submittedData }) => {
  const localize = useLocalize();
  const [formData, setFormData] = useState<CrawlFormData>({
    website: '',
    launchDate: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: keyof CrawlFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.website || !formData.launchDate || !formData.description) {
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit?.(formData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const isValid = formData.website && formData.launchDate && formData.description;

  // If form is submitted, show the submitted data
  if (isSubmitted && submittedData) {
    return (
      <div className="my-4 rounded-xl border border-green-400 bg-green-50 dark:bg-green-900/20 p-4 shadow-lg">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              ✅ Crawl Configuration Submitted
            </h3>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            The crawl configuration has been submitted and processed.
          </p>
        </div>
        
        <div className="space-y-3">
          {/* Submitted Website */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Website
            </label>
            <div className="w-full rounded-md border border-green-300 bg-green-100 dark:bg-green-800/30 px-3 py-2 text-text-primary">
              {submittedData.websiteLabel || submittedData.website}
            </div>
          </div>

          {/* Submitted Launch Date */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Launch Date
            </label>
            <div className="w-full rounded-md border border-green-300 bg-green-100 dark:bg-green-800/30 px-3 py-2 text-text-primary">
              {new Date(submittedData.launchDate).toLocaleString()}
            </div>
          </div>

          {/* Submitted Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <div className="w-full rounded-md border border-green-300 bg-green-100 dark:bg-green-800/30 px-3 py-2 text-text-primary whitespace-pre-wrap">
              {submittedData.description}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-xl border border-orange-400 bg-orange-50 dark:bg-orange-900/20 p-4 shadow-lg">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
            Website Crawl Configuration
          </h3>
        </div>
        <p className="text-sm text-orange-700 dark:text-orange-300">
          Please provide the details for the website crawl. 
          {websiteOptions.length > 0 && ` Select from ${websiteOptions.length} available website${websiteOptions.length > 1 ? 's' : ''}.`}
          {' '}Chat is disabled until you submit or cancel this form.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Website Selector */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-text-primary mb-2">
            Website
          </label>
          {websiteOptions.length > 0 ? (
            <select
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full rounded-md border border-border-medium bg-surface-secondary px-3 py-2 text-text-primary focus:border-border-heavy focus:outline-none focus:ring-1 focus:ring-border-heavy"
              required
            >
              <option value="">Select a website...</option>
              {websiteOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-md border border-border-medium bg-surface-secondary px-3 py-2 text-text-primary placeholder-text-tertiary focus:border-border-heavy focus:outline-none focus:ring-1 focus:ring-border-heavy"
              required
            />
          )}
        </div>

        {/* Launch Date Picker */}
        <div>
          <label htmlFor="launchDate" className="block text-sm font-medium text-text-primary mb-2">
            Launch Date
          </label>
          <input
            id="launchDate"
            type="datetime-local"
            value={formData.launchDate}
            onChange={(e) => handleInputChange('launchDate', e.target.value)}
            className="w-full rounded-md border border-border-medium bg-surface-secondary px-3 py-2 text-text-primary focus:border-border-heavy focus:outline-none focus:ring-1 focus:ring-border-heavy"
            required
          />
        </div>

        {/* Description Text Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what you want to crawl..."
            rows={3}
            className="w-full rounded-md border border-border-medium bg-surface-secondary px-3 py-2 text-text-primary placeholder-text-tertiary focus:border-border-heavy focus:outline-none focus:ring-1 focus:ring-border-heavy resize-none"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md px-4 py-2 text-white font-medium transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </span>
            ) : (
              'Confirm Crawl'
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 border border-border-medium bg-surface-secondary hover:bg-surface-tertiary rounded-md px-4 py-2 text-text-primary font-medium transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrawlForm;