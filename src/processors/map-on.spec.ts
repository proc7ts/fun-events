import { describe, expect, it, jest } from '@jest/globals';
import { EventEmitter } from '../senders';
import { mapOn } from './map-on';

describe('mapOn', () => {
  it('maps event', () => {
    const emitter = new EventEmitter<[number, number]>();
    const onEvent = emitter.on.do(mapOn((a: number, b: number) => a + b));
    const receiver = jest.fn<(arg: number) => void>();

    onEvent(receiver);

    emitter.send(2, 11);
    expect(receiver).toHaveBeenCalledWith(13);
  });
});
