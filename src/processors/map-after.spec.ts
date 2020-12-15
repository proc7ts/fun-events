import { valueProvider } from '@proc7ts/primitives';
import { AfterEvent } from '../after-event';
import { EventEmitter } from '../senders';
import { trackValue } from '../value';
import { mapAfter } from './map-after';

describe('mapAfter', () => {
  it('maps events', () => {

    const tracker = trackValue(1);
    const afterEvent: AfterEvent<[number]> = tracker.read.do(mapAfter(a => a + 100));
    const receiver = jest.fn<void, [number]>();

    afterEvent(receiver);

    tracker.it = 2;
    expect(receiver).toHaveBeenCalledWith(101);
    expect(receiver).toHaveBeenCalledWith(102);
    expect(receiver).toHaveBeenCalledTimes(2);
  });
  it('maps events with fallback', () => {

    const emitter = new EventEmitter<[number, number]>();
    const afterEvent: AfterEvent<[number]> = emitter.on.do(mapAfter((a: number, b: number) => a + b, valueProvider(0)));
    const receiver = jest.fn<void, [number]>();

    afterEvent(receiver);

    emitter.send(2, 11);
    expect(receiver).toHaveBeenCalledWith(0);
    expect(receiver).toHaveBeenCalledWith(13);
    expect(receiver).toHaveBeenCalledTimes(2);
  });
});
