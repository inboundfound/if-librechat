import React, { useState, useCallback } from 'react';
import { useLocalize } from '~/hooks';
import { Button, Input, Label, TextareaAutosize, SelectDropDown } from '@librechat/client';

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

const CrawlForm: React.FC<CrawlFormProps> = ({
  onSubmit,
  onCancel,
  websiteOptions = [],
  isSubmitted = false,
  submittedData,
}) => {
  const localize = useLocalize();
  const [formData, setFormData] = useState<CrawlFormData>({
    website: '',
    launchDate: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: keyof CrawlFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [formData, onSubmit],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const isValid = formData.website && formData.launchDate && formData.description;

  // If form is submitted, show the submitted data
  if (isSubmitted && submittedData) {
    return (
      <div className="my-4 rounded-xl border border-green-400 bg-green-50 p-4 shadow-lg dark:bg-green-900/20">
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
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
            <Label className="mb-1 block text-sm font-medium text-text-primary">Website</Label>
            <div className="w-full rounded-md border border-green-300 bg-green-100 px-3 py-2 text-text-primary dark:bg-green-800/30">
              {submittedData.websiteLabel || submittedData.website}
            </div>
          </div>

          {/* Submitted Launch Date */}
          <div>
            <Label className="mb-1 block text-sm font-medium text-text-primary">Launch Date</Label>
            <div className="w-full rounded-md border border-green-300 bg-green-100 px-3 py-2 text-text-primary dark:bg-green-800/30">
              {new Date(submittedData.launchDate).toLocaleString()}
            </div>
          </div>

          {/* Submitted Description */}
          <div>
            <Label className="mb-1 block text-sm font-medium text-text-primary">Description</Label>
            <div className="w-full whitespace-pre-wrap rounded-md border border-green-300 bg-green-100 px-3 py-2 text-text-primary dark:bg-green-800/30">
              {submittedData.description}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-xl border border-gray-600 bg-gray-800 p-4 shadow-lg">
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-blue-500"></div>
          <h3 className="text-lg font-semibold text-white">Website Crawl Configuration</h3>
        </div>
        <p className="text-sm text-gray-300">
          Please provide the details for the website crawl.
          {websiteOptions.length > 0 &&
            ` Select from ${websiteOptions.length} available website${websiteOptions.length > 1 ? 's' : ''}.`}{' '}
          Chat is disabled until you submit or cancel this form.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Website Selector */}
        <div>
          <Label htmlFor="website" className="mb-2 block text-sm font-medium text-white">
            Website
          </Label>
          {websiteOptions.length > 0 ? (
            <SelectDropDown
              id="website"
              value={formData.website}
              setValue={(value) => handleInputChange('website', value)}
              placeholder="Select a website..."
              containerClassName="w-full"
              availableValues={websiteOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              showLabel={false}
              emptyTitle={true}
            />
          ) : (
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://example.com"
              className="w-full border-gray-600 bg-gray-700 text-white placeholder-gray-400"
              required
            />
          )}
        </div>

        {/* Launch Date Picker */}
        <div>
          <Label htmlFor="launchDate" className="mb-2 block text-sm font-medium text-white">
            Launch Date
          </Label>
          <Input
            id="launchDate"
            type="datetime-local"
            value={formData.launchDate}
            onChange={(e) => handleInputChange('launchDate', e.target.value)}
            className="w-full border-gray-600 bg-gray-700 text-white"
            required
          />
        </div>

        {/* Description Text Field */}
        <div>
          <Label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
            Description
          </Label>
          <TextareaAutosize
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what you want to crawl..."
            minRows={3}
            maxRows={6}
            className="w-full resize-none border-gray-600 bg-gray-700 text-white placeholder-gray-400"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={handleCancel}
            variant="outline"
            className="flex-1 border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Submitting...
              </span>
            ) : (
              'Confirm Crawl'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CrawlForm;
