import { EventEmitter } from '../senders';
import { mapEvents } from './map-events';

describe('mapEvents', () => {
  it('maps event', () => {

    const emitter = new EventEmitter<[number, number]>();
    const onEvent = emitter.on.do(mapEvents((a: number, b: number) => a + b));
    const receiver = jest.fn<void, [number]>();

    onEvent(receiver);

    emitter.send(2, 11);
    expect(receiver).toHaveBeenCalledWith(13);
  });
});
