import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Mock } from 'jest-mock';
import { AfterEvent, afterEventBy } from '../after-event';
import { EventReceiver } from '../base';
import { trackValue, ValueTracker } from '../value';
import { afterAll } from './after-all';

describe('afterAll', () => {
  let source1: ValueTracker<string>;
  let source2: ValueTracker<number>;
  let fromAll: AfterEvent<[{ source1: [string]; source2: [number] }]>;
  let mockReceiver: Mock<(arg: { source1: [string]; source2: [number] }) => void>;

  beforeEach(() => {
    source1 = trackValue('init');
    source2 = trackValue(1);
    fromAll = afterAll({ source1, source2 });
    mockReceiver = jest.fn();
  });

  it('sends initial event only once', () => {
    fromAll(mockReceiver);
    expect(mockReceiver).toHaveBeenCalledWith({ source1: ['init'], source2: [1] });
    expect(mockReceiver).toHaveBeenCalledTimes(1);
  });
  it('sends empty object without sources', () => {
    const receiver = jest.fn();

    afterAll({})(receiver);
    expect(receiver).toHaveBeenCalledWith({});
    expect(receiver).toHaveBeenCalledTimes(1);
  });
  it('sends updates', () => {
    fromAll(mockReceiver);
    mockReceiver.mockClear();
    source1.it = 'update';
    expect(mockReceiver).toHaveBeenCalledWith({ source1: ['update'], source2: [1] });
    source2.it = 2;
    expect(mockReceiver).toHaveBeenCalledWith({ source1: ['update'], source2: [2] });
  });
  it('stops sending updates once their supply is cut off', () => {
    const supply = fromAll(mockReceiver);

    mockReceiver.mockClear();
    supply.off();
    source1.it = 'update';
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('stops sending updates if their supply is cut off during registration', () => {
    const reason = 'some reason';
    const stopper = afterEventBy<[string]>(({ supply }) => supply.off(reason));
    const mockOff = jest.fn();

    fromAll = afterAll({ source1: stopper, source2 });
    fromAll(mockReceiver).whenOff(mockOff);

    expect(mockReceiver).not.toHaveBeenCalled();
    expect(mockOff).toHaveBeenCalledWith(reason);
  });
  it('sends recurrent event sent during registration to recurrent receiver', () => {
    const recurrentReceiver = jest.fn();
    const receiver: EventReceiver.Object<[{ source1: [string]; source2: [number] }]> = {
      receive: jest.fn(
        (context: EventReceiver.Context<[{ source1: [string]; source2: [number] }]>) => {
          context.onRecurrent(recurrentReceiver);
          source1.it = 'recurrent';
        },
      ),
    };

    fromAll(receiver);
    expect(receiver.receive).toHaveBeenCalledWith(
      expect.anything() as unknown as EventReceiver.Context<
        [{ source1: [string]; source2: [number] }]
      >,
      {
        source1: ['init'],
        source2: [1],
      },
    );
    expect(recurrentReceiver).toHaveBeenCalledWith({ source1: ['recurrent'], source2: [1] });
  });
});
