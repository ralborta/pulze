import { addKeyword, EVENTS } from '@builderbot/bot';
import { welcomeFlow } from './welcome.flow';
import { checkInFlow } from './checkin.flow';
import { helpFlow } from './help.flow';
import { conversationFlow, generalFlow } from './conversation.flow';

class FlowManager {
  getAllFlows() {
    return [
      welcomeFlow,
      checkInFlow,
      helpFlow,
      conversationFlow,
      generalFlow,
    ];
  }
}

export const flowManager = new FlowManager();
