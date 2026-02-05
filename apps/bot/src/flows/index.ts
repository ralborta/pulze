import { addKeyword, EVENTS } from '@builderbot/bot';
import { welcomeFlow } from './welcome.flow';
import { checkInFlow } from './checkin.flow';
import { helpFlow } from './help.flow';

class FlowManager {
  getAllFlows() {
    return [
      welcomeFlow,
      checkInFlow,
      helpFlow,
    ];
  }
}

export const flowManager = new FlowManager();
