import { atom } from 'recoil';

interface CrawlFormState {
  isVisible: boolean;
  isSubmitted: boolean;
  messageId?: string;
  conversationId?: string;
  formData?: {
    website: string;
    launchDate: string;
    description: string;
  };
  submittedData?: {
    website: string;
    launchDate: string;
    description: string;
    websiteLabel?: string;
  };
}

// Store submitted forms by their unique identifier (message content hash)
export const submittedFormsState = atom<Record<string, {
  isSubmitted: boolean;
  submittedData?: {
    website: string;
    launchDate: string;
    description: string;
    websiteLabel?: string;
  };
}>>({
  key: 'submittedFormsState',
  default: {},
});

export const crawlFormState = atom<CrawlFormState>({
  key: 'crawlFormState',
  default: {
    isVisible: false,
    isSubmitted: false,
  },
});

// Store chat blocking state by conversation ID
export const isChatBlockedState = atom<Record<string, boolean>>({
  key: 'isChatBlockedState',
  default: {},
});