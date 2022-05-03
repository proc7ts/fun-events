import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Mock } from 'jest-mock';
import { AfterEvent, afterEventBy } from '../after-event';
import { EventReceiver } from '../base';
import { trackValue, ValueTracker } from '../value';
import { afterEach } from './after-each';

describe('afterEach', () => {

  let source1: ValueTracker<string>;
  let source2: ValueTracker<string>;
  let fromEach: AfterEvent<[string][]>;
  let mockReceiver: Mock<(...args: [string][]) => void>;

  beforeEach(() => {
    source1 = trackValue('init1');
    source2 = trackValue('init2');
    fromEach = afterEach(source1, source2);
    mockReceiver = jest.fn();
  });

  it('sends initial event only once', () => {
    fromEach(mockReceiver);
    expect(mockReceiver).toHaveBeenCalledWith(['init1'], ['init2']);
    expect(mockReceiver).toHaveBeenCalledTimes(1);
  });
  it('sends empty tuple without sources', () => {

    const receiver = jest.fn();

    afterEach()(receiver);
    expect(receiver).toHaveBeenCalledWith(...([] as unknown[] as [unknown, ...unknown[]]));
    expect(receiver).toHaveBeenCalledTimes(1);
  });
  it('sends updates', () => {
    fromEach(mockReceiver);
    mockReceiver.mockClear();
    source1.it = 'update1';
    expect(mockReceiver).toHaveBeenCalledWith(['update1'], ['init2']);
    source2.it = 'update2';
    expect(mockReceiver).toHaveBeenCalledWith(['update1'], ['update2']);
  });
  it('stops sending updates once their supply is cut off', () => {

    const supply = fromEach(mockReceiver);

    mockReceiver.mockClear();
    supply.off();
    source1.it = 'update';
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('stops sending updates when their supply is cut off during registration', () => {

    const reason = 'some reason';
    const stopper = afterEventBy<[string]>(({ supply }) => supply.off(reason));
    const mockOff = jest.fn();

    fromEach = afterEach(stopper, source2);
    fromEach(mockReceiver).whenOff(mockOff);

    expect(mockReceiver).not.toHaveBeenCalled();
    expect(mockOff).toHaveBeenCalledWith(reason);
  });
  it('sends recurrent event sent during registration to recurrent receiver', () => {

    const recurrentReceiver = jest.fn();
    const receiver: EventReceiver.Object<[string][]> = {
      receive: jest.fn((context: EventReceiver.Context<[string][]>) => {
        context.onRecurrent(recurrentReceiver);
        source1.it = 'recurrent';
      }),
    };

    fromEach(receiver);
    expect(receiver.receive).toHaveBeenCalledWith(expect.anything(), ['init1'], ['init2']);
    expect(recurrentReceiver).toHaveBeenCalledWith(['recurrent'], ['init2']);
  });
});
