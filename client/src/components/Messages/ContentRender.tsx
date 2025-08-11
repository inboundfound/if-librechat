import { useRecoilValue } from 'recoil';
import { useCallback, useMemo, memo, useState, useEffect } from 'react';
import type { TMessage, TMessageContentParts } from 'librechat-data-provider';
import type { TMessageProps, TMessageIcon } from '~/common';
import ContentParts from '~/components/Chat/Messages/Content/ContentParts';
import PlaceholderRow from '~/components/Chat/Messages/ui/PlaceholderRow';
import SiblingSwitch from '~/components/Chat/Messages/SiblingSwitch';
import HoverButtons from '~/components/Chat/Messages/HoverButtons';
import MessageIcon from '~/components/Chat/Messages/MessageIcon';
import { useAttachments, useMessageActions } from '~/hooks';
import SubRow from '~/components/Chat/Messages/SubRow';
import { cn, logger } from '~/utils';
import store from '~/store';
import { parseAIResponseForGSC } from '~/utils/aiGSCDetection';
import LaunchGuardianGSCTool from '~/components/Chat/Messages/Content/LaunchGuardianGSCTool';
import useLaunchGuardianGSC from '~/hooks/useLaunchGuardianGSC';

type ContentRenderProps = {
  message?: TMessage;
  isCard?: boolean;
  isMultiMessage?: boolean;
  isSubmittingFamily?: boolean;
} & Pick<
  TMessageProps,
  'currentEditId' | 'setCurrentEditId' | 'siblingIdx' | 'setSiblingIdx' | 'siblingCount'
>;

