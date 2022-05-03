import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { Mock } from 'jest-mock';
import { AfterEvent, afterEventBy } from '../after-event';
import { EventNotifier, EventReceiver } from '../base';
import { onceOn } from './once-on';
import { shareAfter } from './share-after';

describe('shareAfter', () => {

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

    const shared = afterEvent.do(shareAfter);

    shared(mockReceiver);
    shared(mockReceiver2);
    expect(mockReceiver).toHaveBeenCalledWith(...fallback);
    expect(mockReceiver2).toHaveBeenCalledWith(...fallback);
  });
  it('keeps initial event from the source', () => {

    const shared = afterEvent.do(shareAfter);

    shared.do(onceOn)((...received) => expect(received).toEqual(fallback));
  });
  it('sends events from the source', () => {

    const shared = afterEvent.do(shareAfter);

    shared(mockReceiver);
    shared(mockReceiver2);
    emitter.send('a', 'b');
    expect(mockReceiver).toHaveBeenCalledWith('a', 'b');
    expect(mockReceiver2).toHaveBeenCalledWith('a', 'b');
  });
  it('handles immediate source supply cut off', async () => {
    mockRegister.mockImplementation(({ supply }) => supply.off('reason'));

    const shared = afterEvent.do(shareAfter);

    expect(await shared(mockReceiver).whenDone().catch(asis)).toBe('reason');
  });
});
