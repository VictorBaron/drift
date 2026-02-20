import { MemberFactory } from '@/accounts/__tests__/factories/member.factory';
import { Message } from '@/messages/domain';
import { UserFactory } from '@/users/__tests__/factories/user.factory';

const buildSender = () =>
  MemberFactory.create({
    id: 'senderId',
    accountId: 'accountId',
    user: UserFactory.create({ id: 'senderUserId', slackId: 'slackUserId' }),
  });

const createMessage = () =>
  Message.create({
    sender: buildSender(),
    slackTs: '1234567890.123456',
    slackChannelId: 'C_GENERAL',
    slackChannelType: 'channel',
    slackThreadTs: null,
    text: 'Hello',
  });

describe('Message aggregate', () => {
  describe('isUrgent()', () => {
    it('should return true when urgency score is 5', () => {
      const message = createMessage();
      message.setUrgencyScore({ score: 5, reasoning: 'Prod is down' });

      expect(message.isUrgent()).toBe(true);
    });

    it('should return false when urgency score is less than 5', () => {
      const message = createMessage();
      message.setUrgencyScore({ score: 4, reasoning: 'Important but not critical' });

      expect(message.isUrgent()).toBe(false);
    });

    it('should return false when urgency score is null', () => {
      const message = createMessage();

      expect(message.isUrgent()).toBe(false);
    });
  });
});