const ContentRender = memo(
  ({
    message: msg,
    isCard = false,
    siblingIdx,
    siblingCount,
    setSiblingIdx,
    currentEditId,
    isMultiMessage = false,
    setCurrentEditId,
    isSubmittingFamily = false,
  }: ContentRenderProps) => {
    const { attachments, searchResults } = useAttachments({
      messageId: msg?.messageId,
      attachments: msg?.attachments,
    });
    const {
      edit,
      index,
      agent,
      assistant,
      enterEdit,
      conversation,
      messageLabel,
      isSubmitting,
      latestMessage,
      handleContinue,
      copyToClipboard,
      setLatestMessage,
      regenerateMessage,
      handleFeedback,
    } = useMessageActions({
      message: msg,
      searchResults,
      currentEditId,
      isMultiMessage,
      setCurrentEditId,
    });
    const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
    const fontSize = useRecoilValue(store.fontSize);

    // AI-driven GSC detection state
    const [showGSCTool, setShowGSCTool] = useState(false);
    const [gscRequestContext, setGscRequestContext] = useState('');
    const [_cleanedText, setCleanedText] = useState('');
    const { triggerGSCForm } = useLaunchGuardianGSC();

    // Extract text content from message (AI messages use content array, user messages use text)
    const extractMessageText = useCallback((message: TMessage | undefined): string => {
      if (!message) return '';

      // Try text property first (user messages)
      if (message.text) {
        return message.text;
      }

      // Try content array (AI messages)
      if (Array.isArray(message.content)) {
        return message.content
          .map((part: any) => {
            if (typeof part === 'string') return part;
            if (part?.text) return part.text;
            if (part?.content) return part.content;
            return '';
          })
          .join(' ')
          .trim();
      }

      // Try content as string
      if (typeof message.content === 'string') {
        return message.content;
      }

      return '';
    }, []);

    const messageText = extractMessageText(msg);

    // Debug: Log ContentRender processing
    console.log('🟠 ContentRender PROCESSING MESSAGE', {
      messageId: msg?.messageId,
      isCreatedByUser: msg?.isCreatedByUser,
      endpoint: msg?.endpoint,
      textPreview: messageText.substring(0, 200),
      hasText: !!messageText,
      textLength: messageText.length,
      messageType: msg?.isCreatedByUser ? 'USER' : 'AI',
      isCard,
      isMultiMessage,
      rawText: msg?.text,
      rawContent: Array.isArray(msg?.content)
        ? msg?.content.length + ' parts'
        : typeof msg?.content,
      timestamp: new Date().toISOString(),
    });

    // Debug: Log extracted message text details
    console.log('🟠 ContentRender TEXT EXTRACTION DEBUG', {
      messageId: msg?.messageId,
      extractedText: messageText,
      extractedTextLength: messageText.length,
      hasExtractedText: !!messageText,
      messageHasText: !!msg?.text,
      messageHasContent: !!msg?.content,
      contentType: typeof msg?.content,
      contentIsArray: Array.isArray(msg?.content),
      contentLength: Array.isArray(msg?.content) ? msg?.content.length : 'N/A',
    });

    // AI-driven GSC detection logic
    useEffect(() => {
      console.log('🚨🚨🚨 ContentRender GSC DETECTION USEEFFECT TRIGGERED 🚨🚨🚨', {
        messageId: msg?.messageId,
        messageTextLength: messageText.length,
        isCreatedByUser: msg?.isCreatedByUser,
        triggerGSCFormExists: !!triggerGSCForm,
        extractMessageTextExists: !!extractMessageText,
        messageTextPreview: messageText.substring(0, 100),
        componentName: 'ContentRender',
        timestamp: new Date().toISOString(),
      });

      const text = messageText;

      console.log('🟠 ContentRender GSC DETECTION', {
        messageId: msg?.messageId,
        isCreatedByUser: msg?.isCreatedByUser,
        messageType: msg?.isCreatedByUser ? 'USER' : 'AI',
        textPreview: text.substring(0, 200),
        textLength: text.length,
        hasText: !!text,
        timestamp: new Date().toISOString(),
      });

      // Only process AI messages
      if (msg?.isCreatedByUser || !text) {
        console.log('🟠 ContentRender: Skipping GSC detection (user message or no text)');
        setShowGSCTool(false);
        setCleanedText(text);
        return;
      }

      console.log('🟠 ContentRender: Processing AI message for GSC detection');

      // Parse AI response for GSC detection
      console.log('🟠 ContentRender: CALLING parseAIResponseForGSC with text:', {
        textLength: text.length,
        textPreview: text.substring(0, 300),
        fullText: text,
      });
      const gscDetection = parseAIResponseForGSC(text);

      console.log('🟠 ContentRender GSC DETECTION RESULT', {
        shouldShowTool: gscDetection.shouldShowTool,
        requestContext: gscDetection.requestContext,
        cleanedResponse: gscDetection.cleanedResponse?.substring(0, 200),
        messageId: msg?.messageId,
        detectionDetails: gscDetection,
      });

      if (gscDetection.shouldShowTool) {
        console.log('🟠 ContentRender: TRIGGERING GSC TOOL!');
        setShowGSCTool(true);
        setGscRequestContext(gscDetection.requestContext || '');
        triggerGSCForm();
      } else {
        setShowGSCTool(false);
      }

      setCleanedText(gscDetection.cleanedResponse || text);
    }, [messageText, msg?.isCreatedByUser, msg?.messageId, triggerGSCForm, extractMessageText]);

    const handleRegenerateMessage = useCallback(() => regenerateMessage(), [regenerateMessage]);
    const isLast = useMemo(
      () =>
        !(msg?.children?.length ?? 0) && (msg?.depth === latestMessage?.depth || msg?.depth === -1),
      [msg?.children, msg?.depth, latestMessage?.depth],
    );
    const isLatestMessage = msg?.messageId === latestMessage?.messageId;
    const showCardRender = isLast && !isSubmittingFamily && isCard;
    const isLatestCard = isCard && !isSubmittingFamily && isLatestMessage;

    const iconData: TMessageIcon = useMemo(
      () => ({
        endpoint: msg?.endpoint ?? conversation?.endpoint,
        model: msg?.model ?? conversation?.model,
        iconURL: msg?.iconURL,
        modelLabel: messageLabel,
        isCreatedByUser: msg?.isCreatedByUser,
      }),
      [
        messageLabel,
        conversation?.endpoint,
        conversation?.model,
        msg?.model,
        msg?.iconURL,
        msg?.endpoint,
        msg?.isCreatedByUser,
      ],
    );

    const clickHandler = useMemo(
      () =>
        showCardRender && !isLatestMessage
          ? () => {
              logger.log(`Message Card click: Setting ${msg?.messageId} as latest message`);
              logger.dir(msg);
              setLatestMessage(msg!);
            }
          : undefined,
      [showCardRender, isLatestMessage, msg, setLatestMessage],
    );

    if (!msg) {
      return null;
    }

    const baseClasses = {
      common: 'group mx-auto flex flex-1 gap-3 transition-all duration-300 transform-gpu ',
      card: 'relative w-full gap-1 rounded-lg border border-border-medium bg-surface-primary-alt p-2 md:w-1/2 md:gap-3 md:p-4',
      chat: maximizeChatSpace
        ? 'w-full max-w-full md:px-5 lg:px-1 xl:px-5'
        : 'md:max-w-[47rem] xl:max-w-[55rem]',
    };

    const conditionalClasses = {
      latestCard: isLatestCard ? 'bg-surface-secondary' : '',
      cardRender: showCardRender ? 'cursor-pointer transition-colors duration-300' : '',
      focus: 'focus:outline-none focus:ring-2 focus:ring-border-xheavy',
    };

    return (
      <div
        id={msg.messageId}
        aria-label={`message-${msg.depth}-${msg.messageId}`}
        className={cn(
          baseClasses.common,
          isCard ? baseClasses.card : baseClasses.chat,
          conditionalClasses.latestCard,
          conditionalClasses.cardRender,
          conditionalClasses.focus,
          'message-render',
        )}
        onClick={clickHandler}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && clickHandler) {
            clickHandler();
          }
        }}
        role={showCardRender ? 'button' : undefined}
        tabIndex={showCardRender ? 0 : undefined}
      >
        {isLatestCard && (
          <div className="absolute right-0 top-0 m-2 h-3 w-3 rounded-full bg-text-primary" />
        )}

        <div className="relative flex flex-shrink-0 flex-col items-center">
          <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
            <MessageIcon iconData={iconData} assistant={assistant} agent={agent} />
          </div>
        </div>

        <div
          className={cn(
            'relative flex w-11/12 flex-col',
            msg.isCreatedByUser ? 'user-turn' : 'agent-turn',
          )}
        >
          <h2 className={cn('select-none font-semibold', fontSize)}>{messageLabel}</h2>

          <div className="flex flex-col gap-1">
            <div className="flex max-w-full flex-grow flex-col gap-0">
              <ContentParts
                edit={edit}
                isLast={isLast}
                enterEdit={enterEdit}
                siblingIdx={siblingIdx}
                messageId={msg.messageId}
                attachments={attachments}
                isSubmitting={isSubmitting}
                searchResults={searchResults}
                setSiblingIdx={setSiblingIdx}
                isCreatedByUser={msg.isCreatedByUser}
                conversationId={conversation?.conversationId}
                content={msg.content as Array<TMessageContentParts | undefined>}
              />

              {/* AI-driven Launch Guardian GSC Tool */}
              {showGSCTool && !msg.isCreatedByUser && (
                <div className="mt-4">
                  <LaunchGuardianGSCTool
                    requestContext={gscRequestContext}
                    onClose={() => {
                      console.log('🟠 ContentRender: GSC Tool closed');
                      setShowGSCTool(false);
                    }}
                  />
                </div>
              )}
            </div>

            {(isSubmittingFamily || isSubmitting) && !(msg.children?.length ?? 0) ? (
              <PlaceholderRow isCard={isCard} />
            ) : (
              <SubRow classes="text-xs">
                <SiblingSwitch
                  siblingIdx={siblingIdx}
                  siblingCount={siblingCount}
                  setSiblingIdx={setSiblingIdx}
                />
                <HoverButtons
                  index={index}
                  isEditing={edit}
                  message={msg}
                  enterEdit={enterEdit}
                  isSubmitting={isSubmitting}
                  conversation={conversation ?? null}
                  regenerate={handleRegenerateMessage}
                  copyToClipboard={copyToClipboard}
                  handleContinue={handleContinue}
                  latestMessage={latestMessage}
                  handleFeedback={handleFeedback}
                  isLast={isLast}
                />
              </SubRow>
            )}
          </div>

          {/* AI-driven Launch Guardian GSC Tool - REMOVED DUPLICATE */}
          {/* Duplicate GSC form removed - already rendered above in the main content area */}
        </div>
      </div>
    );
  },
);

export default ContentRender;
