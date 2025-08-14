import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { CrawlFormData } from './Input/CrawlOldWebsiteForm';

interface CrawlFormContextType {
  isCrawlFormVisible: boolean;
  handleToggleCrawlForm: () => void;
  handleCloseCrawlForm: () => void;
  handleSubmitCrawl: (formData: CrawlFormData) => void;
}

const CrawlFormContext = createContext<CrawlFormContextType | undefined>(undefined);

export const useCrawlFormContext = () => {
  const context = useContext(CrawlFormContext);
  if (context === undefined) {
    throw new Error('useCrawlFormContext must be used within a CrawlFormProvider');
  }
  return context;
};

interface CrawlFormProviderProps {
  children: ReactNode;
}

export const CrawlFormProvider: React.FC<CrawlFormProviderProps> = ({ children }) => {
  const [isCrawlFormVisible, setIsCrawlFormVisible] = useState(false);

  const handleToggleCrawlForm = useCallback(() => {
    setIsCrawlFormVisible((prev) => !prev);
  }, []);

  const handleCloseCrawlForm = useCallback(() => {
    setIsCrawlFormVisible(false);
  }, []);

  const handleSubmitCrawl = useCallback((formData: CrawlFormData) => {
    console.log('Submitting crawl form:', formData);
    // TODO: Implement actual crawl logic
    setIsCrawlFormVisible(false); // Close form after submission
  }, []);

  const value: CrawlFormContextType = {
    isCrawlFormVisible,
    handleToggleCrawlForm,
    handleCloseCrawlForm,
    handleSubmitCrawl,
  };

  return <CrawlFormContext.Provider value={value}>{children}</CrawlFormContext.Provider>;
};
