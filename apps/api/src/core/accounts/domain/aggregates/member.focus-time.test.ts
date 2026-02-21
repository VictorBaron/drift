import { MemberFactory } from '@/accounts/__tests__/factories/member.factory';
import { FocusTimeStartedEvent } from '@/accounts/domain/events';

describe('Member focus time', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startFocusTime', () => {
    it('should set focusEndsAt to now + given minutes', () => {
      const member = MemberFactory.create();
      member.startFocusTime(30);
      expect(member.getFocusEndsAt()).toEqual(new Date('2026-01-01T10:30:00.000Z'));
    });

    it('should emit FocusTimeStartedEvent', () => {
      const member = MemberFactory.create();
      member.startFocusTime(30);
      expect(member.findEvents(FocusTimeStartedEvent)).toHaveLength(1);
    });

    it('should emit FocusTimeStartedEvent with correct endsAt date', () => {
      const member = MemberFactory.create();
      member.startFocusTime(45);
      const [event] = member.findEvents(FocusTimeStartedEvent);
      expect(event.endsAt).toEqual(new Date('2026-01-01T10:45:00.000Z'));
    });
  });

  describe('stopFocusTime', () => {
    it('should clear focusEndsAt', () => {
      const member = MemberFactory.create();
      member.startFocusTime(30);
      member.stopFocusTime();
      expect(member.getFocusEndsAt()).toBeNull();
    });

    it('should not emit FocusTimeStartedEvent', () => {
      const member = MemberFactory.create();
      member.stopFocusTime();
      expect(member.findEvents(FocusTimeStartedEvent)).toHaveLength(0);
    });
  });

  describe('isInFocusTime', () => {
    it('should return false when focusEndsAt is null', () => {
      const member = MemberFactory.create();
      expect(member.isInFocusTime()).toBe(false);
    });

    it('should return true when focusEndsAt is in the future', () => {
      const member = MemberFactory.create();
      member.startFocusTime(30);
      expect(member.isInFocusTime()).toBe(true);
    });

    it('should return false when focusEndsAt is in the past', () => {
      const member = MemberFactory.create();
      member.startFocusTime(30);
      jest.setSystemTime(new Date('2026-01-01T10:31:00.000Z'));
      expect(member.isInFocusTime()).toBe(false);
    });
  });

  describe('getFocusEndsAt', () => {
    it('should return null when no focus time is set', () => {
      const member = MemberFactory.create();
      expect(member.getFocusEndsAt()).toBeNull();
    });

    it('should return focusEndsAt when focus time is set', () => {
      const member = MemberFactory.create();
      member.startFocusTime(60);
      expect(member.getFocusEndsAt()).toEqual(new Date('2026-01-01T11:00:00.000Z'));
    });
  });
});
