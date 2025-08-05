import React, { useState, useCallback } from 'react';
import { Label, Input, Button } from '~/components/ui';
import { useChatContext } from '~/Providers';
import { useSubmitMessage } from '~/hooks';

interface LaunchGuardianGSCToolProps {
  requestContext?: string;
  onClose: () => void;
}

/**
 * AI-invokable Launch Guardian GSC Tool Component
 * This component appears when the AI determines that GSC analysis is needed.
 * It integrates naturally into the conversation flow.
 */
export default function LaunchGuardianGSCTool({
  requestContext = 'Website Analysis Request',
  onClose,
}: LaunchGuardianGSCToolProps) {
  const [websiteId, setWebsiteId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { conversation } = useChatContext();
  const { submitMessage } = useSubmitMessage();

  // Set default date range (last 30 days)
  React.useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // UUID validation
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const isFormValid = websiteId.trim() && isValidUUID(websiteId.trim()) && startDate && endDate;

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Create a structured query for Launch Guardian GSC analysis
      const gscAnalysisQuery = `
Launch Guardian GSC Data Analysis:

Website ID: ${websiteId.trim()}
Date Range: ${startDate} to ${endDate}

Please analyze the Google Search Console data for this website and provide insights on:
- Most trafficked main topics and pages
- Search term performance and keyword rankings  
- Traffic patterns and trends over the specified period
- Click-through rates and impressions analysis
- Opportunities for lead generation optimization
- Actionable recommendations for website improvement

Context: ${requestContext}
      `.trim();

      // Submit the formatted query to continue the conversation
      await submitMessage({
        text: gscAnalysisQuery,
      });

      // Close the form after successful submission
      onClose();
    } catch (error) {
      console.error('Launch Guardian GSC Tool: Submission error', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    isSubmitting,
    websiteId,
    startDate,
    endDate,
    requestContext,
    submitMessage,
    conversation?.conversationId,
    onClose,
  ]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className="mx-auto my-4 max-w-2xl rounded-lg border border-border-medium bg-surface-primary p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 19c-5 0-8-3-8-8s3-8 8-8 8 3 8 8-3 8-8 8z" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Launch Guardian GSC Analysis
            </h3>
            <p className="text-sm text-text-secondary">
              I need some details to analyze your website's performance
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Button>
      </div>

      {/* Context Display */}
      {requestContext && (
        <div className="mb-4 rounded-lg bg-surface-secondary p-3">
          <Label className="text-sm font-medium text-text-primary">Analysis Context:</Label>
          <p className="mt-1 text-sm italic text-text-secondary">"{requestContext}"</p>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Website ID */}
        <div>
          <Label htmlFor="websiteId" className="text-sm font-medium text-text-primary">
            Website ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="websiteId"
            type="text"
            value={websiteId}
            onChange={(e) => setWebsiteId(e.target.value)}
            placeholder="e.g., 72c0e6fc-9c32-46e2-afc1-75bc567959a0"
            className={`mt-1 ${
              websiteId && !isValidUUID(websiteId) ? 'border-red-500 focus:border-red-500' : ''
            }`}
          />
          {websiteId && !isValidUUID(websiteId) && (
            <p className="mt-1 text-xs text-red-500">Please enter a valid UUID format</p>
          )}
          <p className="mt-1 text-xs text-text-secondary">
            Enter the UUID of the website you want to analyze
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate" className="text-sm font-medium text-text-primary">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="text-sm font-medium text-text-primary">
              End Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            'Analyze Website Performance'
          )}
        </Button>
        <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-4 rounded-lg bg-blue-50 p-3">
        <p className="text-xs text-blue-700">
          <strong>💡 Tip:</strong> This analysis will provide insights on your website's search
          performance, top-performing content, and optimization opportunities based on Google Search
          Console data.
        </p>
      </div>
    </div>
  );
}
