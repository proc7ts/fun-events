import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { Mock } from 'jest-mock';
import { AfterEvent, afterEventBy } from '../after-event';
import { EventNotifier, EventReceiver } from '../base';
import { OnEvent, onEventBy } from '../on-event';
import { onceOn } from './once-on';
import { shareOn } from './share-on';

describe('shareOn', () => {
  describe('OnEvent', () => {
    let mockRegister: Mock<(receiver: EventReceiver.Generic<[string, string]>) => void>;
    let offSpy: Mock<(arg?: unknown) => Supply>;
    let emitter: EventNotifier<[string, string]>;
    let onEvent: OnEvent<[string, string]>;
    let mockReceiver: Mock<(arg1: string, arg2: string) => void>;
    let mockReceiver2: Mock<(arg1: string, arg2: string) => void>;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
        offSpy = jest.spyOn(receiver.supply, 'off') as typeof offSpy;
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
      mockReceiver2 = jest.fn();
    });

    it('sends events from the source', () => {
      const shared = onEvent.do(shareOn);

      shared(mockReceiver);
      shared(mockReceiver2);
      emitter.send('a', 'b');
      expect(mockReceiver).toHaveBeenCalledWith('a', 'b');
      expect(mockReceiver2).toHaveBeenCalledWith('a', 'b');
    });
    it('registers exactly one source receiver', () => {
      const shared = onEvent.do(shareOn);

      shared(mockReceiver);
      shared(mockReceiver2);

      expect(mockRegister).toHaveBeenCalledTimes(1);
    });
    it('cuts off events supply from the source when all event supplies do', () => {
      const shared = onEvent.do(shareOn);
      const supply1 = shared(mockReceiver);
      const supply2 = shared(mockReceiver2);

      supply1.off('reason1');
      expect(offSpy).not.toHaveBeenCalled();
      supply2.off('reason2');
      expect(offSpy).toHaveBeenCalledWith('reason2');
    });
    it('replicates events sent during registration', () => {
      mockRegister.mockImplementation(receiver => {
        emitter.on(receiver);
        emitter.send('init1', '1');
        emitter.send('init2', '2');
      });

      const shared = onEvent.do(shareOn);

      shared(mockReceiver);
      shared(mockReceiver2);

      expect(mockReceiver).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver).toHaveReturnedTimes(2);
      expect(mockReceiver2).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver2).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver2).toHaveReturnedTimes(2);
    });
    it('replicates events sent during registration to receivers registered after all event supplies cut off', () => {
      mockRegister.mockImplementation(receiver => {
        const receiverEmitter = new EventNotifier<[string, string]>();

        receiverEmitter.on(receiver);
        receiverEmitter.send('init1', '1');
        receiverEmitter.send('init2', '2');

        offSpy = jest.spyOn(receiver.supply, 'off') as typeof offSpy;
      });

      const shared = onEvent.do(shareOn);
      const supply1 = shared(mockReceiver);
      const supply2 = shared(mockReceiver2);

      supply1.off();
      supply2.off();
      expect(offSpy).toHaveBeenCalled();
      mockReceiver.mockClear();
      mockReceiver2.mockClear();

      shared(mockReceiver);
      shared(mockReceiver2);
      expect(mockReceiver).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver).toHaveReturnedTimes(2);
      expect(mockReceiver2).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver2).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver2).toHaveReturnedTimes(2);
    });
    it('stops events replication of events sent during registration after new event received', () => {
      mockRegister.mockImplementation(receiver => {
        emitter.on(receiver);
        emitter.send('init1', '1');
        emitter.send('init2', '2');
      });

      const shared = onEvent.do(shareOn);

      shared(mockReceiver);
      emitter.send('update1', '11');
      shared(mockReceiver2);
      emitter.send('update2', '12');

      expect(mockReceiver).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver).toHaveBeenCalledWith('update1', '11');
      expect(mockReceiver).toHaveBeenCalledWith('update2', '12');
      expect(mockReceiver).toHaveReturnedTimes(4);
      expect(mockReceiver2).toHaveBeenCalledWith('update2', '12');
      expect(mockReceiver2).toHaveReturnedTimes(1);
    });
  });

  describe('AfterEvent', () => {
    let fallback: [string, string];
    let mockRegister: Mock<(receiver: EventReceiver.Generic<[string, string]>) => void>;
    let emitter: EventNotifier<[string, string]>;
    let afterEvent: AfterEvent<[string, string]>;
    let mockReceiver: Mock<(arg1: string, arg2: string) => void>;
    let mockReceiver2: Mock<(arg1: string, arg2: string) => void>;

    beforeEach(() => {
      fallback = ['init1', 'init2'];
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
      });
      afterEvent = afterEventBy(mockRegister, () => fallback);
      mockReceiver = jest.fn();
      mockReceiver2 = jest.fn();
    });

    it('sends fallback event from the source', () => {
      const shared = afterEvent.do(shareOn);

      shared(mockReceiver);
      shared(mockReceiver2);
      expect(mockReceiver).toHaveBeenCalledWith(...fallback);
      expect(mockReceiver2).toHaveBeenCalledWith(...fallback);
    });
    it('keeps initial event from the source', () => {
      const shared = afterEvent.do(shareOn);

      shared.do(onceOn)((...received) => expect(received).toEqual(fallback));
    });
    it('sends events from the source', () => {
      const shared = afterEvent.do(shareOn);

      shared(mockReceiver);
      shared(mockReceiver2);
      emitter.send('a', 'b');
      expect(mockReceiver).toHaveBeenCalledWith('a', 'b');
      expect(mockReceiver2).toHaveBeenCalledWith('a', 'b');
    });
    it('handles immediate source supply cut off', async () => {
      mockRegister.mockImplementation(({ supply }) => supply.off('reason'));

      const shared = afterEvent.do(shareOn);

      expect(await shared(mockReceiver).whenDone().catch(asis)).toBe('reason');
    });
  });
});
