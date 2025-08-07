import { memo, Suspense, useMemo, useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { DelayedRender } from '@librechat/client';
import type { TMessage } from 'librechat-data-provider';
import type { TMessageContentProps, TDisplayProps } from '~/common';
import Error from '~/components/Messages/Content/Error';
import Thinking from '~/components/Artifacts/Thinking';
import { useChatContext } from '~/Providers';
import MarkdownLite from './MarkdownLite';
import EditMessage from './EditMessage';
import { useLocalize } from '~/hooks';
import Container from './Container';
import Markdown from './Markdown';
import { cn } from '~/utils';
import store, { ephemeralAgentByConvoId } from '~/store';
import { Constants } from 'librechat-data-provider';
import LaunchGuardianGSCTool from './LaunchGuardianGSCTool';
import { parseAIResponseForGSC, isGSCAnalysisAvailable } from '~/utils/aiGSCDetection';

export const ErrorMessage = ({
  text,
  message,
  className = '',
}: Pick<TDisplayProps, 'text' | 'className'> & {
  message?: TMessage;
}) => {
  const localize = useLocalize();
  if (text === 'Error connecting to server, try refreshing the page.') {
    console.log('error message', message);
    return (
      <Suspense
        fallback={
          <div className="text-message mb-[0.625rem] flex min-h-[20px] flex-col items-start gap-3 overflow-visible">
            <div className="markdown prose dark:prose-invert light w-full break-words dark:text-gray-100">
              <div className="absolute">
                <p className="submitting relative">
                  <span className="result-thinking" />
                </p>
              </div>
            </div>
          </div>
        }
      >
        <DelayedRender delay={5500}>
          <Container message={message}>
            <div
              className={cn(
                'rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-gray-600 dark:text-gray-200',
                className,
              )}
            >
              {localize('com_ui_error_connection')}
            </div>
          </Container>
        </DelayedRender>
      </Suspense>
    );
  }
  return (
    <Container message={message}>
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          'rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-gray-600 dark:text-gray-200',
          className,
        )}
      >
        <Error text={text} />
      </div>
    </Container>
  );
};

