/**
 * AI-Driven Launch Guardian GSC Detection Utilities
 *
 * This module provides utilities for detecting when the AI wants to invoke
 * the Launch Guardian GSC analysis tool based on natural conversation flow.
 */

export interface GSCToolRequest {
  shouldShowTool: boolean;
  requestContext?: string;
  cleanedResponse?: string;
}

/**
 * Special markers that the AI can include in its responses to trigger the GSC tool.
 * These are designed to be natural and contextual, not rigid keywords.
 */
const GSC_TOOL_MARKERS = [
  '[[LAUNCH_GUARDIAN_GSC]]',
  '[[GSC_ANALYSIS_NEEDED]]',
  '[[WEBSITE_DATA_REQUEST]]',
] as const;

/**
 * Contextual phrases that indicate the AI wants to request website analysis data.
 * These are more natural and flexible than rigid regex patterns.
 */
const GSC_CONTEXT_INDICATORS = [
  'let me get some details about your website',
  'i need some information about your website',
  'to analyze your website performance',
  'let me gather some website data',
  "i'll need your website details",
  'to provide website analysis',
  'for google search console analysis',
  'to analyze your gsc data',
  'launch guardian analysis',
  'which website (domain or url) in launch guardian',
  'which website would you like me to analyze',
  "in launch guardian's gsc data",
  'launch guardian gsc data',
  'website in launch guardian',
  'analyze a website in launch guardian',
  'launch guardian website analysis',
  'launch guardian currently contains google search console data',
  'launch guardian currently contains',
  'google search console data for the following sites',
  'for the following sites:',
  'inboundfound.com',
  'ultravioletagency.com',
  'contains google search console data',
  'following sites:',
  'to get started i need a little more detail',
  'which website (domain / property) do you want to analyze',
  'which website (domain / gsc property) do you want to analyze',
  'which website (domain or gsc property)',
  'which website (domain/gsc property)',
  'which specific launch guardian gsc property',
  'what gsc information would be most helpful',
  'overall search performance',
  'top queries or pages',
  'device or country breakdowns',
  'year-over-year comparisons',
  'to perform a launch guardian google search console',
  'launch guardian can hold data for many google search console',
  'launch guardian has data for multiple sites',
  'to get started i need to know which property',
  "which property you'd like to analyze",
  'for example: "example.com" or "www.example.org"',
  "i'll need two quick details before i run an analysis",
  'what kind of analysis are you after',
  'to perform a launch guardian google search console (gsc) analysis',
  'launch guardian google search console (gsc) analysis',
  "website (domain or property) you'd like analyzed",
  'time-frame (e.g., last 3 months',
  'focus areas—impressions, clicks, average position',
  'any specific comparison',
  'let me know, and i can run the appropriate queries',
  'before we dive into an analysis, please tell me which site',
  'please tell me which site you have in mind',
  'which site you have in mind',
  'before we dive into an analysis',
  'tell me which site you have in mind',
  'which site do you have in mind',
  'i can help you analyze your website',
  'google search console data in launch guardian',
  "launch guardian's gsc dataset tracks each site",
  'tracks each site by a website_id',
  'here are the 10 largest sites in the graph',
  'largest sites in the graph',
] as const;

/**
 * Parse an AI response to detect if it wants to invoke the Launch Guardian GSC tool.
 * This uses both explicit markers and contextual analysis.
 */
