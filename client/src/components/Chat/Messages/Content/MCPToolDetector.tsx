import React, { useEffect, useMemo } from 'react';
import { Constants } from 'librechat-data-provider';
import { useMessageContext } from '~/Providers';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { crawlFormState, isChatBlockedState, submittedFormsState } from '~/store/crawlForm';
import { useSubmitMessage } from '~/hooks';
import CrawlForm from './CrawlForm';

interface MCPToolDetectorProps {
  toolCall: any; // Tool call data
  output?: string | null;
}

// Configuration for MCP tools that should trigger specific behaviors
const MCP_TOOL_CONFIGS = {
  'render_crawl_form': {
    triggerForm: true,
    formType: 'crawl',
    extractOptions: (output: string) => {
      try {
        // Parse the websites string format: "url1|id1,url2|id2,..."
        // Capture everything after "websites::" until the end of the string
        const websitesMatch = output.match(/websites::(.+)/);
        if (!websitesMatch) {
          console.log('No websites found in output');
          return [];
        }

        const websitesString = websitesMatch[1];
        console.log('Raw websites string:', websitesString);
        console.log('Full output for debugging:', output);
        
        const websitePairs = websitesString.split(',');
        console.log('Website pairs:', websitePairs);
        console.log('Number of pairs found:', websitePairs.length);
        
        const options = websitePairs.map(pair => {
          const [url, id] = pair.split('|');
          if (!url || !id) {
            console.log('Invalid pair:', pair);
            return null;
          }
          
          // Extract domain name from URL for display
          let label = url;
          try {
            const domain = new URL(url).hostname.replace('www.', '');
            label = domain;
          } catch (e) {
            // If URL parsing fails, use the URL as is
            label = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
          }
          
          return {
            label: label,
            value: url,
            id: id
          };
        }).filter(Boolean);

        console.log('Extracted website options:', options);
        return options;
      } catch (e) {
        console.error('Failed to parse website options:', e);
        return [];
      }
    }
  },
  // Add more MCP tool configurations here
  // 'another_tool': {
  //   triggerForm: true,
  //   formType: 'custom',
  //   // ... other config
  // }
};

