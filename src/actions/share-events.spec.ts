import { AfterEvent, afterEventBy } from '../after-event';
import { EventNotifier, EventReceiver } from '../base';
import { OnEvent, onEventBy } from '../on-event';
import { onceEvent } from './once-event';
import { shareEvents } from './share-events';

describe('shareEvents', () => {
  describe('OnEvent', () => {

    let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string, string]>]>;
    let offSpy: jest.SpyInstance;
    let emitter: EventNotifier<[string, string]>;
    let onEvent: OnEvent<[string, string]>;
    let mockReceiver: jest.Mock<void, [string, string]>;
    let mockReceiver2: jest.Mock<void, [string, string]>;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
        offSpy = jest.spyOn(receiver.supply, 'off');
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
      mockReceiver2 = jest.fn();
    });

    it('sends events from the source', () => {

      const shared = onEvent.do(shareEvents);

      shared(mockReceiver);
      shared(mockReceiver2);
      emitter.send('a', 'b');
      expect(mockReceiver).toHaveBeenCalledWith('a', 'b');
      expect(mockReceiver2).toHaveBeenCalledWith('a', 'b');
    });
    it('registers exactly one source receiver', () => {

      const shared = onEvent.do(shareEvents);

      shared(mockReceiver);
      shared(mockReceiver2);

      expect(mockRegister).toHaveBeenCalledTimes(1);
    });
    it('cuts off events supply from the source when all event supplies do', () => {

      const shared = onEvent.do(shareEvents);
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

      const shared = onEvent.do(shareEvents);

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

        offSpy = jest.spyOn(receiver.supply, 'off');
      });

      const shared = onEvent.do(shareEvents);
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

      const shared = onEvent.do(shareEvents);

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
    let mockRegister: jest.Mock<void, [EventReceiver.Generic<[string, string]>]>;
    let emitter: EventNotifier<[string, string]>;
    let afterEvent: AfterEvent<[string, string]>;
    let mockReceiver: jest.Mock<void, [string, string]>;
    let mockReceiver2: jest.Mock<void, [string, string]>;

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

      const shared = afterEvent.do(shareEvents);

      shared(mockReceiver);
      shared(mockReceiver2);
      expect(mockReceiver).toHaveBeenCalledWith(...fallback);
      expect(mockReceiver2).toHaveBeenCalledWith(...fallback);
    });
    it('keeps initial event from the source', () => {

      const shared = afterEvent.do(shareEvents);

      shared.do(onceEvent)((...received) => expect(received).toEqual(fallback));
    });
    it('sends events from the source', () => {

      const shared = afterEvent.do(shareEvents);

      shared(mockReceiver);
      shared(mockReceiver2);
      emitter.send('a', 'b');
      expect(mockReceiver).toHaveBeenCalledWith('a', 'b');
      expect(mockReceiver2).toHaveBeenCalledWith('a', 'b');
    });
  });
});