export function parseAIResponseForGSC(aiResponse: string): GSCToolRequest {
  if (!aiResponse || typeof aiResponse !== 'string') {
    console.log('AI-driven GSC: Invalid response', { aiResponse, type: typeof aiResponse });
    return { shouldShowTool: false };
  }

  const response = aiResponse.toLowerCase();

  console.log('🔍 parseAIResponseForGSC: Processing response', {
    responseLength: response.length,
    responsePreview: response.substring(0, 200),
    fullResponse: aiResponse.substring(0, 500),
  });

  // Test specific phrases we expect
  const testPhrases = [
    'launch guardian currently contains',
    'launch guardian can hold data',
    'google search console data',
    'google search console (gsc)',
    'following sites:',
    'which website (domain',
    'gsc property',
    'inboundfound.com',
    'ultravioletagency.com',
    'two quick details before',
    'run an analysis',
    'has data for multiple sites',
    "which property you'd like to analyze",
    'for example:',
    'www.example.org',
  ];

  console.log('🔍 parseAIResponseForGSC: Testing phrases...');
  testPhrases.forEach((phrase) => {
    if (response.includes(phrase)) {
      console.log(`🎯 parseAIResponseForGSC: FOUND TEST PHRASE: "${phrase}"`);
    }
  });

  console.log('AI-driven GSC: Parsing response', {
    originalResponse: aiResponse.substring(0, 300),
    lowercaseResponse: response.substring(0, 300),
  });

  // Check for explicit markers first
  const hasExplicitMarker = GSC_TOOL_MARKERS.some((marker) => {
    const found = aiResponse.includes(marker);
    if (found) {
      console.log('AI-driven GSC: Found explicit marker', { marker });
    }
    return found;
  });

  if (hasExplicitMarker) {
    // Extract context from the response
    const requestContext = extractContextFromResponse(aiResponse);

    // Clean the response by removing markers
    const cleanedResponse = GSC_TOOL_MARKERS.reduce(
      (cleaned, marker) => cleaned.replace(new RegExp(marker, 'gi'), ''),
      aiResponse,
    ).trim();

    console.log('AI-driven GSC: Explicit marker detected', {
      requestContext,
      hasCleanedResponse: !!cleanedResponse,
    });
    return {
      shouldShowTool: true,
      requestContext,
      cleanedResponse,
    };
  }

  // Check for contextual indicators
  const matchedIndicators = GSC_CONTEXT_INDICATORS.filter((indicator) => {
    const found = response.includes(indicator);
    console.log('AI-driven GSC: Checking indicator', {
      indicator,
      found,
      responseIncludes: response.includes(indicator),
    });
    return found;
  });

  console.log('AI-driven GSC: Contextual check results', {
    totalIndicators: GSC_CONTEXT_INDICATORS.length,
    matchedCount: matchedIndicators.length,
    matchedIndicators,
  });

  if (matchedIndicators.length > 0) {
    const requestContext = extractContextFromResponse(aiResponse);

    console.log('AI-driven GSC: Contextual indicator detected', {
      matchedIndicators,
      requestContext,
    });
    return {
      shouldShowTool: true,
      requestContext,
      cleanedResponse: aiResponse,
    };
  }

  console.log('AI-driven GSC: No indicators matched');
  return { shouldShowTool: false };
}

/**
 * Extract meaningful context from the AI response to show in the GSC tool.
 */
function extractContextFromResponse(response: string): string {
  // Try to extract a meaningful sentence or phrase that describes the request
  const sentences = response
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Look for sentences that contain website-related terms
  const websiteRelatedSentence = sentences.find((sentence) => {
    const lower = sentence.toLowerCase();
    return (
      lower.includes('website') ||
      lower.includes('analyze') ||
      lower.includes('performance') ||
      lower.includes('optimization') ||
      lower.includes('traffic') ||
      lower.includes('seo')
    );
  });

  if (websiteRelatedSentence) {
    return websiteRelatedSentence.length > 100
      ? websiteRelatedSentence.substring(0, 100) + '...'
      : websiteRelatedSentence;
  }

  // Fallback to first meaningful sentence
  const firstSentence = sentences[0];
  if (firstSentence && firstSentence.length > 10) {
    return firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence;
  }

  return 'Website optimization analysis request';
}

/**
 * Check if neo4j_server MCP is available in the current context.
 * This is used to determine if GSC analysis is possible.
 */
export function isGSCAnalysisAvailable(mcpServers: any[]): boolean {
  console.log('🔍 isGSCAnalysisAvailable: Checking MCP servers', {
    mcpServers,
    isArray: Array.isArray(mcpServers),
    length: mcpServers?.length,
  });

  if (!Array.isArray(mcpServers)) {
    console.log('❌ isGSCAnalysisAvailable: mcpServers is not an array');
    return false;
  }

  const hasNeo4j = mcpServers.some((server: any) => {
    const isNeo4j =
      server === 'neo4j_server' ||
      server?.name === 'neo4j_server' ||
      server?.mcp_id === 'neo4j_server';

    console.log('🔍 isGSCAnalysisAvailable: Checking server', {
      server,
      serverType: typeof server,
      serverName: server?.name,
      serverMcpId: server?.mcp_id,
      isNeo4j,
    });

    return isNeo4j;
  });

  console.log('🎯 isGSCAnalysisAvailable: Final result', { hasNeo4j });
  return hasNeo4j;
}

/**
 * Generate a natural AI prompt that encourages the AI to use GSC analysis when appropriate.
 * This can be included in system prompts or context.
 */
export function getGSCAnalysisPrompt(): string {
  return `
When users ask about website optimization, analysis, performance, SEO, traffic analysis, or lead generation, 
you can offer to analyze their website's Google Search Console data using Launch Guardian.

To request website analysis data from the user, include the phrase "let me get some details about your website" 
or similar natural language in your response. You can also use the marker [[LAUNCH_GUARDIAN_GSC]] if you want 
to explicitly trigger the analysis form.

The Launch Guardian GSC analysis can provide insights on:
- Most trafficked pages and topics
- Search term performance and keyword rankings
- Traffic patterns and trends
- Click-through rates and impressions
- Lead generation optimization opportunities

Only suggest this when the neo4j_server MCP is available and the user's request would benefit from actual 
website performance data analysis.
  `.trim();
}
