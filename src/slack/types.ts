import { KnownEventFromType } from '@slack/bolt';
import { GenericMessageEvent } from '@slack/types';

export const isGenericMessage = (
  event: KnownEventFromType<'message'>,
): event is GenericMessageEvent => {
  return event.subtype === undefined;
};