export const MCPToolDetector: React.FC<MCPToolDetectorProps> = ({ toolCall, output }) => {
  const { messageId, conversationId } = useMessageContext();
  const [submittedForms, setSubmittedForms] = useRecoilState(submittedFormsState);
  const setChatBlocked = useSetRecoilState(isChatBlockedState);
  const { submitMessage } = useSubmitMessage();

  // Parse MCP tool name and server
  const { function_name, serverName, isMCPToolCall } = useMemo(() => {
    if (!toolCall?.name || typeof toolCall.name !== 'string') {
      return { function_name: '', serverName: '', isMCPToolCall: false };
    }

    if (toolCall.name.includes(Constants.mcp_delimiter)) {
      const [func, server] = toolCall.name.split(Constants.mcp_delimiter);
      return {
        function_name: func || '',
        serverName: server || '',
        isMCPToolCall: true,
      };
    }

    return { function_name: toolCall.name, serverName: '', isMCPToolCall: false };
  }, [toolCall?.name]);

  // Check if this is a configured MCP tool
  const toolConfig = useMemo(() => {
    if (!isMCPToolCall || !function_name) return null;
    return MCP_TOOL_CONFIGS[function_name as keyof typeof MCP_TOOL_CONFIGS] || null;
  }, [isMCPToolCall, function_name]);

  // Extract request ID from tool output
  const requestId = useMemo(() => {
    if (!output) return null;
    const requestMatch = output.match(/request_id::([a-f0-9-]+)/);
    return requestMatch ? requestMatch[1] : null;
  }, [output]);

  // Create unique form identifier using request ID if available
  const formId = useMemo(() => {
    if (requestId) {
      return `${conversationId || 'no-conv'}-${requestId}`;
    }
    // Fallback to message-based ID if no request ID
    return `${conversationId || 'no-conv'}-${messageId || 'no-msg'}-${function_name}`;
  }, [conversationId, messageId, function_name, requestId]);

  // Get form state
  const thisFormState = useMemo(() => {
    return submittedForms[formId] || { isSubmitted: false };
  }, [submittedForms, formId]);

  useEffect(() => {
    if (!toolConfig || !toolConfig.triggerForm || !output) {
      return;
    }

    console.log('🔍 MCP Tool Detector: Processing tool call', {
      function_name,
      serverName,
      requestId,
      formId,
      hasOutput: !!output,
      outputPreview: output.substring(0, 200),
    });

    // Extract options if available
    let options: any[] = [];
    if (toolConfig.extractOptions) {
      options = toolConfig.extractOptions(output);
      console.log('📋 MCP Tool Detector: Extracted options', {
        function_name,
        optionsCount: options.length,
        options,
      });
    }

    // If we have options, trigger the form
    if (options.length > 0) {
      console.log('✅ MCP Tool Detector: Options found, triggering form', {
        function_name,
        requestId,
        formId,
        optionsCount: options.length,
      });

      // Set chat as blocked for this specific conversation
      setChatBlocked(prev => ({
        ...prev,
        [conversationId || 'no-conv']: true
      }));

      // Store form data in state
      setSubmittedForms(prev => ({
        ...prev,
        [formId]: {
          isSubmitted: false,
          toolName: function_name,
          serverName,
          requestId,
          options,
          output,
          formType: toolConfig.formType,
        },
      }));

      console.log('🎯 MCP Tool Detector: Form triggered', {
        formId,
        function_name,
        requestId,
        formType: toolConfig.formType,
        optionsCount: options.length,
      });
    }
  }, [toolConfig, output, function_name, serverName, formId, setChatBlocked, setSubmittedForms]);

  // Cleanup: unblock chat when component unmounts or conversation changes
  useEffect(() => {
    return () => {
      // Only unblock if this component was the one that blocked it
      if (toolConfig && thisFormState && !thisFormState.isSubmitted) {
        setChatBlocked(prev => ({
          ...prev,
          [conversationId || 'no-conv']: false
        }));
      }
    };
  }, [conversationId, toolConfig, thisFormState, setChatBlocked]);

  // Handle form submission
  const handleFormSubmit = React.useCallback(async (data: any) => {
    console.log('📤 MCP Tool Detector: Form submitted', {
      formId,
      function_name,
      requestId,
      data,
    });

    // Update form state
    setSubmittedForms(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        isSubmitted: true,
        submittedData: data,
      },
    }));

    // Submit to chat
    const message = `I have submitted the ${toolConfig?.formType || 'form'} with the following configuration:\n\n🌐 **Website:** ${data.website}\n📅 **Launch Date:** ${new Date(data.launchDate).toLocaleString()}\n📝 **Description:** ${data.description}\n\nPlease proceed based on these details.`;
    
    await submitMessage({ text: message });
    setChatBlocked(prev => ({
      ...prev,
      [conversationId || 'no-conv']: false
    }));
  }, [formId, function_name, toolConfig?.formType, setSubmittedForms, submitMessage, setChatBlocked]);

  // Handle form cancellation
  const handleFormCancel = React.useCallback(async () => {
    console.log('❌ MCP Tool Detector: Form cancelled', {
      formId,
      function_name,
      requestId,
    });

    await submitMessage({ text: "I decided not to submit the form at this time. Let's continue our conversation." });
    setChatBlocked(prev => ({
      ...prev,
      [conversationId || 'no-conv']: false
    }));
  }, [formId, function_name, submitMessage, setChatBlocked]);

  // If no tool config or already submitted, don't render anything
  if (!toolConfig || thisFormState.isSubmitted) {
    return null;
  }

  // Render the appropriate form based on form type
  if (toolConfig.formType === 'crawl') {
    return (
      <div className="my-4 rounded-xl border border-orange-400 bg-orange-50 dark:bg-orange-900/20 p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
            Chat is disabled - Please complete the form below
          </span>
        </div>
        
        <CrawlForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          websiteOptions={(thisFormState as any).options || []}
        />
      </div>
    );
  }

  return null;
};

export default MCPToolDetector; 