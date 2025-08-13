import React, { memo, useCallback } from 'react';
import { Button } from '@librechat/client';
import { useMCPSelect } from '~/hooks/Plugins/useMCPSelect';
import { useChatContext } from '~/Providers';
import { useCrawlFormContext } from '../CrawlFormContext';

function LGWebsiteCrawlButton() {
  const { conversation } = useChatContext();
  const { mcpValues } = useMCPSelect({ conversationId: conversation?.conversationId });
  const { handleToggleCrawlForm } = useCrawlFormContext();

  // Check if neo4j_server is selected
  const isNeo4jServerSelected = mcpValues?.includes('neo4j_server') || false;

  // Handler for opening the form
  const handleRunLGOldWebsiteCrawl = useCallback(() => {
    handleToggleCrawlForm();
  }, [handleToggleCrawlForm]);

  if (!isNeo4jServerSelected) {
    return null;
  }

  return (
    <div className="flex justify-start mb-2 ml-2">
      <Button
        onClick={handleRunLGOldWebsiteCrawl}
        className="px-4 py-2 text-sm font-medium transition-colors duration-200 border rounded-lg shadow-sm border-border-medium bg-surface-secondary text-text-primary hover:bg-surface-hover hover:shadow-md"
      >
        Run LG Old Website Crawl
      </Button>
    </div>
  );
}

export default memo(LGWebsiteCrawlButton);
