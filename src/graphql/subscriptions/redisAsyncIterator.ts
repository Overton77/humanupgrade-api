import { EventEmitter } from "events";
import { createClient, type RedisClientType } from "redis";
import { env } from "../../config/env.js";

/**
 Later move to shared Multiplexer or other Distributed PubSub system 
 */
export class RedisAsyncIterator<T> implements AsyncIterableIterator<T> {
  private readonly redisUrl = env.redisUrl;

  private sub: RedisClientType;
  private ee = new EventEmitter();
  private queue: T[] = [];
  private resolveNext: ((value: IteratorResult<T>) => void) | null = null;
  private isClosed = false;
  private channels: string[];

  constructor(channels: string[]) {
    this.channels = channels;
    this.sub = createClient({ url: this.redisUrl });

    this.sub.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("RedisAsyncIterator error", err);
    });

    void this.init();
  }

  private async init() {
    await this.sub.connect();

    for (const ch of this.channels) {
      await this.sub.subscribe(ch, (message) => {
        let parsed: any = message;
        try {
          parsed = JSON.parse(message);
        } catch {
          // keep raw string
        }

        this.push(parsed);
      });
    }
  }

  private push(val: T) {
    if (this.isClosed) return;

    if (this.resolveNext) {
      const r = this.resolveNext;
      this.resolveNext = null;
      r({ value: val, done: false });
      return;
    }

    this.queue.push(val);
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.isClosed) return { value: undefined, done: true };

    if (this.queue.length > 0) {
      return { value: this.queue.shift() as T, done: false };
    }

    return await new Promise<IteratorResult<T>>((resolve) => {
      this.resolveNext = resolve;
    });
  }

  async return(): Promise<IteratorResult<T>> {
    await this.close();
    return { value: undefined, done: true };
  }

  async throw(error?: Error): Promise<IteratorResult<T>> {
    await this.close();
    throw error;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }

  private async close() {
    if (this.isClosed) return;
    this.isClosed = true;

    try {
      for (const ch of this.channels) {
        await this.sub.unsubscribe(ch);
      }
      if (this.sub.isOpen) await this.sub.quit();
    } catch {
      // ignore
    }

    this.ee.removeAllListeners();
    this.queue = [];
    if (this.resolveNext) {
      this.resolveNext({ value: undefined as any, done: true });
      this.resolveNext = null;
    }
  }
}