const DisplayMessage = ({ text, isCreatedByUser, message, showCursor }: TDisplayProps) => {
  console.log('🟢 DisplayMessage COMPONENT LOADED', {
    messageId: message.messageId,
    isCreatedByUser,
    messageEndpoint: message.endpoint,
    textPreview: text?.substring(0, 200),
    messageContent: message.content,
    messageType: typeof message,
    hasText: !!text,
    textLength: text?.length || 0,
  });

  const { isSubmitting, latestMessage, conversation } = useChatContext();
  const enableUserMsgMarkdown = useRecoilValue(store.enableUserMsgMarkdown);
  const [showGSCTool, setShowGSCTool] = useState(false);
  const [gscRequestContext, setGscRequestContext] = useState<string>();
  const [cleanedText, setCleanedText] = useState(text);

  const conversationKey = conversation?.conversationId ?? Constants.NEW_CONVO;
  const ephemeralAgent = useRecoilValue(ephemeralAgentByConvoId(conversationKey));

  // COMPREHENSIVE DEBUGGING - Track all messages
  console.log('🔍 DisplayMessage: EVERY MESSAGE', {
    messageId: message.messageId,
    isCreatedByUser,
    messageIsCreatedByUser: message.isCreatedByUser,
    textPreview: text?.substring(0, 100),
    textLength: text?.length || 0,
    timestamp: new Date().toISOString(),
    messageType: isCreatedByUser ? 'USER' : 'AI',
  });

  // Special logging for AI messages
  if (!isCreatedByUser && text) {
    console.log('🤖 AI MESSAGE DETECTED IN DISPLAY:', {
      messageId: message.messageId,
      textLength: text.length,
      textPreview: text.substring(0, 200),
      containsTriggerPhrase: text
        .toLowerCase()
        .includes('let me get some details about your website'),
      containsAnalyze: text.toLowerCase().includes('analyze'),
      containsWebsite: text.toLowerCase().includes('website'),
    });
  }

  const showCursorState = useMemo(
    () => showCursor === true && isSubmitting,
    [showCursor, isSubmitting],
  );
  const isLatestMessage = useMemo(
    () => message.messageId === latestMessage?.messageId,
    [message.messageId, latestMessage?.messageId],
  );

  // Check if GSC analysis is available
  const isGSCAvailable = useMemo(() => {
    return isGSCAnalysisAvailable(ephemeralAgent?.mcp || []);
  }, [ephemeralAgent?.mcp]);

  // Simplified AI-driven GSC detection - check all messages
  useEffect(() => {
    console.log('🚨 AI-driven GSC: DETECTION CHECK STARTING', {
      messageId: message.messageId,
      isCreatedByUser,
      hasText: !!text,
      textPreview: text?.substring(0, 200),
      fullText: text,
      isGSCAvailable,
      mcpServers: ephemeralAgent?.mcp,
      messageIsCreatedByUser: message.isCreatedByUser,
      messageEndpoint: message.endpoint,
      textContainsLaunchGuardian: text?.toLowerCase().includes('launch guardian'),
      textContainsGSC: text?.toLowerCase().includes('gsc'),
      textContainsAnalysis: text?.toLowerCase().includes('analysis'),
      textContainsSure: text?.toLowerCase().includes('sure'),
      textContainsTellMe: text?.toLowerCase().includes('tell me'),
      textContainsWebsite: text?.toLowerCase().includes('website'),
    });

    // Only process AI messages with text
    if (isCreatedByUser || !text) {
      console.log('AI-driven GSC: Skipping detection', {
        reason: isCreatedByUser ? 'user message' : 'no text',
        isCreatedByUser,
        hasText: !!text,
      });
      setShowGSCTool(false);
      setCleanedText(text);
      return;
    }

    console.log('🚀 AI-driven GSC: Processing AI message', {
      messageId: message.messageId,
      isCreatedByUser,
      textLength: text.length,
      textPreview: text.substring(0, 200),
    });

    // Check if GSC is available
    if (!isGSCAvailable) {
      console.log('AI-driven GSC: GSC not available', {
        mcpServers: ephemeralAgent?.mcp,
        isGSCAvailable,
      });
      setShowGSCTool(false);
      setCleanedText(text);
      return;
    }

    // Perform GSC detection on AI messages
    console.log('🚀 AI-driven GSC: CALLING parseAIResponseForGSC', {
      textLength: text.length,
      textPreview: text.substring(0, 300),
    });
    const gscDetection = parseAIResponseForGSC(text);
    console.log('📝 AI-driven GSC: parseAIResponseForGSC RETURNED', gscDetection);

    console.log('AI-driven GSC: Detection result', {
      messageId: message.messageId,
      shouldShowTool: gscDetection.shouldShowTool,
      requestContext: gscDetection.requestContext,
      textAnalyzed: text?.substring(0, 200),
    });

    if (gscDetection.shouldShowTool) {
      setShowGSCTool(true);
      setGscRequestContext(gscDetection.requestContext);
      setCleanedText(gscDetection.cleanedResponse || text);

      console.log('AI-driven GSC: Tool triggered by AI response', {
        messageId: message.messageId,
        requestContext: gscDetection.requestContext,
        hasCleanedResponse: !!gscDetection.cleanedResponse,
      });
    } else {
      setShowGSCTool(false);
      setCleanedText(text);
    }
  }, [
    text,
    isCreatedByUser,
    isGSCAvailable,
    message.messageId,
    ephemeralAgent?.mcp,
    message.isCreatedByUser,
  ]);

  // Handle GSC tool closure
  const handleGSCToolClose = () => {
    setShowGSCTool(false);
    setGscRequestContext(undefined);
  };

  let content: React.ReactElement;
  if (!isCreatedByUser) {
    content = <Markdown content={cleanedText} isLatestMessage={isLatestMessage} />;
  } else if (enableUserMsgMarkdown) {
    content = <MarkdownLite content={cleanedText} />;
  } else {
    content = <>{cleanedText}</>;
  }

  return (
    <Container message={message}>
      <div
        className={cn(
          isSubmitting ? 'submitting' : '',
          showCursorState && !!cleanedText.length ? 'result-streaming' : '',
          'markdown prose message-content dark:prose-invert light w-full break-words',
          isCreatedByUser && !enableUserMsgMarkdown && 'whitespace-pre-wrap',
          isCreatedByUser ? 'dark:text-gray-20' : 'dark:text-gray-100',
        )}
      >
        {content}
      </div>

      {/* AI-driven Launch Guardian GSC Tool */}
      {showGSCTool && !isCreatedByUser && (
        <LaunchGuardianGSCTool requestContext={gscRequestContext} onClose={handleGSCToolClose} />
      )}
    </Container>
  );
};

// Unfinished Message Component
export const UnfinishedMessage = ({ message }: { message: TMessage }) => (
  <ErrorMessage
    message={message}
    text="The response is incomplete; it's either still processing, was cancelled, or censored. Refresh or try a different prompt."
  />
);

const MessageContent = ({
  text,
  edit,
  error,
  unfinished,
  isSubmitting,
  isLast,
  ...props
}: TMessageContentProps) => {
  const { message } = props;
  const { messageId } = message;

  const { thinkingContent, regularContent } = useMemo(() => {
    const thinkingMatch = text.match(/:::thinking([\s\S]*?):::/);
    return {
      thinkingContent: thinkingMatch ? thinkingMatch[1].trim() : '',
      regularContent: thinkingMatch ? text.replace(/:::thinking[\s\S]*?:::/, '').trim() : text,
    };
  }, [text]);

  const showRegularCursor = useMemo(() => isLast && isSubmitting, [isLast, isSubmitting]);

  const unfinishedMessage = useMemo(
    () =>
      !isSubmitting && unfinished ? (
        <Suspense>
          <DelayedRender delay={250}>
            <UnfinishedMessage message={message} />
          </DelayedRender>
        </Suspense>
      ) : null,
    [isSubmitting, unfinished, message],
  );

  if (error) {
    return <ErrorMessage message={props.message} text={text} />;
  } else if (edit) {
    return <EditMessage text={text} isSubmitting={isSubmitting} {...props} />;
  }

  return (
    <>
      {thinkingContent.length > 0 && (
        <Thinking key={`thinking-${messageId}`}>{thinkingContent}</Thinking>
      )}
      <DisplayMessage
        key={`display-${messageId}`}
        showCursor={showRegularCursor}
        text={regularContent}
        {...props}
      />
      {unfinishedMessage}
    </>
  );
};

export default memo(MessageContent);
