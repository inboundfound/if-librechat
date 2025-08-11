import React, { useMemo, useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import type { TMessageContentParts } from 'librechat-data-provider';
import type { TMessageProps, TMessageIcon } from '~/common';
import { useMessageHelpers, useLocalize, useAttachments, useMessageActions } from '~/hooks';
import MessageIcon from '~/components/Chat/Messages/MessageIcon';
import ContentParts from './Content/ContentParts';
import SiblingSwitch from './SiblingSwitch';
import MultiMessage from './MultiMessage';
import HoverButtons from './HoverButtons';
import SubRow from './SubRow';
import { cn } from '~/utils';
import store from '~/store';
import { parseAIResponseForGSC, isGSCAnalysisAvailable } from '~/utils/aiGSCDetection';
import LaunchGuardianGSCTool from './Content/LaunchGuardianGSCTool';
import { ephemeralAgentByConvoId } from '~/store/agents';

export default function Message(props: TMessageProps) {
  const localize = useLocalize();
  const { message, siblingIdx, siblingCount, setSiblingIdx, currentEditId, setCurrentEditId } =
    props;

  // Debug: Log when MessageParts component loads
  console.log('🔵 MessageParts COMPONENT LOADED', {
    messageId: message?.messageId,
    isCreatedByUser: message?.isCreatedByUser,
    endpoint: message?.endpoint,
    textPreview: message?.text?.substring(0, 200),
    messageContent: message?.content,
    timestamp: new Date().toISOString(),
  });
  const { attachments, searchResults } = useAttachments({
    messageId: message?.messageId,
    attachments: message?.attachments,
  });
  const {
    edit,
    index,
    agent,
    isLast,
    enterEdit,
    assistant,
    handleScroll,
    conversation,
    isSubmitting,
    latestMessage,
    handleContinue,
    copyToClipboard,
    regenerateMessage,
  } = useMessageHelpers(props);

  const { handleFeedback } = useMessageActions({
    message,
    currentEditId,
    setCurrentEditId,
  });

  const fontSize = useRecoilValue(store.fontSize);
  const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
  const { children, messageId = null, isCreatedByUser } = message ?? {};

  // GSC Detection State
  const [showGSCTool, setShowGSCTool] = useState(false);
  const [gscRequestContext, setGscRequestContext] = useState<string>();
  const conversationKey = conversation?.conversationId ?? 'new';
  const ephemeralAgent = useRecoilValue(ephemeralAgentByConvoId(conversationKey));

  // Check if GSC is available
  const isGSCAvailable = useMemo(() => {
    const available = isGSCAnalysisAvailable(ephemeralAgent?.mcp || []);
    console.log('🔍 MessageParts: GSC Availability Check', {
      available,
      mcpServers: ephemeralAgent?.mcp,
      mcpCount: ephemeralAgent?.mcp?.length || 0,
      conversationKey,
    });
    return available;
  }, [ephemeralAgent?.mcp, conversationKey]);

  // AI-driven GSC detection for AI messages
  useEffect(() => {
    if (!message) {
      setShowGSCTool(false);
      return;
    }

    console.log('🔍 MessageParts: Processing message', {
      messageId: message.messageId,
      isCreatedByUser,
      messageText: message.text?.substring(0, 100),
      isGSCAvailable,
      timestamp: new Date().toISOString(),
    });

    // Only process AI messages with text
    if (isCreatedByUser || !message.text || !isGSCAvailable) {
      console.log('🔍 MessageParts: Skipping GSC detection', {
        reason: isCreatedByUser ? 'user message' : !message.text ? 'no text' : 'GSC not available',
        isCreatedByUser,
        hasText: !!message.text,
        isGSCAvailable,
      });
      setShowGSCTool(false);
      return;
    }

    // Process AI message for GSC detection
    console.log('🤖 MessageParts: Processing AI message for GSC');
    const gscDetection = parseAIResponseForGSC(message.text);

    console.log('🔍 MessageParts: GSC Detection result', {
      messageId: message.messageId,
      shouldShowTool: gscDetection.shouldShowTool,
      requestContext: gscDetection.requestContext,
      textAnalyzed: message.text.substring(0, 200),
    });

    if (gscDetection.shouldShowTool) {
      setShowGSCTool(true);
      setGscRequestContext(gscDetection.requestContext);
      console.log('✅ MessageParts: GSC Tool triggered!', {
        messageId: message.messageId,
        requestContext: gscDetection.requestContext,
      });
    } else {
      setShowGSCTool(false);
    }
  }, [
    message?.text,
    isCreatedByUser,
    isGSCAvailable,
    message?.messageId,
    ephemeralAgent?.mcp,
    message,
  ]);

  // Handle GSC tool closure
  const handleGSCToolClose = () => {
    setShowGSCTool(false);
    setGscRequestContext(undefined);
  };

  const name = useMemo(() => {
    let result = '';
    if (isCreatedByUser === true) {
      result = localize('com_user_message');
    } else if (assistant) {
      result = assistant.name ?? localize('com_ui_assistant');
    } else if (agent) {
      result = agent.name ?? localize('com_ui_agent');
    }

    return result;
  }, [assistant, agent, isCreatedByUser, localize]);

  const iconData: TMessageIcon = useMemo(
    () => ({
      endpoint: message?.endpoint ?? conversation?.endpoint,
      model: message?.model ?? conversation?.model,
      iconURL: message?.iconURL ?? conversation?.iconURL,
      modelLabel: name,
      isCreatedByUser: message?.isCreatedByUser,
    }),
    [
      name,
      conversation?.endpoint,
      conversation?.iconURL,
      conversation?.model,
      message?.model,
      message?.iconURL,
      message?.endpoint,
      message?.isCreatedByUser,
    ],
  );

  if (!message) {
    return null;
  }

  const baseClasses = {
    common: 'group mx-auto flex flex-1 gap-3 transition-all duration-300 transform-gpu',
    chat: maximizeChatSpace
      ? 'w-full max-w-full md:px-5 lg:px-1 xl:px-5'
      : 'md:max-w-[47rem] xl:max-w-[55rem]',
  };

  // Add debugging to track MessageParts usage
  console.log('🔵 MessageParts COMPONENT LOADED', {
    messageId: message.messageId,
    isCreatedByUser: message.isCreatedByUser,
    endpoint: message.endpoint,
    content: message.content,
    textPreview: message.text?.substring(0, 100) || 'no text',
  });

  return (
    <>
      <div
        className="w-full border-0 bg-transparent dark:border-0 dark:bg-transparent"
        onWheel={handleScroll}
        onTouchMove={handleScroll}
      >
        <div className="m-auto justify-center p-4 py-2 md:gap-6">
          <div
            id={messageId ?? ''}
            aria-label={`message-${message.depth}-${messageId}`}
            className={cn(baseClasses.common, baseClasses.chat, 'message-render')}
          >
            <div className="relative flex flex-shrink-0 flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full pt-0.5">
                <MessageIcon iconData={iconData} assistant={assistant} agent={agent} />
              </div>
            </div>
            <div
              className={cn(
                'relative flex w-11/12 flex-col',
                isCreatedByUser ? 'user-turn' : 'agent-turn',
              )}
            >
              <h2 className={cn('select-none font-semibold text-text-primary', fontSize)}>
                {name}
              </h2>
              <div className="flex flex-col gap-1">
                <div className="flex max-w-full flex-grow flex-col gap-0">
                  <ContentParts
                    edit={edit}
                    isLast={isLast}
                    enterEdit={enterEdit}
                    siblingIdx={siblingIdx}
                    attachments={attachments}
                    isSubmitting={isSubmitting}
                    searchResults={searchResults}
                    messageId={message.messageId}
                    setSiblingIdx={setSiblingIdx}
                    isCreatedByUser={message.isCreatedByUser}
                    conversationId={conversation?.conversationId}
                    content={message.content as Array<TMessageContentParts | undefined>}
                  />
                </div>
                {isLast && isSubmitting ? (
                  <div className="mt-1 h-[27px] bg-transparent" />
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
                      message={message}
                      enterEdit={enterEdit}
                      isSubmitting={isSubmitting}
                      conversation={conversation ?? null}
                      regenerate={() => regenerateMessage()}
                      copyToClipboard={copyToClipboard}
                      handleContinue={handleContinue}
                      latestMessage={latestMessage}
                      isLast={isLast}
                      handleFeedback={handleFeedback}
                    />
                  </SubRow>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-driven GSC Tool - DISABLED to prevent duplicates, handled by ContentRender */}
      {/* {showGSCTool && !isCreatedByUser && (
        <div className="mx-auto px-4 md:max-w-[47rem] xl:max-w-[55rem]">
          <LaunchGuardianGSCTool requestContext={gscRequestContext} onClose={handleGSCToolClose} />
        </div>
      )} */}

      <MultiMessage
        key={messageId}
        messageId={messageId}
        conversation={conversation}
        messagesTree={children ?? []}
        currentEditId={currentEditId}
        setCurrentEditId={setCurrentEditId}
      />
    </>
  );
}
